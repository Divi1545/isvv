// server/agents/adminNotifier.ts
import { sendMessage } from "../services/telegramClient";

// Admin Telegram chat ID - set this to your personal chat ID
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID 
  ? parseInt(process.env.ADMIN_TELEGRAM_CHAT_ID) 
  : null;

// Track task summaries for periodic reporting
interface TaskSummary {
  taskId: string;
  role: string;
  action: string;
  status: "success" | "failed";
  timestamp: Date;
  error?: string;
  isCritical?: boolean;
}

const recentTasks: TaskSummary[] = [];
const MAX_RECENT_TASKS = 100;

// Keywords that trigger critical alerts
const CRITICAL_KEYWORDS = [
  "payment", "refund", "urgent", "critical", "down", 
  "broken", "error", "failed", "security", "breach"
];

/**
 * Check if a task is critical based on content
 */
function isCriticalTask(input: Record<string, any>, error?: string): boolean {
  const searchText = JSON.stringify(input).toLowerCase() + (error || "").toLowerCase();
  return CRITICAL_KEYWORDS.some(keyword => searchText.includes(keyword));
}

/**
 * Report task completion to Leader (and potentially to admin)
 */
export async function reportTaskToLeader(
  taskId: string,
  role: string,
  action: string,
  success: boolean,
  input: Record<string, any>,
  output?: Record<string, any>,
  error?: string
): Promise<void> {
  const isCritical = isCriticalTask(input, error) || (!success && role === "FINANCE");
  
  const summary: TaskSummary = {
    taskId,
    role,
    action,
    status: success ? "success" : "failed",
    timestamp: new Date(),
    error,
    isCritical,
  };

  // Store in recent tasks
  recentTasks.unshift(summary);
  if (recentTasks.length > MAX_RECENT_TASKS) {
    recentTasks.pop();
  }

  // Send critical alerts immediately to admin
  if (isCritical && ADMIN_CHAT_ID) {
    const alertMessage = formatCriticalAlert(summary, input, output);
    await sendMessage(ADMIN_CHAT_ID, alertMessage);
  }

  // Log for debugging
  console.log(`[Leader] Task ${taskId} (${role}/${action}): ${success ? "SUCCESS" : "FAILED"}${isCritical ? " [CRITICAL]" : ""}`);
}

/**
 * Format critical alert message for admin
 */
function formatCriticalAlert(
  summary: TaskSummary, 
  input: Record<string, any>,
  output?: Record<string, any>
): string {
  const icon = summary.status === "success" ? "⚠️" : "🚨";
  
  let message = `${icon} **CRITICAL ALERT**\n\n`;
  message += `**Agent:** ${summary.role}\n`;
  message += `**Action:** ${summary.action}\n`;
  message += `**Status:** ${summary.status.toUpperCase()}\n`;
  message += `**Time:** ${summary.timestamp.toLocaleString()}\n`;
  
  if (summary.error) {
    message += `\n**Error:** ${summary.error}\n`;
  }

  // Include relevant input info (sanitized)
  const relevantFields = ["email", "subject", "message", "amount", "userId"];
  const inputSummary = relevantFields
    .filter(f => input[f])
    .map(f => `${f}: ${input[f]}`)
    .join(", ");
  
  if (inputSummary) {
    message += `\n**Details:** ${inputSummary}\n`;
  }

  message += `\n_Task ID: ${summary.taskId}_`;
  
  return message;
}

/**
 * Generate daily summary for admin
 */
export function generateDailySummary(): string {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const todaysTasks = recentTasks.filter(t => t.timestamp >= oneDayAgo);
  
  if (todaysTasks.length === 0) {
    return "📊 **Daily Report**\n\nNo tasks processed in the last 24 hours.";
  }

  const successCount = todaysTasks.filter(t => t.status === "success").length;
  const failedCount = todaysTasks.filter(t => t.status === "failed").length;
  const criticalCount = todaysTasks.filter(t => t.isCritical).length;

  // Group by role
  const byRole: Record<string, number> = {};
  todaysTasks.forEach(t => {
    byRole[t.role] = (byRole[t.role] || 0) + 1;
  });

  let message = "📊 **Daily Agent Report**\n\n";
  message += `**Total Tasks:** ${todaysTasks.length}\n`;
  message += `✅ Successful: ${successCount}\n`;
  message += `❌ Failed: ${failedCount}\n`;
  message += `🚨 Critical: ${criticalCount}\n\n`;
  
  message += "**By Agent:**\n";
  Object.entries(byRole)
    .sort((a, b) => b[1] - a[1])
    .forEach(([role, count]) => {
      message += `• ${role}: ${count} tasks\n`;
    });

  return message;
}

/**
 * Send daily summary to admin
 */
export async function sendDailySummaryToAdmin(): Promise<boolean> {
  if (!ADMIN_CHAT_ID) {
    console.log("[Leader] No admin chat ID configured, skipping daily summary");
    return false;
  }

  const summary = generateDailySummary();
  return await sendMessage(ADMIN_CHAT_ID, summary);
}

/**
 * Get recent tasks for dashboard
 */
export function getRecentTasks(limit: number = 50): TaskSummary[] {
  return recentTasks.slice(0, limit);
}

/**
 * Get task statistics
 */
export function getTaskStats(): {
  total: number;
  success: number;
  failed: number;
  critical: number;
  byRole: Record<string, number>;
} {
  const stats = {
    total: recentTasks.length,
    success: recentTasks.filter(t => t.status === "success").length,
    failed: recentTasks.filter(t => t.status === "failed").length,
    critical: recentTasks.filter(t => t.isCritical).length,
    byRole: {} as Record<string, number>,
  };

  recentTasks.forEach(t => {
    stats.byRole[t.role] = (stats.byRole[t.role] || 0) + 1;
  });

  return stats;
}
