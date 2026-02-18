// server/agents/leader.ts
import { createTask } from "./taskQueue";
import { AgentRole } from "@shared/schema";
import OpenAI from "openai";

// Initialize OpenAI if configured (optional enhancement)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface LeadInput {
  type: string; // "vendor_signup", "booking_request", "support_issue", etc.
  data: Record<string, any>;
  source: string; // "telegram", "api", "webhook"
  metadata?: Record<string, any>;
}

export interface TaskPlan {
  tasks: Array<{
    role: AgentRole;
    priority: number;
    input: Record<string, any>;
  }>;
  summary: string;
  reasoning?: string;
}

/**
 * Deterministic rule-based planner (primary logic)
 */
function ruleBasedPlanner(lead: LeadInput): TaskPlan {
  const type = lead.type.toLowerCase();
  const tasks: TaskPlan["tasks"] = [];

  // Route based on lead type
  if (type.includes("vendor") || type.includes("onboard") || type.includes("signup")) {
    tasks.push({
      role: "VENDOR_ONBOARDING",
      priority: 3,
      input: {
        action: "create_vendor",
        ...lead.data,
        source: lead.source,
      },
    });
    return {
      tasks,
      summary: "Vendor onboarding task created",
      reasoning: "Rule-based: vendor/onboard/signup keyword detected",
    };
  }

  if (type.includes("booking") || type.includes("reservation") || type.includes("book")) {
    tasks.push({
      role: "BOOKING_MANAGER",
      priority: 2,
      input: {
        action: "create_booking",
        ...lead.data,
        source: lead.source,
      },
    });
    return {
      tasks,
      summary: "Booking request task created",
      reasoning: "Rule-based: booking/reservation keyword detected",
    };
  }

  if (type.includes("calendar") || type.includes("sync") || type.includes("ical")) {
    tasks.push({
      role: "CALENDAR_SYNC",
      priority: 4,
      input: {
        action: "sync_calendar",
        ...lead.data,
        source: lead.source,
      },
    });
    return {
      tasks,
      summary: "Calendar sync task created",
      reasoning: "Rule-based: calendar/sync keyword detected",
    };
  }

  if (type.includes("price") || type.includes("pricing") || type.includes("cost")) {
    tasks.push({
      role: "PRICING",
      priority: 5,
      input: {
        action: "update_price",
        ...lead.data,
        source: lead.source,
      },
    });
    return {
      tasks,
      summary: "Pricing update task created",
      reasoning: "Rule-based: price/pricing keyword detected",
    };
  }

  if (type.includes("marketing") || type.includes("campaign") || type.includes("content")) {
    tasks.push({
      role: "MARKETING",
      priority: 6,
      input: {
        action: "create_campaign",
        ...lead.data,
        source: lead.source,
      },
    });
    return {
      tasks,
      summary: "Marketing task created",
      reasoning: "Rule-based: marketing/campaign keyword detected",
    };
  }

  if (type.includes("support") || type.includes("help") || type.includes("issue") || type.includes("problem")) {
    tasks.push({
      role: "SUPPORT",
      priority: 1, // High priority
      input: {
        action: "create_ticket",
        ...lead.data,
        source: lead.source,
      },
    });
    return {
      tasks,
      summary: "Support ticket task created",
      reasoning: "Rule-based: support/help/issue keyword detected",
    };
  }

  if (type.includes("payment") || type.includes("checkout") || type.includes("pay")) {
    tasks.push({
      role: "FINANCE",
      priority: 2,
      input: {
        action: "create_checkout",
        ...lead.data,
        source: lead.source,
      },
    });
    return {
      tasks,
      summary: "Payment/checkout task created",
      reasoning: "Rule-based: payment/checkout keyword detected",
    };
  }

  if (type.includes("refund")) {
    tasks.push({
      role: "FINANCE",
      priority: 1, // High priority (refunds are urgent)
      input: {
        action: "process_refund",
        ...lead.data,
        source: lead.source,
      },
    });
    return {
      tasks,
      summary: "Refund request task created",
      reasoning: "Rule-based: refund keyword detected",
    };
  }

  // Default: create a support ticket for unrecognized requests
  tasks.push({
    role: "SUPPORT",
    priority: 5,
    input: {
      action: "create_ticket",
      subject: `Unrecognized request: ${type}`,
      message: JSON.stringify(lead.data, null, 2),
      source: lead.source,
    },
  });

  return {
    tasks,
    summary: "Unrecognized request routed to support",
    reasoning: "Rule-based: no matching pattern, defaulting to support",
  };
}

/**
 * OpenAI-enhanced planner (optional, if OPENAI_API_KEY exists)
 */
async function openaiEnhancedPlanner(lead: LeadInput, rulePlan: TaskPlan): Promise<TaskPlan> {
  if (!openai) {
    return rulePlan; // Fallback to rule-based
  }

  try {
    const prompt = `You are a task planning AI for IslandLoaf, a tourism marketplace platform.

Given this lead:
Type: ${lead.type}
Data: ${JSON.stringify(lead.data, null, 2)}
Source: ${lead.source}

Rule-based plan suggests: ${rulePlan.summary}

Your task:
1. Validate the rule-based plan
2. Extract structured data from lead.data (e.g., email, dates, amounts, names)
3. Suggest priority (1-10, lower = more urgent)
4. Return JSON only:

{
  "tasks": [
    {
      "role": "VENDOR_ONBOARDING" | "BOOKING_MANAGER" | "CALENDAR_SYNC" | "PRICING" | "MARKETING" | "SUPPORT" | "FINANCE",
      "priority": number,
      "input": {
        "action": "specific_action",
        ...extracted data
      }
    }
  ],
  "summary": "Brief summary",
  "reasoning": "Why these tasks"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a JSON-only task planner. Return valid JSON with no markdown.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const enhancedPlan = JSON.parse(responseText.replace(/```json|```/g, "").trim());

    return {
      tasks: enhancedPlan.tasks || rulePlan.tasks,
      summary: enhancedPlan.summary || rulePlan.summary,
      reasoning: `OpenAI-enhanced: ${enhancedPlan.reasoning || ""}`,
    };
  } catch (error) {
    console.warn("OpenAI planning failed, using rule-based fallback:", error);
    return rulePlan;
  }
}

/**
 * Main task planner - deterministic first, optionally enhanced by OpenAI
 */
export async function planTasks(lead: LeadInput): Promise<TaskPlan> {
  // Always start with deterministic rule-based planning
  const rulePlan = ruleBasedPlanner(lead);

  // If OpenAI is configured, enhance the plan
  if (openai && process.env.OPENAI_API_KEY) {
    return await openaiEnhancedPlanner(lead, rulePlan);
  }

  return rulePlan;
}

/**
 * Handle lead intake: plan tasks and create them in the queue
 */
export async function handleLeadIntake(lead: LeadInput): Promise<{
  success: boolean;
  plan: TaskPlan;
  taskIds: string[];
  message: string;
}> {
  try {
    // Plan tasks
    const plan = await planTasks(lead);

    // Create tasks in queue
    const taskIds: string[] = [];
    for (const taskSpec of plan.tasks) {
      const task = await createTask({
        assignedToRole: taskSpec.role,
        input: taskSpec.input,
        priority: taskSpec.priority,
      });
      taskIds.push(task.id);
    }

    return {
      success: true,
      plan,
      taskIds,
      message: `Created ${taskIds.length} task(s): ${plan.summary}`,
    };
  } catch (error: any) {
    console.error("Lead intake failed:", error);
    return {
      success: false,
      plan: {
        tasks: [],
        summary: "Failed to process lead",
        reasoning: error.message,
      },
      taskIds: [],
      message: `Error: ${error.message}`,
    };
  }
}

