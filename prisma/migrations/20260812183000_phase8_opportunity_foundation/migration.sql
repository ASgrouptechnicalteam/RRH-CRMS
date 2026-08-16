-- AlterTable
ALTER TABLE `sitevisitbooking` ADD COLUMN `opportunity_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `task` ADD COLUMN `opportunity_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `Opportunity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `opportunity_code` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `lead_id` INTEGER NOT NULL,
    `project_id` INTEGER NULL,
    `property_id` INTEGER NULL,
    `stage` VARCHAR(191) NOT NULL DEFAULT 'PROSPECT_QUALIFIED',
    `expected_value` DOUBLE NULL,
    `probability` DOUBLE NULL DEFAULT 10.0,
    `budget_min` DOUBLE NULL,
    `budget_max` DOUBLE NULL,
    `expected_close_date` DATETIME(3) NULL,
    `drop_reason` TEXT NULL,
    `owner_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Opportunity_opportunity_code_key`(`opportunity_code`),
    INDEX `Opportunity_company_id_idx`(`company_id`),
    INDEX `Opportunity_branch_id_idx`(`branch_id`),
    INDEX `Opportunity_owner_id_idx`(`owner_id`),
    INDEX `Opportunity_lead_id_idx`(`lead_id`),
    INDEX `Opportunity_stage_idx`(`stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OpportunityHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `opportunity_id` INTEGER NOT NULL,
    `from_stage` VARCHAR(191) NULL,
    `to_stage` VARCHAR(191) NOT NULL,
    `changed_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OpportunityHistory_opportunity_id_idx`(`opportunity_id`),
    INDEX `OpportunityHistory_changed_by_id_idx`(`changed_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `SiteVisitBooking_opportunity_id_idx` ON `SiteVisitBooking`(`opportunity_id`);

-- CreateIndex
CREATE INDEX `Task_opportunity_id_idx` ON `Task`(`opportunity_id`);

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_opportunity_id_fkey` FOREIGN KEY (`opportunity_id`) REFERENCES `Opportunity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitBooking` ADD CONSTRAINT `SiteVisitBooking_opportunity_id_fkey` FOREIGN KEY (`opportunity_id`) REFERENCES `Opportunity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opportunity` ADD CONSTRAINT `Opportunity_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opportunity` ADD CONSTRAINT `Opportunity_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opportunity` ADD CONSTRAINT `Opportunity_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opportunity` ADD CONSTRAINT `Opportunity_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opportunity` ADD CONSTRAINT `Opportunity_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opportunity` ADD CONSTRAINT `Opportunity_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OpportunityHistory` ADD CONSTRAINT `OpportunityHistory_opportunity_id_fkey` FOREIGN KEY (`opportunity_id`) REFERENCES `Opportunity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OpportunityHistory` ADD CONSTRAINT `OpportunityHistory_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

