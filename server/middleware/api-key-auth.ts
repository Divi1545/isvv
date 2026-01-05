import { Request, Response, NextFunction } from 'express';
import { eq } from "drizzle-orm";
import { isValidApiKeyFormat } from '../utils/crypto';
import { apiKeys, type ApiKey } from "@shared/schema";

// Extend Express Request type to include apiKey property
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKey;
    }
  }
}

/**
 * Middleware to verify API key authentication
 * Looks for the API key in the 'x-api-key' header
 */
export async function verifyApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required. Include it in the x-api-key header.' 
      });
    }
    
    // Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
      return res.status(401).json({ 
        error: 'Invalid API key format.' 
      });
    }
    
    if (!process.env.DATABASE_URL) {
      // API keys are stored in Postgres; without DB we cannot validate.
      return res.status(503).json({
        error: "API key authentication is unavailable (DATABASE_URL not configured).",
      });
    }

    // Check if API key exists and is active
    const { db } = await import("../db");
    const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey)).limit(1);
    
    if (!keyRecord) {
      return res.status(401).json({ 
        error: 'Invalid API key.' 
      });
    }
    
    if (!keyRecord.active) {
      return res.status(401).json({ 
        error: 'API key has been revoked.' 
      });
    }
    
    // Attach API key info to request for logging/monitoring
    req.apiKey = keyRecord;
    
    next();
  } catch (error) {
    console.error('API key verification error:', error);
    res.status(500).json({ 
      error: 'Internal server error during API key verification.' 
    });
  }
}

/**
 * Optional middleware to log API key usage
 */
export function logApiKeyUsage(req: Request, res: Response, next: NextFunction) {
  if (req.apiKey) {
    console.log(`API Key Usage: ${req.apiKey.label} (ID: ${req.apiKey.id}) - ${req.method} ${req.path}`);
  }
  next();
}