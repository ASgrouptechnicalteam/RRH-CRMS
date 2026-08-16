-- Create the Project table
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_code` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `location` VARCHAR(191) NOT NULL,
    `total_area` VARCHAR(191) NULL,
    `launch_date` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PLANNING',
    `amenities` JSON NULL,
    `assigned_pm_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_project_code_key`(`project_code`),
    INDEX `Project_company_id_idx`(`company_id`),
    INDEX `Project_branch_id_idx`(`branch_id`),
    INDEX `Project_assigned_pm_id_idx`(`assigned_pm_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add project_id column to Property
ALTER TABLE `Property` ADD COLUMN `project_id` INTEGER NULL;

-- Add index to Property
CREATE INDEX `Property_project_id_idx` ON `Property`(`project_id`);

-- Add foreign key constraints to Project
ALTER TABLE `Project` ADD CONSTRAINT `Project_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Project` ADD CONSTRAINT `Project_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Project` ADD CONSTRAINT `Project_assigned_pm_id_fkey` FOREIGN KEY (`assigned_pm_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign key constraint to Property
ALTER TABLE `Property` ADD CONSTRAINT `Property_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
