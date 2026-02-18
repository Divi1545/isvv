// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// Use Supabase DB URL if available, fallback to DATABASE_URL
let connectionString = (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL) as string;
if (!connectionString) {
  throw new Error("SUPABASE_DB_URL or DATABASE_URL is not set");
}

// Check if using Supabase pooler (which doesn't support SSL the same way)
const isPooler = connectionString.includes('pooler.supabase.com');

// Ensure the connection string uses pgbouncer=true for Supabase pooler
if (connectionString.includes('supabase') && !connectionString.includes('pgbouncer=true')) {
  const separator = connectionString.includes('?') ? '&' : '?';
  connectionString = `${connectionString}${separator}pgbouncer=true`;
}

export const pool = new Pool({
  connectionString,
  // Supabase pooler doesn't support SSL in the same way
  ssl: isPooler ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

export const db = drizzle(pool);
