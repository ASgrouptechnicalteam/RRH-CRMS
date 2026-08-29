ALTER TABLE `AttendanceLog` ADD COLUMN `checkout_branch_id` INT NULL;
ALTER TABLE `AttendanceLog` ADD CONSTRAINT `AttendanceLog_checkout_branch_id_fkey` FOREIGN KEY (`checkout_branch_id`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: For all completed shifts (checked out), assume the checkout branch was the branch_id
-- (due to the bug where checkout overwrote the check-in branch).
UPDATE `AttendanceLog`
SET `checkout_branch_id` = `branch_id`
WHERE `check_out_at` IS NOT NULL AND `branch_id` IS NOT NULL;
