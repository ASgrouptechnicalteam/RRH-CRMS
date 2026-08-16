-- Phase 11 Packet 3F - Payment Synchronization (CRM <-> Portal)

-- AlterTable: additive columns on Payment (Packet 3F)
ALTER TABLE `Payment`
    ADD COLUMN `portal_payment_id` VARCHAR(191) NULL,
    ADD COLUMN `external_transaction_id` VARCHAR(191) NULL,
    ADD COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'CRM',
    ADD COLUMN `sync_status` VARCHAR(191) NOT NULL DEFAULT 'LOCAL';

-- CreateIndex: scoped dedup lookup for Portal payment references (Packet 3F)
CREATE INDEX `Payment_portal_payment_id_idx` ON `Payment`(`portal_payment_id`);
