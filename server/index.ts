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

// CORS - Allow custom domains and Replit domains
const allowedOrigins = [
  'https://islandloafvendor.com',
  'https://www.islandloafvendor.com',
  'https://isalndloafvendor.com',
  'https://www.isalndloafvendor.com',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (origin.includes('replit.dev') || 
        origin.includes('replit.app') ||
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

async function testDatabaseConnection(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) return false;
  
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
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (dbUrl && process.env.NODE_ENV === "production") {
    try {
      // Configure SSL based on environment - Supabase requires SSL
      const sslConfig = process.env.PGSSLMODE === 'disable' 
        ? false 
        : { rejectUnauthorized: false }; // Changed to false for Supabase compatibility
      
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
      
      log("✅ Session store: PostgreSQL");
      return new PgSession({
        pool: sessionPool,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15, // Prune every 15 minutes
        errorLog: (err) => console.error('[PG-SESSION] Error:', err.message),
      });
    } catch (err: any) {
      console.error('[SESSION] Failed to create PG session store, falling back to memory:', err.message);
    }
  }
  
  log("🔐 Session store: Memory (development)");
  return new MemoryStore({
    checkPeriod: 86400000, // Prune expired entries every 24h
  });
}

// Graceful shutdown handling for session pool
process.on('SIGTERM', async () => {
  log('[SHUTDOWN] Received SIGTERM, cleaning up...');
  if (sessionPool) {
    await sessionPool.end();
    log('[SESSION-POOL] Closed');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('[SHUTDOWN] Received SIGINT, cleaning up...');
  if (sessionPool) {
    await sessionPool.end();
    log('[SESSION-POOL] Closed');
  }
  process.exit(0);
});

// Wrap async startup in an IIFE for ESM compatibility
(async function startServer() {
  try {
    // Test database connection first
    if (process.env.NODE_ENV === "production") {
      await testDatabaseConnection();
    }
    
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
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server listening on port ${PORT}`);
      log(`🚀 IslandLoaf API ready at http://0.0.0.0:${PORT}`);
      
      if (process.env.DATABASE_URL) {
        log("📊 PostgreSQL connection active");
      } else {
        log("⚠️  WARNING: DATABASE_URL not set - using memory storage");
      }

      // Optional: Start background agent task runner
      if (process.env.AGENT_RUNNER_ENABLED === "true") {
        import("./agents/taskRunner").then(({ startBackgroundRunner }) => {
          startBackgroundRunner();
          log("🤖 Agent task runner started (background mode)");
        }).catch(err => {
          console.error('[AGENT] Failed to start task runner:', err.message);
        });
      } else {
        log("🤖 Agent task runner disabled (set AGENT_RUNNER_ENABLED=true to enable)");
      }
    });
  } catch (err: any) {
    console.error('[STARTUP] Fatal error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
