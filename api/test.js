export default function handler(req, res) {
  res.json({
    env_keys: Object.keys(process.env).filter(k =>
      k.includes("DATABASE") || k.includes("SUPA") || k.includes("PG")
    ),
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT_SET",
    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL ? "SET" : "NOT_SET",
    SUPABASE_URL: process.env.SUPABASE_URL ? "SET" : "NOT_SET",
    total_env_count: Object.keys(process.env).length,
  });
}
