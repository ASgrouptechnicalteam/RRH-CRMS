-- Phase 11 Packet 3E - Customer Notifications / Activation Flow

-- CreateTable
CREATE TABLE `CustomerNotification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `booking_id` INTEGER NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `CustomerNotification_company_id_idx`(`company_id`),
    INDEX `CustomerNotification_customer_id_idx`(`customer_id`),
    INDEX `CustomerNotification_is_read_idx`(`is_read`),
    INDEX `CustomerNotification_created_at_idx`(`created_at`),
    INDEX `CustomerNotification_company_id_customer_id_created_at_idx`(`company_id`, `customer_id`, `created_at`),
    INDEX `CustomerNotification_customer_id_is_read_idx`(`customer_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomerNotification` ADD CONSTRAINT `CustomerNotification_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerNotification` ADD CONSTRAINT `CustomerNotification_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;