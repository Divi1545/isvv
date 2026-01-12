// server/storage.ts
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { 
  users, 
  services, 
  bookings, 
  notifications, 
  calendarSources,
  apiKeys,
  roomTypes,
  insertServiceSchema,
  insertBookingSchema,
  insertNotificationSchema,
  insertCalendarSourceSchema,
  type InsertService,
  type Service,
  type InsertBooking,
  type Booking,
  type InsertNotification,
  type Notification,
  type InsertCalendarSource,
  type CalendarSource,
  type ApiKey,
  type InsertApiKey
} from "../shared/schema";

export type Role = "admin" | "vendor";

export interface CreateUserInput {
  email: string;
  username?: string;
  password: string; // hashed
  fullName: string;
  businessName: string;
  businessType: string; // "accommodation" | "tour" | etc.
  role: Role; // "vendor" or "admin"
  isActive?: boolean;
  categoriesAllowed?: string[];
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string; // hashed
  fullName?: string;
  businessName?: string;
  businessType?: string;
  role?: Role;
  isActive?: boolean;
  categoriesAllowed?: string[];
}

export async function getUserByEmail(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email));
  return row ?? null;
}

export async function getUserByUsername(username: string) {
  const [row] = await db.select().from(users).where(eq(users.username, username));
  return row ?? null;
}

export async function getUser(id: number) {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row ?? null;
}

export async function createUser(input: CreateUserInput) {
  try {
    // Default categories based on business type if none provided
    let categoriesAllowed = input.categoriesAllowed || ['stays', 'transport', 'tours'];
    
    if (input.role === 'admin') {
      categoriesAllowed = ['stays', 'transport', 'tours', 'wellness', 'tickets', 'products'];
    } else if (input.role === 'vendor') {
      switch(input.businessType) {
        case 'stays':
        case 'accommodation':
          categoriesAllowed = ['stays', 'tours', 'wellness'];
          break;
        case 'transport':
          categoriesAllowed = ['transport', 'tours'];
          break;
        case 'tours':
        case 'activities':
          categoriesAllowed = ['tours', 'tickets', 'transport'];
          break;
        case 'wellness':
          categoriesAllowed = ['wellness', 'tours'];
          break;
        case 'products':
        case 'retail':
          categoriesAllowed = ['products', 'tickets'];
          break;
      }
    }

    const [created] = await db
      .insert(users)
      .values({
        email: input.email,
        username: input.username ?? input.email,
        password: input.password, // already hashed
        role: input.role,
        fullName: input.fullName,
        businessName: input.businessName,
        businessType: input.businessType,
        categoriesAllowed: categoriesAllowed,
        createdAt: new Date(),
      })
      .returning();
    return created;
  } catch (err: any) {
    // Postgres unique violation
    if (err?.code === "23505") {
      err.message = "Email or username already exists";
    }
    throw err;
  }
}

export async function updateUser(id: number, patch: UpdateUserInput) {
  const [updated] = await db
    .update(users)
    .set({ ...patch })
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
}

export async function getAllUsers() {
  return await db.select().from(users);
}

export async function deleteUser(id: number) {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();
  return deleted ?? null;
}

// ==================== SERVICE METHODS ====================

export async function createService(input: InsertService): Promise<Service> {
  const [created] = await db
    .insert(services)
    .values(input)
    .returning();
  return created;
}

export async function updateService(id: number, patch: Partial<InsertService>): Promise<Service | null> {
  const [updated] = await db
    .update(services)
    .set(patch)
    .where(eq(services.id, id))
    .returning();
  return updated ?? null;
}

// ==================== BOOKING METHODS ====================

export async function createBooking(input: InsertBooking): Promise<Booking> {
  const [created] = await db
    .insert(bookings)
    .values({
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateBooking(id: number, patch: Partial<InsertBooking>): Promise<Booking | null> {
  const [updated] = await db
    .update(bookings)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id))
    .returning();
  return updated ?? null;
}

// ==================== NOTIFICATION METHODS ====================

export async function createNotification(input: InsertNotification): Promise<Notification> {
  const [created] = await db
    .insert(notifications)
    .values(input)
    .returning();
  return created;
}

// ==================== CALENDAR SOURCE METHODS ====================

export async function createCalendarSource(input: InsertCalendarSource): Promise<CalendarSource> {
  const [created] = await db
    .insert(calendarSources)
    .values(input)
    .returning();
  return created;
}

// ==================== API KEY METHODS ====================

export async function createApiKey(input: { label: string; key: string; active?: boolean }): Promise<ApiKey> {
  const [created] = await db
    .insert(apiKeys)
    .values({
      label: input.label,
      key: input.key,
      active: input.active ?? true,
    })
    .returning();
  return created;
}

export async function getApiKeys(): Promise<ApiKey[]> {
  return await db.select().from(apiKeys);
}

export async function getApiKeyByKey(key: string): Promise<ApiKey | null> {
  const [row] = await db.select().from(apiKeys).where(eq(apiKeys.key, key));
  return row ?? null;
}

export async function updateApiKey(id: number, patch: Partial<{ label: string; active: boolean }>): Promise<ApiKey | null> {
  const [updated] = await db
    .update(apiKeys)
    .set(patch)
    .where(eq(apiKeys.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteApiKey(id: number): Promise<ApiKey | null> {
  const [deleted] = await db
    .delete(apiKeys)
    .where(eq(apiKeys.id, id))
    .returning();
  return deleted ?? null;
}

export async function revokeApiKey(id: number): Promise<boolean> {
  const [updated] = await db
    .update(apiKeys)
    .set({ active: false })
    .where(eq(apiKeys.id, id))
    .returning();
  return !!updated;
}

// ==================== ALIASES FOR ROUTES COMPATIBILITY ====================

// Alias for getAllUsers (used in admin routes)
export const getUsers = getAllUsers;

// Get bookings by vendor ID (0 = all bookings for admin)
export async function getBookings(vendorId: number): Promise<Booking[]> {
  if (vendorId === 0) {
    return await db.select().from(bookings);
  }
  return await db.select().from(bookings).where(eq(bookings.vendorId, vendorId));
}

// Get services by vendor ID (0 = all services for admin)
export async function getServices(vendorId: number): Promise<Service[]> {
  if (vendorId === 0) {
    return await db.select().from(services);
  }
  return await db.select().from(services).where(eq(services.vendorId, vendorId));
}

// Create room type for vendor
export async function createRoomType(input: {
  vendorId: number;
  name?: string;
  roomTypeName?: string;
  description?: string;
  maxGuests?: number;
  basePrice?: string;
  amenities?: string[];
}): Promise<any> {
  const [created] = await db
    .insert(roomTypes)
    .values({
      vendorId: input.vendorId,
      name: input.name || input.roomTypeName || 'Standard Room',
      description: input.description || '',
      maxGuests: input.maxGuests || 2,
      basePrice: input.basePrice || '100.00',
      amenities: input.amenities || [],
    })
    .returning();
  return created;
}

// Get a single booking by ID
export async function getBooking(id: number): Promise<Booking | null> {
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
  return row ?? null;
}

// Delete a booking by ID
export async function deleteBooking(id: number): Promise<Booking | null> {
  const [deleted] = await db.delete(bookings).where(eq(bookings.id, id)).returning();
  return deleted ?? null;
}

// Get recent bookings (for dashboard) - uses SQL ordering for reliability
export async function getRecentBookings(limit: number = 10): Promise<Booking[]> {
  return await db
    .select()
    .from(bookings)
    .orderBy(sql`${bookings.createdAt} DESC NULLS LAST, ${bookings.id} DESC`)
    .limit(limit);
}

// Get calendar events (placeholder - returns bookings as events)
// Only includes bookings with valid checkIn/checkOut dates
export async function getCalendarEvents(vendorId: number): Promise<any[]> {
  const vendorBookings = await getBookings(vendorId);
  return vendorBookings
    .filter(b => b.checkIn && b.checkOut) // Only include bookings with valid dates
    .map(b => ({
      id: b.id,
      title: b.guestName || 'Booking',
      start: b.checkIn,
      end: b.checkOut,
      status: b.status,
    }));
}