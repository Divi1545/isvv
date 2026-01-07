import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, date, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User / Vendor schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(),
  role: text("role").notNull().default("vendor"), // vendor or admin
  categoriesAllowed: jsonb("categories_allowed")
    .$type<string[]>()
    .default(["stays", "transport", "tours"]), // Default categories for vendors
  createdAt: timestamp("created_at").defaultNow(),
});

// Supported business types
export const businessTypes = [
  "stays",
  "vehicles",
  "tours",
  "wellness",
  "tickets",
  "products",
] as const;

export const bookingStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "refunded",
] as const;

// Room and accommodation options
export const bedTypes = [
  "single",
  "double", 
  "twin",
  "king",
  "queen",
  "sofa_bed",
  "bunk_bed",
] as const;

export const amenityOptions = [
  "wifi",
  "ac",
  "pool",
  "breakfast",
  "sea_view",
  "mountain_view",
  "balcony",
  "parking",
  "gym",
  "spa",
  "restaurant",
  "bar",
  "room_service",
  "laundry",
  "concierge",
  "beach_access",
  "airport_shuttle",
  "pet_friendly",
] as const;

// Service schema
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // from businessTypes
  basePrice: real("base_price").notNull(),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar events
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  serviceId: integer("service_id").references(() => services.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  title: text("title").notNull(),
  isBooked: boolean("is_booked").notNull().default(false),
  isPending: boolean("is_pending").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  source: text("source").default("direct"), // direct, ical, etc.
  externalId: text("external_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar sync sources
export const calendarSources = pgTable("calendar_sources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  serviceId: integer("service_id").references(() => services.id),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(), // google, airbnb, booking.com
  lastSynced: timestamp("last_synced"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  startDate: timestamp("start_date", { mode: 'date' }).notNull(),
  endDate: timestamp("end_date", { mode: 'date' }).notNull(),
  status: text("status").notNull().default("pending"), // from bookingStatuses
  totalPrice: real("total_price").notNull(),
  commission: real("commission").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, warning, error, success
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Marketing content
export const marketingContents = pgTable("marketing_contents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  serviceId: integer("service_id").references(() => services.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull(), // instagram, facebook, seo
  serviceDescription: text("service_description"),
  targetAudience: text("target_audience"),
  tone: text("tone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  vendorName: text("vendor_name").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high
  category: text("category").notNull(), // technical, billing, content, marketing
  assignedTo: text("assigned_to"),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Keys for external access
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  key: text("key").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Room Types for Accommodation Vendors
export const roomTypes = pgTable("room_types", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => users.id),
  roomTypeName: text("room_type_name").notNull(),
  bedTypes: jsonb("bed_types")
    .$type<(typeof bedTypes)[number][]>()
    .notNull()
    .default([]), // Array of bed types: ["double", "twin", "king"]
  numberOfRooms: integer("number_of_rooms").notNull(),
  amenities: jsonb("amenities")
    .$type<(typeof amenityOptions)[number][]>()
    .notNull()
    .default([]), // Array of amenities: ["wifi", "ac", "pool"]
  description: text("description"),
  priceModifier: real("price_modifier").notNull().default(1.0), // Multiplier for service base price
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Booking room details - links bookings to specific room types
export const bookingRooms = pgTable("booking_rooms", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  roomTypeId: integer("room_type_id").notNull().references(() => roomTypes.id),
  roomsBooked: integer("rooms_booked").notNull().default(1),
  guestCount: integer("guest_count").notNull().default(1),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== AI AGENT SYSTEM TABLES ====================

// Agent roles enum
export const agentRoles = [
  "OWNER",
  "LEADER",
  "VENDOR_ONBOARDING",
  "BOOKING_MANAGER",
  "CALENDAR_SYNC",
  "PRICING",
  "MARKETING",
  "SUPPORT",
  "FINANCE",
] as const;

export type AgentRole = typeof agentRoles[number];

// Agent identities - authentication and role management
export const agentIdentities = pgTable("agent_identities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role").notNull(), // from agentRoles
  apiKeyHash: text("api_key_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent audit logs - complete audit trail
export const agentAuditLogs = pgTable("agent_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").notNull().references(() => agentIdentities.id),
  action: text("action").notNull(),
  targetType: text("target_type"), // vendor, booking, service, etc.
  targetId: text("target_id"), // ID of the affected entity
  requestBody: jsonb("request_body").$type<Record<string, any>>(),
  resultBody: jsonb("result_body").$type<Record<string, any>>(),
  status: text("status").notNull(), // SUCCESS, FAIL
  idempotencyKey: text("idempotency_key"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task statuses enum
export const taskStatuses = [
  "QUEUED",
  "RUNNING",
  "DONE",
  "FAILED",
] as const;

export type TaskStatus = typeof taskStatuses[number];

// Agent tasks - task queue for async operations
export const agentTasks = pgTable("agent_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdByAgentId: uuid("created_by_agent_id").references(() => agentIdentities.id),
  assignedToRole: text("assigned_to_role").notNull(), // from agentRoles
  status: text("status").notNull().default("QUEUED"), // from taskStatuses
  priority: integer("priority").notNull().default(5), // 1-10, lower = higher priority
  input: jsonb("input").$type<Record<string, any>>().notNull(),
  output: jsonb("output").$type<Record<string, any>>(),
  error: text("error"),
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// Agent idempotency keys - prevent duplicate operations
export const agentIdempotencyKeys = pgTable("agent_idempotency_keys", {
  key: text("key").primaryKey(),
  agentId: uuid("agent_id").notNull().references(() => agentIdentities.id),
  resultBody: jsonb("result_body").$type<Record<string, any>>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true });
export const insertCalendarSourceSchema = createInsertSchema(calendarSources).omit({ id: true, createdAt: true, lastSynced: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertMarketingContentSchema = createInsertSchema(marketingContents).omit({ id: true, createdAt: true });
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true });
export const insertRoomTypeSchema = createInsertSchema(roomTypes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBookingRoomSchema = createInsertSchema(bookingRooms).omit({ id: true, createdAt: true });

// Agent insert schemas
export const insertAgentIdentitySchema = createInsertSchema(agentIdentities).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgentAuditLogSchema = createInsertSchema(agentAuditLogs).omit({ id: true, createdAt: true });
export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({ id: true, createdAt: true, updatedAt: true, startedAt: true, completedAt: true });
export const insertAgentIdempotencyKeySchema = createInsertSchema(agentIdempotencyKeys).omit({ createdAt: true });

// Auth schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

export type InsertCalendarSource = z.infer<typeof insertCalendarSourceSchema>;
export type CalendarSource = typeof calendarSources.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertMarketingContent = z.infer<typeof insertMarketingContentSchema>;
export type MarketingContent = typeof marketingContents.$inferSelect;

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export type InsertRoomType = z.infer<typeof insertRoomTypeSchema>;
export type RoomType = typeof roomTypes.$inferSelect;

export type InsertBookingRoom = z.infer<typeof insertBookingRoomSchema>;
export type BookingRoom = typeof bookingRooms.$inferSelect;

// Agent types
export type InsertAgentIdentity = z.infer<typeof insertAgentIdentitySchema>;
export type AgentIdentity = typeof agentIdentities.$inferSelect;

export type InsertAgentAuditLog = z.infer<typeof insertAgentAuditLogSchema>;
export type AgentAuditLog = typeof agentAuditLogs.$inferSelect;

export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AgentTask = typeof agentTasks.$inferSelect;

export type InsertAgentIdempotencyKey = z.infer<typeof insertAgentIdempotencyKeySchema>;
export type AgentIdempotencyKey = typeof agentIdempotencyKeys.$inferSelect;

export type BusinessType = typeof businessTypes[number];
export type BookingStatus = typeof bookingStatuses[number];
export type BedType = typeof bedTypes[number];
export type AmenityOption = typeof amenityOptions[number];

export type LoginCredentials = z.infer<typeof loginSchema>;
