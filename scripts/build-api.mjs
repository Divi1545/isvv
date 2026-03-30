import { build } from "esbuild";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const apiDir = path.resolve(root, "api");
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

await build({
  entryPoints: [path.resolve(root, "server/vercel-entry.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: path.resolve(root, "api/index.mjs"),
  external: [
    "express",
    "express-session",
    "helmet",
    "cors",
    "memorystore",
    "connect-pg-simple",
    "express-rate-limit",
    "bcryptjs",
    "pg",
    "drizzle-orm",
    "drizzle-orm/*",
    "drizzle-zod",
    "zod",
    "openai",
    "multer",
    "jsonwebtoken",
    "uuid",
    "@supabase/supabase-js",
    "morgan",
    "fs",
    "path",
    "crypto",
    "url",
  ],
  alias: {
    "@shared": path.resolve(root, "shared"),
    "@": path.resolve(root, "client/src"),
  },
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});

console.log("API function bundled successfully -> api/index.mjs");
