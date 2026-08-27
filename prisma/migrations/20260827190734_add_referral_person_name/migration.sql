-- AlterTable
ALTER TABLE `auditevent` ADD COLUMN `reason` TEXT NULL;

-- AlterTable
ALTER TABLE `document` ADD COLUMN `signature_status` VARCHAR(191) NOT NULL DEFAULT 'NOT_REQUIRED';

-- AlterTable
ALTER TABLE `lead` ADD COLUMN `referral_employee_id` INTEGER NULL,
    ADD COLUMN `referral_person_name` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `EmployeeBranch` (
    `employee_id` INTEGER NOT NULL,
    `branch_id` INTEGER NOT NULL,

    PRIMARY KEY (`employee_id`, `branch_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentSignature` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `document_id` INTEGER NOT NULL,
    `signer_name` VARCHAR(191) NOT NULL,
    `signer_email` VARCHAR(191) NOT NULL,
    `provider_id` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `signed_at` DATETIME(3) NULL,
    `ip_address` VARCHAR(191) NULL,
    `audit_trail_hash` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `DocumentSignature_document_id_idx`(`document_id`),
    INDEX `DocumentSignature_status_idx`(`status`),
    INDEX `DocumentSignature_provider_id_idx`(`provider_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Document_signature_status_idx` ON `Document`(`signature_status`);

-- AddForeignKey
ALTER TABLE `EmployeeBranch` ADD CONSTRAINT `EmployeeBranch_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeBranch` ADD CONSTRAINT `EmployeeBranch_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_referral_employee_id_fkey` FOREIGN KEY (`referral_employee_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentSignature` ADD CONSTRAINT `DocumentSignature_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `Document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
