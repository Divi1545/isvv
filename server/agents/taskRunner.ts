// server/agents/taskRunner.ts
import { getNextTask, completeTask, failTask, requeueTask } from "./taskQueue";
import { AgentRole, agentRoles } from "@shared/schema";
import { logSuccess, logFailure } from "../security/auditLogger";
import * as vendorOnboardingAgent from "./executors/vendorOnboardingAgent";
import * as bookingManagerAgent from "./executors/bookingManagerAgent";
import * as calendarSyncAgent from "./executors/calendarSyncAgent";
import * as pricingAgent from "./executors/pricingAgent";
import * as marketingAgent from "./executors/marketingAgent";
import * as supportAgent from "./executors/supportAgent";
import * as financeAgent from "./executors/financeAgent";
import { reportTaskToLeader } from "./adminNotifier";

// Agent role to executor mapping
const AGENT_EXECUTORS: Record<
  string,
  { executeTask: (input: Record<string, any>) => Promise<any> }
> = {
  VENDOR_ONBOARDING: vendorOnboardingAgent,
  BOOKING_MANAGER: bookingManagerAgent,
  CALENDAR_SYNC: calendarSyncAgent,
  PRICING: pricingAgent,
  MARKETING: marketingAgent,
  SUPPORT: supportAgent,
  FINANCE: financeAgent,
};

export interface TaskRunnerSummary {
  tasksProcessed: number;
  tasksSucceeded: number;
  tasksFailed: number;
  details: Array<{
    taskId: string;
    role: string;
    status: "success" | "failed";
    error?: string;
  }>;
}

// Background runner state
let runnerInterval: NodeJS.Timeout | null = null;
let isRunning = false;
const RUNNER_INTERVAL_MS = 30000; // 30 seconds

/**
 * Process a single task for a given role
 */
async function processSingleTask(role: AgentRole): Promise<{
  taskId: string | null;
  success: boolean;
  error?: string;
}> {
  // Get next task for this role
  const task = await getNextTask(role);

  if (!task) {
    return { taskId: null, success: true }; // No task to process
  }

  const executor = AGENT_EXECUTORS[role];

  if (!executor) {
    console.error(`No executor found for role: ${role}`);
    await failTask(task.id, `No executor found for role: ${role}`);
    return {
      taskId: task.id,
      success: false,
      error: `No executor found for role: ${role}`,
    };
  }

  try {
    // Execute task
    const result = await executor.executeTask(task.input as Record<string, any>);

    if (result.success) {
      // Mark task as completed
      await completeTask(task.id, result.data || {});

      // Log success to audit trail
      await logSuccess("task-runner", `task:${role.toLowerCase()}`, {
        targetType: "task",
        targetId: task.id,
        requestBody: task.input as Record<string, any>,
        resultBody: result.data,
        metadata: { role },
      });

      // Report to Leader
      await reportTaskToLeader(
        task.id,
        role,
        (task.input as any).action || "unknown",
        true,
        task.input as Record<string, any>,
        result.data
      );

      return { taskId: task.id, success: true };
    } else {
      // Task execution failed
      await failTask(task.id, result.error || "Task execution failed");

      // Log failure
      await logFailure("task-runner", `task:${role.toLowerCase()}`, result.error || "Unknown error", {
        targetType: "task",
        targetId: task.id,
        requestBody: task.input as Record<string, any>,
        metadata: { role },
      });

      // Report failure to Leader
      await reportTaskToLeader(
        task.id,
        role,
        (task.input as any).action || "unknown",
        false,
        task.input as Record<string, any>,
        undefined,
        result.error
      );

      return {
        taskId: task.id,
        success: false,
        error: result.error,
      };
    }
  } catch (error: any) {
    // Unexpected error
    console.error(`Task ${task.id} execution error:`, error);
    await failTask(task.id, error.message || "Unexpected error");

    await logFailure("task-runner", `task:${role.toLowerCase()}`, error.message, {
      targetType: "task",
      targetId: task.id,
      requestBody: task.input as Record<string, any>,
      metadata: { role },
    });

    // Report error to Leader
    await reportTaskToLeader(
      task.id,
      role,
      (task.input as any).action || "unknown",
      false,
      task.input as Record<string, any>,
      undefined,
      error.message || "Unexpected error"
    );

    return {
      taskId: task.id,
      success: false,
      error: error.message || "Unexpected error",
    };
  }
}

/**
 * Run a single tick: process at most ONE task per role
 */
export async function runSingleTick(): Promise<TaskRunnerSummary> {
  const summary: TaskRunnerSummary = {
    tasksProcessed: 0,
    tasksSucceeded: 0,
    tasksFailed: 0,
    details: [],
  };

  // Process one task per role (to avoid resource contention)
  const rolesToProcess: AgentRole[] = [
    "VENDOR_ONBOARDING",
    "BOOKING_MANAGER",
    "CALENDAR_SYNC",
    "PRICING",
    "MARKETING",
    "SUPPORT",
    "FINANCE",
  ];

  for (const role of rolesToProcess) {
    const result = await processSingleTask(role);

    if (result.taskId) {
      summary.tasksProcessed++;

      if (result.success) {
        summary.tasksSucceeded++;
        summary.details.push({
          taskId: result.taskId,
          role,
          status: "success",
        });
      } else {
        summary.tasksFailed++;
        summary.details.push({
          taskId: result.taskId,
          role,
          status: "failed",
          error: result.error,
        });
      }
    }
  }

  return summary;
}

/**
 * Start background runner (if AGENT_RUNNER_ENABLED=true)
 */
export function startBackgroundRunner(): void {
  if (runnerInterval) {
    console.warn("Background runner already started");
    return;
  }

  console.log(`🤖 Starting agent task runner (interval: ${RUNNER_INTERVAL_MS}ms)`);

  runnerInterval = setInterval(async () => {
    if (isRunning) {
      console.log("⏭️  Previous tick still running, skipping...");
      return;
    }

    isRunning = true;

    try {
      const summary = await runSingleTick();

      if (summary.tasksProcessed > 0) {
        console.log(
          `✅ Task runner tick: ${summary.tasksProcessed} processed, ${summary.tasksSucceeded} succeeded, ${summary.tasksFailed} failed`
        );
      }
    } catch (error) {
      console.error("Task runner tick error:", error);
    } finally {
      isRunning = false;
    }
  }, RUNNER_INTERVAL_MS);
}

/**
 * Stop background runner
 */
export function stopBackgroundRunner(): void {
  if (runnerInterval) {
    clearInterval(runnerInterval);
    runnerInterval = null;
    console.log("🛑 Background runner stopped");
  }
}



