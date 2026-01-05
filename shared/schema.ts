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

export type BusinessType = typeof businessTypes[number];
export type BookingStatus = typeof bookingStatuses[number];
export type BedType = typeof bedTypes[number];
export type AmenityOption = typeof amenityOptions[number];

export type LoginCredentials = z.infer<typeof loginSchema>;
