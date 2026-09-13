import dotenv from 'dotenv';
import path from 'path';

// Mirrors tests/api/setup.ts's Phase 0 safety guard exactly (see that file's
// header comment for why the ordering here matters): load .env.test, verify
// DATABASE_URL_TEST is a recognized, non-production test database, and only
// THEN require the Prisma-backed test-user fixture helper — never import it
// at the top of the file, which would construct the shared Prisma client
// before the guard has run.
export default async function globalSetup() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

  const testDbUrl = process.env.DATABASE_URL_TEST;
  const prodDbUrl = process.env.DATABASE_URL;

  if (!testDbUrl) throw new Error('ABORT: DATABASE_URL_TEST is not defined.');
  if (testDbUrl === prodDbUrl)
    throw new Error('ABORT: DATABASE_URL_TEST matches production DATABASE_URL.');
  if (testDbUrl.includes('u988844918_crms'))
    throw new Error("ABORT: DATABASE_URL_TEST appears to point at the production 'crms' database.");

  const RECOGNIZED_TEST_DB_NAMES = ['test_db', 'u988844918_test'];
  const parsedTestDbName = new URL(testDbUrl).pathname.replace('/', '');
  if (!RECOGNIZED_TEST_DB_NAMES.includes(parsedTestDbName)) {
    throw new Error(
      `ABORT: DATABASE_URL_TEST points at unrecognized database "${parsedTestDbName}".`,
    );
  }

  process.env.DATABASE_URL = testDbUrl;
  process.env.NODE_ENV = 'test';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { setupDeterministicTestUsers, deterministicUsers } = require('../fixtures/testUsers');
  await setupDeterministicTestUsers();

  // Unlike the Jest suite (which always logs in via a raw POST /auth/login
  // call and never touches the frontend), these E2E tests drive the real
  // LoginForm — which redirects to FirstLoginSetup whenever
  // Employee.first_login_done is false. setupDeterministicTestUsers() never
  // sets this field (defaults to false on create), since nothing needed it
  // until now. Mark every deterministic user done so the real login flow
  // lands on the dashboard, not a forced password-change screen unrelated to
  // what these smoke tests are actually verifying.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { prisma } = require('../../apps/api/src/lib/prisma');
  await prisma.employee.updateMany({
    where: {
      employee_code: {
        in: deterministicUsers.map((u: { employee_code: string }) => u.employee_code),
      },
    },
    data: { first_login_done: true },
  });

  console.log(
    `\n[E2E global-setup] Deterministic test users seeded against ${parsedTestDbName}.\n`,
  );
}
