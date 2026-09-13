-- Production baseline migration: _prisma_migrations was empty on production
-- (migrate has never run there — schema was built via db push / manual SQL),
-- so this brings production's live schema up to match schema.prisma exactly.
-- Generated via: prisma migrate diff --from-url <production> --to-schema-datamodel
-- prisma/schema.prisma --script, then hand-edited to remove the original
-- `Property.price` DROP COLUMN / DROP INDEX — that column is being kept for
-- now rather than dropped without first confirming it holds no live data.
-- Everything remaining here is additive (CREATE TABLE / ADD COLUMN / new
-- indexes and foreign keys) or a constraint redefinition; nothing destructive.

-- DropForeignKey
ALTER TABLE `Booking` DROP FOREIGN KEY `Booking_property_id_fkey`;

-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `area_sqyd` DOUBLE NULL,
    ADD COLUMN `booking_amount_words` VARCHAR(191) NULL,
    ADD COLUMN `charges_per_sqyd` DOUBLE NULL,
    ADD COLUMN `emi_charges` DOUBLE NULL,
    ADD COLUMN `emi_interest_rate` DOUBLE NULL,
    ADD COLUMN `emi_months` INTEGER NULL,
    ADD COLUMN `facing` VARCHAR(191) NULL,
    ADD COLUMN `form_status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `form_submitted_at` DATETIME(3) NULL,
    ADD COLUMN `form_submitted_by_id` INTEGER NULL,
    ADD COLUMN `is_legacy` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `legacy_booking_date` DATETIME(3) NULL,
    ADD COLUMN `legacy_notes` TEXT NULL,
    ADD COLUMN `md_approved_at` DATETIME(3) NULL,
    ADD COLUMN `md_approved_by_id` INTEGER NULL,
    ADD COLUMN `md_rejection_reason` TEXT NULL,
    ADD COLUMN `plot_no` VARCHAR(191) NULL,
    ADD COLUMN `price_per_sqyd` DOUBLE NULL,
    ADD COLUMN `project_unit_id` INTEGER NULL,
    ADD COLUMN `receipt_date` DATETIME(3) NULL,
    ADD COLUMN `receipt_no` VARCHAR(191) NULL,
    ADD COLUMN `referred_by` VARCHAR(191) NULL,
    ADD COLUMN `referred_by_code` VARCHAR(191) NULL,
    ADD COLUMN `sale_price_per_sqyd` DOUBLE NULL,
    ADD COLUMN `serial_no` VARCHAR(191) NULL,
    ADD COLUMN `tc_accepted_at` DATETIME(3) NULL,
    ADD COLUMN `tc_accepted_by_name` VARCHAR(191) NULL,
    ADD COLUMN `total_cost` DOUBLE NULL,
    ADD COLUMN `total_cost_words` VARCHAR(191) NULL,
    MODIFY `property_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `Complaint` ADD COLUMN `project_unit_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `Demo` ADD COLUMN `accepted_at` DATETIME(3) NULL,
    ADD COLUMN `accepted_by` INTEGER NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `DemoInterestedProperty` ADD COLUMN `project_unit_id` INTEGER NULL,
    MODIFY `property_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `Employee` ADD COLUMN `last_working_day` DATETIME(3) NULL,
    ADD COLUMN `resignation_date` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Lead` ADD COLUMN `exit_reason_detail` VARCHAR(191) NULL,
    ADD COLUMN `external_agent_associate_id` VARCHAR(191) NULL,
    ADD COLUMN `external_agent_company` VARCHAR(191) NULL,
    ADD COLUMN `external_agent_name` VARCHAR(191) NULL,
    ADD COLUMN `external_agent_phone` VARCHAR(191) NULL,
    MODIFY `exit_reason` ENUM('NO_MATCHING_INVENTORY', 'CHOSE_COMPETITOR', 'BUDGET_MISMATCH', 'NOT_READY', 'DO_NOT_CONTACT', 'UNRESPONSIVE', 'INVALID_CONTACT', 'DUPLICATE_LEAD', 'FINANCING_ISSUE', 'LOCATION_MISMATCH', 'ALREADY_PURCHASED', 'JUST_ENQUIRING', 'SITE_VISIT_NO_SHOW', 'NEGOTIATION_FAILED', 'OUT_OF_SERVICE_AREA', 'OTHER') NULL;

-- AlterTable
ALTER TABLE `LeadPropertyInterest` ADD COLUMN `project_unit_id` INTEGER NULL,
    MODIFY `property_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `Opportunity` ADD COLUMN `project_unit_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `Project` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `approval_authorities` JSON NULL,
    ADD COLUMN `approval_authority` VARCHAR(191) NULL,
    ADD COLUMN `approval_number` VARCHAR(191) NULL,
    ADD COLUMN `blocks_count` INTEGER NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `completion_date` DATETIME(3) NULL,
    ADD COLUMN `cover_image_url` TEXT NULL,
    ADD COLUMN `default_area_unit` ENUM('SQFT', 'SQYD', 'SQM', 'ACRE', 'GUNTA', 'CENT', 'ANKANAM', 'HECTARE') NULL,
    ADD COLUMN `default_price_basis` ENUM('CARPET', 'BUILT_UP', 'SUPER_BUILT_UP', 'PLOT_AREA', 'LUMPSUM') NULL,
    ADD COLUMN `developer_name` VARCHAR(191) NULL,
    ADD COLUMN `district` VARCHAR(191) NULL,
    ADD COLUMN `floors_count` INTEGER NULL,
    ADD COLUMN `is_published` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `locality` VARCHAR(191) NULL,
    ADD COLUMN `longitude` DOUBLE NULL,
    ADD COLUMN `lp_number` VARCHAR(191) NULL,
    ADD COLUMN `mandal` VARCHAR(191) NULL,
    ADD COLUMN `maps_link` TEXT NULL,
    ADD COLUMN `pincode` VARCHAR(191) NULL,
    ADD COLUMN `project_type` ENUM('PLOTTED', 'APARTMENT', 'VILLA', 'MIXED', 'COMMERCIAL', 'OTHER') NULL,
    ADD COLUMN `rera_status` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `total_area_unit` ENUM('SQFT', 'SQYD', 'SQM', 'ACRE', 'GUNTA', 'CENT', 'ANKANAM', 'HECTARE') NULL,
    ADD COLUMN `total_area_value` DOUBLE NULL,
    ADD COLUMN `towers_count` INTEGER NULL,
    ADD COLUMN `verification_notes` TEXT NULL,
    ADD COLUMN `verification_status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `verified_at` DATETIME(3) NULL,
    ADD COLUMN `verified_by_id` INTEGER NULL,
    ADD COLUMN `village` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Property`
    ADD COLUMN `area_sqyd` DOUBLE NULL,
    ADD COLUMN `area_unit` ENUM('SQFT', 'SQYD', 'SQM', 'ACRE', 'GUNTA', 'CENT', 'ANKANAM', 'HECTARE') NULL,
    ADD COLUMN `area_value` DOUBLE NULL,
    ADD COLUMN `base_price` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `base_rate` DOUBLE NULL,
    ADD COLUMN `base_rate_unit` ENUM('FIXED', 'PER_SQFT', 'PER_SQYD', 'PERCENT_OF_BASE', 'QTY_X_RATE') NULL,
    ADD COLUMN `built_up_area_sqft` DOUBLE NULL,
    ADD COLUMN `calculated_price` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `carpet_area_sqft` DOUBLE NULL,
    ADD COLUMN `charges_total` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `construction_year` INTEGER NULL,
    ADD COLUMN `discount_amount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `discount_reason` VARCHAR(191) NULL,
    ADD COLUMN `final_price` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `first_floor_area_sqft` DOUBLE NULL,
    ADD COLUMN `ground_floor_area_sqft` DOUBLE NULL,
    ADD COLUMN `held_for_lead_id` INTEGER NULL,
    ADD COLUMN `hold_until` DATETIME(3) NULL,
    ADD COLUMN `is_corner` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_main_road_facing` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_park_facing` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_premium_location` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_road_facing` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `overridden_at` DATETIME(3) NULL,
    ADD COLUMN `overridden_by_id` INTEGER NULL,
    ADD COLUMN `override_price` DOUBLE NULL,
    ADD COLUMN `override_reason` TEXT NULL,
    ADD COLUMN `plot_area_sqyd` DOUBLE NULL,
    ADD COLUMN `plot_length_ft` DOUBLE NULL,
    ADD COLUMN `plot_width_ft` DOUBLE NULL,
    ADD COLUMN `premiums_total` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `price_basis` ENUM('CARPET', 'BUILT_UP', 'SUPER_BUILT_UP', 'PLOT_AREA', 'LUMPSUM') NOT NULL DEFAULT 'SUPER_BUILT_UP',
    ADD COLUMN `price_computed_at` DATETIME(3) NULL,
    ADD COLUMN `road_width_ft` DOUBLE NULL,
    ADD COLUMN `sales_status` ENUM('AVAILABLE', 'HOLD', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
    ADD COLUMN `super_built_up_area_sqft` DOUBLE NULL,
    ADD COLUMN `taxes_total` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `total_floors` INTEGER NULL,
    ADD COLUMN `view` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `PropertyApartmentDetails` ADD COLUMN `balcony_area` DOUBLE NULL,
    ADD COLUMN `bathroom_type` VARCHAR(191) NULL,
    ADD COLUMN `electrical` VARCHAR(191) NULL,
    ADD COLUMN `fixtures` VARCHAR(191) NULL,
    ADD COLUMN `has_additional_parking` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `has_utility_area` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `is_city_view` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `is_covered_parking` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `is_garden_view` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `is_higher_floor` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `is_main_road_view` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `is_near_lift` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `is_near_staircase` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `is_pool_view` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `is_road_view` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `paint` VARCHAR(191) NULL,
    ADD COLUMN `parking_number` VARCHAR(191) NULL,
    ADD COLUMN `plumbing` VARCHAR(191) NULL,
    ADD COLUMN `terrace_area` DOUBLE NULL;

-- AlterTable
ALTER TABLE `PropertyPlotDetails` ADD COLUMN `near_park` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `SiteVisitBooking` ADD COLUMN `project_unit_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `SiteVisitProperty` ADD COLUMN `project_unit_id` INTEGER NULL,
    MODIFY `property_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `WebAuthnCredential` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NOT NULL,
    `credential_id` VARCHAR(191) NOT NULL,
    `public_key` TEXT NOT NULL,
    `counter` INTEGER NOT NULL DEFAULT 0,
    `device_label` VARCHAR(191) NULL,
    `transports` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_used_at` DATETIME(3) NULL,

    UNIQUE INDEX `WebAuthnCredential_credential_id_key`(`credential_id`),
    INDEX `WebAuthnCredential_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteVisitFeedback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `site_visit_id` INTEGER NOT NULL,
    `rated_employee_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `submitted_at` DATETIME(3) NULL,
    `rating` INTEGER NULL,
    `on_time` BOOLEAN NULL,
    `answered_questions` BOOLEAN NULL,
    `property_as_described` BOOLEAN NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SiteVisitFeedback_site_visit_id_key`(`site_visit_id`),
    UNIQUE INDEX `SiteVisitFeedback_token_hash_key`(`token_hash`),
    INDEX `SiteVisitFeedback_rated_employee_id_idx`(`rated_employee_id`),
    INDEX `SiteVisitFeedback_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeCompanyAccess` (
    `employee_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,

    PRIMARY KEY (`employee_id`, `company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadPreferredLocation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lead_id` INTEGER NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeadPreferredLocation_lead_id_idx`(`lead_id`),
    UNIQUE INDEX `LeadPreferredLocation_lead_id_location_key`(`lead_id`, `location`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectUnit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unit_code` VARCHAR(191) NOT NULL,
    `project_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `branch_id` INTEGER NULL,
    `unit_number` VARCHAR(191) NOT NULL,
    `unit_type` ENUM('PLOT', 'FLAT', 'VILLA', 'HOUSE', 'COMMERCIAL', 'OTHER') NOT NULL,
    `plot_number` VARCHAR(191) NULL,
    `survey_number` VARCHAR(191) NULL,
    `tower` VARCHAR(191) NULL,
    `block` VARCHAR(191) NULL,
    `floor` INTEGER NULL,
    `flat_number` VARCHAR(191) NULL,
    `villa_number` VARCHAR(191) NULL,
    `type_code` VARCHAR(191) NULL,
    `bhk` VARCHAR(191) NULL,
    `bedrooms` INTEGER NULL,
    `bathrooms` INTEGER NULL,
    `balconies` INTEGER NULL,
    `living_rooms` INTEGER NULL,
    `kitchens` INTEGER NULL,
    `utility_rooms` INTEGER NULL,
    `has_pooja_room` BOOLEAN NOT NULL DEFAULT false,
    `has_study_room` BOOLEAN NOT NULL DEFAULT false,
    `listing_type` VARCHAR(191) NULL,
    `area_value` DOUBLE NULL,
    `area_unit` ENUM('SQFT', 'SQYD', 'SQM', 'ACRE', 'GUNTA', 'CENT', 'ANKANAM', 'HECTARE') NULL,
    `area_sqft` DOUBLE NULL,
    `area_sqyd` DOUBLE NULL,
    `plot_area_sqyd` DOUBLE NULL,
    `plot_length_ft` DOUBLE NULL,
    `plot_width_ft` DOUBLE NULL,
    `carpet_area_sqft` DOUBLE NULL,
    `built_up_area_sqft` DOUBLE NULL,
    `super_built_up_area_sqft` DOUBLE NULL,
    `ground_floor_area_sqft` DOUBLE NULL,
    `first_floor_area_sqft` DOUBLE NULL,
    `total_floors` INTEGER NULL,
    `price_basis` ENUM('CARPET', 'BUILT_UP', 'SUPER_BUILT_UP', 'PLOT_AREA', 'LUMPSUM') NOT NULL DEFAULT 'SUPER_BUILT_UP',
    `facing` VARCHAR(191) NULL,
    `is_corner` BOOLEAN NOT NULL DEFAULT false,
    `is_road_facing` BOOLEAN NOT NULL DEFAULT false,
    `is_park_facing` BOOLEAN NOT NULL DEFAULT false,
    `is_main_road_facing` BOOLEAN NOT NULL DEFAULT false,
    `road_width_ft` DOUBLE NULL,
    `view` VARCHAR(191) NULL,
    `parking_included` BOOLEAN NOT NULL DEFAULT false,
    `parking_type` VARCHAR(191) NULL,
    `parking_count` INTEGER NULL,
    `parking_slots` VARCHAR(191) NULL,
    `base_rate` DOUBLE NULL,
    `base_rate_unit` ENUM('FIXED', 'PER_SQFT', 'PER_SQYD', 'PERCENT_OF_BASE', 'QTY_X_RATE') NULL,
    `base_price` DOUBLE NOT NULL DEFAULT 0,
    `premiums_total` DOUBLE NOT NULL DEFAULT 0,
    `charges_total` DOUBLE NOT NULL DEFAULT 0,
    `taxes_total` DOUBLE NOT NULL DEFAULT 0,
    `discount_amount` DOUBLE NOT NULL DEFAULT 0,
    `discount_reason` VARCHAR(191) NULL,
    `calculated_price` DOUBLE NOT NULL DEFAULT 0,
    `override_price` DOUBLE NULL,
    `override_reason` TEXT NULL,
    `overridden_by_id` INTEGER NULL,
    `overridden_at` DATETIME(3) NULL,
    `final_price` DOUBLE NOT NULL DEFAULT 0,
    `price_computed_at` DATETIME(3) NULL,
    `selected_optional_rule_ids` JSON NULL,
    `sales_status` ENUM('AVAILABLE', 'HOLD', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
    `hold_until` DATETIME(3) NULL,
    `held_for_lead_id` INTEGER NULL,
    `locked_until` DATETIME(3) NULL,
    `locked_by_booking_id` INTEGER NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `created_by_id` INTEGER NULL,
    `migrated_from_property_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProjectUnit_unit_code_key`(`unit_code`),
    UNIQUE INDEX `ProjectUnit_locked_by_booking_id_key`(`locked_by_booking_id`),
    INDEX `ProjectUnit_project_id_sales_status_idx`(`project_id`, `sales_status`),
    INDEX `ProjectUnit_project_id_unit_type_idx`(`project_id`, `unit_type`),
    INDEX `ProjectUnit_project_id_tower_floor_idx`(`project_id`, `tower`, `floor`),
    INDEX `ProjectUnit_project_id_bhk_idx`(`project_id`, `bhk`),
    INDEX `ProjectUnit_company_id_idx`(`company_id`),
    INDEX `ProjectUnit_final_price_idx`(`final_price`),
    INDEX `ProjectUnit_area_sqft_idx`(`area_sqft`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectPricingRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `kind` ENUM('BASE_RATE', 'PREMIUM', 'CHARGE', 'DISCOUNT', 'TAX') NOT NULL,
    `category` ENUM('FACING', 'FLOOR', 'CORNER', 'ROAD', 'PARK', 'VIEW', 'BHK', 'AMENITY', 'PARKING', 'INFRA', 'MAINTENANCE', 'LEGAL', 'CLUB', 'TAX', 'OTHER') NOT NULL,
    `calc_method` ENUM('FIXED', 'PER_SQFT', 'PER_SQYD', 'PERCENT_OF_BASE', 'QTY_X_RATE') NOT NULL,
    `rate` DOUBLE NOT NULL,
    `area_basis` ENUM('CARPET', 'BUILT_UP', 'SUPER_BUILT_UP', 'PLOT_AREA', 'LUMPSUM') NULL,
    `applies_to_unit_type` ENUM('PLOT', 'FLAT', 'VILLA', 'HOUSE', 'COMMERCIAL', 'OTHER') NULL,
    `is_mandatory` BOOLEAN NOT NULL DEFAULT true,
    `is_tax` BOOLEAN NOT NULL DEFAULT false,
    `is_refundable` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `match_facing` VARCHAR(191) NULL,
    `match_corner` BOOLEAN NULL,
    `match_park_facing` BOOLEAN NULL,
    `match_road_facing` BOOLEAN NULL,
    `match_main_road_facing` BOOLEAN NULL,
    `match_floor_min` INTEGER NULL,
    `match_floor_max` INTEGER NULL,
    `match_bhk` VARCHAR(191) NULL,
    `match_type_code` VARCHAR(191) NULL,
    `match_view` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ProjectPricingRule_project_id_kind_idx`(`project_id`, `kind`),
    INDEX `ProjectPricingRule_project_id_is_active_idx`(`project_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyPricingRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `kind` ENUM('BASE_RATE', 'PREMIUM', 'CHARGE', 'DISCOUNT', 'TAX') NOT NULL,
    `category` ENUM('FACING', 'FLOOR', 'CORNER', 'ROAD', 'PARK', 'VIEW', 'BHK', 'AMENITY', 'PARKING', 'INFRA', 'MAINTENANCE', 'LEGAL', 'CLUB', 'TAX', 'OTHER') NOT NULL,
    `calc_method` ENUM('FIXED', 'PER_SQFT', 'PER_SQYD', 'PERCENT_OF_BASE', 'QTY_X_RATE') NOT NULL,
    `rate` DOUBLE NOT NULL,
    `area_basis` ENUM('CARPET', 'BUILT_UP', 'SUPER_BUILT_UP', 'PLOT_AREA', 'LUMPSUM') NULL,
    `is_mandatory` BOOLEAN NOT NULL DEFAULT true,
    `is_tax` BOOLEAN NOT NULL DEFAULT false,
    `is_refundable` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `match_facing` VARCHAR(191) NULL,
    `match_corner` BOOLEAN NULL,
    `match_park_facing` BOOLEAN NULL,
    `match_road_facing` BOOLEAN NULL,
    `match_main_road_facing` BOOLEAN NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `PropertyPricingRule_property_id_kind_idx`(`property_id`, `kind`),
    INDEX `PropertyPricingRule_property_id_is_active_idx`(`property_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PriceLine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_unit_id` INTEGER NULL,
    `property_id` INTEGER NULL,
    `rule_id` INTEGER NULL,
    `property_rule_id` INTEGER NULL,
    `label` VARCHAR(191) NOT NULL,
    `kind` ENUM('BASE_RATE', 'PREMIUM', 'CHARGE', 'DISCOUNT', 'TAX') NOT NULL,
    `category` ENUM('FACING', 'FLOOR', 'CORNER', 'ROAD', 'PARK', 'VIEW', 'BHK', 'AMENITY', 'PARKING', 'INFRA', 'MAINTENANCE', 'LEGAL', 'CLUB', 'TAX', 'OTHER') NOT NULL,
    `calc_method` ENUM('FIXED', 'PER_SQFT', 'PER_SQYD', 'PERCENT_OF_BASE', 'QTY_X_RATE') NOT NULL,
    `rate` DOUBLE NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 1,
    `area_basis` ENUM('CARPET', 'BUILT_UP', 'SUPER_BUILT_UP', 'PLOT_AREA', 'LUMPSUM') NULL,
    `amount` DOUBLE NOT NULL,
    `is_manual` BOOLEAN NOT NULL DEFAULT false,
    `is_refundable` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PriceLine_project_unit_id_idx`(`project_unit_id`),
    INDEX `PriceLine_property_id_idx`(`property_id`),
    INDEX `PriceLine_rule_id_idx`(`rule_id`),
    INDEX `PriceLine_property_rule_id_idx`(`property_rule_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Amenity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `category` ENUM('SECURITY', 'RECREATION', 'CONVENIENCE', 'ENVIRONMENT', 'SPORTS', 'UTILITY', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Amenity_company_id_idx`(`company_id`),
    UNIQUE INDEX `Amenity_company_id_name_key`(`company_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectAmenity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `amenity_id` INTEGER NOT NULL,
    `availability` ENUM('INCLUDED', 'OPTIONAL', 'CHARGEABLE') NOT NULL DEFAULT 'INCLUDED',
    `charge_calc_method` ENUM('FIXED', 'PER_SQFT', 'PER_SQYD', 'PERCENT_OF_BASE', 'QTY_X_RATE') NULL,
    `charge_amount` DOUBLE NULL,
    `applicability` ENUM('ALL_UNITS', 'SELECTED_UNITS', 'BY_UNIT_TYPE') NOT NULL DEFAULT 'ALL_UNITS',
    `applicable_unit_type` ENUM('PLOT', 'FLAT', 'VILLA', 'HOUSE', 'COMMERCIAL', 'OTHER') NULL,
    `notes` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ProjectAmenity_project_id_idx`(`project_id`),
    UNIQUE INDEX `ProjectAmenity_project_id_amenity_id_key`(`project_id`, `amenity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryFeature` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_unit_id` INTEGER NULL,
    `property_id` INTEGER NULL,
    `amenity_id` INTEGER NULL,
    `label` VARCHAR(191) NOT NULL,
    `charge_amount` DOUBLE NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryFeature_project_unit_id_idx`(`project_unit_id`),
    INDEX `InventoryFeature_property_id_idx`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectMedia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `kind` ENUM('COVER', 'GALLERY', 'VIDEO', 'BROCHURE', 'MASTER_PLAN', 'LAYOUT_PLAN', 'FLOOR_PLAN') NOT NULL,
    `url` TEXT NOT NULL,
    `title` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `uploaded_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectMedia_project_id_kind_idx`(`project_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `kind` ENUM('RERA', 'APPROVAL', 'LEGAL', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `url` TEXT NOT NULL,
    `title` VARCHAR(191) NULL,
    `uploaded_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectDocument_project_id_kind_idx`(`project_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectUnitImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_unit_id` INTEGER NOT NULL,
    `image_url` TEXT NOT NULL,
    `alt_text` VARCHAR(191) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `uploaded_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectUnitImage_project_unit_id_idx`(`project_unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectUnitDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_unit_id` INTEGER NOT NULL,
    `url` TEXT NOT NULL,
    `title` VARCHAR(191) NULL,
    `uploaded_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectUnitDocument_project_unit_id_idx`(`project_unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebsiteAccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `token_version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `WebsiteAccount_company_id_idx`(`company_id`),
    UNIQUE INDEX `WebsiteAccount_company_id_email_key`(`company_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebsiteShortlistItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `property_id` INTEGER NULL,
    `project_unit_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WebsiteShortlistItem_account_id_idx`(`account_id`),
    UNIQUE INDEX `WebsiteShortlistItem_account_id_property_id_key`(`account_id`, `property_id`),
    UNIQUE INDEX `WebsiteShortlistItem_account_id_project_unit_id_key`(`account_id`, `project_unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebsiteCompareItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `property_id` INTEGER NULL,
    `project_unit_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WebsiteCompareItem_account_id_idx`(`account_id`),
    UNIQUE INDEX `WebsiteCompareItem_account_id_property_id_key`(`account_id`, `property_id`),
    UNIQUE INDEX `WebsiteCompareItem_account_id_project_unit_id_key`(`account_id`, `project_unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebsiteActivityEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `account_id` INTEGER NULL,
    `anonymous_id` VARCHAR(191) NULL,
    `event_name` VARCHAR(191) NOT NULL,
    `page` VARCHAR(191) NULL,
    `property_id` INTEGER NULL,
    `project_id` INTEGER NULL,
    `search_context` JSON NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WebsiteActivityEvent_company_id_created_at_idx`(`company_id`, `created_at`),
    INDEX `WebsiteActivityEvent_account_id_idx`(`account_id`),
    INDEX `WebsiteActivityEvent_anonymous_id_idx`(`anonymous_id`),
    INDEX `WebsiteActivityEvent_event_name_idx`(`event_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectLayoutImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `uploaded_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ProjectLayoutImage_project_id_idx`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyLayoutRegion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `layout_image_id` INTEGER NOT NULL,
    `property_id` INTEGER NULL,
    `project_unit_id` INTEGER NULL,
    `x` DOUBLE NOT NULL,
    `y` DOUBLE NOT NULL,
    `created_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `PropertyLayoutRegion_property_id_idx`(`property_id`),
    INDEX `PropertyLayoutRegion_project_unit_id_idx`(`project_unit_id`),
    UNIQUE INDEX `PropertyLayoutRegion_layout_image_id_property_id_key`(`layout_image_id`, `property_id`),
    UNIQUE INDEX `PropertyLayoutRegion_layout_image_id_project_unit_id_key`(`layout_image_id`, `project_unit_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyVillaDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `villa_number` VARCHAR(191) NULL,
    `villa_type` VARCHAR(191) NULL,
    `bhk` VARCHAR(191) NULL,
    `has_second_floor` BOOLEAN NULL DEFAULT false,
    `second_floor_area` DOUBLE NULL,
    `has_servant_room` BOOLEAN NULL DEFAULT false,
    `has_pooja_room` BOOLEAN NULL DEFAULT false,
    `has_study_room` BOOLEAN NULL DEFAULT false,
    `has_family_room` BOOLEAN NULL DEFAULT false,
    `garden_area` DOUBLE NULL,
    `terrace_area` DOUBLE NULL,
    `is_clubhouse_facing` BOOLEAN NULL DEFAULT false,
    `is_pool_facing` BOOLEAN NULL DEFAULT false,
    `has_private_garden` BOOLEAN NULL DEFAULT false,
    `has_private_pool` BOOLEAN NULL DEFAULT false,
    `has_terrace` BOOLEAN NULL DEFAULT false,
    `has_compound_wall` BOOLEAN NULL DEFAULT false,
    `has_gate` BOOLEAN NULL DEFAULT false,
    `number_of_cars` INTEGER NULL,
    `has_ev_charging` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `PropertyVillaDetails_property_id_key`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyHouseDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `house_number` VARCHAR(191) NULL,
    `house_type` VARCHAR(191) NULL,
    `bhk` VARCHAR(191) NULL,
    `has_kitchen` BOOLEAN NULL DEFAULT false,
    `has_pooja_room` BOOLEAN NULL DEFAULT false,
    `has_study_room` BOOLEAN NULL DEFAULT false,
    `has_servant_room` BOOLEAN NULL DEFAULT false,
    `has_utility_room` BOOLEAN NULL DEFAULT false,
    `garden_area` DOUBLE NULL,
    `terrace_area` DOUBLE NULL,
    `is_covered_parking` BOOLEAN NULL DEFAULT false,
    `parking_capacity` INTEGER NULL,
    `parking_number` VARCHAR(191) NULL,
    `has_additional_parking` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `PropertyHouseDetails_property_id_key`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyCommercialShopDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `shop_number` VARCHAR(191) NULL,
    `building` VARCHAR(191) NULL,
    `block` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `shop_type` VARCHAR(191) NULL,
    `frontage` DOUBLE NULL,
    `depth` DOUBLE NULL,
    `ceiling_height` DOUBLE NULL,
    `is_mall_facing` BOOLEAN NULL DEFAULT false,
    `is_entrance_facing` BOOLEAN NULL DEFAULT false,
    `is_parking_facing` BOOLEAN NULL DEFAULT false,
    `is_high_footfall_location` BOOLEAN NULL DEFAULT false,
    `has_parking` BOOLEAN NULL DEFAULT false,
    `has_power` BOOLEAN NULL DEFAULT false,
    `has_water` BOOLEAN NULL DEFAULT false,
    `has_washroom` BOOLEAN NULL DEFAULT false,
    `has_lift` BOOLEAN NULL DEFAULT false,
    `has_security` BOOLEAN NULL DEFAULT false,
    `has_fire_safety` BOOLEAN NULL DEFAULT false,
    `has_signage_space` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `PropertyCommercialShopDetails_property_id_key`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyCommercialOfficeDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `office_number` VARCHAR(191) NULL,
    `tower` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `block` VARCHAR(191) NULL,
    `office_type` VARCHAR(191) NULL,
    `cabins` INTEGER NULL,
    `workstations` INTEGER NULL,
    `meeting_rooms` INTEGER NULL,
    `has_reception` BOOLEAN NULL DEFAULT false,
    `has_pantry` BOOLEAN NULL DEFAULT false,
    `washrooms` INTEGER NULL,
    `has_server_room` BOOLEAN NULL DEFAULT false,
    `is_city_view` BOOLEAN NULL DEFAULT false,
    `is_higher_floor` BOOLEAN NULL DEFAULT false,
    `has_parking` BOOLEAN NULL DEFAULT false,
    `has_power_backup` BOOLEAN NULL DEFAULT false,
    `has_lift` BOOLEAN NULL DEFAULT false,
    `has_security` BOOLEAN NULL DEFAULT false,
    `has_fire_safety` BOOLEAN NULL DEFAULT false,
    `has_hvac` BOOLEAN NULL DEFAULT false,
    `has_internet` BOOLEAN NULL DEFAULT false,
    `has_ev_charging` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `PropertyCommercialOfficeDetails_property_id_key`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyFarmLandDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `farm_land_number` VARCHAR(191) NULL,
    `parcel_number` VARCHAR(191) NULL,
    `survey_number` VARCHAR(191) NULL,
    `subdivision` VARCHAR(191) NULL,
    `road_frontage` DOUBLE NULL,
    `boundary_details` TEXT NULL,
    `is_near_water_source` BOOLEAN NULL DEFAULT false,
    `has_internal_road` BOOLEAN NULL DEFAULT false,
    `has_electricity` BOOLEAN NULL DEFAULT false,
    `has_water` BOOLEAN NULL DEFAULT false,
    `has_borewell` BOOLEAN NULL DEFAULT false,
    `has_irrigation` BOOLEAN NULL DEFAULT false,
    `has_fencing` BOOLEAN NULL DEFAULT false,
    `has_plantation` BOOLEAN NULL DEFAULT false,
    `has_drainage` BOOLEAN NULL DEFAULT false,
    `has_farmhouse_permission` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `PropertyFarmLandDetails_property_id_key`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Booking_project_unit_id_idx` ON `Booking`(`project_unit_id`);

-- CreateIndex
CREATE INDEX `Booking_form_status_idx` ON `Booking`(`form_status`);

-- CreateIndex
CREATE INDEX `Booking_is_legacy_idx` ON `Booking`(`is_legacy`);

-- CreateIndex
CREATE INDEX `DemoInterestedProperty_project_unit_id_idx` ON `DemoInterestedProperty`(`project_unit_id`);

-- CreateIndex
CREATE UNIQUE INDEX `DemoInterestedProperty_demo_id_project_unit_id_key` ON `DemoInterestedProperty`(`demo_id`, `project_unit_id`);

-- CreateIndex
CREATE INDEX `LeadPropertyInterest_project_unit_id_idx` ON `LeadPropertyInterest`(`project_unit_id`);

-- CreateIndex
CREATE UNIQUE INDEX `LeadPropertyInterest_lead_id_project_unit_id_key` ON `LeadPropertyInterest`(`lead_id`, `project_unit_id`);

-- CreateIndex
CREATE INDEX `Project_project_type_idx` ON `Project`(`project_type`);

-- CreateIndex
CREATE INDEX `Project_city_idx` ON `Project`(`city`);

-- CreateIndex
CREATE INDEX `Property_final_price_idx` ON `Property`(`final_price`);

-- CreateIndex
CREATE INDEX `SiteVisitProperty_project_unit_id_idx` ON `SiteVisitProperty`(`project_unit_id`);

-- CreateIndex
CREATE UNIQUE INDEX `SiteVisitProperty_visit_id_project_unit_id_key` ON `SiteVisitProperty`(`visit_id`, `project_unit_id`);

-- AddForeignKey
ALTER TABLE `WebAuthnCredential` ADD CONSTRAINT `WebAuthnCredential_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitFeedback` ADD CONSTRAINT `SiteVisitFeedback_site_visit_id_fkey` FOREIGN KEY (`site_visit_id`) REFERENCES `SiteVisitBooking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitFeedback` ADD CONSTRAINT `SiteVisitFeedback_rated_employee_id_fkey` FOREIGN KEY (`rated_employee_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeCompanyAccess` ADD CONSTRAINT `EmployeeCompanyAccess_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeCompanyAccess` ADD CONSTRAINT `EmployeeCompanyAccess_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadPreferredLocation` ADD CONSTRAINT `LeadPreferredLocation_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadPropertyInterest` ADD CONSTRAINT `LeadPropertyInterest_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_verified_by_id_fkey` FOREIGN KEY (`verified_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectUnit` ADD CONSTRAINT `ProjectUnit_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectUnit` ADD CONSTRAINT `ProjectUnit_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectUnit` ADD CONSTRAINT `ProjectUnit_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectUnit` ADD CONSTRAINT `ProjectUnit_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectUnit` ADD CONSTRAINT `ProjectUnit_overridden_by_id_fkey` FOREIGN KEY (`overridden_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectUnit` ADD CONSTRAINT `ProjectUnit_locked_by_booking_id_fkey` FOREIGN KEY (`locked_by_booking_id`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectPricingRule` ADD CONSTRAINT `ProjectPricingRule_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyPricingRule` ADD CONSTRAINT `PropertyPricingRule_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceLine` ADD CONSTRAINT `PriceLine_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceLine` ADD CONSTRAINT `PriceLine_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceLine` ADD CONSTRAINT `PriceLine_rule_id_fkey` FOREIGN KEY (`rule_id`) REFERENCES `ProjectPricingRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceLine` ADD CONSTRAINT `PriceLine_property_rule_id_fkey` FOREIGN KEY (`property_rule_id`) REFERENCES `PropertyPricingRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Amenity` ADD CONSTRAINT `Amenity_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectAmenity` ADD CONSTRAINT `ProjectAmenity_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectAmenity` ADD CONSTRAINT `ProjectAmenity_amenity_id_fkey` FOREIGN KEY (`amenity_id`) REFERENCES `Amenity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryFeature` ADD CONSTRAINT `InventoryFeature_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryFeature` ADD CONSTRAINT `InventoryFeature_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryFeature` ADD CONSTRAINT `InventoryFeature_amenity_id_fkey` FOREIGN KEY (`amenity_id`) REFERENCES `Amenity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMedia` ADD CONSTRAINT `ProjectMedia_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMedia` ADD CONSTRAINT `ProjectMedia_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectDocument` ADD CONSTRAINT `ProjectDocument_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectDocument` ADD CONSTRAINT `ProjectDocument_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectUnitImage` ADD CONSTRAINT `ProjectUnitImage_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectUnitImage` ADD CONSTRAINT `ProjectUnitImage_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectUnitDocument` ADD CONSTRAINT `ProjectUnitDocument_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectUnitDocument` ADD CONSTRAINT `ProjectUnitDocument_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteAccount` ADD CONSTRAINT `WebsiteAccount_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteShortlistItem` ADD CONSTRAINT `WebsiteShortlistItem_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `WebsiteAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteShortlistItem` ADD CONSTRAINT `WebsiteShortlistItem_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteShortlistItem` ADD CONSTRAINT `WebsiteShortlistItem_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteCompareItem` ADD CONSTRAINT `WebsiteCompareItem_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `WebsiteAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteCompareItem` ADD CONSTRAINT `WebsiteCompareItem_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteCompareItem` ADD CONSTRAINT `WebsiteCompareItem_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteActivityEvent` ADD CONSTRAINT `WebsiteActivityEvent_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteActivityEvent` ADD CONSTRAINT `WebsiteActivityEvent_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `WebsiteAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectLayoutImage` ADD CONSTRAINT `ProjectLayoutImage_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectLayoutImage` ADD CONSTRAINT `ProjectLayoutImage_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyLayoutRegion` ADD CONSTRAINT `PropertyLayoutRegion_layout_image_id_fkey` FOREIGN KEY (`layout_image_id`) REFERENCES `ProjectLayoutImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyLayoutRegion` ADD CONSTRAINT `PropertyLayoutRegion_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyLayoutRegion` ADD CONSTRAINT `PropertyLayoutRegion_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyLayoutRegion` ADD CONSTRAINT `PropertyLayoutRegion_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitBooking` ADD CONSTRAINT `SiteVisitBooking_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisitProperty` ADD CONSTRAINT `SiteVisitProperty_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_form_submitted_by_id_fkey` FOREIGN KEY (`form_submitted_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_md_approved_by_id_fkey` FOREIGN KEY (`md_approved_by_id`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opportunity` ADD CONSTRAINT `Opportunity_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DemoInterestedProperty` ADD CONSTRAINT `DemoInterestedProperty_project_unit_id_fkey` FOREIGN KEY (`project_unit_id`) REFERENCES `ProjectUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyVillaDetails` ADD CONSTRAINT `PropertyVillaDetails_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyHouseDetails` ADD CONSTRAINT `PropertyHouseDetails_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyCommercialShopDetails` ADD CONSTRAINT `PropertyCommercialShopDetails_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyCommercialOfficeDetails` ADD CONSTRAINT `PropertyCommercialOfficeDetails_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyFarmLandDetails` ADD CONSTRAINT `PropertyFarmLandDetails_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

