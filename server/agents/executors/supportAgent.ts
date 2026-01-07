// server/agents/executors/supportAgent.ts
import * as storage from "../../storage-adapter";

export interface SupportAgentResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute support task
 */
export async function executeTask(taskInput: Record<string, any>): Promise<SupportAgentResult> {
  const action = taskInput.action;

  try {
    switch (action) {
      case "create_ticket":
        return await createTicket(taskInput);

      case "update_ticket":
        return await updateTicket(taskInput);

      case "assign_priority":
        return await assignPriority(taskInput);

      default:
        return {
          success: false,
          error: `Unknown support action: ${action}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Support task failed",
    };
  }
}

async function createTicket(data: Record<string, any>): Promise<SupportAgentResult> {
  const { subject, message, priority, userId } = data;

  if (!subject || !message) {
    return {
      success: false,
      error: "Missing subject or message",
    };
  }

  const notification = await storage.createNotification({
    userId: userId || 1, // Default to admin user
    title: `[${(priority || "MEDIUM").toUpperCase()}] ${subject}`,
    message,
    type: "support",
  });

  return {
    success: true,
    data: {
      ticketId: notification.id,
      subject,
      priority: priority || "medium",
      status: "open",
      createdAt: new Date().toISOString(),
    },
  };
}

async function updateTicket(data: Record<string, any>): Promise<SupportAgentResult> {
  const { ticketId, status, response } = data;

  if (!ticketId) {
    return {
      success: false,
      error: "Missing ticketId",
    };
  }

  // For now, we'll create a follow-up notification
  // In production, you'd have a support_tickets table and update it
  if (response) {
    await storage.createNotification({
      userId: 1, // Admin
      title: `Ticket #${ticketId} Update`,
      message: `Status: ${status || "updated"}. Response: ${response}`,
      type: "info",
    });
  }

  return {
    success: true,
    data: {
      ticketId,
      status: status || "updated",
      updatedAt: new Date().toISOString(),
    },
  };
}

async function assignPriority(data: Record<string, any>): Promise<SupportAgentResult> {
  const { ticketId, priority, keywords } = data;

  if (!ticketId) {
    return {
      success: false,
      error: "Missing ticketId",
    };
  }

  // Auto-prioritize based on keywords if provided
  let assignedPriority = priority || "medium";

  if (keywords) {
    const urgentKeywords = ["urgent", "critical", "down", "broken", "payment", "refund"];
    const hasUrgent = urgentKeywords.some((kw) =>
      keywords.toLowerCase().includes(kw)
    );

    if (hasUrgent) {
      assignedPriority = "high";
    }
  }

  return {
    success: true,
    data: {
      ticketId,
      priority: assignedPriority,
      assignedAt: new Date().toISOString(),
    },
  };
}



