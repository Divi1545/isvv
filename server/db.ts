// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

let connectionString = (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL) as string;
if (!connectionString) {
  console.error("[DB] SUPABASE_DB_URL or DATABASE_URL is not set — database operations will fail");
}

let isPooler = false;
if (connectionString) {
  // Detect pooler: either pooler.supabase.com hostname OR port 6543 (transaction mode)
  isPooler = connectionString.includes('pooler.supabase.com') || connectionString.includes(':6543');

  if (isPooler && !connectionString.includes('pgbouncer=true')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    connectionString = `${connectionString}${separator}pgbouncer=true`;
  }

  try {
    const parsed = new URL(connectionString);
    console.log(`[DB] Connecting to ${parsed.hostname}:${parsed.port || 5432} (pooler: ${isPooler})`);
  } catch {
    console.log(`[DB] Connection string set (could not parse URL for logging)`);
  }
}

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : (null as any);

if (pool) {
  pool.on('error', (err: Error) => {
    console.error('[DB] Unexpected pool error:', err.message);
  });
}

export const db = pool ? drizzle(pool) : (null as any);
