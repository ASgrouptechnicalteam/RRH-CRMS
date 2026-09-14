/**
 * QA report 2026-09-14, item "duplicate employees with same phone/email".
 *
 * Two-part maintenance script:
 *
 *   1. Normalises existing Employee.phone / Employee.email values to the
 *      canonical form the application now writes going forward (see
 *      services/employeeContact.service.ts) — 10-digit phone (91/0 prefix
 *      stripped), trimmed lower-case email. Existing rows hold a mix of
 *      "+919876543210" / "919876543210" / "09876543210" / "9876543210" for
 *      the same number, which is why a plain equality check misses
 *      duplicates today.
 *
 *   2. Reports any (company_id, phone) / (company_id, email) pairs that are
 *      still duplicated after normalisation — those must be resolved by
 *      hand (merge or edit one of the records) before a UNIQUE index can be
 *      added; the migration would otherwise fail to apply.
 *
 * Deliberately a standalone script, not a `prisma migrate` SQL file: it runs
 * through Node so the normalisation logic is exactly
 * `normaliseEmployeePhone`/`normaliseEmployeeEmail` (no risk of a MySQL-
 * version-specific regex function that behaves differently between the local
 * dev DB and production), and it never runs implicitly — someone has to
 * invoke it and read the report.
 *
 * Usage:
 *   npx ts-node src/scripts/normalizeEmployeeContacts.ts                 # dry run, report only
 *   npx ts-node src/scripts/normalizeEmployeeContacts.ts --apply         # write the normalised values
 *
 * Always run without --apply first and read the report. Take a DB backup /
 * snapshot before running with --apply against production.
 */
import { prisma } from '../lib/prisma';
import {
  normaliseEmployeePhone,
  normaliseEmployeeEmail,
} from '../services/employeeContact.service';

const APPLY = process.argv.includes('--apply');

async function main() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employee_code: true,
      company_id: true,
      phone: true,
      email: true,
      status: true,
    },
  });

  const phoneChanges: { id: number; code: string; from: string; to: string }[] = [];
  const emailChanges: { id: number; code: string; from: string; to: string }[] = [];

  for (const e of employees) {
    const normPhone = normaliseEmployeePhone(e.phone);
    if (e.phone && normPhone && normPhone !== e.phone) {
      phoneChanges.push({ id: e.id, code: e.employee_code, from: e.phone, to: normPhone });
    }
    const normEmail = normaliseEmployeeEmail(e.email);
    if (e.email && normEmail && normEmail !== e.email) {
      emailChanges.push({ id: e.id, code: e.employee_code, from: e.email, to: normEmail });
    }
  }

  console.log(`Scanned ${employees.length} employees.`);
  console.log(`Phone values to normalise: ${phoneChanges.length}`);
  for (const c of phoneChanges.slice(0, 20)) console.log(`  ${c.code}: "${c.from}" -> "${c.to}"`);
  if (phoneChanges.length > 20) console.log(`  ... and ${phoneChanges.length - 20} more`);

  console.log(`Email values to normalise: ${emailChanges.length}`);
  for (const c of emailChanges.slice(0, 20)) console.log(`  ${c.code}: "${c.from}" -> "${c.to}"`);
  if (emailChanges.length > 20) console.log(`  ... and ${emailChanges.length - 20} more`);

  if (APPLY) {
    console.log('\nApplying...');
    for (const c of phoneChanges) {
      await prisma.employee.update({ where: { id: c.id }, data: { phone: c.to } });
    }
    for (const c of emailChanges) {
      await prisma.employee.update({ where: { id: c.id }, data: { email: c.to } });
    }
    console.log(
      `Applied ${phoneChanges.length} phone updates and ${emailChanges.length} email updates.`,
    );
  } else if (phoneChanges.length || emailChanges.length) {
    console.log('\nDry run only — nothing written. Re-run with --apply to write these changes.');
  }

  // --- Duplicate report, using the post-normalisation values ---
  const byCompanyPhone = new Map<string, typeof employees>();
  const byCompanyEmail = new Map<string, typeof employees>();
  for (const e of employees) {
    const phone = APPLY
      ? normaliseEmployeePhone(e.phone)
      : (phoneChanges.find((c) => c.id === e.id)?.to ?? e.phone);
    const email = APPLY
      ? normaliseEmployeeEmail(e.email)
      : (emailChanges.find((c) => c.id === e.id)?.to ?? e.email);
    if (phone) {
      const key = `${e.company_id}:${phone}`;
      (byCompanyPhone.get(key) ?? byCompanyPhone.set(key, []).get(key)!).push(e);
    }
    if (email) {
      const key = `${e.company_id}:${email}`;
      (byCompanyEmail.get(key) ?? byCompanyEmail.set(key, []).get(key)!).push(e);
    }
  }

  const dupPhoneGroups = [...byCompanyPhone.entries()].filter(([, list]) => list.length > 1);
  const dupEmailGroups = [...byCompanyEmail.entries()].filter(([, list]) => list.length > 1);

  console.log(`\n--- Duplicate report (after normalisation) ---`);
  console.log(`Duplicate phone groups: ${dupPhoneGroups.length}`);
  for (const [key, list] of dupPhoneGroups) {
    console.log(`  ${key}: ${list.map((e) => `${e.employee_code}(${e.status})`).join(', ')}`);
  }
  console.log(`Duplicate email groups: ${dupEmailGroups.length}`);
  for (const [key, list] of dupEmailGroups) {
    console.log(`  ${key}: ${list.map((e) => `${e.employee_code}(${e.status})`).join(', ')}`);
  }

  if (dupPhoneGroups.length === 0 && dupEmailGroups.length === 0) {
    console.log(
      '\nNo remaining duplicates — safe to add the UNIQUE(company_id, phone) / UNIQUE(company_id, email) migration.',
    );
  } else {
    console.log(
      '\nResolve the groups above by hand (merge duplicate records, or move one to a different number/email) before adding a UNIQUE constraint — it will fail to apply while these remain.',
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
