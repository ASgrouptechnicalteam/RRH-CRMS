-- ─────────────────────────────────────────────────────────────
-- §1 Lead Macro-Status Pipeline — new Lead fields
-- ─────────────────────────────────────────────────────────────

-- AlterTable
ALTER TABLE `lead`
    ADD COLUMN `exit_reason` TEXT NULL,
    ADD COLUMN `exited_from_status` VARCHAR(191) NULL,
    ADD COLUMN `demo_scheduled_at` DATETIME(3) NULL,
    ADD COLUMN `demo_handler_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `lead` ADD CONSTRAINT `lead_demo_handler_id_fkey`
    FOREIGN KEY (`demo_handler_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- §2 SiteVisitBooking.status — adopt new §2 state machine
-- (existing rows keep their prior status string; new rows default to REQUESTED)
-- ─────────────────────────────────────────────────────────────

-- AlterTable — change the column default only (type stays VARCHAR(191))
ALTER TABLE `sitevisitbooking` ALTER COLUMN `status` SET DEFAULT 'REQUESTED';

-- AlterTable — add project_id for §2 PM routing (all linked properties share one project)
ALTER TABLE `sitevisitbooking` ADD COLUMN `project_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `sitevisitbooking` ADD CONSTRAINT `sitevisitbooking_project_id_fkey`
    FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- §2 SiteVisitProperty — multi-property outcome capture per visit
-- ─────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE `SiteVisitProperty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_id` INTEGER NOT NULL,
    `property_id` INTEGER NOT NULL,
    `outcome` VARCHAR(191) NULL,
    `outcome_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SiteVisitProperty_visit_id_property_id_key`(`visit_id`, `property_id`),
    INDEX `SiteVisitProperty_visit_id_idx`(`visit_id`),
    INDEX `SiteVisitProperty_property_id_idx`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SiteVisitProperty` ADD CONSTRAINT `SiteVisitProperty_visit_id_fkey`
    FOREIGN KEY (`visit_id`) REFERENCES `SiteVisitBooking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitProperty` ADD CONSTRAINT `SiteVisitProperty_property_id_fkey`
    FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- §2 SiteVisitReassignment — logged initial-acceptance chain
-- ─────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE `SiteVisitReassignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_id` INTEGER NOT NULL,
    `from_employee_id` INTEGER NULL,
    `to_employee_id` INTEGER NULL,
    `reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SiteVisitReassignment_visit_id_idx`(`visit_id`),
    INDEX `SiteVisitReassignment_from_employee_id_idx`(`from_employee_id`),
    INDEX `SiteVisitReassignment_to_employee_id_idx`(`to_employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SiteVisitReassignment` ADD CONSTRAINT `SiteVisitReassignment_visit_id_fkey`
    FOREIGN KEY (`visit_id`) REFERENCES `SiteVisitBooking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitReassignment` ADD CONSTRAINT `SiteVisitReassignment_from_employee_id_fkey`
    FOREIGN KEY (`from_employee_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitReassignment` ADD CONSTRAINT `SiteVisitReassignment_to_employee_id_fkey`
    FOREIGN KEY (`to_employee_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- §5 MessageTemplate — editable WhatsApp deep-link templates
-- ─────────────────────────────────────────────────────────────

-- CreateTable
CREATE TABLE `MessageTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `body_text` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MessageTemplate_template_key_key`(`template_key`),
    INDEX `MessageTemplate_template_key_idx`(`template_key`),
    INDEX `MessageTemplate_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
