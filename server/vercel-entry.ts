import express from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import pg from "pg";
import { registerRoutes } from "./routes";

const MemoryStore = createMemoryStore(session);
const PgSession = connectPgSimple(session);

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:", "fonts.googleapis.com", "cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "blob:", "https:", "*"],
        fontSrc: ["'self'", "data:", "https:", "fonts.gstatic.com", "fonts.googleapis.com"],
        connectSrc: ["'self'", "https:", "wss:", "*"],
        frameAncestors: ["*"],
        frameSrc: ["'self'", "https:", "*"],
      },
    },
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  })
);

app.use((_req, res, next) => {
  res.removeHeader("X-Frame-Options");
  next();
});

const allowedOrigins = [
  "https://islandloafvendor.com",
  "https://www.islandloafvendor.com",
  "https://isalndloafvendor.com",
  "https://www.isalndloafvendor.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        origin.includes("vercel.app") ||
        origin.includes("replit.dev") ||
        origin.includes("replit.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, origin);
      }
      callback(null, origin);
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const sessionSecret = process.env.SESSION_SECRET || "islandloaf-session-secret-2024";

function createVercelSessionStore() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const sessionPool = new pg.Pool({
        connectionString: dbUrl,
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false },
      });
      sessionPool.on('error', (err) => {
        console.error('[VERCEL-SESSION] Pool error:', err.message);
      });
      console.log('[VERCEL] Using PostgreSQL session store');
      return new PgSession({
        pool: sessionPool,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15,
        errorLog: (err) => console.error('[VERCEL-SESSION] Store error:', err.message),
      });
    } catch (err: any) {
      console.error('[VERCEL] Failed to create PG session store:', err.message);
    }
  }
  console.warn('[VERCEL] Using MemoryStore — sessions will NOT persist across requests');
  return new MemoryStore({ checkPeriod: 86400000 });
}

app.use(
  session({
    store: createVercelSessionStore(),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none" as const,
    },
    name: "connect.sid",
  })
);

app.get("/api/health", async (_req, res) => {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || "";
  let dbConnected = false;
  let userCount = 0;
  let adminEmail = "";
  let dbError = "";
  let sessionStoreType = dbUrl ? "postgresql" : "memory";

  try {
    const { pool } = await import("./db");
    if (pool) {
      const r = await pool.query("SELECT COUNT(*) as cnt FROM users");
      userCount = parseInt(r.rows[0].cnt);
      const admin = await pool.query("SELECT email FROM users WHERE role='admin' LIMIT 1");
      adminEmail = admin.rows[0]?.email || "no_admin_user";
      dbConnected = true;
    } else {
      dbError = "pool is null — DATABASE_URL or SUPABASE_DB_URL not set";
    }
  } catch (e: any) {
    dbError = e.message;
  }

  let dbHost = "not_set";
  try {
    if (dbUrl) dbHost = new URL(dbUrl).hostname;
  } catch { dbHost = "invalid_url"; }

  res.json({
    status: dbConnected ? "healthy" : "degraded",
    platform: "vercel",
    timestamp: new Date().toISOString(),
    db_url_set: !!dbUrl,
    db_url_source: process.env.SUPABASE_DB_URL ? "SUPABASE_DB_URL" : (process.env.DATABASE_URL ? "DATABASE_URL" : "none"),
    db_url_host: dbHost,
    db_connected: dbConnected,
    db_error: dbError || undefined,
    user_count: userCount,
    admin_email: adminEmail,
    session_store: sessionStoreType,
    supabase_url_set: !!process.env.SUPABASE_URL,
    supabase_service_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    session_secret_set: !!process.env.SESSION_SECRET,
  });
});

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

let routesRegistered = false;

async function ensureRoutes() {
  if (!routesRegistered) {
    try {
      await registerRoutes(app);
      routesRegistered = true;
    } catch (err: any) {
      console.error("[VERCEL] Failed to register routes:", err.message, err.stack);
      throw err;
    }
  }
}

const handler = async (req: any, res: any) => {
  try {
    await ensureRoutes();
    return app(req, res);
  } catch (err: any) {
    console.error("[VERCEL] Handler error:", err.message, err.stack);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  }
};

export default handler;
