-- CreateTable
CREATE TABLE `BookingPortalMapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `crms_booking_id` INTEGER NOT NULL,
    `crms_customer_id` INTEGER NOT NULL,
    `portal_customer_id` VARCHAR(191) NULL,
    `portal_booking_id` VARCHAR(191) NULL,
    `handoff_status` VARCHAR(191) NOT NULL DEFAULT 'CREATED',
    `last_sync_at` DATETIME(3) NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BookingPortalMapping_crms_booking_id_key`(`crms_booking_id`),
    INDEX `BookingPortalMapping_company_id_idx`(`company_id`),
    INDEX `BookingPortalMapping_crms_booking_id_idx`(`crms_booking_id`),
    INDEX `BookingPortalMapping_crms_customer_id_idx`(`crms_customer_id`),
    INDEX `BookingPortalMapping_handoff_status_idx`(`handoff_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntegrationEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_type` VARCHAR(191) NOT NULL,
    `payload` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'CREATED',
    `company_id` INTEGER NOT NULL,
    `crms_booking_id` INTEGER NULL,
    `retry_count` INTEGER NOT NULL DEFAULT 0,
    `max_retries` INTEGER NOT NULL DEFAULT 3,
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,

    INDEX `IntegrationEvent_company_id_idx`(`company_id`),
    INDEX `IntegrationEvent_status_idx`(`status`),
    INDEX `IntegrationEvent_crms_booking_id_idx`(`crms_booking_id`),
    INDEX `IntegrationEvent_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BookingPortalMapping` ADD CONSTRAINT `BookingPortalMapping_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntegrationEvent` ADD CONSTRAINT `IntegrationEvent_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
