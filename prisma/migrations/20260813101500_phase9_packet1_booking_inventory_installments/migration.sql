-- AlterTable
ALTER TABLE `customer` ADD COLUMN `aadhaar_number` VARCHAR(191) NULL,
    ADD COLUMN `pan_number` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `opportunity` ADD COLUMN `booking_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `property` ADD COLUMN `locked_by_booking_id` INTEGER NULL,
    ADD COLUMN `locked_until` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Installment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `installment_number` INTEGER NOT NULL,
    `expected_amount` DOUBLE NOT NULL,
    `received_amount` DOUBLE NOT NULL DEFAULT 0,
    `due_date` DATETIME(3) NOT NULL,
    `received_date` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `recorded_by_id` INTEGER NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Installment_booking_id_idx`(`booking_id`),
    INDEX `Installment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Opportunity_booking_id_key` ON `Opportunity`(`booking_id`);

-- CreateIndex
CREATE UNIQUE INDEX `Property_locked_by_booking_id_key` ON `Property`(`locked_by_booking_id`);

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_locked_by_booking_id_fkey` FOREIGN KEY (`locked_by_booking_id`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Installment` ADD CONSTRAINT `Installment_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Installment` ADD CONSTRAINT `Installment_recorded_by_id_fkey` FOREIGN KEY (`recorded_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opportunity` ADD CONSTRAINT `Opportunity_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

