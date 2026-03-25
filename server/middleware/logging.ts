// server/middleware/logging.ts
import fs from "fs";
import path from "path";
import morgan from "morgan";

try {
  const logsDir = path.join(process.cwd(), "logs");
  fs.mkdirSync(logsDir, { recursive: true });
} catch {
  // Read-only filesystem (e.g. Vercel) - skip directory creation
}

export const requestLogger = morgan("combined");