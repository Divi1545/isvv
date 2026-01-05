/**
 * Storage adapter:
 * - Uses DB-backed storage when DATABASE_URL is present
 * - Falls back to in-memory storage when DATABASE_URL is missing
 *
 * This avoids importing `server/storage.ts` (which imports `db.ts`) on machines
 * without a configured Postgres connection string.
 */
type DbStorage = typeof import("./storage");
type MemoryStorage = typeof import("./storage-fallback");

type StorageModule = DbStorage | MemoryStorage;

let implPromise: Promise<StorageModule> | null = null;

async function getImpl(): Promise<StorageModule> {
  if (!implPromise) {
    implPromise = process.env.DATABASE_URL
      ? import("./storage")
      : import("./storage-fallback");
  }
  return implPromise;
}

export async function getUserByEmail(email: string) {
  return (await getImpl()).getUserByEmail(email);
}

export async function getUserByUsername(username: string) {
  return (await getImpl()).getUserByUsername(username);
}

export async function getUser(id: number) {
  return (await getImpl()).getUser(id);
}

export async function getAllUsers() {
  return (await getImpl()).getAllUsers();
}

export async function createUser(input: Parameters<DbStorage["createUser"]>[0]) {
  return (await getImpl()).createUser(input as any);
}

export async function updateUser(id: number, patch: Parameters<DbStorage["updateUser"]>[1]) {
  return (await getImpl()).updateUser(id, patch as any);
}

export async function deleteUser(id: number) {
  return (await getImpl()).deleteUser(id);
}


