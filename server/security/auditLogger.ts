// server/security/auditLogger.ts
import { db } from "../db";
import { agentAuditLogs } from "@shared/schema";

export interface AuditLogEntry {
  agentId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  requestBody?: Record<string, any>;
  resultBody?: Record<string, any>;
  status: "SUCCESS" | "FAIL";
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an agent action to the audit trail
 * Never throws errors - logs failures to console and returns gracefully
 */
export async function logAgentAction(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(agentAuditLogs).values({
      agentId: entry.agentId,
      action: entry.action,
      targetType: entry.targetType || null,
      targetId: entry.targetId || null,
      requestBody: entry.requestBody || null,
      resultBody: entry.resultBody || null,
      status: entry.status,
      idempotencyKey: entry.idempotencyKey || null,
      metadata: entry.metadata || {},
    });
  } catch (error) {
    // Never throw - audit logging must not break the main operation
    console.error("Failed to write audit log:", error);
    console.error("Audit entry:", JSON.stringify(entry, null, 2));
  }
}

/**
 * Helper to log successful actions
 */
export async function logSuccess(
  agentId: string,
  action: string,
  data: {
    targetType?: string;
    targetId?: string;
    requestBody?: Record<string, any>;
    resultBody?: Record<string, any>;
    idempotencyKey?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  await logAgentAction({
    agentId,
    action,
    status: "SUCCESS",
    ...data,
  });
}

/**
 * Helper to log failed actions
 */
export async function logFailure(
  agentId: string,
  action: string,
  error: Error | string,
  data: {
    targetType?: string;
    targetId?: string;
    requestBody?: Record<string, any>;
    idempotencyKey?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;

  await logAgentAction({
    agentId,
    action,
    status: "FAIL",
    resultBody: { error: errorMessage },
    ...data,
  });
}

/**
 * Query audit logs (for admin/leader)
 */
export async function queryAuditLogs(filters: {
  agentId?: string;
  action?: string;
  status?: "SUCCESS" | "FAIL";
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    let query = db.select().from(agentAuditLogs);

    // Apply filters (simplified for now - use drizzle where clauses for production)
    const logs = await query.limit(filters.limit || 100).offset(filters.offset || 0);

    // Manual filtering (for simplicity - production should use SQL WHERE)
    let filtered = logs;
    if (filters.agentId) {
      filtered = filtered.filter((log) => log.agentId === filters.agentId);
    }
    if (filters.action) {
      filtered = filtered.filter((log) => log.action === filters.action);
    }
    if (filters.status) {
      filtered = filtered.filter((log) => log.status === filters.status);
    }

    return filtered;
  } catch (error) {
    console.error("Failed to query audit logs:", error);
    return [];
  }
}



