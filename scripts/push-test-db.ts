import { spawnSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

// 1. Load .env.test explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

// 2. Read ONLY DATABASE_URL_TEST
const testDbUrl = process.env.DATABASE_URL_TEST;

if (!testDbUrl) {
  console.error("ABORT: DATABASE_URL_TEST is not defined in .env.test");
  process.exit(1);
}

// 4. Parse the test connection URL
let urlParams: URL;
try {
  urlParams = new URL(testDbUrl);
} catch (e) {
  console.error("ABORT: Invalid DATABASE_URL_TEST format.");
  process.exit(1);
}

const host = urlParams.hostname;
const dbName = urlParams.pathname.replace('/', '');

// 5. Verify constraints
if (host !== '82.25.121.145' && host !== 'localhost' && host !== '127.0.0.1') {
  console.error(`ABORT: Host is ${host}, expected 82.25.121.145 or localhost`);
  process.exit(1);
}

if (dbName !== 'u988844918_test' && dbName !== 'test_db') {
  console.error(`ABORT: Database name is ${dbName}, expected exactly u988844918_test or test_db`);
  process.exit(1);
}

if (testDbUrl.includes('u988844918_crms')) {
  console.error("ABORT: Test database URL contains production database identifier (u988844918_crms).");
  process.exit(1);
}

// 9. Print sanitized target information
console.log(`\n========================================`);
console.log(`🛡️  PHASE 0 TEST DATABASE INITIALIZATION`);
console.log(`========================================`);
console.log(`✓ Host: ${host}`);
console.log(`✓ Database: ${dbName}`);
console.log(`✓ Environment: TEST`);
console.log(`========================================\n`);
console.log(`Executing Prisma db push safely...\n`);

// 6. Set process.env.DATABASE_URL in the child Prisma process
const childEnv = { ...process.env, DATABASE_URL: testDbUrl };

// 7. Execute Prisma's db push
const result = spawnSync('npx', ['prisma', 'db', 'push'], {
  env: childEnv,
  stdio: 'inherit',
  shell: process.platform === 'win32' // Required to spawn npx correctly on Windows
});

if (result.error) {
  console.error(`Execution error: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
