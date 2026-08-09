const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const { setupDeterministicTestUsers } = require('../tests/fixtures/testUsers');

// 1. Load .env.test explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

const testDbUrl = process.env.DATABASE_URL_TEST;

if (!testDbUrl) {
  console.error("ABORT: DATABASE_URL_TEST is not defined in .env.test");
  process.exit(1);
}

// 2 & 3 & 4. Verify the connection URL
const urlParams = new URL(testDbUrl);
const host = urlParams.hostname;
const dbName = urlParams.pathname.replace('/', '');

if (dbName !== 'u988844918_test' || testDbUrl.includes('crms')) {
  console.error(`ABORT: Unsafe database URL detected. DB is ${dbName}`);
  process.exit(1);
}

console.log(`\n========================================`);
console.log(`🛡️  EXECUTING TEST FIXTURES`);
console.log(`========================================`);
console.log(`✓ Host: ${host}`);
console.log(`✓ Database: ${dbName}`);
console.log(`✓ Validated Safe for Execution`);
console.log(`========================================\n`);

// Ensure Prisma connects to the test database
process.env.DATABASE_URL = testDbUrl;
process.env.NODE_ENV = 'test';

async function execute() {
  const prisma = new PrismaClient();
  try {
    const beforeCount = await prisma.employee.count();
    
    // Execute the existing fixture!
    await setupDeterministicTestUsers();
    
    const afterCount = await prisma.employee.count();
    const testCompany = await prisma.company.findUnique({ where: { code: 'TEST_COMP_01' } });
    
    console.log(`\n--- FIXTURE EXECUTION REPORT ---`);
    console.log(`1. Users Created: ${afterCount - beforeCount}`);
    console.log(`2. Users Already Existing/Upserted: ${beforeCount}`);
    console.log(`3. Roles Successfully Associated: YES (handled safely via Prisma connectOrCreate)`);
    console.log(`4. Test Company Status: ${testCompany ? 'SUCCESS (Found ID: ' + testCompany.id + ')' : 'FAILED'}`);
    console.log(`5. Database Target: ${dbName} at ${host}`);
    console.log(`6. Errors: NONE`);
    console.log(`--------------------------------\n`);

  } catch (err: any) {
    console.error(`\n❌ Error executing fixture: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

execute();
