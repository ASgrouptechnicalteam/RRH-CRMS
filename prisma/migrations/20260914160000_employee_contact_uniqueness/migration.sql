-- QA report 2026-09-14, "duplicate employees with same phone/email":
-- Employee.phone/email only carried a plain index, so nothing stopped two
-- employees in the same company holding the same number. The application
-- (apps/api/src/services/employeeContact.service.ts) now normalises and
-- rejects duplicates on write; this constraint is defense-in-depth for
-- anything that writes to Employee outside those three guarded routes.
--
-- Before deploying this migration, run (and confirm a clean report from):
--   npx ts-node src/scripts/normalizeEmployeeContacts.ts
-- against the target database. A UNIQUE index on a column that still has
-- duplicate values will fail to apply — see docs/ERROR-FIX-PLAN-2026-09-14.md
-- item 0.3 for the full remediation sequence. MySQL exempts multiple NULLs
-- from a unique index (unlike multiple '' values), which is why that script
-- also converts blank strings to NULL first.

-- DropIndex
DROP INDEX `Employee_phone_idx` ON `Employee`;

-- DropIndex
DROP INDEX `Employee_email_idx` ON `Employee`;

-- CreateIndex
CREATE UNIQUE INDEX `Employee_company_id_phone_key` ON `Employee`(`company_id`, `phone`);

-- CreateIndex
CREATE UNIQUE INDEX `Employee_company_id_email_key` ON `Employee`(`company_id`, `email`);
