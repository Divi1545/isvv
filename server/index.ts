// server/index-new.ts
import express from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import pgSessionFactory from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import MemoryStoreFactory from "memorystore";

import { requestLogger } from "./middleware/logging";
import authRoutes from "./routes-new";
import vendorAuth from "./vendor-auth";
import { setupVite, serveStatic, log } from "./vite";

const PgSession = pgSessionFactory(session);
const MemoryStore = MemoryStoreFactory(session);

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

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

// Session configuration
const sessionSecret = process.env.SESSION_SECRET || "islandloaf-session-secret-2024";
if (process.env.DATABASE_URL) {
  // Postgres-backed session store (production / when DB is configured)
  const { pool } = await import("./db");
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
        secure: false, // Set to true in production with HTTPS
        httpOnly: false, // Allow client-side access for debugging
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax",
      },
      name: "connect.sid",
    }),
  );
  log("🔐 Session store: PostgreSQL");
} else {
  // Dev-friendly in-memory session store (no DATABASE_URL required)
  app.use(
    session({
      store: new MemoryStore({
        checkPeriod: 24 * 60 * 60 * 1000, // prune expired entries every 24h
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
      name: "connect.sid",
    }),
  );
  log("🔐 Session store: in-memory (DATABASE_URL not set)");
}

// Auth routes
app.use(authRoutes);
app.use("/api/vendor", vendorAuth);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Setup Vite for development
const http = await import("node:http");
const server = http.createServer(app);

if (process.env.NODE_ENV !== "production") {
  log("⚡️ Running in development mode");
  await setupVite(app, server);
} else {
  serveStatic(app);
}

server.listen(PORT, "0.0.0.0", () => {
  log(`🚀 Server running on http://localhost:${PORT}`);
  if (process.env.DATABASE_URL) {
    console.log("📊 PostgreSQL connection active");
  } else {
    console.log("📊 Running without DATABASE_URL (in-memory storage/session)");
  }
});