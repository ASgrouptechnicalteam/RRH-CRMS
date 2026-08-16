-- WR-1: Property Publication junction table for dual-brand publication control

CREATE TABLE `PropertyPublication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PropertyPublication_property_id_company_id_key`(`property_id`, `company_id`),
    INDEX `PropertyPublication_company_id_idx`(`company_id`),
    INDEX `PropertyPublication_property_id_idx`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign keys
ALTER TABLE `PropertyPublication` ADD CONSTRAINT `PropertyPublication_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PropertyPublication` ADD CONSTRAINT `PropertyPublication_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
