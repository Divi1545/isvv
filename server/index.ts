// server/index.ts - Production-ready entrypoint for IslandLoaf
import express from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import pgSessionFactory from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import { requestLogger } from "./middleware/logging";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";

const PgSession = pgSessionFactory(session);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

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

// Session configuration - Postgres-backed only (production-safe)
const sessionSecret = process.env.SESSION_SECRET || "islandloaf-session-secret-2024";

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
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

log("🔐 Session store: PostgreSQL (via connect-pg-simple)");

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
