import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// SAFETY NOTE (added during the Phase 0 test-database audit):
// This script previously constructed `new PrismaClient()` with ZERO
// environment checks, meaning it connected to whatever DATABASE_URL was
// already set in the shell/CI environment — almost always the PRODUCTION
// Hostinger database, per .env / .env.example — and its own closing log
// message even said "...successfully wiped from production database!",
// which strongly suggests this script was written to run destructively
// against production data.
//
// This script now REFUSES to run unless it is explicitly pointed at a
// recognized test database (via DATABASE_URL_TEST in .env.test) AND the
// operator passes an explicit confirmation flag. Do not weaken these checks
// to "make it run faster" — if you need to wipe the production database,
// that is a deliberate, separate, human-approved action, not something a
// script should do by default.

dotenv.config({ path: path.resolve(process.cwd(), '.env.test'), override: true });

const RECOGNIZED_TEST_DB_NAMES = ['test_db', 'u988844918_test'];

async function main() {
  const testDbUrl = process.env.DATABASE_URL_TEST;

  if (!testDbUrl) {
    console.error(
      'ABORT: DATABASE_URL_TEST is not defined in .env.test. This script only ever runs against a recognized test database.',
    );
    process.exit(1);
  }

  if (testDbUrl.includes('u988844918_crms')) {
    console.error(
      "ABORT: DATABASE_URL_TEST appears to be pointing to the production 'crms' database.",
    );
    process.exit(1);
  }

  let dbName = '';
  try {
    dbName = new URL(testDbUrl).pathname.replace('/', '');
  } catch (e) {
    console.error('ABORT: Invalid DATABASE_URL_TEST format.');
    process.exit(1);
  }

  if (!RECOGNIZED_TEST_DB_NAMES.includes(dbName)) {
    console.error(
      `ABORT: DATABASE_URL_TEST points at database "${dbName}", which is not in the recognized test-database allow-list (${RECOGNIZED_TEST_DB_NAMES.join(', ')}).`,
    );
    process.exit(1);
  }

  if (process.env.CONFIRM_WIPE_TEST_DB !== 'yes-wipe-the-test-database') {
    console.error(
      `ABORT: Refusing to wipe data without explicit confirmation.\n` +
        `This will delete attendance logs, audit events, daily reports, tasks, leads,\n` +
        `performance snapshots, targets, QR codes, employees (except the seed admin),\n` +
        `and ALL properties from database "${dbName}".\n\n` +
        `If this is really what you want, and "${dbName}" is really your isolated test database,\n` +
        `re-run with: CONFIRM_WIPE_TEST_DB=yes-wipe-the-test-database npx ts-node scripts/wipe-sample-data.ts`,
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });

  try {
    // Final runtime check: verify the database we actually connected to
    // matches what we intended, not just the env-var string.
    const rows: any[] = await prisma.$queryRawUnsafe('SELECT DATABASE() as db');
    const connectedDb = rows?.[0]?.db;
    if (!RECOGNIZED_TEST_DB_NAMES.includes(connectedDb)) {
      console.error(
        `ABORT: Connected to database "${connectedDb}", which is not a recognized test database. Aborting before any deletes.`,
      );
      process.exit(1);
    }

    console.log(`Wiping sample data from test database "${connectedDb}"...`);

    await prisma.attendanceLog.deleteMany({});
    await prisma.auditEvent.deleteMany({});
    await prisma.dailyReport.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.performanceSnapshot.deleteMany({});
    await prisma.dailyTarget.deleteMany({});
    await prisma.employeeQrCode.deleteMany({});

    await prisma.employeeRole.deleteMany({
      where: { employee: { employee_code: { not: 'RRH-ADMIN-001' } } },
    });
    await prisma.employeePermissionOverride.deleteMany({
      where: { employee: { employee_code: { not: 'RRH-ADMIN-001' } } },
    });
    await prisma.employee.deleteMany({
      where: { employee_code: { not: 'RRH-ADMIN-001' } },
    });

    // Wipe everything else
    await prisma.property.deleteMany({});

    console.log(
      `Sample data and old employees (except Admin) successfully wiped from TEST database "${connectedDb}".`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
