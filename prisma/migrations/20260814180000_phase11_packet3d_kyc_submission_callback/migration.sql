-- Phase 11 Packet 3D — Portal → CRM KYC Submission Callback

-- AlterTable: Customer gains the Portal KYC submission notification state.
-- Both columns are nullable and non-blocking. Only kyc_submission_status +
-- kyc_submitted_at are added; raw KYC values never cross the boundary.
ALTER TABLE `Customer` ADD COLUMN `kyc_submission_status` VARCHAR(191) NULL;
ALTER TABLE `Customer` ADD COLUMN `kyc_submitted_at` DATETIME(3) NULL;
