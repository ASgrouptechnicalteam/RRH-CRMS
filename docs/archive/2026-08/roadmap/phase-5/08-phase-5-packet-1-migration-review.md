# Phase 5 Packet 1: Migration Review

## 1. Migration Problem
The Phase 5 database foundation requires a new `Project` table and a `project_id` reference on the existing `Property` table. However, generating the standard Prisma migration file failed. 

## 2. Why `migrate dev` Failed
`npx prisma migrate dev` requires creating a temporary "shadow database" to detect schema drift and automatically generate the `.sql` migration file. The shared MySQL hosting environment (`u988844918_crms` on `82.25.121.145`) denies the `CREATE DATABASE` privilege for security reasons (Error `P3014` / `P1010`). This is a known restriction in managed/shared hosting environments. To ensure safety, we must bypass automatic generation and manually construct the additive SQL migration.

## 3. Exact Schema Changes
**Added Model**:
```prisma
model Project {
  id               Int       @id @default(autoincrement())
  project_code     String    @unique
  company_id       Int
  branch_id        Int?
  name             String
  description      String?   @db.Text
  location         String
  total_area       String?
  launch_date      DateTime?
  status           String    @default("PLANNING")
  amenities        Json?
  assigned_pm_id   Int?
  
  company          Company   @relation(fields: [company_id], references: [id])
  branch           Branch?   @relation(fields: [branch_id], references: [id])
  assigned_pm      Employee? @relation("AssignedPMProjects", fields: [assigned_pm_id], references: [id])
  
  properties       Property[]
  
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt

  @@index([company_id])
  @@index([branch_id])
  @@index([assigned_pm_id])
}
```

**Modified Model** (`Property`):
```prisma
  // Added fields
  project_id        Int?
  project           Project? @relation(fields: [project_id], references: [id])

  // Added index
  @@index([project_id])
```

## 4. Proposed SQL Operations
Because Prisma generates standard MySQL schemas, the exact equivalent raw SQL is:

```sql
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
```

## 5. Data-Safety Analysis
- **Additive Only**: The migration introduces 1 new table (`Project`) and 1 new nullable column (`Property.project_id`).
- **No Deletions**: No columns, tables, or records are dropped or modified.
- **Existing Property Records**: By default, `project_id` will be `NULL`. This perfectly matches the architecture for "Standalone Properties." All existing properties will default to standalone, maintaining absolute backwards compatibility.
- **Existing Bookings**: `Booking.property_id` remains entirely unchanged.
- **Existing Site Visits**: `SiteVisitBooking.property_id` remains entirely unchanged.
- **Lead Matching Engine**: Unchanged.
- **Customer & Payment**: Unchanged.

## 6. Rollback Considerations
If rollback is necessary, the changes are easily reversible without data loss to any pre-existing records:
```sql
ALTER TABLE `Property` DROP FOREIGN KEY `Property_project_id_fkey`;
DROP INDEX `Property_project_id_idx` ON `Property`;
ALTER TABLE `Property` DROP COLUMN `project_id`;
DROP TABLE `Project`;
```

## 7. Production Application Procedure
Because Prisma cannot `migrate dev`, the procedure to deploy is:
1. Do **NOT** use `npx prisma db push` directly on production without explicit authorization, as it is dangerous to run uncontrolled synchronization on live databases.
2. We must manually create the `prisma/migrations/20260812XXXXXX_phase5_project_foundation/migration.sql` file containing the SQL from section 4.
3. Then deploy using `npx prisma migrate resolve --applied 20260812XXXXXX_phase5_project_foundation` to mark the migration as complete in the Prisma migration history table, OR let the CI pipeline apply the raw SQL to the database manually.

## 9. Final Compatibility Verification

- **Existing DB compatibility:** The target database utilizes `INTEGER` for auto-incrementing primary keys and `VARCHAR(191)` for strings to ensure compatibility with MySQL max index lengths. The proposed SQL adheres exactly to these conventions.
- **Foreign-key compatibility:** `Company.id`, `Branch.id`, `Employee.id`, and `Property.id` are all `INTEGER NOT NULL`. The foreign keys (`company_id`, `branch_id`, `assigned_pm_id`, `project_id`) use identical `INTEGER` typing.
- **Index compatibility:** Prisma creates standard `INDEX TableName_columnName_idx(columnName)` names. The SQL uses `Project_company_id_idx`, `Property_project_id_idx` identically to how Prisma native migrations do it.
- **Charset/collation compatibility:** `DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` is identical to the baseline migration file.
- **Timestamp compatibility:** `DATETIME(3)` is the standard Prisma convention for mapping to MySQL timestamps with fractional seconds. The SQL exactly mimics `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)`.
- **Data preservation analysis:** Adding `project_id INTEGER NULL` to `Property` guarantees that every existing property record remains valid, undisturbed, and implicitly isolated as a "Standalone Property." `Booking.property_id` and all other related models are entirely untouched. No existing relationships are impacted.
- **Exact SQL changes required:** Verified as perfectly matching Prisma MySQL behaviors.
- **Production application procedure:** Create a manual migration folder. Do NOT use `db push` on the production database.

**FINAL VERDICT:** SAFE TO APPLY
