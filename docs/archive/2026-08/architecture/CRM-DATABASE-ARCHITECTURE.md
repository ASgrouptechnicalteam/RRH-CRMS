# CRM-DATABASE-ARCHITECTURE

> Prisma/MySQL architecture for RRH-CRMS, verified against `prisma/schema.prisma`
> (MySQL provider, `DATABASE_URL`). The schema is the source of truth.

## 1. Provider & conventions

- **Provider**: MySQL. **Generator**: `prisma-client-js`.
- **Naming**: snake_case columns, relation names in camelCase; soft deletes via
  `deleted_at` on Company/Branch/Employee/Document; `created_at`/`updated_at` on most
  models; `@@index` on foreign keys; `@@unique` for business codes.
- **Lifecycle statuses are stored as `String` with a documented enum comment** (no native
  MySQL ENUM) — see [CRM-FEATURE-INVENTORY](CRM-FEATURE-INVENTORY.md#2-status-enums-verified).
- **Channel Partner domain (verified excised)**: the only `channel partner` string in all
  20+ migration `.sql` files is (a) table creation in `phase5_commercial_foundation` and
  (b) its removal in `phase10_packet1b_remove_channel_partner_domain`.
  `prisma/schema.prisma` contains **no** `ChannelPartner` model or relation — the domain
  is fully excised from the active schema. No residual CP artifacts remain in source.

## 2. Active models (major) — purpose, relations, lifecycle, domain

| Model | Purpose | Key relations | Lifecycle | Domain |
|-------|---------|---------------|-----------|--------|
| `Company` | Tenant (brand group RADHA_REAL_HOMES/SONTHILLU) | branches, employees, leads, opportunities, customers, properties, projects, bookings, payments, documents, complaints, portal/public tables | active/deleted_at | Tenancy |
| `Branch` | Company sub-location | company, employees, leads, opportunities, customers, properties, projects, bookings, documents | active/deleted_at | Tenancy |
| `Employee` | Internal user | company, branch, roles, manager/direct_reports, assigned/created leads & properties & customers & tasks & bookings & opportunities & payments & installments & documents, auth_sessions, push_subscriptions, complaints | status ACTIVE/INACTIVE/SUSPENDED | Identity/HR |
| `Role` | RBAC role | RolePermission, EmployeeRole | is_system, is_invisible | RBAC |
| `Permission` | RBAC permission string | RolePermission, EmployeePermissionOverride | — | RBAC |
| `EmployeePermissionOverride` | per-employee grant/deny | employee, permission | is_granted | RBAC |
| `AttendanceLog` / `AttendanceProposal` | QR attendance + late/leave proposals | employee | PRESENT/LATE/HALF_DAY/ABSENT/APPROVED_LATE; PENDING/APPROVED/REJECTED | HR |
| `Task` | Follow-up / ops tasks | assignee, lead, opportunity | PENDING/IN_PROGRESS/COMPLETED/OVERDUE | Ops/SLA |
| `DailyReport` / `DailyTarget` | Reporting + target config | employee / company+role | — | Reporting |
| `AuditEvent` | Immutable audit trail | actor | — | Audit |
| `Notification` / `PushSubscription` | Employee in-app + web-push | employee | is_read | Notification |
| `PerformanceSnapshot` | Performance score | employee | score 50.0 base | Performance |

| `Opportunity` | Pipeline deal | company, branch, lead, project, property, booking, owner, site_visits, tasks, history | stage enum (10) | Sales |
| `OpportunityHistory` | Stage transition log | opportunity, changed_by | — | Sales |
| `Project` | Development project | company, branch, assigned_pm, properties, opportunities, documents, leads | PLANNING/UNDER_CONSTRUCTION/COMPLETED/CANCELLED | Inventory |
| `Property` | Inventory unit | company, branch, project, assigned_pm, created_by, images, publications, verification_logs, interested_leads, site_visits, bookings, opportunities, documents, complaints, locked_by_booking | PENDING_VERIFICATION…LIVE/REJECTED/LOCKED/BOOKED/SOLD | Inventory |
| `PropertyImage` / `PropertyPublication` / `PropertyVerificationLog` | media / public publication / status audit | property | image PENDING/APPROVED/REJECTED | Inventory |
| `SiteVisitBooking` | Site visit | lead, opportunity, property, telecaller, project_manager, assigned_agent | PENDING_VERIFICATION…CANCELLED | Sales |
| `Booking` | Sales booking | company, branch, customer, property, assigned_employee, payments, installments, opportunity, locked_property, documents, complaints | INITIATED/PENDING/TOKEN_RECEIVED/CONFIRMED/REGISTERED/COMPLETED/CANCELLED | Commercial |
| `Payment` | Payment record | company, booking, installment, recorded_by, documents | PENDING/SUCCESS/FAILED/REFUNDED; source CRM/PORTAL; sync_status | Commercial |
| `Installment` | Payment schedule | booking, recorded_by, payments | PENDING/PARTIALLY_RECEIVED/RECEIVED/OVERDUE/CANCELLED | Collections |
| `Customer` | Customer master | company, branch, assigned_to, origin_lead, bookings, documents, notifications, complaints | ACTIVE/INACTIVE/BLACKLISTED | Customer/KYC |
| `Document` | File metadata | company, branch, customer/lead/opportunity/booking/property/project/payment, uploaded_by, verified_by, deleted_by | ACTIVE; verification PENDING | Documents/KYC |
| `ExpenseRefund` | Petty-cash reimbursement | employee, accountant, md, refunded_by | PENDING→…→REFUNDED | Finance |
| `Complaint` | Customer complaint | company, customer, booking, property, assigned_employee | OPEN/IN_PROGRESS/RESOLVED/CLOSED/REOPENED | Support |
| `AuthSession` | Refresh-token family | employee | consumed/revoked | Auth |
| `BookingPortalMapping` | Booking → customer-portal link | company | handoff_status CREATED…ACTIVE/FAILED | Portal |
| `IntegrationEvent` | Outbox event to portal | company | CREATED/PENDING/PROCESSING/COMPLETED/FAILED | Portal |
| `CustomerNotification` | Customer-scoped notifications (read-only to portal) | company, customer | is_read | Portal |
| `PublicApiKey` | Public website auth | company | is_active | Public |

## 3. High-level relationship map (verified in Prisma)

```text
Company
 ├── Branch
 │    └── Employee ── Role ── Permission
 │              ├── AuthSession / PushSubscription / AttendanceLog / PerformanceSnapshot / DailyReport
 │              ├── Lead ── LeadActivity / LeadMatchingRequirement / LeadPropertyInterest → Property
 │              ├── Opportunity ── OpportunityHistory ── SiteVisitBooking
 │              └── ExpenseRefund / Complaint (assigned/resolved)
 ├── Project ── Property ── PropertyImage / PropertyPublication / PropertyVerificationLog
 │                  │
 ├── Lead ── Opportunity ── Booking ── Payment / Installment / BookingPortalMapping / IntegrationEvent
 ├── Customer ── Booking / Document / CustomerNotification / Complaint
 ├── Document (→ customer/lead/opportunity/booking/property/project/payment)
 ├── BookingPortalMapping / IntegrationEvent / PublicApiKey / CustomerNotification
 └── DailyTarget
```

> All tenant tables carry a `company_id` foreign key. Cross-company access is denied by the
> `can()` engine unless ADMIN (see [CRM-SECURITY-ARCHITECTURE](CRM-SECURITY-ARCHITECTURE.md)).

| `Lead` | Sales enquiry | company, branch, assigned_to, created_by, project, activities, matching_requirement, site_visits, property_interests, converted_customer, follow_up_tasks, opportunities | NEW…WON/LOST/RECOVERED_TO_POOL | Sales |
| `LeadActivity` | Lead event history | lead, actor | — | Sales |
| `LeadMatchingRequirement` | Structured lead requirement | lead | is_active | Matching |
| `LeadPropertyInterest` | Lead ↔ property interest | lead, property, creator | is_active | Sales |
