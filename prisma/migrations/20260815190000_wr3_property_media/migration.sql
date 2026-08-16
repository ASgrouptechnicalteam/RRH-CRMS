-- WR-3: Add status, sort_order, alt_text to PropertyImage
-- All columns have safe defaults for backward compatibility

ALTER TABLE `PropertyImage` ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0;
ALTER TABLE `PropertyImage` ADD COLUMN `alt_text` VARCHAR(191) NULL;
ALTER TABLE `PropertyImage` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'APPROVED';

-- Index for public API filtering by status
CREATE INDEX `PropertyImage_status_idx` ON `PropertyImage`(`status`);
