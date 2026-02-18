import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, static files are bundled in the same directory as the server bundle
  // Try multiple resolution strategies for Replit autoscale deployment compatibility
  const possiblePaths = [
    __dirname,                                    // ESM __dirname (from fileURLToPath)
    path.resolve(process.cwd(), "dist"),          // CWD/dist
    path.resolve(process.cwd()),                  // CWD directly (if files are at root)
    "/home/runner/workspace/dist",                // Replit workspace dist
  ];

  let distPath: string | null = null;
  
  for (const testPath of possiblePaths) {
    const indexPath = path.join(testPath, "index.html");
    console.log(`[STATIC] Checking: ${testPath} -> ${fs.existsSync(indexPath)}`);
    if (fs.existsSync(indexPath)) {
      distPath = testPath;
      break;
    }
  }

  if (!distPath) {
    console.error("[STATIC] ERROR: Could not find index.html in any expected location!");
    console.error("[STATIC] Checked paths:", possiblePaths);
    console.error("[STATIC] CWD:", process.cwd());
    console.error("[STATIC] __dirname:", __dirname);
    
    // List what's in CWD to debug
    try {
      const cwdContents = fs.readdirSync(process.cwd());
      console.error("[STATIC] CWD contents:", cwdContents.slice(0, 20));
    } catch (e) {
      console.error("[STATIC] Could not read CWD");
    }
    
    throw new Error(
      `Could not find index.html for static serving. CWD: ${process.cwd()}, __dirname: ${__dirname}`,
    );
  }

  console.log(`[STATIC] Serving static files from: ${distPath}`);
  
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (SPA catch-all)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath!, "index.html"));
  });
}
