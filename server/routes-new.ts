// server/routes-new.ts
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import * as storage from "./storage-adapter";

const router = Router();

/**
 * Unified login:
 * - Admin: user with role 'admin' in DB (preferred)
 * - Fallback: ENV-based admin (optional)
 * - Vendor: role 'vendor' in DB
 */
router.post("/api/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    let user = await storage.getUserByEmail(email);

    // Fallback admin (if not in DB)
    if (!user) {
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@islandloaf.com";
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
      if (email === ADMIN_EMAIL) {
        if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Invalid email or password" });
        req.session.user = { userId: 1, userRole: "admin" };
        return res.json({
          success: true,
          user: {
            id: 1,
            username: "admin",
            email: ADMIN_EMAIL,
            fullName: "Admin User",
            businessName: "IslandLoaf Admin",
            businessType: "administration",
            role: "admin",
          },
        });
      }
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    const role = user.role as "admin" | "vendor";
    req.session.user = { userId: user.id, userRole: role };

    const { password: _pw, ...safe } = user as any;
    return res.json({ success: true, user: safe });
  } catch (err) {
    console.error("Error /api/login:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Current user — tolerant of old session shape and migrates
router.get("/api/me", async (req: Request, res: Response) => {
  try {
    const sess: any = req.session.user;
    if (!sess) return res.status(401).json({ error: "Not authenticated" });

    // Admin stub (DB admin will also be handled by generic branch below, but this keeps your previous behavior)
    if (sess.userRole === "admin" && sess.userId === 1) {
      return res.json({
        id: 1,
        username: "admin",
        email: process.env.ADMIN_EMAIL ?? "admin@islandloaf.com",
        fullName: "Admin User",
        businessName: "IslandLoaf Admin",
        businessType: "administration",
        role: "admin",
      });
    }

    // Vendor/Admin from DB; accept legacy { id } too
    const userId = sess.userId ?? sess.id;
    if (!userId) return res.status(401).json({ error: "Invalid session" });

    const user = await storage.getUser(Number(userId));
    if (!user) return res.status(404).json({ error: "User not found" });

    // migrate session
    req.session.user = { userId: user.id, userRole: user.role as any };

    const { password: _pw, ...safe } = user as any;
    return res.json(safe);
  } catch (err) {
    console.error("Error /api/me:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/logout", (req: Request, res: Response) => {
  try {
    req.session.destroy((err) => {
      if (err) console.error("Session destroy error:", err);
      res.clearCookie?.("connect.sid");
      res.json({ success: true });
    });
  } catch (err) {
    console.error("Error /api/logout:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Vendor Management Routes
router.get("/api/vendors", async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    const vendors = users.filter(u => u.role === 'vendor');
    res.json(vendors.map(v => {
      const { password, ...safe } = v as any;
      return safe;
    }));
  } catch (err) {
    console.error("Error /api/vendors:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/vendors", async (req: Request, res: Response) => {
  try {
    const { username, password, email, fullName, businessName, businessType } = req.body || {};
    
    if (!email || !password || !fullName || !businessName || !businessType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await storage.createUser({
      username: username || email,
      email,
      password: hashedPassword,
      fullName,
      businessName,
      businessType,
      role: "vendor",
    });

    const { password: _, ...userWithoutPassword } = newUser as any;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error("Error creating vendor:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/api/vendors/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }

    const deleted = await storage.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json({ message: "Vendor deleted successfully" });
  } catch (err) {
    console.error("Error deleting vendor:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;