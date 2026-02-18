import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { extendStorageWithIcalSupport } from "./storage/icalExtensions";
import { storage } from "./storage-provider"; // Use storage provider for proper storage selection
import session from "express-session";
import rateLimit from "express-rate-limit";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectPgSimple from 'connect-pg-simple';
import dotenv from "dotenv";
import { authDebugMiddleware } from "./middleware/auth-debug";
import { sessionDebugMiddleware } from "./middleware/session-debug";
import { getDeploymentConfig } from "./utils/deployment-config";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Get deployment configuration
const deploymentConfig = getDeploymentConfig();

// CORS configuration for custom domain deployment
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // For development, allow all replit.dev origins
    if (origin.includes('replit.dev') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Check against allowed origins
    const isAllowed = deploymentConfig.corsOrigins.some(allowedOrigin => 
      origin === allowedOrigin || origin.includes(allowedOrigin.replace('https://', '').replace('http://', ''))
    );
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    console.log(`[CORS-BLOCKED] Origin not allowed: ${origin}`);
    console.log(`[CORS-DEBUG] Allowed origins:`, deploymentConfig.corsOrigins);
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Enhanced middleware with logging
app.use(cookieParser()); // Add cookie parser before session
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging with unique IDs
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;
  (req as any).startTime = start;

  log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${requestId}`);

  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - ${requestId}`);
    return originalSend.call(this, data);
  };

  next();
});

// Rate limiting for auth endpoints (security enhancement)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Create PostgreSQL session store
const PgSession = connectPgSimple(session);
const pgSessionStore = new PgSession({
  conString: process.env.DATABASE_URL,
  tableName: 'session', // Use consistent table name
  createTableIfMissing: true, // Auto-create sessions table
  pruneSessionInterval: 60 * 15, // Cleanup expired sessions every 15 minutes
});

// Session configuration with PostgreSQL persistence
const sessionConfig = {
  store: pgSessionStore, // Use PostgreSQL for persistence
  secret: process.env.SESSION_SECRET || 'islandloaf-secure-session-key-2025',
  resave: false,
  saveUninitialized: true, // Allow session creation for all requests
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours for better persistence
    secure: false, // Use false for Replit development environment
    httpOnly: false, // Allow client-side access
    sameSite: 'lax' as const, // More compatible option
    path: '/', // Explicit path
    domain: undefined // Let browser handle domain automatically
  },
  rolling: true, // Refresh session on activity
  name: 'connect.sid', // Use default session name
  proxy: true // Trust proxy headers for deployment
};

// Override for custom domain deployment
if (deploymentConfig.isCustomDomain) {
  sessionConfig.cookie.sameSite = 'lax' as const;
  sessionConfig.cookie.secure = true; // Use secure on custom HTTPS domain
}

console.log('[SESSION-CONFIG]', JSON.stringify(sessionConfig, null, 2));
app.use(session(sessionConfig));

// Add debugging middleware (only in development)
if (!deploymentConfig.isProduction) {
  app.use(sessionDebugMiddleware);
  app.use(authDebugMiddleware);
}

// Extend storage with iCal support
extendStorageWithIcalSupport(storage);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Error:', err);
  });

  // Create HTTP server
  const http = await import('node:http');
  const server = http.createServer(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT);
  if (!process.env.PORT || !Number.isFinite(port)) {
    throw new Error("PORT environment variable must be set (Railway requires this)");
  }
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${process.env.PORT}`);
  });
})();