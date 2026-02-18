// server/middleware/logging.ts
import fs from "fs";
import path from "path";
import morgan from "morgan";

const logsDir = path.join(process.cwd(), "logs");
fs.mkdirSync(logsDir, { recursive: true });

export const requestLogger = morgan("combined");