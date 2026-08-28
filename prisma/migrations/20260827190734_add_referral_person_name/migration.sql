-- AlterTable
ALTER TABLE `auditevent` ADD COLUMN `reason` TEXT NULL;

-- AlterTable

-- AlterTable
ALTER TABLE `lead` ADD COLUMN `referral_employee_id` INTEGER NULL,
    ADD COLUMN `referral_person_name` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `EmployeeBranch` (
    `employee_id` INTEGER NOT NULL,
    `branch_id` INTEGER NOT NULL,

    PRIMARY KEY (`employee_id`, `branch_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- CreateIndex

-- AddForeignKey
ALTER TABLE `EmployeeBranch` ADD CONSTRAINT `EmployeeBranch_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeBranch` ADD CONSTRAINT `EmployeeBranch_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_referral_employee_id_fkey` FOREIGN KEY (`referral_employee_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
