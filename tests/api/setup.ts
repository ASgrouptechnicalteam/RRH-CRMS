import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Global test setup for API testing
// This file initializes the testing environment safely without modifying production DB

// 1. Load .env.test specifically for the test environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

const testDbUrl = process.env.DATABASE_URL_TEST;
const prodDbUrl = process.env.DATABASE_URL;

if (!testDbUrl) {
  console.error("ABORT: DATABASE_URL_TEST is not defined. Ensure .env.test is configured correctly with an isolated database.");
  process.exit(1);
}

if (testDbUrl === prodDbUrl) {
  console.error("ABORT: DATABASE_URL_TEST matches the production DATABASE_URL. They must be completely isolated.");
  process.exit(1);
}

// Ensure it's not accidentally pointing to the crms production DB
if (testDbUrl.includes('u988844918_crms')) {
  console.error("ABORT: DATABASE_URL_TEST appears to be pointing to the production 'crms' database.");
  process.exit(1);
}

// 2. Override Prisma's default connection URL BEFORE Prisma instantiation
process.env.DATABASE_URL = testDbUrl;

// 3. Extract safe metadata for logging
try {
  const urlParams = new URL(testDbUrl);
  console.log(`\n========================================`);
  console.log(`🛡️  PHASE 0 TEST DATABASE SAFETY GUARD`);
  console.log(`========================================`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  console.log(`✓ Target Host: ${urlParams.hostname}`);
  console.log(`✓ Target DB  : ${urlParams.pathname.replace('/', '')}`);
  console.log(`========================================\n`);
} catch (e) {
  console.error("ABORT: Invalid DATABASE_URL_TEST format.");
  process.exit(1);
}

// 4. Safe to instantiate PrismaClient using the overridden DATABASE_URL
const prisma = new PrismaClient();

beforeAll(async () => {
  // We explicitly avoid wiping or altering the database here in Phase 0
  // to ensure zero impact on production data. Tests will use the generated
  // deterministic users.
  
  // Set fallback env variables for testing to satisfy Phase 0 requirements
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-secret-access';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-secret-refresh';
});

afterAll(async () => {
  await prisma.$disconnect();
});
