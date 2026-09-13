/**
 * Admin Bootstrap Seed Script (P8)
 *
 * Creates the first SUPER_ADMIN from environment variables.
 * Run ONCE after the initial migration:
 *
 *   npx tsx prisma/seed-admin.ts
 *
 * Required environment variables (never commit these):
 *   ADMIN_SEED_EMAIL    — email for the first SUPER_ADMIN
 *   ADMIN_SEED_PASSWORD — password for the first SUPER_ADMIN (≥12 chars)
 *   ADMIN_SEED_NAME     — display name (optional, defaults to "Super Admin")
 *
 * Safety rules:
 *   - Only creates the account if NO admin with that email exists yet.
 *   - Exits with code 1 if required env vars are missing.
 *   - Never prints the password to stdout/stderr.
 *   - Never modifies or deletes existing admin accounts.
 *   - Never touches Customer, Session, ActivityEvent, or any P4 data.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME?.trim() || 'Super Admin';

  if (!email || !password) {
    console.error(
      '[seed-admin] ERROR: ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set.\n' +
        'Add them to your .env file. Do NOT commit credentials.'
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('[seed-admin] ERROR: ADMIN_SEED_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(
      `[seed-admin] Admin with email ${email} already exists (id=${existing.id}). No action taken.`
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.create({
    data: {
      email,
      passwordHash,
      name,
      role: 'SUPER_ADMIN',
      active: true,
    },
  });

  console.log(
    `[seed-admin] Created SUPER_ADMIN: id=${admin.id}, email=${admin.email}, name=${admin.name}`
  );
  // Password is intentionally NOT logged.
}

main()
  .catch((err) => {
    console.error('[seed-admin] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
