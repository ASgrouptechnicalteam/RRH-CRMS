-- Phase 11 Packet 3C — KYC Data Bridge

-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `kyc_status` VARCHAR(191) NULL;
ALTER TABLE `Customer` ADD COLUMN `kyc_verified_at` DATETIME(3) NULL;
ALTER TABLE `Customer` ADD COLUMN `kyc_rejected_reason` TEXT NULL;

-- CreateIndex
CREATE INDEX `Customer_kyc_status_idx` ON `Customer`(`kyc_status`);

-- AlterTable
ALTER TABLE `IntegrationEvent` ADD COLUMN `crms_customer_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `IntegrationEvent_crms_customer_id_idx` ON `IntegrationEvent`(`crms_customer_id`);