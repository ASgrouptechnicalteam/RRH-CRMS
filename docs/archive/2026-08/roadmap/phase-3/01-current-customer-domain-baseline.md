# Current Customer Domain Baseline

## What Already Exists
- **Lead Architecture**: The `Lead` model is fully implemented and acts as the entry point for all CRM sales activity. It includes `lead_code`, `status`, `source`, assignment details, property preferences, and related entities like `LeadActivity`, `LeadPropertyInterest`, `LeadMatchingRequirement`, and `LeadProtectionLock`. The Lead's lifecycle includes statuses like `NEW`, `ASSIGNED`, `CONTACTED`, `QUALIFIED`, `SITE_VISIT_SCHEDULED`, `NEGOTIATION`, `WON`, `LOST`, `RECOVERED_TO_POOL`.
- **Authorization Architecture**: Phase 2 introduced a mature Role-Based Access Control (RBAC) integrated with Tenant Isolation (`company_id`). It uses `Permissions` mapped to `Roles` through `RolePermissionsMatrix`, and scopes data access dynamically via policies like `buildLeadScope`. The `authz` and `policies` folders handle security rules.
- **Frontend Architecture**: Frontend pages exist for Leads (`LeadList`, `LeadDetail`), built on standard API routing and React patterns.
- **Testing Architecture**: High coverage API integration tests are available. The suite uses a deterministic fixture setup (`tests/fixtures/testUsers.ts`) creating a controlled set of users across different companies, enabling exact assertions of cross-tenant violations.

## What Does Not Exist
- **Customer Entity**: There is no dedicated `Customer` model or table in Prisma. 
- **Customer Permissions**: The permission constants do not include `CUSTOMERS_CREATE`, `CUSTOMERS_READ`, etc.
- **Lead to Customer Conversion**: No endpoints or logic exists to seamlessly convert a Lead to a Customer while preserving the Lead history.

## Discrepancies between Phase 3 Request and Reality
- The Phase 3 instructions aligned perfectly with the repository's current state. No conflicts detected. The schema uses `snake_case`, ID strategy uses integer `autoincrement`, tenant scoping uses `company_id`, ownership uses `assigned_to_id`, etc.
