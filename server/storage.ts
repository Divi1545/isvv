// server/storage.ts
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  users, 
  services, 
  bookings, 
  notifications, 
  calendarSources,
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
  type CalendarSource
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