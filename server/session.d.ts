// server/session.d.ts
import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      userId: number;
      userRole: "admin" | "vendor";
    };
  }
}