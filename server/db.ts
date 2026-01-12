// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// Use Supabase DB URL if available, fallback to DATABASE_URL
const connectionString = (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL) as string;
if (!connectionString) {
  throw new Error("SUPABASE_DB_URL or DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool);
