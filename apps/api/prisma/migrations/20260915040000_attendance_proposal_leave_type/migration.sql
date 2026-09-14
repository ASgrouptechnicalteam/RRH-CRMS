-- AlterTable
-- item 2.7: half-day leave option. Column was already applied directly to
-- test_db (matching this session's established pattern for avoiding
-- `prisma migrate deploy` picking up an unrelated pending migration from a
-- concurrent session) but had no migration file tracking it -- added here so
-- production has a real path to pick it up.
ALTER TABLE `attendanceproposal` ADD COLUMN `leave_type` VARCHAR(191) NOT NULL DEFAULT 'FULL_DAY';
