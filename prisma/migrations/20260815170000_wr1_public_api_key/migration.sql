-- WR-1: PublicApiKey table for public API authentication
-- Pre-existing broken reference in public.ts (never existed in schema)

CREATE TABLE `PublicApiKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `api_key` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PublicApiKey_api_key_key`(`api_key`),
    INDEX `PublicApiKey_company_id_idx`(`company_id`),
    INDEX `PublicApiKey_api_key_idx`(`api_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PublicApiKey` ADD CONSTRAINT `PublicApiKey_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
