// server/index.ts - Local development & standalone production entrypoint
import { createApp, getSessionPool } from "./app";
import { setupVite, serveStatic, log } from "./vite";

const PORT = Number(process.env.PORT) || 5000;

// Graceful shutdown handling for session pool
process.on('SIGTERM', async () => {
  log('[SHUTDOWN] Received SIGTERM, cleaning up...');
  const pool = getSessionPool();
  if (pool) {
    await pool.end();
    log('[SESSION-POOL] Closed');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('[SHUTDOWN] Received SIGINT, cleaning up...');
  const pool = getSessionPool();
  if (pool) {
    await pool.end();
    log('[SESSION-POOL] Closed');
  }
  process.exit(0);
});

(async function startServer() {
  try {
    const app = await createApp();

    const http = await import("node:http");
    const server = http.createServer(app);

    // Frontend serving: Vite dev in development, static build in production
    if (process.env.NODE_ENV === "production") {
      log("📦 Serving static frontend from /dist");
      serveStatic(app);
    } else {
      log("⚡️ Running in development mode with Vite HMR");
      await setupVite(app, server);
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server listening on port ${PORT}`);
      log(`🚀 IslandLoaf API ready at http://0.0.0.0:${PORT}`);

      if (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL) {
        log("📊 PostgreSQL connection active");
      } else {
        log("⚠️  WARNING: No database URL set - using memory storage");
      }

      // Optional: Start background agent task runner (local/standalone only)
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
