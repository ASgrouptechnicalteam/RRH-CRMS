# CRM-WORKFLOWS

> Detailed, source-verified end-to-end workflows. Every flow lists **responsible role**,
> **API**, **database domain**, **authorization**, **status transitions**, and **business
> rules** as implemented. Only workflows present in the repository are included.

## 1. Authentication workflow

```text
Login (POST /api/v1/auth/login)
   ↓ employee_code + password (Zod LoginSchema) + loginRateLimiter
   ↓ find active Employee (roles + permissions + overrides)
   ↓ bcrypt.compare(password_hash)
   ↓ build TokenPayload { employeeId, employeeCode, companyId, branchId, roles[], permissions[] }
   ↓ generateAccessToken (JWT) + generateRefreshToken
   ↓ AuthSession create (family_token + sha256 refresh_token_hash, 7-day expiry)
   ↓ set httpOnly refresh cookie + return accessToken
   ↓ subsequent requests: Authorization: Bearer <access> → authenticateToken → req.user
   ↓ on access expiry → TOKEN_EXPIRED → frontend redirects to login
POST /api/v1/auth/refresh  → rotation + AuthSession (reuse → revoke family)
POST /api/v1/auth/logout   → revoke session family
```

- **Responsible role**: any ACTIVE employee.
- **AuthZ**: n/a (unauthenticated endpoint); `/auth/me` requires `authenticateToken`.
- **Business rules (verified)**: inactive/suspended employees rejected; failed login &
  invalid-password attempts write `AuditEvent(action=SECURITY_ALERT)`; refresh-token reuse
  triggers `TOKEN_FAMILY_REVOKED` security alert and revokes the family.

## 2. Lead workflow

```text
Lead creation (POST /api/v1/leads  OR  POST /api/v1/public/:brand/leads)
   ↓ validate LeadCreateSchema / PublicLeadCreateSchema
   ↓ company_id from caller (token / public API key) — never client body
   ↓ source (MANUAL_ENTRY | WEBSITE | ...) + UTM
   ↓ status = NEW
   ↓ assignment (auto performance-weighted / manual override / PM preference) → assigned_to_id
   ↓ LeadActivity: LEAD_CREATED, ASSIGNED_TO_AGENT, ...
   ↓ follow-up (Task creation) + SLA breach field (lead.sla_breach_at)
   ↓ qualification (status QUALIFIED)
   ↓ convert → Customer (POST /leads/:id/convert-to-customer)  [CUSTOMERS_CONVERT]
   ↓ opportunity creation (POST /opportunities)
   ↓ site visit booking / property interest
   ↓ WON / LOST / RECOVERED_TO_POOL
```

- **APIs**: `/leads`, `/leads/:id/convert-to-customer`, `/leads/bulk-upload`,
  `/leads/distribution-monitor`, `/leads/:id/matches`, `/leads/:id/tasks`,
  `/leads/:id/opportunities`, `/leads/:id/whatsapp-proposal/:propertyId`,
  `/leads/:id/properties` (+DELETE).
- **AuthZ**: `LEADS_CREATE/READ/UPDATE/DELETE/ASSIGN/BULK_UPLOAD/DISTRIBUTION_MONITOR`,
  `CUSTOMERS_CONVERT`; ownership/team scope via `buildLeadScope` + `LeadPolicy`.
- **Business rules (verified)**: public website leads have `created_by_id = NULL`;
  `source=WEBSITE`; auto lead-code `RRH-LD-<YEAR>-NNNN`; matching engine computes
  `matchScore` for `GET /leads/:id/matches`.

## 3. Customer workflow

```text
Customer (POST /customers | from lead conversion)
   ↓ Customer.status = ACTIVE
   ↓ assigned_to (owner) — scope: telecallers/agents see own; PM/management see company
   ↓ KYC write (PUT /customers/:id/kyc) — PAN/Aadhaar AES-256-CBC encrypted (crypto utils)
   ↓ kyc_status: PENDING/PARTIAL/VERIFIED/REJECTED (derived from KYC document verification)
   ↓ Portal submission notification (KYC_STATUS_UPDATED) via kyc-callback
   ↓ bookings, payments, installments, documents, complaints linked to customer
```

- **APIs**: `/customers`, `/customers/:id`, `PUT /customers/:id/kyc`.
- **AuthZ**: `CUSTOMERS_CREATE/READ/UPDATE/DELETE/CONVERT`, `CUSTOMERS_KYC_WRITE`
  (via `KycPolicy` — MD/ADMIN/HR/Finance). Company scope via `buildCustomerScope`.
- **Lifecycle enums**: status ACTIVE/INACTIVE/BLACKLISTED.

## 4. Property workflow

```text
Property creation (POST /properties)
   ↓ PropertyCreateSchema; project association (project_id), brand_type, category, price, area, location, structured fields
   ↓ status = PENDING_VERIFICATION; created_by
   ↓ PM on-site verification (POST /properties/:id/verify)  [PROPERTIES_VERIFY]
   ↓ status PENDING_DM_POLISH (+ PropertyVerificationLog)
   ↓ DM polish (POST /properties/:id/dm-polish)  [PROPERTIES_DM_POLISH] (incl. image approve/reject)
   ↓ status PENDING_MD_APPROVAL
   ↓ MD approval (POST /properties/:id/md-approve)  [PROPERTIES_MD_APPROVE]
   ↓ status LIVE (+ publication flag PropertyPublication for public site)
   ↓ booking → LOCKED (locked_by_booking_id, locked_until) → BOOKED → SOLD
   ↓ REJECTED (with reason) available at verify/approve gates
```

- **APIs**: `/properties` GET/POST/PUT, `/:id/verify`, `/:id/dm-polish`, `/:id/md-approve`,
  `/:id/publications`, `/:id/images` (upload/delete/approve/reject). Public: `/public/:brand/properties`.
- **AuthZ**: `PROPERTIES_CREATE/READ/UPDATE/DELETE/VERIFY/DM_POLISH/MD_APPROVE` via
  `PropertyPolicy.canVerify/canDMPolish/canMDApprove`; scope via `buildPropertyScope`
  (PM sees assigned + LIVE; others LIVE only).
- **Business rules (verified)**: GPS lat/long kept internal-only (excluded from public
  allowlist); public site shows only approved images and published properties; SEO slug.

## 5. Site Visit workflow

```text
Book (POST /site-visits) [SITE_VISITS_CREATE] telecaller
   ↓ status = PENDING_VERIFICATION (booking_code auto)
Verify (POST /site-visits/:id/verify) [SITE_VISITS_VERIFY]
   ↓ confirmed ? CONFIRMED : CANCELLED → transferred to Project Manager
Assign agent (POST /site-visits/:id/assign-agent) [SITE_VISITS_ASSIGN_AGENT] PM
   ↓ status = ASSIGNED_TO_AGENT (agent_id, notes)
Complete (POST /site-visits/:id/complete) [SITE_VISITS_COMPLETE] agent
   ↓ feedback_notes, rating, proof_photo_url → status COMPLETED
   ↓ lead.status auto-update: HOT_INTERESTED→QUALIFIED, WARM→NEGOTIATION, else→CONTACTED
```

- **APIs**: `/site-visits` (+ `/:id/verify`, `/:id/assign-agent`, `/:id/complete`).
- **AuthZ**: `SITE_VISITS_CREATE/READ/VERIFY/ASSIGN_AGENT/COMPLETE` via `SiteVisitPolicy`.
- **Domain**: `SiteVisitBooking` (lead, property, opportunity, telecaller/PM/agent).
- **Business rule (verified)**: completing a visit auto-transitions the originating lead.

## 6. Booking workflow

```text
Create (POST /bookings) [BOOKINGS_CREATE]
   ↓ CreateBookingSchema { customer_id, property_id, agreed_price, booking_amount, notes }
   ↓ status = PENDING; property lock set (locked_by_booking_id, locked_until) — concurrency-safe
   ↓ BookingPortalMapping created (handoff_status CREATED) for customer-portal sync
Confirm (POST /bookings/:id/confirm) [BOOKINGS_CONFIRM]
   ↓ status = CONFIRMED; property → BOOKED
Cancel (POST /bookings/:id/cancel) [BOOKINGS_CANCEL]
   ↓ status = CANCELLED; property lock released
Facade status update (PUT /bookings/:id/status) [BOOKINGS_UPDATE]
   ↓ allowed: TOKEN_RECEIVED, CONFIRMED, CANCELLED, COMPLETED
     (verified: `UpdateBookingStatusSchema` `z.enum` in `apps/api/src/routes/booking.routes.ts:20-22`;
      service layer enforces per-transition perms; `BOOKINGS_UPDATE` is the base guard)
Handoff status (GET /bookings/:id/handoff-status) [BOOKINGS_READ]
```

- **APIs**: `/bookings`, `/:id`, `/:id/handoff-status`, `/:id/confirm`, `/:id/cancel`,
  `/:id/status`.
- **AuthZ**: `BOOKINGS_CREATE/READ/UPDATE/CONFIRM/CANCEL`; object scoping in service.
- **Domain**: `Booking`, `BookingPortalMapping`, `IntegrationEvent`.
- **Business rules (verified)**: `booking-concurrency.test.ts` validates lock integrity;
  Portal handoff via `portalClient.ts`/`portalWorker.ts` (disabled by default).

## 7. Payment & Collections workflow

```text
Record payment (POST /payments) [PAYMENTS_CREATE] (finance)
   ↓ RecordPaymentSchema { booking_id, installment_id?, amount, payment_method, reference_number }
   ↓ status = PENDING; source = CRM
Verify (PUT /payments/:id/status) [PAYMENTS_UPDATE]
   ↓ status = SUCCESS | FAILED | REFUNDED (CRM is verification authority)
Installment schedule (GET/POST /installments) [BOOKINGS_READ / PAYMENTS_CREATE]
   ↓ Installment.status: PENDING → PARTIALLY_RECEIVED → RECEIVED | OVERDUE | CANCELLED
Portal sync (POST /integration/portal/payment-callback) [service token]
   ↓ Portal reports completed/failed only; CRM acks PAYMENT_STATUS_CHANGED; payment.sync_status → SYNCED
```

- **APIs**: `/payments`, `/installments`, `/integration/portal/payment-callback`.
- **AuthZ**: `PAYMENTS_CREATE/READ/UPDATE/CANCEL`; installments gated by `PAYMENTS_CREATE`.
- **Domain**: `Payment`, `Installment`, `IntegrationEvent`.
- **Responsibility boundary**: the CRM **records and verifies** payments/installments and is
  the **financial source of truth**. Actual money collection happens via the **external
  portal / payment gateway**, which reports completion back through the service-token
  callback. Collections is **not** a separate CRM module — it is Payments + Installments.

## 8. Document workflow

```text
Upload (POST /documents) [DOCUMENTS_CREATE]  (multer, max 10MB, ext allowlist)
   ↓ DocumentUploadSchema; entity ownership (customer/lead/opportunity/booking/property/project/payment)
   ↓ document_type; status = ACTIVE; verification_status = PENDING; uploaded_by
List/Get (GET /documents, GET /:id, GET /:id/download) [DOCUMENTS_READ]
Verify (PATCH /documents/:id/verify) [DOCUMENTS_VERIFY]  (KYC docs gated by KYC roles)
Archive (PATCH /:id/archive) [DOCUMENTS_DELETE]  (soft delete + reason)
Restore (PATCH /:id/restore) [DOCUMENTS_DELETE]
```

- **Domain**: `Document` (company/branch scoped, entity-links, version optimistic lock).
- **AuthZ**: `DOCUMENTS_*` via `DocumentPolicy` (KYC doc types restricted to
  MD/ADMIN/HR/Finance); storage via `storage.service.ts` (local disk).
- **KYC relationship**: `KYC_PAN`/`KYC_AADHAAR` document types feed customer KYC status.

## 9. KYC workflow

```text
CRM writes customer KYC (PUT /customers/:id/kyc) [CUSTOMERS_KYC_WRITE] (MD/ADMIN/HR/Finance)
   ↓ PAN/Aadhaar encrypted AES-256-CBC at rest (crypto utils) — never exposed
   ↓ kyc_status: PENDING | PARTIAL | VERIFIED | REJECTED; kyc_verified_at / rejected_reason
Portal reports submission (POST /integration/portal/kyc-callback) [service token]
   ↓ Portal may only report "submitted" (kyc_submission_status = SUBMITTED)
   ↓ verification authority stays in CRM
Notification (CustomerNotification type KYC_STATUS_UPDATED)
```

- **AuthZ**: `KycPolicy.canWrite` (KYC-authorized tier). Service-token callback.
- **Boundary**: CRM verifies; Portal only notifies submission; AI may never approve KYC.

## 10. Task / SLA / Escalation workflow

```text
Create task (POST /tasks)  (validate TaskCreateSchema)
   ↓ assignee, target_date, priority, optional lead/opportunity/booking link
List own / team (GET /tasks/my-tasks, /tasks/all-team-tasks [REPORTS_READ_TEAM])
   ↓ auto-flip PENDING/IN_PROGRESS past target_date → OVERDUE; alert MD + assignee
Read SLA (GET /tasks/:id/sla) → deriveTaskSlaStatus(status, target_date, completed_at)
Update status (PATCH /tasks/:id/status) [TASKS_UPDATE]
   ↓ COMPLETED → completed_at set; AuditEvent TASK_COMPLETED (+1.0 performance point); cheer notification
```

- **AuthZ**: `TASKS_CREATE/READ/UPDATE/ASSIGN`; `TaskPolicy.canMutateSync` (owner or
  manager via downstream employee ids).
- **Escalation (verified)**: task-level overdue → MD/dept-head notification. There is **no**
  general-purpose SLA/escalation engine beyond tasks.

## 11. Complaint workflow (Phase 14-1)

```text
Create (POST /complaints) [COMPLAINTS_CREATE]  (priority default MEDIUM)
   ↓ status = OPEN; optional booking/property link
Assign (PATCH /:id/assign) [COMPLAINTS_ASSIGN]
Update (PATCH /:id) [COMPLAINTS_UPDATE]  (title/description/category/priority)
Status (PATCH /:id/status) [COMPLAINTS_UPDATE]  (IN_PROGRESS / REOPENED)
Resolve (PATCH /:id/resolve) [COMPLAINTS_RESOLVE]  (resolution_description) → RESOLVED
Close (PATCH /:id/close) [COMPLAINTS_CLOSE]  (closure_reason) → CLOSED
```

- **Domain**: `Complaint` (company/customer scoped; statuses OPEN/IN_PROGRESS/RESOLVED/CLOSED/REOPENED).

## 12. Expense Refund workflow (petty cash)

```text
Submit (POST /expense-refunds) [EXPENSES_CREATE]  (proof_image upload ≤5MB)
   ↓ status = PENDING
Accountant review (PATCH /:id/accountant-review) [EXPENSES_REVIEW]
   ↓ ACCOUNTANT_APPROVED | REJECTED_BY_ACCOUNTANT
MD review (PATCH /:id/md-review) [EXPENSES_MD_APPROVE]
   ↓ MD_APPROVED | REJECTED_BY_MD
Mark refunded (PATCH /:id/mark-refunded) [EXPENSES_MARK_REFUNDED]
   ↓ REFUNDED (refunded_by, refunded_at)
```

- **APIs**: `/expense-refunds` (`/my`, `/queue`, `/:id/proof`).
- **AuthZ**: `EXPENSES_*` via `ExpenseRefundPolicy` (accountant / MD / self-owner).

## 13. Reporting / Analytics workflow

```text
Daily report submit (POST /reports/daily) [REPORTS_CREATE] → DailyReport
Configure targets (POST /targets) [REPORTS_TARGETS_CONFIGURE] (MD/marketing) → DailyTarget
View own/team status (GET /reports/today-status, /targets/*)
Performance (GET /performance/my-score|history|leaderboard|team; POST /reset-score-history)
Analytics KPIs (GET /analytics/kpis) [ADMIN_SYSTEM_METRICS]
MD executive metrics (GET /md/executive-metrics) [ADMIN_SYSTEM_METRICS]
```

- **Data sources**: `DailyReport`, `DailyTarget`, `PerformanceSnapshot`, `AuditEvent`,
  and aggregate queries over `Lead`/`Opportunity`/`Booking`/`Payment` in
  `analytics.service.ts`.

## 14. Complete workflow map (master)

```text
Marketing / Website (public lead capture → Lead source=WEBSITE)
        ↓
CRM Lead Management (assignment, follow-up tasks, SLA breach tracking)
        ↓
Qualification (status QUALIFIED; convert → Customer)
        ↓
Opportunity (pipeline stages → convert-to-booking)
        ↓
Property Matching (deterministic matchScore via matchingEngine)
        ↓
Site Visit (book → verify → assign agent → complete → auto lead-status update)
        ↓
Booking (property lock → confirm/cancel → portal handoff)
        ↓
Payment / Collections (record → verify; installment schedule; portal payment-callback)
        ↓
Documents / KYC (upload/verify; PAN/Aadhaar encrypted; portal kyc-callback)
        ↓
Operations (tasks/SLA, expense refunds, complaints, attendance)
        ↓
Reporting / Audit (daily reports, targets, performance, analytics KPIs, AuditEvent)
```

> **Annotated responsibilities:** each stage maps to the roles/APIs/domains documented in
> the sections above. This master flow is fully implemented end-to-end in the CRM **except**
> the public AI-search step (see [CRM-AI-ARCHITECTURE](CRM-AI-ARCHITECTURE.md)) and the live
> customer portal (see [CRM-V2-ROADMAP](CRM-V2-ROADMAP.md)).
