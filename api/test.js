module.exports = (req, res) => {
  res.json({
    env_keys: Object.keys(process.env).filter(k => 
      k.includes("DATABASE") || k.includes("SUPA") || k.includes("SESSION")
    ),
    db_url: process.env.DATABASE_URL ? "SET" : "NOT_SET",
    supabase_db: process.env.SUPABASE_DB_URL ? "SET" : "NOT_SET",
    supabase_url: process.env.SUPABASE_URL ? "SET" : "NOT_SET",
  });
};
