-- CreateTable
CREATE TABLE `Company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `property_type_group` VARCHAR(191) NOT NULL DEFAULT 'RADHA_REAL_HOMES',
    `announcement_image_url` TEXT NULL,
    `announcement_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `Company_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Branch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `Branch_company_id_idx`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_code` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `attendance_required` BOOLEAN NOT NULL DEFAULT true,
    `first_login_done` BOOLEAN NOT NULL DEFAULT false,
    `full_name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `secondary_phone` VARCHAR(191) NULL,
    `whatsapp_number` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `blood_group` VARCHAR(191) NULL,
    `social_links` VARCHAR(191) NULL,
    `current_address` VARCHAR(191) NULL,
    `permanent_address` VARCHAR(191) NULL,
    `emergency_contact_name` VARCHAR(191) NULL,
    `emergency_contact_relation` VARCHAR(191) NULL,
    `emergency_contact_phone` VARCHAR(191) NULL,
    `pan_number` VARCHAR(191) NULL,
    `aadhaar_number` VARCHAR(191) NULL,
    `bank_name` VARCHAR(191) NULL,
    `bank_account_number` VARCHAR(191) NULL,
    `bank_ifsc` VARCHAR(191) NULL,
    `bank_branch` VARCHAR(191) NULL,
    `job_title` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `employment_type` VARCHAR(191) NULL DEFAULT 'FULL_TIME',
    `reporting_manager_id` INTEGER NULL,
    `date_of_joining` DATETIME(3) NULL,
    `salary_ctc` DOUBLE NULL,
    `background_education` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `Employee_employee_code_key`(`employee_code`),
    INDEX `Employee_company_id_idx`(`company_id`),
    INDEX `Employee_branch_id_idx`(`branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `is_invisible` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Permission_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeRole` (
    `employee_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,

    PRIMARY KEY (`employee_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeePermissionOverride` (
    `employee_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `is_granted` BOOLEAN NOT NULL,

    PRIMARY KEY (`employee_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeQrCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `qr_token` VARCHAR(191) NOT NULL,
    `generated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NULL,

    UNIQUE INDEX `EmployeeQrCode_qr_token_key`(`qr_token`),
    INDEX `EmployeeQrCode_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `check_in_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `check_out_at` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'QR_SCAN',
    `notes` VARCHAR(191) NULL,

    INDEX `AttendanceLog_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceProposal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `target_date` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewed_by` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `assignee_id` INTEGER NOT NULL,
    `target_date` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `created_by` INTEGER NOT NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Task_assignee_id_idx`(`assignee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `summary` VARCHAR(191) NOT NULL,
    `call_count` INTEGER NOT NULL DEFAULT 0,
    `site_visit_count` INTEGER NOT NULL DEFAULT 0,
    `closed_deal_count` INTEGER NOT NULL DEFAULT 0,
    `target_met` BOOLEAN NOT NULL DEFAULT true,
    `below_target_reason` VARCHAR(191) NULL,
    `metrics_json` JSON NULL,

    INDEX `DailyReport_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_id` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` INTEGER NOT NULL,
    `old_value` VARCHAR(191) NULL,
    `new_value` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditEvent_actor_id_idx`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyTarget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL DEFAULT 1,
    `role_name` VARCHAR(191) NOT NULL,
    `employee_id` INTEGER NULL,
    `target_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `calls_target` INTEGER NOT NULL DEFAULT 0,
    `site_visits_target` INTEGER NOT NULL DEFAULT 0,
    `closed_deals_target` INTEGER NOT NULL DEFAULT 0,
    `form_schema_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `DailyTarget_role_name_idx`(`role_name`),
    INDEX `DailyTarget_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerformanceSnapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `snapshot_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `score` DOUBLE NOT NULL DEFAULT 50.0,
    `tasks_completed` INTEGER NOT NULL DEFAULT 0,
    `on_time_logins` INTEGER NOT NULL DEFAULT 0,
    `late_logins` INTEGER NOT NULL DEFAULT 0,
    `sub_target_reports` INTEGER NOT NULL DEFAULT 0,
    `uninformed_absences` INTEGER NOT NULL DEFAULT 0,

    INDEX `PerformanceSnapshot_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lead_code` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'MANUAL_ENTRY',
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `assigned_to_id` INTEGER NULL,
    `assigned_at` DATETIME(3) NULL,
    `assignment_type` VARCHAR(191) NULL,
    `property_type_preference` VARCHAR(191) NULL,
    `budget_min` DOUBLE NULL,
    `budget_max` DOUBLE NULL,
    `preferred_location` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `created_by_id` INTEGER NOT NULL,
    `last_contacted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Lead_lead_code_key`(`lead_code`),
    INDEX `Lead_company_id_idx`(`company_id`),
    INDEX `Lead_branch_id_idx`(`branch_id`),
    INDEX `Lead_assigned_to_id_idx`(`assigned_to_id`),
    INDEX `Lead_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadActivity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lead_id` INTEGER NOT NULL,
    `actor_id` INTEGER NOT NULL,
    `activity_type` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeadActivity_lead_id_idx`(`lead_id`),
    INDEX `LeadActivity_actor_id_idx`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadMatchingRequirement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lead_id` INTEGER NOT NULL,
    `property_type` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `max_budget` DOUBLE NOT NULL,
    `min_bedrooms` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LeadMatchingRequirement_lead_id_key`(`lead_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadPropertyInterest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lead_id` INTEGER NOT NULL,
    `property_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeadPropertyInterest_property_id_idx`(`property_id`),
    INDEX `LeadPropertyInterest_created_by_idx`(`created_by`),
    UNIQUE INDEX `LeadPropertyInterest_lead_id_property_id_key`(`lead_id`, `property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Property` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_code` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `brand_type` VARCHAR(191) NOT NULL DEFAULT 'SONTHILLU',
    `category` VARCHAR(191) NOT NULL DEFAULT 'VILLA',
    `price` DOUBLE NOT NULL,
    `area_sqft` DOUBLE NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `address` TEXT NULL,
    `bedrooms` INTEGER NULL,
    `bathrooms` INTEGER NULL,
    `facing` VARCHAR(191) NULL,
    `details` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `assigned_pm_id` INTEGER NULL,
    `created_by_id` INTEGER NOT NULL,
    `verified_by_pm_at` DATETIME(3) NULL,
    `dm_polished_at` DATETIME(3) NULL,
    `md_approved_at` DATETIME(3) NULL,
    `rejection_reason` TEXT NULL,
    `seo_title` VARCHAR(191) NULL,
    `seo_keywords` VARCHAR(191) NULL,
    `amenities` TEXT NULL,
    `possession_status` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Property_property_code_key`(`property_code`),
    INDEX `Property_company_id_idx`(`company_id`),
    INDEX `Property_brand_type_idx`(`brand_type`),
    INDEX `Property_status_idx`(`status`),
    INDEX `Property_assigned_pm_id_idx`(`assigned_pm_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `uploaded_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PropertyImage_property_id_idx`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyVerificationLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `actor_id` INTEGER NOT NULL,
    `from_status` VARCHAR(191) NOT NULL,
    `to_status` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PropertyVerificationLog_property_id_idx`(`property_id`),
    INDEX `PropertyVerificationLog_actor_id_idx`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChannelPartner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cp_code` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `firm_name` VARCHAR(191) NOT NULL,
    `contact_name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `tier` VARCHAR(191) NOT NULL DEFAULT 'SILVER',
    `upline_cp_id` INTEGER NULL,
    `rera_number` VARCHAR(191) NULL,
    `pan_number` VARCHAR(191) NULL,
    `bank_name` VARCHAR(191) NULL,
    `bank_account_number` VARCHAR(191) NULL,
    `bank_ifsc` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ChannelPartner_cp_code_key`(`cp_code`),
    INDEX `ChannelPartner_company_id_idx`(`company_id`),
    INDEX `ChannelPartner_tier_idx`(`tier`),
    INDEX `ChannelPartner_upline_cp_id_idx`(`upline_cp_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CPPayout` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payout_code` VARCHAR(191) NOT NULL,
    `cp_id` INTEGER NOT NULL,
    `lead_id` INTEGER NULL,
    `property_id` INTEGER NULL,
    `deal_amount` DOUBLE NOT NULL,
    `tier_rate_percent` DOUBLE NOT NULL,
    `commission_amount` DOUBLE NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_MD_APPROVAL',
    `approved_by_id` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `disbursed_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CPPayout_payout_code_key`(`payout_code`),
    INDEX `CPPayout_cp_id_idx`(`cp_id`),
    INDEX `CPPayout_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadProtectionLock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lead_id` INTEGER NOT NULL,
    `cp_id` INTEGER NOT NULL,
    `protected_until` DATETIME(3) NOT NULL,
    `lock_status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LeadProtectionLock_lead_id_key`(`lead_id`),
    INDEX `LeadProtectionLock_cp_id_idx`(`cp_id`),
    INDEX `LeadProtectionLock_protected_until_idx`(`protected_until`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteVisitBooking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_code` VARCHAR(191) NOT NULL,
    `lead_id` INTEGER NOT NULL,
    `property_id` INTEGER NULL,
    `telecaller_id` INTEGER NOT NULL,
    `project_manager_id` INTEGER NULL,
    `assigned_agent_id` INTEGER NULL,
    `scheduled_date` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `verification_call_notes` TEXT NULL,
    `feedback_notes` TEXT NULL,
    `rating` VARCHAR(191) NULL,
    `proof_photo_url` VARCHAR(191) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SiteVisitBooking_booking_code_key`(`booking_code`),
    INDEX `SiteVisitBooking_lead_id_idx`(`lead_id`),
    INDEX `SiteVisitBooking_telecaller_id_idx`(`telecaller_id`),
    INDEX `SiteVisitBooking_project_manager_id_idx`(`project_manager_id`),
    INDEX `SiteVisitBooking_assigned_agent_id_idx`(`assigned_agent_id`),
    INDEX `SiteVisitBooking_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExpenseRefund` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `purpose` TEXT NOT NULL,
    `amount` DOUBLE NOT NULL,
    `proof_image_url` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `accountant_id` INTEGER NULL,
    `accountant_note` VARCHAR(191) NULL,
    `accountant_reviewed_at` DATETIME(3) NULL,
    `md_id` INTEGER NULL,
    `md_note` VARCHAR(191) NULL,
    `md_reviewed_at` DATETIME(3) NULL,
    `refunded_at` DATETIME(3) NULL,
    `refunded_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ExpenseRefund_employee_id_idx`(`employee_id`),
    INDEX `ExpenseRefund_status_idx`(`status`),
    INDEX `ExpenseRefund_company_id_idx`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PushSubscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `endpoint` TEXT NOT NULL,
    `p256dh` TEXT NOT NULL,
    `auth` VARCHAR(191) NOT NULL,
    `user_agent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PushSubscription_employee_id_idx`(`employee_id`),
    UNIQUE INDEX `PushSubscription_employee_id_endpoint_key`(`employee_id`, `endpoint`(200)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `family_token` VARCHAR(191) NOT NULL,
    `refresh_token_hash` VARCHAR(191) NOT NULL,
    `consumed` BOOLEAN NOT NULL DEFAULT false,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `revocation_reason` VARCHAR(191) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `AuthSession_employee_id_idx`(`employee_id`),
    INDEX `AuthSession_family_token_idx`(`family_token`),
    INDEX `AuthSession_refresh_token_hash_idx`(`refresh_token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_code` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `source` VARCHAR(191) NOT NULL DEFAULT 'MANUAL_ENTRY',
    `assigned_to_id` INTEGER NULL,
    `origin_lead_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_customer_code_key`(`customer_code`),
    UNIQUE INDEX `Customer_origin_lead_id_key`(`origin_lead_id`),
    INDEX `Customer_company_id_idx`(`company_id`),
    INDEX `Customer_branch_id_idx`(`branch_id`),
    INDEX `Customer_assigned_to_id_idx`(`assigned_to_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_code` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `customer_id` INTEGER NOT NULL,
    `property_id` INTEGER NOT NULL,
    `assigned_employee_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `agreed_price` DOUBLE NOT NULL,
    `booking_amount` DOUBLE NOT NULL,
    `balance_amount` DOUBLE NOT NULL,
    `booking_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Booking_booking_code_key`(`booking_code`),
    INDEX `Booking_company_id_idx`(`company_id`),
    INDEX `Booking_customer_id_idx`(`customer_id`),
    INDEX `Booking_property_id_idx`(`property_id`),
    INDEX `Booking_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payment_code` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `booking_id` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `payment_method` VARCHAR(191) NOT NULL,
    `reference_number` VARCHAR(191) NULL,
    `payment_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `recorded_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_payment_code_key`(`payment_code`),
    INDEX `Payment_company_id_idx`(`company_id`),
    INDEX `Payment_booking_id_idx`(`booking_id`),
    INDEX `Payment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Branch` ADD CONSTRAINT `Branch_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_reporting_manager_id_fkey` FOREIGN KEY (`reporting_manager_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeRole` ADD CONSTRAINT `EmployeeRole_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeRole` ADD CONSTRAINT `EmployeeRole_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeePermissionOverride` ADD CONSTRAINT `EmployeePermissionOverride_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeePermissionOverride` ADD CONSTRAINT `EmployeePermissionOverride_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeQrCode` ADD CONSTRAINT `EmployeeQrCode_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceLog` ADD CONSTRAINT `AttendanceLog_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_assignee_id_fkey` FOREIGN KEY (`assignee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyReport` ADD CONSTRAINT `DailyReport_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyTarget` ADD CONSTRAINT `DailyTarget_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyTarget` ADD CONSTRAINT `DailyTarget_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerformanceSnapshot` ADD CONSTRAINT `PerformanceSnapshot_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadActivity` ADD CONSTRAINT `LeadActivity_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadActivity` ADD CONSTRAINT `LeadActivity_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadMatchingRequirement` ADD CONSTRAINT `LeadMatchingRequirement_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadPropertyInterest` ADD CONSTRAINT `LeadPropertyInterest_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadPropertyInterest` ADD CONSTRAINT `LeadPropertyInterest_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadPropertyInterest` ADD CONSTRAINT `LeadPropertyInterest_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_assigned_pm_id_fkey` FOREIGN KEY (`assigned_pm_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyImage` ADD CONSTRAINT `PropertyImage_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyImage` ADD CONSTRAINT `PropertyImage_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyVerificationLog` ADD CONSTRAINT `PropertyVerificationLog_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyVerificationLog` ADD CONSTRAINT `PropertyVerificationLog_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChannelPartner` ADD CONSTRAINT `ChannelPartner_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChannelPartner` ADD CONSTRAINT `ChannelPartner_upline_cp_id_fkey` FOREIGN KEY (`upline_cp_id`) REFERENCES `ChannelPartner`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CPPayout` ADD CONSTRAINT `CPPayout_cp_id_fkey` FOREIGN KEY (`cp_id`) REFERENCES `ChannelPartner`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CPPayout` ADD CONSTRAINT `CPPayout_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadProtectionLock` ADD CONSTRAINT `LeadProtectionLock_cp_id_fkey` FOREIGN KEY (`cp_id`) REFERENCES `ChannelPartner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadProtectionLock` ADD CONSTRAINT `LeadProtectionLock_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitBooking` ADD CONSTRAINT `SiteVisitBooking_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitBooking` ADD CONSTRAINT `SiteVisitBooking_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitBooking` ADD CONSTRAINT `SiteVisitBooking_telecaller_id_fkey` FOREIGN KEY (`telecaller_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitBooking` ADD CONSTRAINT `SiteVisitBooking_project_manager_id_fkey` FOREIGN KEY (`project_manager_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitBooking` ADD CONSTRAINT `SiteVisitBooking_assigned_agent_id_fkey` FOREIGN KEY (`assigned_agent_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseRefund` ADD CONSTRAINT `ExpenseRefund_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseRefund` ADD CONSTRAINT `ExpenseRefund_accountant_id_fkey` FOREIGN KEY (`accountant_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseRefund` ADD CONSTRAINT `ExpenseRefund_md_id_fkey` FOREIGN KEY (`md_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseRefund` ADD CONSTRAINT `ExpenseRefund_refunded_by_fkey` FOREIGN KEY (`refunded_by`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushSubscription` ADD CONSTRAINT `PushSubscription_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthSession` ADD CONSTRAINT `AuthSession_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_origin_lead_id_fkey` FOREIGN KEY (`origin_lead_id`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_assigned_employee_id_fkey` FOREIGN KEY (`assigned_employee_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_recorded_by_id_fkey` FOREIGN KEY (`recorded_by_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
