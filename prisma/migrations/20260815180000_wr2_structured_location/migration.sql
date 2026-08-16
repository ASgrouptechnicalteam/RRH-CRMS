-- WR-2: Add structured location fields and listing_type to Property
-- All columns are nullable for backward compatibility with existing records

ALTER TABLE `Property` ADD COLUMN `state` VARCHAR(191) NULL;
ALTER TABLE `Property` ADD COLUMN `city` VARCHAR(191) NULL;
ALTER TABLE `Property` ADD COLUMN `locality` VARCHAR(191) NULL;
ALTER TABLE `Property` ADD COLUMN `pincode` VARCHAR(191) NULL;
ALTER TABLE `Property` ADD COLUMN `latitude` DOUBLE NULL;
ALTER TABLE `Property` ADD COLUMN `longitude` DOUBLE NULL;
ALTER TABLE `Property` ADD COLUMN `listing_type` VARCHAR(191) NULL DEFAULT 'NEW';

-- Indexes for website filtering
CREATE INDEX `Property_city_idx` ON `Property`(`city`);
CREATE INDEX `Property_listing_type_idx` ON `Property`(`listing_type`);
