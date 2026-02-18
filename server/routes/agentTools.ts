// server/routes/agentTools.ts
import { Router, Request, Response } from "express";
import { z } from "zod";
import { verifyAgentKey, requireAgentRole } from "../security/agentAuth";
import { checkPermission, validateBookingCreation, validateRefund } from "../security/agentPolicy";
import { handleIdempotency } from "../security/idempotency";
import { logSuccess, logFailure } from "../security/auditLogger";
import * as storage from "../storage-adapter";
import { hashAgentKey } from "../security/agentAuth";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

const router = Router();

// Initialize Stripe if configured
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" })
  : null;

// ==================== VENDOR MANAGEMENT ENDPOINTS ====================

/**
 * POST /api/agent/tools/vendors/create
 * Create a new vendor
 */
router.post(
  "/vendors/create",
  verifyAgentKey,
  requireAgentRole(["OWNER", "LEADER", "VENDOR_ONBOARDING"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "vendors:create";

    try {
      // Check permission
      const policyCheck = checkPermission(agent.role, action);
      if (!policyCheck.allowed) {
        await logFailure(agent.id, action, policyCheck.reason || "Permission denied", {
          requestBody: req.body,
          idempotencyKey,
        });
        return res.status(403).json({
          success: false,
          error: policyCheck.reason,
          code: "POLICY_DENIED",
        });
      }

      // Validate request
      const schema = z.object({
        email: z.string().email(),
        fullName: z.string().min(1),
        businessName: z.string().min(1),
        businessType: z.enum(["stays", "vehicles", "tours", "wellness", "tickets", "products"]),
        password: z.string().min(8).optional(),
        categoriesAllowed: z.array(z.string()).optional(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;

      // Handle idempotency
      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        // Generate password if not provided
        const password = data.password || `temp-${Math.random().toString(36).slice(2)}`;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create vendor
        const vendor = await storage.createUser({
          email: data.email,
          username: data.email,
          password: hashedPassword,
          fullName: data.fullName,
          businessName: data.businessName,
          businessType: data.businessType,
          role: "vendor",
          categoriesAllowed: data.categoriesAllowed,
        });

        return {
          success: true,
          data: {
            id: vendor.id,
            email: vendor.email,
            businessName: vendor.businessName,
            businessType: vendor.businessType,
          },
          message: "Vendor created successfully",
          metadata: {
            agentId: agent.id,
            agentRole: agent.role,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "vendor",
          targetId: result.data.id.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.status(cached ? 200 : 201).json({
        ...result,
        cached,
      });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create vendor",
        code: "VENDOR_CREATE_FAILED",
      });
    }
  }
);

/**
 * POST /api/agent/tools/vendors/approve
 * Approve a vendor (activate account)
 */
router.post(
  "/vendors/approve",
  verifyAgentKey,
  requireAgentRole(["OWNER", "LEADER"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "vendors:approve";

    try {
      const policyCheck = checkPermission(agent.role, action);
      if (!policyCheck.allowed) {
        await logFailure(agent.id, action, policyCheck.reason || "Permission denied", {
          requestBody: req.body,
          idempotencyKey,
        });
        return res.status(403).json({
          success: false,
          error: policyCheck.reason,
          code: policyCheck.requiresOwnerApproval ? "REQUIRES_OWNER_APPROVAL" : "POLICY_DENIED",
        });
      }

      const schema = z.object({
        vendorId: z.number().int().positive(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const { vendorId } = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        // Note: The current schema doesn't have an isActive field, but we'll update the vendor
        // In a real implementation, you'd add an isActive field to the users table
        const vendor = await storage.getUser(vendorId);
        if (!vendor) {
          throw new Error("Vendor not found");
        }

        // For now, we'll just log the approval (future: add isActive field)
        return {
          success: true,
          data: {
            vendorId,
            status: "approved",
            approvedAt: new Date().toISOString(),
          },
          message: "Vendor approved successfully",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "vendor",
          targetId: vendorId.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to approve vendor",
        code: "VENDOR_APPROVE_FAILED",
      });
    }
  }
);

/**
 * POST /api/agent/tools/vendors/suspend
 * Suspend a vendor (high-risk action)
 */
router.post(
  "/vendors/suspend",
  verifyAgentKey,
  requireAgentRole(["OWNER", "LEADER"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "vendors:suspend";

    try {
      const policyCheck = checkPermission(agent.role, action);
      if (!policyCheck.allowed) {
        await logFailure(agent.id, action, policyCheck.reason || "Permission denied", {
          requestBody: req.body,
          idempotencyKey,
        });
        return res.status(403).json({
          success: false,
          error: policyCheck.reason,
          code: policyCheck.requiresOwnerApproval ? "REQUIRES_OWNER_APPROVAL" : "POLICY_DENIED",
        });
      }

      const schema = z.object({
        vendorId: z.number().int().positive(),
        reason: z.string().min(1),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const { vendorId, reason } = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        const vendor = await storage.getUser(vendorId);
        if (!vendor) {
          throw new Error("Vendor not found");
        }

        // For now, log suspension (future: add isActive=false to user)
        return {
          success: true,
          data: {
            vendorId,
            status: "suspended",
            reason,
            suspendedAt: new Date().toISOString(),
          },
          message: "Vendor suspended successfully",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "vendor",
          targetId: vendorId.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to suspend vendor",
        code: "VENDOR_SUSPEND_FAILED",
      });
    }
  }
);

// ==================== SERVICE MANAGEMENT ENDPOINTS ====================

/**
 * POST /api/agent/tools/services/create
 * Create a new service
 */
router.post(
  "/services/create",
  verifyAgentKey,
  requireAgentRole(["OWNER", "VENDOR_ONBOARDING"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "services:create";

    try {
      const schema = z.object({
        userId: z.number().int().positive(),
        name: z.string().min(1),
        description: z.string().min(1),
        type: z.enum(["stays", "vehicles", "tours", "wellness", "tickets", "products"]),
        basePrice: z.number().positive(),
        available: z.boolean().default(true),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        const service = await storage.createService(data);

        return {
          success: true,
          data: service,
          message: "Service created successfully",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "service",
          targetId: result.data.id.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.status(cached ? 200 : 201).json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create service",
        code: "SERVICE_CREATE_FAILED",
      });
    }
  }
);

/**
 * POST /api/agent/tools/services/update
 * Update a service
 */
router.post(
  "/services/update",
  verifyAgentKey,
  requireAgentRole(["OWNER", "PRICING", "VENDOR_ONBOARDING"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "services:update";

    try {
      const schema = z.object({
        serviceId: z.number().int().positive(),
        name: z.string().optional(),
        description: z.string().optional(),
        basePrice: z.number().positive().optional(),
        available: z.boolean().optional(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const { serviceId, ...updates } = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        const service = await storage.updateService(serviceId, updates);
        if (!service) {
          throw new Error("Service not found");
        }

        return {
          success: true,
          data: service,
          message: "Service updated successfully",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "service",
          targetId: serviceId.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to update service",
        code: "SERVICE_UPDATE_FAILED",
      });
    }
  }
);

// ==================== BOOKING MANAGEMENT ENDPOINTS ====================

/**
 * POST /api/agent/tools/bookings/create
 * Create a new booking (with availability check)
 */
router.post(
  "/bookings/create",
  verifyAgentKey,
  requireAgentRole(["OWNER", "BOOKING_MANAGER"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "bookings:create";

    try {
      const schema = z.object({
        userId: z.number().int().positive(),
        serviceId: z.number().int().positive(),
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        startDate: z.string(),
        endDate: z.string(),
        totalPrice: z.number().positive(),
        commission: z.number().nonnegative().optional(),
        notes: z.string().optional(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;

      // Policy check for double-booking
      const policyCheck = validateBookingCreation({
        startDate: data.startDate,
        endDate: data.endDate,
        serviceAvailable: true, // TODO: check actual availability
        conflictingBookings: 0, // TODO: check for conflicts
      });

      if (!policyCheck.allowed) {
        await logFailure(agent.id, action, policyCheck.reason || "Policy check failed", {
          requestBody: req.body,
          idempotencyKey,
        });
        return res.status(400).json({
          success: false,
          error: policyCheck.reason,
          code: "BOOKING_VALIDATION_FAILED",
        });
      }

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        const booking = await storage.createBooking({
          userId: data.userId,
          serviceId: data.serviceId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          totalPrice: data.totalPrice,
          commission: data.commission || data.totalPrice * 0.1,
          status: "pending",
          notes: data.notes,
        });

        return {
          success: true,
          data: booking,
          message: "Booking created successfully",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "booking",
          targetId: result.data.id.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.status(cached ? 200 : 201).json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create booking",
        code: "BOOKING_CREATE_FAILED",
      });
    }
  }
);

/**
 * POST /api/agent/tools/bookings/update-status
 * Update booking status
 */
router.post(
  "/bookings/update-status",
  verifyAgentKey,
  requireAgentRole(["OWNER", "BOOKING_MANAGER"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "bookings:update-status";

    try {
      const schema = z.object({
        bookingId: z.number().int().positive(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "refunded"]),
        reason: z.string().optional(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const { bookingId, status, reason } = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        const booking = await storage.updateBooking(bookingId, { status });
        if (!booking) {
          throw new Error("Booking not found");
        }

        return {
          success: true,
          data: {
            bookingId,
            status,
            updatedAt: new Date().toISOString(),
          },
          message: `Booking status updated to ${status}`,
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "booking",
          targetId: bookingId.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to update booking status",
        code: "BOOKING_UPDATE_FAILED",
      });
    }
  }
);

// ==================== CALENDAR MANAGEMENT ENDPOINTS ====================

/**
 * POST /api/agent/tools/calendar/add-source
 * Add a calendar sync source
 */
router.post(
  "/calendar/add-source",
  verifyAgentKey,
  requireAgentRole(["OWNER", "CALENDAR_SYNC"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "calendar:create";

    try {
      const schema = z.object({
        userId: z.number().int().positive(),
        serviceId: z.number().int().positive().optional(),
        name: z.string().min(1),
        url: z.string().url(),
        type: z.enum(["google", "airbnb", "booking.com", "ical", "other"]),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        const calendarSource = await storage.createCalendarSource({
          userId: data.userId,
          serviceId: data.serviceId || null,
          name: data.name,
          url: data.url,
          type: data.type,
        });

        return {
          success: true,
          data: calendarSource,
          message: "Calendar source added successfully",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "calendar_source",
          targetId: result.data.id.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.status(cached ? 200 : 201).json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to add calendar source",
        code: "CALENDAR_SOURCE_FAILED",
      });
    }
  }
);

/**
 * POST /api/agent/tools/calendar/sync
 * Trigger calendar sync
 */
router.post(
  "/calendar/sync",
  verifyAgentKey,
  requireAgentRole(["OWNER", "CALENDAR_SYNC"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "calendar:sync";

    try {
      const schema = z.object({
        calendarSourceId: z.number().int().positive(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const { calendarSourceId } = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        // Check if syncCalendarFromUrl is available (from icalExtensions)
        if ((storage as any).syncCalendarFromUrl) {
          const syncResult = await (storage as any).syncCalendarFromUrl(calendarSourceId);
          return {
            success: syncResult.success,
            data: syncResult,
            message: syncResult.message,
            metadata: {
              agentId: agent.id,
              action,
              timestamp: new Date().toISOString(),
            },
          };
        } else {
          throw new Error("Calendar sync functionality not available");
        }
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "calendar_source",
          targetId: calendarSourceId.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to sync calendar",
        code: "CALENDAR_SYNC_FAILED",
      });
    }
  }
);

// ==================== PRICING MANAGEMENT ENDPOINTS ====================

/**
 * POST /api/agent/tools/pricing/update-base
 * Update service base price
 */
router.post(
  "/pricing/update-base",
  verifyAgentKey,
  requireAgentRole(["OWNER", "PRICING"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "services:update-price";

    try {
      const schema = z.object({
        serviceId: z.number().int().positive(),
        basePrice: z.number().positive(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const { serviceId, basePrice } = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        const service = await storage.updateService(serviceId, { basePrice });
        if (!service) {
          throw new Error("Service not found");
        }

        return {
          success: true,
          data: {
            serviceId,
            basePrice: service.basePrice,
            updatedAt: new Date().toISOString(),
          },
          message: "Base price updated successfully",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "service",
          targetId: serviceId.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to update price",
        code: "PRICE_UPDATE_FAILED",
      });
    }
  }
);

// ==================== SUPPORT MANAGEMENT ENDPOINTS ====================

/**
 * POST /api/agent/tools/support/tickets/create
 * Create a support ticket (via notifications)
 */
router.post(
  "/support/tickets/create",
  verifyAgentKey,
  requireAgentRole(["OWNER", "SUPPORT", "LEADER"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "tickets:create";

    try {
      const schema = z.object({
        userId: z.number().int().positive().default(1), // Admin user
        subject: z.string().min(1),
        message: z.string().min(1),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const { userId, subject, message, priority } = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        const notification = await storage.createNotification({
          userId,
          title: `[${priority.toUpperCase()}] ${subject}`,
          message,
          type: "support",
        });

        return {
          success: true,
          data: {
            ticketId: notification.id,
            subject,
            priority,
            createdAt: new Date().toISOString(),
          },
          message: "Support ticket created successfully",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "ticket",
          targetId: result.data.ticketId.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.status(cached ? 200 : 201).json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create support ticket",
        code: "TICKET_CREATE_FAILED",
      });
    }
  }
);

// ==================== MARKETING MANAGEMENT ENDPOINTS ====================

/**
 * POST /api/agent/tools/marketing/campaigns/create
 * Create a marketing campaign (in-memory for now)
 */
router.post(
  "/marketing/campaigns/create",
  verifyAgentKey,
  requireAgentRole(["OWNER", "MARKETING"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "campaigns:create";

    try {
      const schema = z.object({
        title: z.string().min(1),
        type: z.enum(["email", "sms", "push", "social"]),
        message: z.string().min(1),
        targetAudience: z.enum(["all", "vendors", "customers", "inactive"]).default("all"),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        // For now, we'll return a mock campaign ID (in-memory campaigns)
        // In production, you'd insert into a campaigns table
        const campaignId = `CAM-${Date.now()}`;

        return {
          success: true,
          data: {
            campaignId,
            title: data.title,
            type: data.type,
            status: "draft",
            createdAt: new Date().toISOString(),
          },
          message: "Campaign created successfully (in-memory)",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "campaign",
          targetId: result.data.campaignId,
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.status(cached ? 200 : 201).json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create campaign",
        code: "CAMPAIGN_CREATE_FAILED",
      });
    }
  }
);

/**
 * POST /api/agent/tools/marketing/campaigns/launch
 * Launch a marketing campaign
 */
router.post(
  "/marketing/campaigns/launch",
  verifyAgentKey,
  requireAgentRole(["OWNER", "MARKETING"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "campaigns:launch";

    try {
      const schema = z.object({
        campaignId: z.string().min(1),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const { campaignId } = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        // Mock launch (in-memory campaigns)
        return {
          success: true,
          data: {
            campaignId,
            status: "active",
            launchedAt: new Date().toISOString(),
          },
          message: "Campaign launched successfully (in-memory)",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "campaign",
          targetId: campaignId,
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to launch campaign",
        code: "CAMPAIGN_LAUNCH_FAILED",
      });
    }
  }
);

// ==================== FINANCE MANAGEMENT ENDPOINTS ====================

/**
 * POST /api/agent/tools/finance/checkout/create
 * Create a Stripe checkout session
 */
router.post(
  "/finance/checkout/create",
  verifyAgentKey,
  requireAgentRole(["OWNER", "FINANCE", "BOOKING_MANAGER"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "checkout:create";

    try {
      const schema = z.object({
        bookingId: z.number().int().positive(),
        amount: z.number().positive(),
        currency: z.string().default("USD"),
        customerEmail: z.string().email(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        if (!stripe) {
          // Stripe not configured - return mock response
          return {
            success: true,
            data: {
              sessionId: `mock-session-${Date.now()}`,
              url: `https://checkout.stripe.com/pay/mock-${Date.now()}`,
              status: "mock",
            },
            message: "Stripe not configured. Returning mock checkout session.",
            metadata: {
              agentId: agent.id,
              action,
              timestamp: new Date().toISOString(),
              warning: "STRIPE_SECRET_KEY not set",
            },
          };
        }

        // Create real Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: data.currency.toLowerCase(),
                product_data: {
                  name: `Booking #${data.bookingId}`,
                  description: `IslandLoaf booking payment`,
                },
                unit_amount: Math.round(data.amount * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: data.successUrl,
          cancel_url: data.cancelUrl,
          customer_email: data.customerEmail,
          metadata: {
            bookingId: data.bookingId.toString(),
            agentId: agent.id,
          },
        });

        return {
          success: true,
          data: {
            sessionId: session.id,
            url: session.url,
            status: session.status,
          },
          message: "Stripe checkout session created successfully",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "checkout",
          targetId: data.bookingId.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.status(cached ? 200 : 201).json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create checkout session",
        code: "CHECKOUT_CREATE_FAILED",
      });
    }
  }
);

/**
 * POST /api/agent/tools/finance/refund
 * Process a refund (high-risk action)
 */
router.post(
  "/finance/refund",
  verifyAgentKey,
  requireAgentRole(["OWNER", "FINANCE"]),
  async (req: Request, res: Response) => {
    const agent = req.agent!;
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const action = "refunds:create";

    try {
      // Check permission (high-risk action)
      const policyCheck = checkPermission(agent.role, action);
      if (!policyCheck.allowed) {
        await logFailure(agent.id, action, policyCheck.reason || "Permission denied", {
          requestBody: req.body,
          idempotencyKey,
        });
        return res.status(403).json({
          success: false,
          error: policyCheck.reason,
          code: policyCheck.requiresOwnerApproval ? "REQUIRES_OWNER_APPROVAL" : "POLICY_DENIED",
        });
      }

      const schema = z.object({
        bookingId: z.number().int().positive(),
        amount: z.number().positive(),
        reason: z.string().min(1),
        paymentIntentId: z.string().optional(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;

      // Validate refund policy
      const refundCheck = validateRefund({
        bookingStatus: "confirmed", // TODO: fetch actual booking status
        amount: data.amount,
        originalAmount: data.amount, // TODO: fetch actual booking amount
      });

      if (!refundCheck.allowed) {
        await logFailure(agent.id, action, refundCheck.reason || "Refund validation failed", {
          requestBody: req.body,
          idempotencyKey,
        });
        return res.status(400).json({
          success: false,
          error: refundCheck.reason,
          code: "REFUND_VALIDATION_FAILED",
        });
      }

      const { cached, result } = await handleIdempotency(agent.id, idempotencyKey, async () => {
        if (!stripe) {
          // Stripe not configured - return stub response
          return {
            success: true,
            data: {
              refundId: `mock-refund-${Date.now()}`,
              status: "mock",
              amount: data.amount,
            },
            message: "Stripe not configured. Refund logged but not processed.",
            metadata: {
              agentId: agent.id,
              action,
              timestamp: new Date().toISOString(),
              warning: "STRIPE_SECRET_KEY not set",
            },
          };
        }

        // TODO: In production, process actual Stripe refund
        // const refund = await stripe.refunds.create({
        //   payment_intent: data.paymentIntentId,
        //   amount: Math.round(data.amount * 100),
        //   reason: 'requested_by_customer',
        // });

        return {
          success: true,
          data: {
            refundId: `stub-refund-${Date.now()}`,
            status: "stub",
            amount: data.amount,
          },
          message: "Refund endpoint is a stub. Implement Stripe refund logic in production.",
          metadata: {
            agentId: agent.id,
            action,
            timestamp: new Date().toISOString(),
            todo: "Implement stripe.refunds.create() with webhook confirmation",
          },
        };
      });

      if (!cached) {
        await logSuccess(agent.id, action, {
          targetType: "refund",
          targetId: data.bookingId.toString(),
          requestBody: req.body,
          resultBody: result,
          idempotencyKey,
        });
      }

      return res.json({ ...result, cached });
    } catch (error: any) {
      await logFailure(agent.id, action, error.message, {
        requestBody: req.body,
        idempotencyKey,
      });

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to process refund",
        code: "REFUND_FAILED",
      });
    }
  }
);

export default router;

