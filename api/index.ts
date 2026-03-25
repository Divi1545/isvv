import express from "express";
import session from "express-session";
import helmet from "helmet";
import cors from "cors";
import createMemoryStore from "memorystore";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "../server/routes.js";
import bcrypt from "bcryptjs";

const MemoryStore = createMemoryStore(session);

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

app.use((req, res, next) => {
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

app.use(
  session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none",
    },
    name: "connect.sid",
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", platform: "vercel", timestamp: new Date().toISOString() });
});

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

let routesRegistered = false;

async function ensureRoutes() {
  if (!routesRegistered) {
    await registerRoutes(app);
    routesRegistered = true;
  }
}

const handler = async (req: any, res: any) => {
  await ensureRoutes();
  return app(req, res);
};

export default handler;
