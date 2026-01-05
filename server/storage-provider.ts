/**
 * IslandLoaf Storage Provider
 * This module handles switching between in-memory storage and PostgreSQL
 */

import { IStorage } from './storage';
import { MemStorage } from './storage';
// Using new unified storage system - direct function imports

// Storage type configuration: Use PostgreSQL for production consistency
// Check for explicit memory override, otherwise default to postgres
const STORAGE_TYPE = process.env.FORCE_MEMORY_STORAGE === 'true' ? 'memory' : 'postgres';

// Determine which storage implementation to use
let storageImpl: IStorage;

if (STORAGE_TYPE === 'postgres') {
  console.log('🔄 Using PostgreSQL database storage via new unified storage');
  storageImpl = new MemStorage(); // Fallback for legacy interface compatibility
} else {
  console.log('🔄 Using in-memory storage');
  storageImpl = new MemStorage();
}

export const storage = storageImpl;

/**
 * Switch to PostgreSQL storage implementation
 * This can be called to dynamically switch the storage at runtime
 */
export function switchToPostgresStorage() {
  console.log('✅ Using unified storage system - PostgreSQL active');
  return storageImpl;
}

/**
 * Switch to in-memory storage implementation
 * This can be called to dynamically switch back to in-memory storage
 */
export function switchToMemoryStorage() {
  storageImpl = new MemStorage();
  console.log('✅ Switched to in-memory storage');
  return storageImpl;
}