// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

let connectionString = (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL) as string;
if (!connectionString) {
  console.error("[DB] SUPABASE_DB_URL or DATABASE_URL is not set — database operations will fail");
}

let isPooler = false;
if (connectionString) {
  isPooler = connectionString.includes('pooler.supabase.com');
  if (connectionString.includes('supabase') && !connectionString.includes('pgbouncer=true')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    connectionString = `${connectionString}${separator}pgbouncer=true`;
  }
}

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: isPooler ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : (null as any);

if (pool) {
  pool.on('error', (err: Error) => {
    console.error('Unexpected database pool error:', err.message);
  });
}

export const db = pool ? drizzle(pool) : (null as any);
