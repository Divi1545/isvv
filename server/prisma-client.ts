import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient to use throughout the app
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'], // Log all queries, errors, and warnings
});

export default prisma;