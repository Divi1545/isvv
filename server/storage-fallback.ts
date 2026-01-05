/**
 * Minimal in-memory storage fallback used when DATABASE_URL is not set.
 *
 * This lets the dev server boot on machines without Postgres, while keeping
 * the same function-level API as `server/storage.ts` (used by routes).
 */
export type Role = "admin" | "vendor";

export interface CreateUserInput {
  email: string;
  username?: string;
  password: string; // hashed
  fullName: string;
  businessName: string;
  businessType: string;
  role: Role;
  isActive?: boolean;
  categoriesAllowed?: string[];
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password?: string;
  fullName?: string;
  businessName?: string;
  businessType?: string;
  role?: Role;
  isActive?: boolean;
  categoriesAllowed?: string[];
}

export interface UserRecord {
  id: number;
  email: string;
  username: string | null;
  password: string;
  fullName: string;
  businessName: string;
  businessType: string;
  role: Role;
  isActive: boolean;
  categoriesAllowed: string[];
  createdAt: Date;
}

let nextId = 1;
const users = new Map<number, UserRecord>();

function defaultCategories(input: CreateUserInput): string[] {
  if (input.categoriesAllowed?.length) return input.categoriesAllowed;
  if (input.role === "admin") {
    return ["stays", "transport", "tours", "wellness", "tickets", "products"];
  }
  switch (input.businessType) {
    case "stays":
    case "accommodation":
      return ["stays", "tours", "wellness"];
    case "transport":
      return ["transport", "tours"];
    case "tours":
    case "activities":
      return ["tours", "tickets", "transport"];
    case "wellness":
      return ["wellness", "tours"];
    case "products":
    case "retail":
      return ["products", "tickets"];
    default:
      return ["stays", "transport", "tours"];
  }
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  for (const u of Array.from(users.values())) {
    if (u.email === email) return u;
  }
  return null;
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  for (const u of Array.from(users.values())) {
    if (u.username === username) return u;
  }
  return null;
}

export async function getUser(id: number): Promise<UserRecord | null> {
  return users.get(id) ?? null;
}

export async function getAllUsers(): Promise<UserRecord[]> {
  return Array.from(users.values());
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  // Basic uniqueness checks to mimic DB unique constraints
  const existingEmail = await getUserByEmail(input.email);
  if (existingEmail) {
    const err: any = new Error("Email or username already exists");
    err.code = "23505";
    throw err;
  }
  const uname = (input.username ?? input.email) || null;
  if (uname) {
    const existingUsername = await getUserByUsername(uname);
    if (existingUsername) {
      const err: any = new Error("Email or username already exists");
      err.code = "23505";
      throw err;
    }
  }

  const created: UserRecord = {
    id: nextId++,
    email: input.email,
    username: uname,
    password: input.password,
    fullName: input.fullName,
    businessName: input.businessName,
    businessType: input.businessType,
    role: input.role,
    isActive: input.isActive ?? true,
    categoriesAllowed: defaultCategories(input),
    createdAt: new Date(),
  };

  users.set(created.id, created);
  return created;
}

export async function updateUser(id: number, patch: UpdateUserInput): Promise<UserRecord | null> {
  const existing = users.get(id);
  if (!existing) return null;

  const updated: UserRecord = {
    ...existing,
    ...patch,
    username: patch.username !== undefined ? patch.username : existing.username,
    email: patch.email ?? existing.email,
    password: patch.password ?? existing.password,
    fullName: patch.fullName ?? existing.fullName,
    businessName: patch.businessName ?? existing.businessName,
    businessType: patch.businessType ?? existing.businessType,
    role: (patch.role ?? existing.role) as Role,
    isActive: patch.isActive ?? existing.isActive,
    categoriesAllowed: patch.categoriesAllowed ?? existing.categoriesAllowed,
  };

  users.set(id, updated);
  return updated;
}

export async function deleteUser(id: number): Promise<UserRecord | null> {
  const existing = users.get(id);
  if (!existing) return null;
  users.delete(id);
  return existing;
}


