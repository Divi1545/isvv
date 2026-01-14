// server/security/idempotency.ts
import { db } from "../db";
import { agentIdempotencyKeys } from "@shared/schema";
import { eq, and, lt } from "drizzle-orm";

const DEFAULT_TTL_HOURS = 24;

/**
 * Check if an idempotency key exists and return cached result
 */
export async function checkIdempotency(
  agentId: string,
  idempotencyKey: string
): Promise<{ exists: boolean; result?: Record<string, any> }> {
  try {
    const [existing] = await db
      .select()
      .from(agentIdempotencyKeys)
      .where(
        and(
          eq(agentIdempotencyKeys.key, idempotencyKey),
          eq(agentIdempotencyKeys.agentId, agentId)
        )
      );

    if (!existing) {
      return { exists: false };
    }

    // Check if expired
    const now = new Date();
    if (existing.expiresAt < now) {
      // Clean up expired key
      await db
        .delete(agentIdempotencyKeys)
        .where(eq(agentIdempotencyKeys.key, idempotencyKey));
      return { exists: false };
    }

    return {
      exists: true,
      result: existing.resultBody as Record<string, any>,
    };
  } catch (error) {
    console.error("Idempotency check error:", error);
    // Fail open: if we can't check idempotency, allow the request
    return { exists: false };
  }
}

/**
 * Store idempotency key with result
 */
export async function storeIdempotency(
  agentId: string,
  idempotencyKey: string,
  result: Record<string, any>,
  ttlHours: number = DEFAULT_TTL_HOURS
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    await db.insert(agentIdempotencyKeys).values({
      key: idempotencyKey,
      agentId,
      resultBody: result,
      expiresAt,
    });
  } catch (error) {
    // If storage fails, log but don't throw (operation already succeeded)
    console.error("Failed to store idempotency key:", error);
  }
}

/**
 * Clean up expired idempotency keys (call periodically or on check)
 */
export async function cleanupExpiredKeys(): Promise<number> {
  try {
    const now = new Date();
    const deleted = await db
      .delete(agentIdempotencyKeys)
      .where(lt(agentIdempotencyKeys.expiresAt, now))
      .returning();

    return deleted.length || 0;
  } catch (error) {
    console.error("Failed to cleanup expired keys:", error);
    return 0;
  }
}

/**
 * Middleware to handle idempotency automatically
 */
export async function handleIdempotency(
  agentId: string,
  idempotencyKey: string | undefined,
  action: () => Promise<Record<string, any>>
): Promise<{ cached: boolean; result: Record<string, any> }> {
  // If no idempotency key provided, execute action directly
  if (!idempotencyKey) {
    const result = await action();
    return { cached: false, result };
  }

  // Check if we've seen this key before
  const { exists, result: cachedResult } = await checkIdempotency(agentId, idempotencyKey);

  if (exists && cachedResult) {
    return { cached: true, result: cachedResult };
  }

  // Execute action and store result
  const result = await action();
  await storeIdempotency(agentId, idempotencyKey, result);

  return { cached: false, result };
}

