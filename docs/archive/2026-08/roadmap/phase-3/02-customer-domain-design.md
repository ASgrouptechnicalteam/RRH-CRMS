# Customer Domain Design

Based on the actual schema conventions and Phase 3 requirements, the `Customer` entity is designed as follows:

## Prisma Model Definition

```prisma
model Customer {
  id               Int       @id @default(autoincrement())
  customer_code    String    @unique
  company_id       Int
  branch_id        Int?
  
  first_name       String
  last_name        String?
  phone            String
  email            String?
  
  status           String    @default("ACTIVE") // ACTIVE, INACTIVE, BLACKLISTED
  source           String    @default("MANUAL_ENTRY")
  
  assigned_to_id   Int?      // Employee who owns the customer relationship
  origin_lead_id   Int?      @unique // Which lead created this customer (1:1)
  
  company          Company   @relation(fields: [company_id], references: [id])
  branch           Branch?   @relation(fields: [branch_id], references: [id])
  assigned_to      Employee? @relation("AssignedCustomers", fields: [assigned_to_id], references: [id])
  origin_lead      Lead?     @relation(fields: [origin_lead_id], references: [id])
  
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt
  
  @@index([company_id])
  @@index([branch_id])
  @@index([assigned_to_id])
}
```

## Explanation
- **Naming Conventions**: Uses `snake_case` (e.g. `customer_code`, `company_id`) matching the repository's database schema.
- **Tenant Scope**: `company_id` forms the fundamental tenant barrier. All operations on Customers will scope to the authenticated user's `company_id`.
- **Ownership Scope**: `assigned_to_id` assigns ownership (typically to a Field Agent, Telecaller, or PM). Modification permissions are checked against this field.
- **Identity Uniqueness**: To avoid aggressive uniqueness constraints, `phone` and `email` are not explicitly constrained via `@@unique` against `company_id`. Soft duplicate checks will run in the API. `customer_code` and `origin_lead_id` are natively enforced uniquely via the DB constraints.
- **Lead Reference**: `origin_lead_id` preserves the historical path.
- **Timestamps**: Uses standard `created_at` and `updated_at`.
