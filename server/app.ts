// server/app.ts - Express app factory, shared by local dev server and Vercel serverless
import express from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import pg from "pg";
import { requestLogger } from "./middleware/logging";
import { registerRoutes } from "./routes";
import { log } from "./log";

const MemoryStore = createMemoryStore(session);
const PgSession = connectPgSimple(session);

let sessionPool: pg.Pool | null = null;

export async function testDatabaseConnection(): Promise<boolean> {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) return false;

  const dbHost = dbUrl.includes('supabase') ? 'Supabase' : 'PostgreSQL';
  console.log(`[DB-CONFIG] Using ${dbHost} database`);

  try {
    const testPool = new pg.Pool({
      connectionString: dbUrl,
      max: 1,
      connectionTimeoutMillis: 5000,
      ssl: process.env.PGSSLMODE === 'disable'
        ? false
        : { rejectUnauthorized: false },
    });

    const client = await testPool.connect();
    await client.query('SELECT 1');
    client.release();
    await testPool.end();

    log("✅ [DB-HEALTH] Database connection successful!");
    return true;
  } catch (err: any) {
    console.error('[DB-HEALTH] Database connection failed:', err.message);
    return false;
  }
}

function createSessionStore() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  // Use PostgreSQL sessions whenever a DB URL is available (required for serverless)
  if (dbUrl) {
    try {
      const sslConfig = process.env.PGSSLMODE === 'disable'
        ? false
        : { rejectUnauthorized: false };

      sessionPool = new pg.Pool({
        connectionString: dbUrl,
        max: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: sslConfig,
      });

      sessionPool.on('error', (err) => {
        console.error('[SESSION-POOL] Error:', err.message);
      });

      log("✅ Session store: PostgreSQL");
      return new PgSession({
        pool: sessionPool,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15,
        errorLog: (err) => console.error('[PG-SESSION] Error:', err.message),
      });
    } catch (err: any) {
      console.error('[SESSION] Failed to create PG session store, falling back to memory:', err.message);
    }
  }

  log("🔐 Session store: Memory (development only)");
  return new MemoryStore({
    checkPeriod: 86400000,
  });
}

export function getSessionPool() {
  return sessionPool;
}

/**
 * Creates and configures the Express app with all middleware and routes.
 * Used by both the local dev server (server/index.ts) and the Vercel
 * serverless function entry point (api/index.ts).
 */
export async function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
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
  }));

  app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    next();
  });

  // CORS
  const allowedOrigins = [
    'https://islandloafvendor.com',
    'https://www.islandloafvendor.com',
    'https://isalndloafvendor.com',
    'https://www.isalndloafvendor.com',
  ];

  app.use(cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (origin.includes('vercel.app') ||
          origin.includes('replit.dev') ||
          origin.includes('replit.app') ||
          origin.includes('railway.app') ||
          origin.includes('up.railway.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          allowedOrigins.includes(origin)) {
        return callback(null, origin);
      }

      callback(null, origin);
    },
    credentials: true,
    optionsSuccessStatus: 200
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests from this IP, please try again later." }
  });

  app.use("/api/", limiter);

  // Request logging
  app.use(requestLogger);

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Sessions
  await testDatabaseConnection();
  const sessionStore = createSessionStore();
  const sessionSecret = process.env.SESSION_SECRET || "islandloaf-session-secret-2024";

  app.use(
    session({
      store: sessionStore,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
      name: "connect.sid",
    }),
  );

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.get("/health", (_req, res) => {
    res.status(200).send("OK");
  });

  // Business routes
  await registerRoutes(app);

  return app;
}
