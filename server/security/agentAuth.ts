// server/security/agentAuth.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { agentIdentities } from "@shared/schema";
import { eq } from "drizzle-orm";

// Extend Express Request to include agent
declare global {
  namespace Express {
    interface Request {
      agent?: {
        id: string;
        name: string;
        role: string;
        metadata: Record<string, any>;
      };
    }
  }
}

/**
 * Verify agent API key and attach agent to request
 */
export async function verifyAgentKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers["x-agent-key"] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: "Missing x-agent-key header",
        code: "MISSING_AGENT_KEY",
      });
      return;
    }

    // Check for OWNER key from env (superuser bypass)
    if (process.env.OWNER_AGENT_KEY && apiKey === process.env.OWNER_AGENT_KEY) {
      req.agent = {
        id: "owner",
        name: "Owner (ENV)",
        role: "OWNER",
        metadata: { source: "env" },
      };
      next();
      return;
    }

    // Query DB for agent identity
    // For performance, we'd normally cache this, but keeping it simple for now
    const agents = await db.select().from(agentIdentities).where(eq(agentIdentities.isActive, true));

    let matchedAgent = null;
    for (const agent of agents) {
      const matches = await bcrypt.compare(apiKey, agent.apiKeyHash);
      if (matches) {
        matchedAgent = agent;
        break;
      }
    }

    if (!matchedAgent) {
      res.status(401).json({
        success: false,
        error: "Invalid or inactive agent key",
        code: "INVALID_AGENT_KEY",
      });
      return;
    }

    // Attach agent to request
    req.agent = {
      id: matchedAgent.id,
      name: matchedAgent.name,
      role: matchedAgent.role,
      metadata: matchedAgent.metadata as Record<string, any>,
    };

    next();
  } catch (error) {
    console.error("Agent auth error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
}

/**
 * Require specific agent roles (RBAC middleware)
 */
export function requireAgentRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.agent) {
      res.status(401).json({
        success: false,
        error: "Agent not authenticated",
        code: "NOT_AUTHENTICATED",
      });
      return;
    }

    // OWNER role has access to everything
    if (req.agent.role === "OWNER") {
      next();
      return;
    }

    if (!allowedRoles.includes(req.agent.role)) {
      res.status(403).json({
        success: false,
        error: `Role ${req.agent.role} not authorized for this action`,
        code: "INSUFFICIENT_PERMISSIONS",
        allowedRoles,
      });
      return;
    }

    next();
  };
}

/**
 * Hash an agent API key (for storage)
 */
export async function hashAgentKey(plainKey: string): Promise<string> {
  return bcrypt.hash(plainKey, 10);
}



