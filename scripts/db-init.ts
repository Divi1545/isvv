/**
 * IslandLoaf Database Initialization Script
 * This script initializes the PostgreSQL database schema using Prisma
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

async function initializeDatabase() {
  console.log('🔄 Starting database initialization...');
  
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Please set it before running this script.');
    }
    
    // Run Prisma schema generation commands
    console.log('Generating Prisma client...');
    await execPromise('npx prisma generate');
    
    // Run database migrations
    console.log('Running database migrations...');
    await execPromise('npx prisma migrate dev --name init');
    
    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization if this script is called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase };