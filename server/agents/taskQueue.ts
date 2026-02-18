// server/agents/taskQueue.ts
import { db } from "../db";
import { agentTasks, type AgentRole, type TaskStatus } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface CreateTaskInput {
  assignedToRole: AgentRole;
  input: Record<string, any>;
  priority?: number;
  createdByAgentId?: string;
}

export interface TaskResult {
  id: string;
  assignedToRole: string;
  status: TaskStatus | string; // Allow string from DB queries
  input: Record<string, any>;
  output?: Record<string, any> | null; // Allow null from DB
  error?: string | null;
  createdAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Create a new task in the queue
 */
export async function createTask(input: CreateTaskInput): Promise<TaskResult> {
  const [task] = await db
    .insert(agentTasks)
    .values({
      assignedToRole: input.assignedToRole,
      input: input.input,
      priority: input.priority || 5,
      createdByAgentId: input.createdByAgentId || null,
      status: "QUEUED",
      retryCount: 0,
    })
    .returning();

  return task as TaskResult;
}

/**
 * Get the next queued task for a specific role
 * Atomically updates status to RUNNING to prevent double-processing
 */
export async function getNextTask(role: AgentRole): Promise<TaskResult | null> {
  try {
    // Find oldest queued task for this role
    const [queuedTask] = await db
      .select()
      .from(agentTasks)
      .where(
        and(
          eq(agentTasks.assignedToRole, role),
          eq(agentTasks.status, "QUEUED")
        )
      )
      .orderBy(agentTasks.priority, agentTasks.createdAt)
      .limit(1);

    if (!queuedTask) {
      return null;
    }

    // Atomically update to RUNNING
    const [runningTask] = await db
      .update(agentTasks)
      .set({
        status: "RUNNING",
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agentTasks.id, queuedTask.id),
          eq(agentTasks.status, "QUEUED") // Ensure it's still queued (race condition protection)
        )
      )
      .returning();

    return runningTask || null;
  } catch (error) {
    console.error("Error fetching next task:", error);
    return null;
  }
}

/**
 * Mark a task as completed successfully
 */
export async function completeTask(
  taskId: string,
  output: Record<string, any>
): Promise<TaskResult | null> {
  try {
    const [task] = await db
      .update(agentTasks)
      .set({
        status: "DONE",
        output,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentTasks.id, taskId))
      .returning();

    return task || null;
  } catch (error) {
    console.error("Error completing task:", error);
    return null;
  }
}

/**
 * Mark a task as failed
 */
export async function failTask(
  taskId: string,
  error: string
): Promise<TaskResult | null> {
  try {
    const [task] = await db
      .update(agentTasks)
      .set({
        status: "FAILED",
        error,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentTasks.id, taskId))
      .returning();

    return task || null;
  } catch (error: any) {
    console.error("Error failing task:", error);
    return null;
  }
}

/**
 * Requeue a failed task (if retryCount < 3)
 */
export async function requeueTask(taskId: string): Promise<TaskResult | null> {
  try {
    // Get current task
    const [currentTask] = await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.id, taskId));

    if (!currentTask) {
      return null;
    }

    if (currentTask.retryCount >= 3) {
      console.warn(`Task ${taskId} exceeded max retries (3)`);
      return null;
    }

    const [task] = await db
      .update(agentTasks)
      .set({
        status: "QUEUED",
        retryCount: currentTask.retryCount + 1,
        error: null,
        startedAt: null,
        completedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(agentTasks.id, taskId))
      .returning();

    return task || null;
  } catch (error) {
    console.error("Error requeuing task:", error);
    return null;
  }
}

/**
 * Get tasks by status and optionally by role
 */
export async function getTasksByStatus(
  status: TaskStatus,
  role?: AgentRole
): Promise<TaskResult[]> {
  try {
    const conditions = role
      ? and(eq(agentTasks.status, status), eq(agentTasks.assignedToRole, role))
      : eq(agentTasks.status, status);

    const tasks = await db
      .select()
      .from(agentTasks)
      .where(conditions)
      .limit(100);
      
    return tasks as TaskResult[];
  } catch (error) {
    console.error("Error fetching tasks by status:", error);
    return [];
  }
}

/**
 * Get task by ID
 */
export async function getTaskById(taskId: string): Promise<TaskResult | null> {
  try {
    const [task] = await db.select().from(agentTasks).where(eq(agentTasks.id, taskId));
    return task || null;
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    return null;
  }
}

/**
 * Clean up old completed/failed tasks (optional maintenance)
 */
export async function cleanupOldTasks(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // TODO: Implement cleanup with drizzle where clause for date comparison
    console.log(`TODO: Cleanup tasks older than ${daysOld} days (before ${cutoffDate})`);
    return 0;
  } catch (error) {
    console.error("Error cleaning up old tasks:", error);
    return 0;
  }
}

