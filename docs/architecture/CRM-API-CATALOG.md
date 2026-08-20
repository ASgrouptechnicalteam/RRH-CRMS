# CRM-API-CATALOG

> Complete inventory of HTTP endpoints, verified from `apps/api/src/routes/*` and
> `apps/api/src/server.ts`. Prefix is **`/api/v1`** unless noted. Auth legend:
> 🔑 `authenticateToken` (employee JWT) · 🔐 service token · 🅰️ public API key ·
> (none) public.

## 1. Authentication APIs (`/api/v1/auth`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| POST | `/auth/login` | none | — | Login (rate-limited), issues access + refresh |
| GET | `/auth/me` | 🔑 | — | Current profile/permissions |
| POST | `/auth/refresh` | cookie | — | Rotate refresh token, return new access token |
| POST | `/auth/logout` | cookie | — | Revoke refresh family |

**Health**: `GET /api/v1/health` (none).

## 2. Employees (`/api/v1/employees`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/employees` | 🔑 | EMPLOYEES_READ | List (sensitive fields filtered unless EMPLOYEES_VIEW_SENSITIVE) |
| GET | `/employees/branches` | 🔑 | — | Branch dropdown |
| GET | `/employees/managers` | 🔑 | — | Manager list |
| POST | `/employees` | 🔑 | EMPLOYEES_CREATE | Create employee |
| PATCH | `/employees/:id` | 🔑 | EMPLOYEES_UPDATE | Update (role/salary/status/branch; notifies) |
| POST | `/employees/:id/reset-password` | 🔑 | EMPLOYEES_RESET_PASSWORD | Admin 1-click password reset |

## 3. MD / Executive (`/api/v1/md`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/md/employees` | 🔑 | EMPLOYEES_READ | MD employee list (Admin filtered) |
| PATCH | `/md/employees/:id/attendance-requirement` | 🔑 | EMPLOYEES_UPDATE | Toggle attendance requirement (audited) |
| GET | `/md/executive-metrics` | 🔑 | ADMIN_SYSTEM_METRICS | MD executive KPIs (delegates to AnalyticsService) |

## 4. Leads (`/api/v1/leads`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/leads` | 🔑 | LEADS_READ | Role/company-aware list |
| GET | `/leads/distribution-monitor` | 🔑 | LEADS_DISTRIBUTION_MONITOR | Telecaller load & intake monitor |
| POST | `/leads` | 🔑 | LEADS_CREATE | Create lead (auto-assign) |
| POST | `/leads/bulk-upload` | 🔑 | LEADS_BULK_UPLOAD | Bulk import + auto-distribute |
| POST | `/leads/:id/assign` | 🔑 | LEADS_ASSIGN | Manual reassignment (audited) |
| PATCH | `/leads/:id/status` | 🔑 | LEADS_UPDATE | Status transition + notes |
| PATCH | `/leads/:id` | 🔑 | LEADS_UPDATE | Update lead |
| POST | `/leads/:id/convert-to-customer` | 🔑 | CUSTOMERS_CONVERT | Convert to customer |
| GET | `/leads/:id/matches` | 🔑 | (auth) | Deterministic property matches |
| GET | `/leads/:id/opportunities` | 🔑 | LEADS_READ | Related opportunities |
| GET | `/leads/:id/properties` | 🔑 | LEADS_READ | Property interests |
| POST | `/leads/:id/properties` | 🔑 | LEADS_UPDATE | Add property interest |
| DELETE | `/leads/:id/properties/:propertyId` | 🔑 | LEADS_UPDATE | Remove property interest |
| POST | `/leads/:id/whatsapp-proposal/:propertyId` | 🔑 | LEADS_UPDATE | Generate WhatsApp proposal |
| GET | `/leads/:id/tasks` | 🔑 | LEADS_READ | Lead tasks |

## 5. Customers (`/api/v1/customers`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/customers` | 🔑 | CUSTOMERS_READ | List (scoped) |
| GET | `/customers/:id` | 🔑 | CUSTOMERS_READ | Detail |
| POST | `/customers` | 🔑 | CUSTOMERS_CREATE | Create |
| PATCH | `/customers/:id` | 🔑 | CUSTOMERS_UPDATE | Update |
| PUT | `/customers/:id/kyc` | 🔑 | CUSTOMERS_KYC_WRITE | Write encrypted KYC |

## 6. Properties (`/api/v1/properties`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/properties` | 🔑 | PROPERTIES_READ | List (brand/status/project filters) |
| POST | `/properties` | 🔑 | PROPERTIES_CREATE | Create → PENDING_VERIFICATION |
| PUT | `/properties/:id` | 🔑 | PROPERTIES_UPDATE | Update |
| POST | `/properties/:id/verify` | 🔑 | PROPERTIES_VERIFY | PM on-site verification |
| POST | `/properties/:id/dm-polish` | 🔑 | PROPERTIES_DM_POLISH | DM polish |
| POST | `/properties/:id/md-approve` | 🔑 | PROPERTIES_MD_APPROVE | MD approval → LIVE |
| POST | `/properties/:id/publications` | 🔑 | PROPERTIES_UPDATE | Publish/unpublish |
| GET | `/properties/:id/publications` | 🔑 | PROPERTIES_READ | Publication status |
| POST | `/properties/:id/images` | 🔑 | PROPERTIES_UPDATE | Upload image (multer) |
| PUT | `/properties/:id/images/:imageId` | 🔑 | PROPERTIES_UPDATE | Update image |
| DELETE | `/properties/:id/images/:imageId` | 🔑 | PROPERTIES_UPDATE | Delete image |
| POST | `/properties/:id/images/:imageId/approve` | 🔑 | PROPERTIES_DM_POLISH | Approve image |
| POST | `/properties/:id/images/:imageId/reject` | 🔑 | PROPERTIES_DM_POLISH | Reject image |

## 7. Projects (`/api/v1/projects`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/projects` | 🔑 | PROJECTS_READ | List |
| GET | `/projects/:id` | 🔑 | (auth) | Detail |
| POST | `/projects` | 🔑 | PROJECTS_CREATE | Create |
| PUT | `/projects/:id` | 🔑 | PROJECTS_UPDATE | Update (scoped getResource) |
| DELETE | `/projects/:id` | 🔑 | PROJECTS_DELETE | Delete (scoped getResource) |

## 8. Opportunities (`/api/v1/opportunities`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| POST | `/opportunities` | 🔑 | LEADS_UPDATE | Create from lead |
| GET | `/opportunities` | 🔑 | LEADS_READ | List + filters |
| GET | `/opportunities/pipeline-metrics` | 🔑 | LEADS_READ | Pipeline KPIs |
| GET | `/opportunities/conversion-metrics` | 🔑 | LEADS_READ | Conversion KPIs |
| GET | `/opportunities/:id` | 🔑 | LEADS_READ | Dossier |
| GET | `/opportunities/:id/history` | 🔑 | LEADS_READ | Stage history |
| PATCH | `/opportunities/:id` | 🔑 | LEADS_UPDATE | Update |
| PATCH | `/opportunities/:id/stage` | 🔑 | LEADS_UPDATE | Stage transition (+drop_reason) |
| POST | `/opportunities/:id/convert-to-booking` | 🔑 | LEADS_UPDATE | Convert to booking |

## 9. Site Visits (`/api/v1/site-visits`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/site-visits` | 🔑 | SITE_VISITS_READ | List |
| POST | `/site-visits` | 🔑 | SITE_VISITS_CREATE | Book visit |
| POST | `/site-visits/:id/verify` | 🔑 | SITE_VISITS_VERIFY | Verify/confirm |
| POST | `/site-visits/:id/assign-agent` | 🔑 | SITE_VISITS_ASSIGN_AGENT | Assign field agent |
| POST | `/site-visits/:id/complete` | 🔑 | SITE_VISITS_COMPLETE | Complete + feedback |

## 10. Bookings / Payments / Installments

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/bookings` | 🔑 | BOOKINGS_READ | List |
| GET | `/bookings/:id` | 🔑 | BOOKINGS_READ | Detail |
| GET | `/bookings/:id/handoff-status` | 🔑 | BOOKINGS_READ | Portal handoff status |
| POST | `/bookings` | 🔑 | BOOKINGS_CREATE | Create (locks property) |
| POST | `/bookings/:id/confirm` | 🔑 | BOOKINGS_CONFIRM | Confirm |
| POST | `/bookings/:id/cancel` | 🔑 | BOOKINGS_CANCEL | Cancel (release lock) |
| PUT | `/bookings/:id/status` | 🔑 | BOOKINGS_UPDATE | Facade status update |
| GET | `/payments` | 🔑 | PAYMENTS_READ | List (by booking) |
| POST | `/payments` | 🔑 | PAYMENTS_CREATE | Record payment |
| PUT | `/payments/:id/status` | 🔑 | PAYMENTS_UPDATE | Verify (SUCCESS/FAILED/REFUNDED) |
| GET | `/installments?booking_id=` | 🔑 | BOOKINGS_READ | Installment schedule |
| POST | `/installments` | 🔑 | PAYMENTS_CREATE | Create installment |

## 11. Documents / Complaints / Expense Refunds

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/documents` | 🔑 | DOCUMENTS_READ | List (entity filters) |
| GET | `/documents/:id` | 🔑 | DOCUMENTS_READ | Detail |
| GET | `/documents/:id/download` | 🔑 | DOCUMENTS_READ | Download file |
| POST | `/documents` | 🔑 | DOCUMENTS_CREATE | Upload (≤10MB) |
| PATCH | `/documents/:id/verify` | 🔑 | DOCUMENTS_VERIFY | Verify document |
| PATCH | `/documents/:id/archive` | 🔑 | DOCUMENTS_DELETE | Soft delete |
| PATCH | `/documents/:id/restore` | 🔑 | DOCUMENTS_DELETE | Restore |
| GET | `/complaints` | 🔑 | COMPLAINTS_READ | List |
| GET | `/complaints/:id` | 🔑 | COMPLAINTS_READ | Detail |
| POST | `/complaints` | 🔑 | COMPLAINTS_CREATE | Create |
| PATCH | `/complaints/:id` | 🔑 | COMPLAINTS_UPDATE | Update |
| PATCH | `/complaints/:id/status` | 🔑 | COMPLAINTS_UPDATE | Status change |
| PATCH | `/complaints/:id/assign` | 🔑 | COMPLAINTS_ASSIGN | Assign |
| PATCH | `/complaints/:id/resolve` | 🔑 | COMPLAINTS_RESOLVE | Resolve |
| PATCH | `/complaints/:id/close` | 🔑 | COMPLAINTS_CLOSE | Close |
| GET | `/expense-refunds/my` | 🔑 | EXPENSES_READ_OWN | My refunds |
| GET | `/expense-refunds/queue` | 🔑 | EXPENSES_REVIEW \| EXPENSES_MD_APPROVE | Review queue |
| POST | `/expense-refunds` | 🔑 | EXPENSES_CREATE | Submit (proof ≤5MB) |
| PATCH | `/expense-refunds/:id/accountant-review` | 🔑 | EXPENSES_REVIEW | Accountant review |
| PATCH | `/expense-refunds/:id/md-review` | 🔑 | EXPENSES_MD_APPROVE | MD review |
| PATCH | `/expense-refunds/:id/mark-refunded` | 🔑 | EXPENSES_MARK_REFUNDED | Mark refunded |
| GET | `/expense-refunds/:id/proof` | 🔑 | EXPENSES_READ_OWN | Proof file |

## 12. Tasks / Attendance / Reports / Targets / Notifications / Performance / Announcement / Push

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/tasks/my-tasks` | 🔑 | — | Own tasks (auto-overdue) |
| GET | `/tasks/all-team-tasks` | 🔑 | REPORTS_READ_TEAM | Team tasks + overdue alerts |
| POST | `/tasks` | 🔑 | — | Create task |
| GET | `/tasks/:id/sla` | 🔑 | — | Derived SLA status |
| PATCH | `/tasks/:id/status` | 🔑 | TASKS_UPDATE | Update status (completion bonus) |
| GET | `/attendance/my-qr` | 🔑 | — | HMAC QR payload |
| GET | `/attendance/my-status` | 🔑 | — | Today's check-in status |
| POST | `/attendance/scan` | 🔑 | — | Verify QR + stamp (IST) |
| POST | `/attendance/late-proposal` | 🔑 | — | Submit late proposal |
| GET | `/attendance/proposals/queue` | 🔑 | HR_MANAGER/MD role | HR approval queue |
| GET | `/attendance/live` | 🔑 | HR/MD/ADMIN role | Live attendance feed |
| POST | `/reports/daily` | 🔑 | — | Submit daily report |
| GET | `/reports/today-status` | 🔑 | — | Today status |
| GET | `/targets/presets` | 🔑 | — | Target presets |
| GET | `/targets/my-target` | 🔑 | — | My target |
| GET | `/targets/all` | 🔑 | — | All targets |
| POST | `/targets` | 🔑 | REPORTS_TARGETS_CONFIGURE | Configure target |
| GET | `/notifications` | 🔑 | — | In-app notifications |
| PATCH | `/notifications/:id/read` | 🔑 | — | Mark read |
| GET | `/performance/my-score` | 🔑 | — | My score |
| GET | `/performance/history` | 🔑 | — | Score history |
| GET | `/performance/leaderboard` | 🔑 | PERFORMANCE_READ_TEAM | Leaderboard |
| GET | `/performance/team` | 🔑 | — | Team scores |
| POST | `/performance/reset-score-history` | 🔑 | — | Reset history |
| GET | `/announcement` | 🔑 | — | Active announcement |
| POST | `/announcement` | 🔑 | — | Update announcement |
| GET | `/push/vapid-public-key` | none | — | VAPID public key |
| POST | `/push/subscribe` | 🔑 | — | Subscribe push |
| DELETE | `/push/unsubscribe` | 🔑 | — | Unsubscribe push |


## 13. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/notifications` | 🔑 | — | In-app notifications (recent) |
| PATCH | `/notifications/:id/read` | 🔑 | — | Mark read |

> Notifications drive status change emails, SMS, push, and in-app `CustomerNotification`s
> (`LEAD_ASSIGNED`, `TASK_COMPLETED`, `PAYMENT_STATUS_CHANGED`, etc.). Templates are
> defined in `templates/`; dispatch in `notifications.service.ts`.

## 14. Integration callbacks (`/api/v1/integration`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| POST | `/integration/portal/payment-callback` | 🔐 | — | Portal reports payment completion/failure |
| POST | `/integration/portal/kyc-callback` | 🔐 | — | Portal reports KYC submission |
| POST | `/integration/portal/booking-callback` | 🔐 | — | Portal reports booking status |

> Callback payloads carry `event`, `booking_reference`/`payment_reference`/`customer_id`,
> `status`, `timestamp`, and `signature` (HMAC). Service-token auth; idempotent upsert.

## 15. Public website routes (`/public`)

> Mount: `/public` (no version). No authentication. Rate-limited via `publicApiLimiter`.

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/public/:brand/properties` | 🅰️ key | — | Property listings (published, LIVE) |
| GET | `/public/:brand/leads` | POST only | none | Lead capture (lead form) |
| POST | `/public/:brand/leads` | 🅰️ key | none | Create public lead |
| POST | `/public/:brand/leads/:leadId/whatsapp-otp` | 🅰️ key | none | WhatsApp OTP |
| POST | `/public/:brand/leads/:leadId/whatsapp-verify` | 🅰️ key | none | WhatsApp verify |
| POST | `/public/:brand/leads/:leadId/whatsapp-proposal` | 🅰️ key | none | Generate proposal |
| POST | `/public/:brand/leads/:leadId/whatsapp-proposal/:propertyId` | POST | none | Proposal for property |
| GET | `/public/:brand/properties/:propertyId` | 🅰️ key | none | Property detail |
| GET | `/public/:brand/properties/:propertyId/images/:imageId` | 🅰️ key | none | Property image |
| GET | `/public/:brand/projects` | 🅰️ key | none | Projects list |
| GET | `/public/:brand/projects/:projectId` | 🅰️ key | none | Project detail |
| GET | `/public/:brand/projects/:projectId/property-counts` | 🅰️ key | none | Property-counts by status |

## 16. Analytics (`/api/v1/analytics`) — 🔑

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|------------|---------|
| GET | `/analytics/kpis` | 🔑 | ADMIN_SYSTEM_METRICS | Unified company-isolated KPI dashboard |

> KPI sources: `DailyReport`, `DailyTarget`, `PerformanceSnapshot`, `AuditEvent`, and
> aggregates over `Lead`/`Opportunity`/`Booking`/`Payment` in `analytics.service.ts`.

## 17. AI APIs

> 🔴 **NO AI HTTP endpoint is mounted** (`server.ts` mounts no AI router). The Phase 17-A
> `SearchIntentService` is exercised **only by unit tests**
> (`tests/api/phase17a-ai-foundation.test.ts`). A structured-search endpoint (WR-7) is
> **NOT IMPLEMENTED**. See [CRM-AI-ARCHITECTURE](CRM-AI-ARCHITECTURE.md) for the intended
> design (which keeps AI to interpretation only).

