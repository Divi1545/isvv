// server/index.ts - Production-ready entrypoint for IslandLoaf
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
import { setupVite, serveStatic, log } from "./vite";

const MemoryStore = createMemoryStore(session);
const PgSession = connectPgSimple(session);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Trust proxy for Replit (behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware - configured to allow iframe embedding while maintaining security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "fonts.googleapis.com", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "*"],
      fontSrc: ["'self'", "data:", "https:", "fonts.gstatic.com", "fonts.googleapis.com"],
      connectSrc: ["'self'", "https:", "wss:", "*"],
      frameAncestors: ["*"], // Allow embedding from any domain
      frameSrc: ["'self'", "https:", "*"],
    },
  },
  crossOriginEmbedderPolicy: false,
  frameguard: false, // Disable X-Frame-Options to allow iframe embedding
}));

// Ensure X-Frame-Options doesn't override CSP frame-ancestors
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  next();
});

// CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // For development, allow all replit.dev origins and localhost
    if (origin.includes('replit.dev') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all for development
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later." }
});

app.use("/api/", limiter);

// Request logging
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session configuration - PostgreSQL for production, Memory for fallback
const sessionSecret = process.env.SESSION_SECRET || "islandloaf-session-secret-2024";

let sessionPool: pg.Pool | null = null;

// Database connection health check function
async function testDatabaseConnection(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!dbUrl) {
    console.warn('[DB-HEALTH] ⚠️  No database URL configured');
    return false;
  }

  try {
    const isSupabasePooler = dbUrl.includes('pooler.supabase.com');
    const sslConfig = process.env.PGSSLMODE === 'disable' || isSupabasePooler
      ? false 
      : { rejectUnauthorized: false };

    const testPool = new pg.Pool({
      connectionString: dbUrl,
      max: 1,
      connectionTimeoutMillis: 5000,
      ssl: sslConfig,
    });

    console.log('[DB-HEALTH] Testing database connection...');
    const client = await testPool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    const { current_time, pg_version } = result.rows[0];
    
    console.log('[DB-HEALTH] ✅ Database connection successful!');
    console.log(`[DB-HEALTH]    Time: ${current_time}`);
    console.log(`[DB-HEALTH]    Version: ${pg_version.split(',')[0]}`);
    
    client.release();
    await testPool.end();
    return true;
  } catch (err) {
    console.error('[DB-HEALTH] ❌ Database connection failed:', err instanceof Error ? err.message : err);
    console.error('[DB-HEALTH]    Check your DATABASE_URL or SUPABASE_DB_URL configuration');
    console.error('[DB-HEALTH]    Server will continue with memory-based sessions');
    return false;
  }
}

function createSessionStore() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  // Attempt PostgreSQL session store if database URL is available
  if (dbUrl) {
    try {
      // Validate database URL format
      if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
        console.warn('[SESSION] Invalid database URL format, falling back to memory store');
        console.warn('[SESSION] Expected format: postgresql://user:pass@host:port/database');
      } else {
        // Configure SSL based on environment - Supabase pooler needs special handling
        const isSupabasePooler = dbUrl.includes('pooler.supabase.com');
        const sslConfig = process.env.PGSSLMODE === 'disable' || isSupabasePooler
          ? false 
          : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' };
        
        console.log('[SESSION] Attempting PostgreSQL session store...');
        console.log('[SESSION] Connection type:', isSupabasePooler ? 'Supabase Pooler' : 'Direct PostgreSQL');
        console.log('[SESSION] SSL Config:', sslConfig);
        
        sessionPool = new pg.Pool({
          connectionString: dbUrl,
          max: 3,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000, // Increased timeout
          ssl: sslConfig,
        });
        
        sessionPool.on('error', (err) => {
          console.error('[SESSION-POOL] Unexpected pool error:', err.message);
          console.error('[SESSION-POOL] App will continue with existing connections');
        });
        
        log("🔐 Session store: PostgreSQL");
        return new PgSession({
          pool: sessionPool,
          tableName: 'session',
          createTableIfMissing: true,
          pruneSessionInterval: 60 * 15, // Prune every 15 minutes
          errorLog: (err) => {
            console.error('[PG-SESSION] Session store error:', err.message);
            console.error('[PG-SESSION] Sessions may not persist across restarts');
          },
        });
      }
    } catch (err) {
      console.error('[SESSION] Failed to create PostgreSQL session store:', err instanceof Error ? err.message : err);
      console.error('[SESSION] Falling back to memory store - sessions will not persist across restarts!');
    }
  } else {
    console.warn('[SESSION] No DATABASE_URL or SUPABASE_DB_URL found in environment');
    console.warn('[SESSION] Set these variables for persistent session storage');
  }
  
  log("🔐 Session store: Memory (fallback) - Sessions will not persist across restarts");
  return new MemoryStore({
    checkPeriod: 86400000, // Prune expired entries every 24h
  });
}

// Graceful shutdown handling for session pool
process.on('SIGTERM', async () => {
  if (sessionPool) {
    await sessionPool.end();
    console.log('[SESSION-POOL] Closed');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (sessionPool) {
    await sessionPool.end();
    console.log('[SESSION-POOL] Closed');
  }
  process.exit(0);
});

const sessionStore = createSessionStore();

app.use(
  session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Refresh session on activity
    cookie: {
      secure: false, // Set to false for Replit compatibility (behind reverse proxy)
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for better persistence
      sameSite: "lax",
    },
    name: "connect.sid",
  }),
);

// Health check endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

// Create HTTP server
const http = await import("node:http");
const server = http.createServer(app);

// Register all business routes from server/routes.ts
await registerRoutes(app);

// Frontend serving: Vite dev in development, static build in production
if (process.env.NODE_ENV === "production") {
  log("📦 Serving static frontend from /dist");
  serveStatic(app);
} else {
  log("⚡️ Running in development mode with Vite HMR");
  await setupVite(app, server);
}

// Start server
server.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server listening on port ${PORT}`);
  log(`🚀 IslandLoaf API ready at http://0.0.0.0:${PORT}`);
  
  // Test database connection on startup
  const dbConnected = await testDatabaseConnection();
  
  if (dbConnected) {
    log("📊 Database: Connected to Supabase PostgreSQL");
  } else {
    log("⚠️  Database: Using memory store (sessions will not persist across restarts)");
    if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_URL) {
      log("💡 Tip: Set SUPABASE_DB_URL in environment variables for persistent storage");
    }
  }

  // Optional: Start background agent task runner
  if (process.env.AGENT_RUNNER_ENABLED === "true") {
    const { startBackgroundRunner } = await import("./agents/taskRunner");
    startBackgroundRunner();
    log("🤖 Agent task runner started (background mode)");
  } else {
    log("🤖 Agent task runner disabled (set AGENT_RUNNER_ENABLED=true to enable)");
  }
});
