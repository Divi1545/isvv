import { defineConfig } from "drizzle-kit";

// Use Supabase DB URL if available, fallback to DATABASE_URL
const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("SUPABASE_DB_URL or DATABASE_URL is required");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
