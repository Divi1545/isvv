// server/routes/agentManagement.ts
import { Router, Request, Response } from "express";
import { z } from "zod";
import { hashAgentKey } from "../security/agentAuth";
import { verifyAgentKey, requireAgentRole } from "../security/agentAuth";
import { queryAuditLogs } from "../security/auditLogger";
import { db } from "../db";
import { agentIdentities, agentTasks, agentRoles } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// Session-based auth middleware (admin only)
function requireAdminSession(req: Request, res: Response, next: any) {
  if (!req.session?.user || req.session.user.userRole !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
      code: "ADMIN_REQUIRED",
    });
  }
  next();
}

/**
 * POST /api/agent/identities
 * Create a new agent identity (admin only)
 */
router.post("/identities", requireAdminSession, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      role: z.enum(agentRoles as any),
      metadata: z.record(z.any()).optional(),
    });

    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        details: validationResult.error.errors,
      });
    }

    const { name, role, metadata } = validationResult.data;

    // Generate secure API key (32 bytes = 64 hex chars)
    const apiKey = `agent_${crypto.randomBytes(32).toString("hex")}`;

    // Hash the key for storage
    const apiKeyHash = await hashAgentKey(apiKey);

    // Insert into database
    const [agent] = await db
      .insert(agentIdentities)
      .values({
        name,
        role,
        apiKeyHash,
        isActive: true,
        metadata: metadata || {},
      })
      .returning();

    // Return the plaintext key ONCE (never stored or shown again)
    return res.status(201).json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        isActive: agent.isActive,
        createdAt: agent.createdAt,
        apiKey, // ⚠️ SHOWN ONLY ONCE
      },
      message: "Agent identity created successfully",
      warning: "Save the API key securely. It will not be shown again.",
    });
  } catch (error: any) {
    console.error("Failed to create agent identity:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create agent identity",
      code: "AGENT_CREATE_FAILED",
    });
  }
});

/**
 * GET /api/agent/identities
 * List all agent identities (admin only)
 */
router.get("/identities", requireAdminSession, async (req: Request, res: Response) => {
  try {
    const agents = await db.select({
      id: agentIdentities.id,
      name: agentIdentities.name,
      role: agentIdentities.role,
      isActive: agentIdentities.isActive,
      metadata: agentIdentities.metadata,
      createdAt: agentIdentities.createdAt,
      updatedAt: agentIdentities.updatedAt,
    }).from(agentIdentities);

    return res.json({
      success: true,
      data: agents,
      count: agents.length,
    });
  } catch (error: any) {
    console.error("Failed to list agent identities:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to list agents",
      code: "AGENT_LIST_FAILED",
    });
  }
});

/**
 * PATCH /api/agent/identities/:id
 * Update an agent identity (admin only)
 */
router.patch("/identities/:id", requireAdminSession, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const schema = z.object({
      name: z.string().min(1).optional(),
      role: z.enum(agentRoles as any).optional(),
      isActive: z.boolean().optional(),
      metadata: z.record(z.any()).optional(),
    });

    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        details: validationResult.error.errors,
      });
    }

    const updates = validationResult.data;

    const [agent] = await db
      .update(agentIdentities)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(agentIdentities.id, id))
      .returning();

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
        code: "AGENT_NOT_FOUND",
      });
    }

    return res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        isActive: agent.isActive,
        updatedAt: agent.updatedAt,
      },
      message: "Agent identity updated successfully",
    });
  } catch (error: any) {
    console.error("Failed to update agent identity:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update agent",
      code: "AGENT_UPDATE_FAILED",
    });
  }
});

/**
 * DELETE /api/agent/identities/:id
 * Soft delete an agent identity (set isActive=false)
 */
router.delete("/identities/:id", requireAdminSession, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [agent] = await db
      .update(agentIdentities)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(agentIdentities.id, id))
      .returning();

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: "Agent not found",
        code: "AGENT_NOT_FOUND",
      });
    }

    return res.json({
      success: true,
      message: "Agent identity deactivated successfully",
    });
  } catch (error: any) {
    console.error("Failed to delete agent identity:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to delete agent",
      code: "AGENT_DELETE_FAILED",
    });
  }
});

/**
 * GET /api/agent/audit-logs
 * Query audit logs (admin or LEADER role)
 */
router.get("/audit-logs", verifyAgentKey, requireAgentRole(["OWNER", "LEADER"]), async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      agentId: z.string().optional(),
      action: z.string().optional(),
      status: z.enum(["SUCCESS", "FAIL"]).optional(),
      limit: z.string().transform(Number).optional(),
      offset: z.string().transform(Number).optional(),
    });

    const validationResult = schema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: validationResult.error.errors,
      });
    }

    const filters = validationResult.data;

    const logs = await queryAuditLogs({
      agentId: filters.agentId,
      action: filters.action,
      status: filters.status,
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    });

    return res.json({
      success: true,
      data: logs,
      count: logs.length,
      filters,
    });
  } catch (error: any) {
    console.error("Failed to query audit logs:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to query audit logs",
      code: "AUDIT_QUERY_FAILED",
    });
  }
});

/**
 * GET /api/agent/tasks
 * Query agent tasks (admin or LEADER role)
 */
router.get("/tasks", verifyAgentKey, requireAgentRole(["OWNER", "LEADER"]), async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      status: z.enum(["QUEUED", "RUNNING", "DONE", "FAILED"]).optional(),
      role: z.enum(agentRoles as any).optional(),
      limit: z.string().transform(Number).optional(),
    });

    const validationResult = schema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: validationResult.error.errors,
      });
    }

    const { status, role, limit } = validationResult.data;

    let query = db.select().from(agentTasks);

    // Apply filters
    const conditions: any[] = [];
    if (status) {
      conditions.push(eq(agentTasks.status, status));
    }
    if (role) {
      conditions.push(eq(agentTasks.assignedToRole, role));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const tasks = await query.limit(limit || 100);

    return res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error: any) {
    console.error("Failed to query tasks:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to query tasks",
      code: "TASK_QUERY_FAILED",
    });
  }
});

export default router;



