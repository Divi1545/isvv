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
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      frameAncestors: ["*"], // Allow embedding from any domain
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

function createSessionStore() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (dbUrl && process.env.NODE_ENV === "production") {
    try {
      // Configure SSL based on environment - Supabase requires SSL
      const sslConfig = process.env.PGSSLMODE === 'disable' 
        ? false 
        : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' };
      
      sessionPool = new pg.Pool({
        connectionString: dbUrl,
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: sslConfig,
      });
      
      sessionPool.on('error', (err) => {
        console.error('[SESSION-POOL] Error:', err.message);
      });
      
      log("🔐 Session store: PostgreSQL (production)");
      return new PgSession({
        pool: sessionPool,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15, // Prune every 15 minutes
        errorLog: (err) => console.error('[PG-SESSION] Error:', err.message),
      });
    } catch (err) {
      console.error('[SESSION] Failed to create PG session store, falling back to memory:', err);
    }
  }
  
  log("🔐 Session store: Memory (development)");
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
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
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
  
  if (process.env.DATABASE_URL) {
    log("📊 PostgreSQL connection active");
  } else {
    log("⚠️  WARNING: DATABASE_URL not set - server may fail");
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
