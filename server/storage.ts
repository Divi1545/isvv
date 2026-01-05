// server/storage.ts
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";

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