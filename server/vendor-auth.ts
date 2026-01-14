// server/vendor-auth.ts
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import type { Session } from "express-session";
import * as storage from "./storage";

const router = Router();

// Create Vendor
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { fullName, businessName, businessType, email, password, username } = req.body || {};

    if (!fullName || !businessName || !businessType || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existsByEmail = await storage.getUserByEmail(email);
    if (existsByEmail) return res.status(409).json({ error: "Email already in use" });

    if (username) {
      const existsByUsername = await storage.getUserByUsername(username);
      if (existsByUsername) return res.status(409).json({ error: "Username already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const created = await storage.createUser({
      email,
      username: username ?? null,
      password: hashed,
      fullName,
      businessName,
      businessType,
      role: req.body.businessType === "administration" ? "admin" : "vendor",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      userId: created.id,
      message: "Vendor created successfully",
    });
  } catch (err: any) {
    console.error("Error /api/vendor/register:", err);
    const code = err?.code === "23505" ? 409 : 500;
    return res.status(code).json({ error: err?.message ?? "Internal server error" });
  }
});

// Vendor Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = await storage.getUserByEmail(email);
    if (!user || user.role !== "vendor") {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    (req.session as Session).user = { userId: user.id, userRole: "vendor" };

    const { password: _pw, ...safe } = user as any;
    return res.json({ success: true, user: safe });
  } catch (err) {
    console.error("Error /api/vendor/login:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Vendor profile update
router.put("/profile", async (req: Request, res: Response) => {
  try {
    const sess = req.session.user;
    if (!sess || sess.userRole !== "vendor") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { businessName, businessType, fullName } = req.body || {};
    const updated = await storage.updateUser(sess.userId, {
      businessName,
      businessType,
      fullName,
    });

    if (!updated) return res.status(404).json({ error: "User not found" });

    const { password: _pw, ...safe } = updated as any;
    return res.json({ success: true, user: safe });
  } catch (err) {
    console.error("Error /api/vendor/profile:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;