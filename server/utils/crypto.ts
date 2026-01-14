import crypto from 'crypto';

/**
 * Generates a secure prefixed API key
 * Format: il_[32 random characters]
 * Total length: 35 characters
 */
export function generatePrefixedApiKey(): string {
  const prefix = 'il_';
  const randomBytes = crypto.randomBytes(16); // 16 bytes = 32 hex characters
  const randomString = randomBytes.toString('hex');
  return prefix + randomString;
}

/**
 * Generates a secure random string of specified length
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = Math.ceil(length / 2);
  return crypto.randomBytes(bytes).toString('hex').slice(0, length);
}

/**
 * Creates a hash of a given string using SHA-256
 */
export function createHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Verifies if an API key matches the expected format
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Check if key starts with 'il_' and has exactly 35 characters total
  return /^il_[a-f0-9]{32}$/.test(key);
}