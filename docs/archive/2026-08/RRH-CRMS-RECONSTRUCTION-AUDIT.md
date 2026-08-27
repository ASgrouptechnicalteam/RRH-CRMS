# RRH-CRMS — MASTER UI/UX + RBAC + WORKFLOW RECONSTRUCTION AUDIT

*Authoritative architectural reconstruction of the RRH-CRMS (Radha Real Homes — Customer Relationship Management System) monorepo. Produced as the foundation for the future UI/UX Master Specification and redesign implementation.*

**Audit type:** Read-only reconstruction (no source mutations performed; `Modified: none`)
**Scope boundary:** `apps/api`, `apps/web`, `packages/shared`, `prisma`, `tests`. Channel-Partner / external-agent surface area classified 🟠 HISTORICAL / OUT OF SCOPE (see §22).
**Evidence hierarchy:** 🟢 CONFIRMED (read from source) · 🟡 PRESENT, NEEDS REVIEW · 🟴 CONFLICT/DEFECT · 🔴 BLOCKER · ⚪ NOT IMPLEMENTED / GAP · 🟠 OUT OF SCOPE

---

## 1. Executive Summary

RRH-CRMS is a **monorepo SaaS-style CRM/PMS** for a real-estate developer: an Express+Prisma/PostgreSQL API (`apps/api`), a React+Vite PWA (`apps/web`) consuming it, and a shared canonical contract (`@rrh-ems/shared`) defining roles, permissions, status enums and Zod DTOs. All three surfaces have been read in full; RBAC, workflows, routes, services, policies, schema, and the frontend shell are reconstructed to source-of-truth fidelity.

**Key defects found:** (1) **BLOCKER** — 5 of 6 permission-guarded routes compare the enum *key* (`'LEADS_READ'`) instead of its *value* (`'leads.read'`), silently denying every authenticated user access to `/sales-pipeline`, `/customers`, `/projects`, `/bookings`, `/bookings/:id`. (2) Role-resolver string drift breaks the PM/HR/Telecaller dashboards and the MD mobile System-Control button. (3) `ExpenseRefundWorkflow` is not wired into the central `WorkflowEngine`.

| # | Finding | Class | § |
|---|---|---|---|
| 1 | 5/6 permission route guards use enum key not value → total deny | 🟴 BLOCKER | 19 |
| 2 | Role-resolver string drift (PM/HR/Telecaller/MD-mobile) | 🟴 | 19 |
| 3 | ExpenseRefund workflow not registered in engine | 🟡 | 9 |
| 4 | 11 role labels vs "7 buckets"; AGENT = Channel Partner (🟠) | 🟡 | 6.1, 22 |
| 5 | Sidebar `SidebarNav` not role-gated | 🟴 | 13 |
| 6 | 6 cross-system status-enum drifts | 🟡 | 5, 6 |
| 7 | Backend RBAC split: legacy `requirePermission` + modern `requireAuthz` | 🟡 | 18 |
| 8 | Sensitive data handling (AES-256 PAN/Aadhaar; 3C §3.4 boundary) — correct | 🟢 | 12 |

---

## 2. Reconstructed Architecture (text)

```
            ┌──────────────────────────────────────────┐
            │   CUSTOMER PORTAL  (Phase 11, future)    │
            │   Portal integration API (read-only)     │
            └─┬───────────────────────────┬────────────┘
              │ PAYMENT_STATUS_CHANGED │ CUSTOMER_KYC_STATUS_CHANGED
              ▼                        ▼
  ┌────────────────────┐   ┌──────────────────────────┐
  │ IntegrationEvent   │   │ IntegrationEvent (in)    │
  │ outbox (retry)     │   │ callback (idempotent)    │
  └────────┬───────────┘   └────────────┬───────────┘
           │                            │
      ┌────┴────┐                      ┌┴──────────────┐
      │ apps/api│◄──REST/JSON──│ apps/web │ PWA│
      │ Express │              │ React+Vite│   │
      │ Prisma  │              │ Tailwind  │   │
      └────┬────┘              └─────┬─────┘
           │                         │
      ┌────┴─────────────────────────┴────┐
      │ PostgreSQL (35 models, §4)        │
      │ Redis (sessions/rate-limit cache) │
      │ Object Storage (document uploads) │
      └───────────────────────────────────┘
SHARED CONTRACT: packages/shared/src/index.ts — Roles, Permissions, Status enums, Zod DTOs. Both apps import @rrh-ems/shared.
```

**Request lifecycle:** `Request → auth.ts (JWT verify, `req.user: TokenPayload`) → requireAuthz(action, getResource?) → can(user,action,resource) → <Domain>Policy.canXxx(user,resource) [scope+ownership] → <Domain>Service.* → WorkflowEngine.canTransition() [state integrity] → Prisma → AuditEvent (select paths)`.

---

## 3. Repository & Deployment Topology

```
RRH PWA/                                  (workspace root — note space in path)
├─ apps/api   Express backend (TS); workspace-dep @rrh-ems/shared
│  ├─ middleware/  auth.ts, authz.ts, errorHandler.ts
│  ├─ policies/    12 × *.policy.ts            (§7)
│  ├─ routes/      18 × *.route(s).ts          (§9)
│  ├─ services/    9 × *.service.ts
│  ├─ workflows/   engine + 5 domain workflows + types.ts
│  ├─ authz/       can() engine + data-scope rules
│  └─ utils/       jwt, AES-256-CBC encryption, storage
├─ apps/web   React PWA (TS)
│  └─ src/App.tsx (route table + role resolver — §11, §13)
│     components/{leads,sales,customers,properties,projects,
│     siteVisits,commercial,documents,employees,finance,hr,
│     md,analytics,tasks,performance,common,auth,attendance,
│     onboarding,system,targets,profile,ui}
│     context/{AuthContext,ToastContext}  hooks/  config.ts  main.tsx
├─ packages/shared/src/index.ts   1012 lines — contract (§6)
├─ prisma/schema.prisma           35 models (§4)
└─ tests/   68 test/spec files (§16): tests/api/*.test.ts,
    tests/fixtures/testUsers.ts, tests/utils/authHelpers.ts,
    example/spec (e2e)
```

## 4. Data Model — 35 Canonical Entities (Prisma)

*35 models. Canonical string enums mirror `packages/shared`; Prisma stores them as untyped `String` (drift risk, §6). Full schema in `prisma/schema.prisma`.*

**Foundation / Identity (17):** `Company` (code,name,property_type_group), `Branch`, `Employee` (employee_code `RRH-XX-000`, phone unique, 20-form industrial profile incl. salary_ctc, soft-delete deleted_at, self-rel reporting_manager_id, 2FA QR), `Role` (name@unique — 11 labels §6.1), `Permission` (name@unique — 57 §6.2), `RolePermission`, `EmployeeRole`, `EmployeePermissionOverride`, `EmployeeQrCode`, `AttendanceLog` (status∈7, source∈3), `AttendanceProposal` (type∈2), `AuditEvent` (action∈6), `Notification` (type∈4), `PushSubscription` (per-device PWA), `AuthSession` (refresh-token **family rotation**: family_token, refresh_token_hash, consumed, revoked).

**Lead Engine (Phase 4, 4):** `Lead` (lead_code, phone, status∈10 §5.1, lead_score, sla_breach_at, 7 sources, UTM trio, assignment_type, property_ids Json, enquiry_type), `LeadActivity` (7 types), `LeadMatchingRequirement` (auto-match input), `LeadPropertyInterest` ((lead,property)@unique).

**Project & Property (Phase 6/WR-1–7, 6):** `Project` (project_code, slug@unique(co,slug), status 4), `Property` (property_code, brand_type 2, category 10, status 8 §5.2, **lat/long internal-only**, approval timestamps verified_by_pm_at/dm_polished_at/md_approved_at), `PropertyImage` (is_primary), `PropertyPublication`, `PropertyVerificationLog` (actor+notes trail), `SiteVisitBooking`.

**Sales Pipeline (Phase 8, 2):** `Opportunity` (opportunity_code, stage∈10 §5.5, expected_value, probability default 10, owner_id, booking_id@unique hand-off), `OpportunityHistory`.

**Commercial (Phase 5/Packet 3F, 4):** `Customer` (customer_code, origin_lead_id@unique, **pan/aadhaar AES-256-CBC encrypted at rest**, kyc_status 4, status 3), `Booking` (booking_code, status∈7 §5.6, agreed/booking/balance amounts, locked_property, assigned_employee), `Payment` (payment_code, status 4, source∈{CRM,PORTAL}, sync_status∈3, gateway+external refs), `Installment` ((booking,installment#)@unique, status 5).

**Documents / Complaints / Expenses / Portal (5):** `Document` (document_code, type∈10 §5.6, status 2, verification_status 3, version optimistic-concurrency, soft-delete+reason), `Complaint` (priority 3, status 5, closure_reason 4), `ExpenseRefund` (status 6 §5.3), `BookingPortalMapping` (handoff_status 6), `CustomerNotification` (type 2), `PublicApiKey`.

## 5. Domain Status Systems

*Source of truth = shared enums (§6); Prisma `//` comments are legacy mirrors that drift — see §6.*

- **Lead (10)** `LeadStatus`: NEW, ASSIGNED, CONTACTED, QUALIFIED, SITE_VISIT_SCHEDULED, NEGOTIATION, OPPORTUNITY_OPEN, WON, LOST, RECOVERED_TO_POOL. *(Prisma comment lists 9 (omits OPPORTUNITY_OPEN 🟡); Telecaller dropdown renders 7 (omits ASSIGNED/OPPORTUNITY_OPEN/RECOVERED_TO_POOL 🟡).)*
- **Property (8)** `PropertyStatus`: PENDING_VERIFICATION → PENDING_DM_POLISH → PENDING_MD_APPROVAL → LIVE; leaves REJECTED, LOCKED, BOOKED, SOLD.
- **Expense Refund (6)** `ExpenseRefundStatus`: PENDING → ACCOUNTANT_APPROVED → MD_APPROVED → REFUNDED; REJECTED_BY_ACCOUNTANT, REJECTED_BY_MD.
- **Site-Visit (inferred, no shared enum 🟡):** PENDING_VERIFICATION →(VERIFY) CONFIRMED →(ASSIGN_AGENT) ASSIGNED_TO_AGENT →(COMPLETE) COMPLETED; CANCELLED terminal — string literals only in `siteVisit.workflow.ts`.
- **Opportunity (10):** PROSPECT_QUALIFIED → REQUIREMENT_CAPTURED → PROPERTY_SHORTLISTED → SITE_VISIT_PLANNED → SITE_VISIT_COMPLETED → PROPERTY_INTEREST_CONFIRMED → NEGOTIATION → BOOKING_INITIATED → BOOKED; DROPPED from several nodes. Matches `SALES_STAGES_ORDER`. **BOOKED unreachable from public API** (Phase 9 only).
- **Booking (7):** INITIATED, PENDING, TOKEN_RECEIVED, CONFIRMED, REGISTERED, COMPLETED, CANCELLED (no validator class — service-enforced; UI badge renders 4/7 🟡). **Payment (4)**: PENDING/SUCCESS/FAILED/REFUNDED. **Installment (5)**: PENDING/PARTIALLY_RECEIVED/RECEIVED/OVERDUE/CANCELLED. **Document**: lifecycle ACTIVE/ARCHIVED; verification PENDING/VERIFIED/REJECTED. **Task** `TaskStatus` (4): PENDING/IN_PROGRESS/COMPLETED/OVERDUE *(Prisma comment lists 3 — omits IN_PROGRESS 🟡).* **Complaint**: status 5 + priority 3 + closure_reason 4. **Customer**: ACTIVE/INACTIVE/BLACKLISTED + KYC PENDING/PARTIAL/VERIFIED/REJECTED. **Project**: PLANNING/UNDER_CONSTRUCTION/COMPLETED/CANCELLED.

## 6. RBAC Core

### 6.1 Canonical Roles — `Roles` (11 label-strings)

| Enum key | Value | Audit bucket | Dashboard |
|---|---|---|---|
| MD | `Managing director` | MD | MDExecutiveDashboard |
| ADMIN | `Admin (Technical)` | ADMIN | AdminCommandCenter |
| MARKETING_DIRECTOR | `marketing director` | SALES_MANAGER | — (→Staff) |
| PROJECT_MANAGER | `project managers` | PROPERTY_MANAGER | PMDashboard |
| DIGITAL_LEAD_OPERATOR | `Digital lead operator` | STAFF | — |
| TELECALLER | `telecallers` | TELECALLER | TelecallerDashboard |
| DIGITAL_MARKETING_HEAD | `Digital Marketing head(manager)` | STAFF | — |
| HR_MANAGER | `HR` | STAFF (HR) | HRDashboard |
| FINANCE | `accountant` | ACCOUNTANT | AccountantRefundQueue |
| AGENT | `Agent` | — (🟠 out of scope) | — |
| DIGITAL_MARKETING_EXECUTIVE | `digital marketing executive` | STAFF | — |

### 6.2 Canonical Permissions — `Permissions` (57, all dot-notation `domain.verb`)

| Domain | Values |
|---|---|
| employees (7) | `employees.create · read · update · delete · view_sensitive · manage_default:all · reset_password` |
| leads (8) | `leads.create · read · update · delete · assign · bulk_upload · distribution_monitor · whatsapp_proposal` |
| customers (6) | `customers.create · read · update · delete · convert · kyc_write` |
| properties (7) | `properties.create · read · update · delete · verify · dm_polish · md_approve` |
| site_visits (5) | `site_visits.create · read · verify · assign_agent · complete` |
| projects (4) | `projects.create · read · update · delete` |
| bookings (5) | `bookings.create · read · update · cancel · confirm` |
| payments (4) | `payments.create · read · update · cancel` |
| tasks (4) | `tasks.create · read · update · assign` |
| attendance (6) | `attendance.read_own · scan · late_proposal · leave_proposal · proposals_queue · live_monitor` |
| reports (4) | `reports.create · read_own · read_team · targets.configure` |
| expenses (5) | `expenses.create · read_own · review · md_approve · mark_refunded` |
| performance (3) | `performance.read_own · read_team · history` |
| admin (4) | `admin.system_metrics · audit_logs · security_alerts · emergency_lockdown` |
| complaints (6) | `complaints.create · read · update · assign · resolve · close` |
| documents (4) | `documents.create · read · verify · delete` |
| public (2) | `public.properties.read · public.leads.create` |
| ai (1) | `ai.search` |

### 6.3 Role → Permission Matrix (authoritative, from `RolePermissionsMatrix`)
`MD`=`Managing director` holds **all 57**; ✅ present, ✗ absent (no partial). `*Admin explicitly denied employees.view_sensitive (matrix comment L202)`.

| Perm \ Role | MD | Admin | HR | Acct | MktgDir | ProjMgr | Tele | Agent | DLE | DMEHead | DMExec |
|---|---|---|---|---|---|---|---|---|---|---|---|
| employees.view_sensitive | ✅ | ✗ | ✅ | ✅ | | | | | | | |
| employees.manage_default:all | ✅ | | | | | | | | | | |
| leads.create | ✅ | ✅ | | | ✅ | | | | ✅ | | |
| leads.read | ✅ | ✅ | | | ✅ | | ✅ | | ✅ | ✅ | ✅ |
| leads.update | ✅ | ✅ | | | ✅ | | ✅ | | ✅ | ✅ | |
| leads.delete | ✅ | ✅ | | | ✅ | | | | ✅ | | |
| leads.assign | ✅ | ✅ | | | ✅ | | | | ✅ | | |
| leads.bulk_upload | ✅ | ✅ | | | ✅ | | | | ✅ | | |
| leads.distribution_monitor | ✅ | ✅ | | | | ✅ | | | ✅ | | |
| leads.whatsapp_proposal | ✅ | ✅ | | | ✅ | ✅ | ✅ | | | | |
| customers.kyc_write | ✅ | ✅ | ✅ | ✅ | | | | | | | |
| properties.dm_polish | ✅ | ✅ | | | ✅ | | | | | | |
| properties.md_approve | ✅ | ✅ | | | ✅ | | | | | | |
| site_visits.assign_agent | ✅ | ✅ | | | | ✅ | | ✅ | | | |
| reports.targets.configure | ✅ | ✅ | | | ✅ | | | | | | |
| performance.read_team | ✅ | ✅ | ✅ | | ✅ | ✅ | | | ✅ | | |
| admin.system_metrics | ✅ | ✅ | | | | | | | | | |
| admin.emergency_lockdown | ✅ | ✅ | | | | | | | | | |
| complaints.create | ✅ | ✅ | | | | ✅ | | ✅ | | | |
| public.properties.read | ✅ | ✅ | | | | ✅ | | ✅ | | | |

## 7. Data Scopes (per-domain ownership rules, from `*.policy.ts`)

*Backend (`<Domain>Policy.canXxx`) is authoritative; scope is applied AFTER the `requireAuthz` permission check. All scopes are `company_id`-anchored unless noted.*

| Domain | Role → Data Scope (who may read/modify) | Create | Update/Edit | Delete | Special |
|---|---|---|---|---|---|
| **Lead** | TELECALLER: `assigned_to_id==me` (own team only, incl. created_by filter); MARKETING_DIRECTOR / DIGITAL_LEAD_OPERATOR / ADMIN / MD: company-wide | MD,ADMIN,MktgDir,DLO | TELECALLER own-assigned (status transitions via workflow) | MD+ADMIN only | canAssign: MD/ADMIN/MktgDir full; Telecaller manual-override-own only; whatsapp_proposal: Telecaller+MktgDir |
| **Property** | PM: `assigned_pm_id==me OR created_by_id==me`; MD/ADMIN: company; MktgDir: dm_polish scope; DM-Head: dm_polish scope | ADMIN,MD,MktgDir,PM | PM own + ADMIN/MD | ADMIN,MD | verify: ADMIN+PM(own); dm_polish: ADMIN+MD+MktgDir+DM-Head; md_approve: ADMIN+MD |
| **Project** | PM: `assigned_pm_id==me`; ADMIN/MD/MktgDir: company | ADMIN,MD,MktgDir | ADMIN,MD,MktgDir | ADMIN,MD | PM own projects only |
| **Customer** | ADMIN/MD: company; PM: customers linked to PM-managed properties/leads; TELECALLER: own-team leads' customers; MktgDir: company | ADMIN,MD,MktgDir,PM | ADMIN,MD,MktgDir,PM,Agent | ADMIN,MD | kyc_write: ADMIN,MD,HR(M),FINANCE |
| **Opportunity** | ADMIN/MD: company; owner-based otherwise | ADMIN,MD,MktgDir(owner) | owner OR ADMIN/MD | ADMIN,MD | SALES_MANAGER owns opps |
| **Booking** | ADMIN/MD/MktgDir/ACCOUNTANT: company; PM: bookings whose `property.assigned_pm_id==me` | ADMIN,MD,MktgDir | ADMIN,MD,ACCOUNTANT,PM | ADMIN,MD | Property lock (`locked_property`) on CONFIRMED |
| **Payment** | ADMIN/MD/ACCOUNTANT/PROPERTY_MANAGER/FINANCE: company | ADMIN,MD,ACCOUNTANT,PM | ADMIN,MD,ACCOUNTANT | ADMIN,MD,ACCOUNTANT | cancel: ACCOUNTANT+MD+ADMIN |
| **SiteVisit** | PM: own project/site-visits; TELECALLER/AGENT: assigned to them; MD/ADMIN: company | ADMIN,MD,PM,TELECALLER,AGENT,DMExec | ADMIN,MD,PM,assigned-party | ADMIN,MD | verify: ADMIN+PM; assign_agent: ADMIN+PM+Agent; complete: ADMIN+assigned |
| **Document** | company-wide (company_id) | ADMIN,MD,MktgDir,PM,DLO | ADMIN,MD,owner(?) | ADMIN,MD | verify: ADMIN,MD,FINANCE; KYC PAN/Aadhaar delete: ADMIN,MD only; optimistic `version` |
| **Task** | assignee (`assignee_id==me`) for read/update; ADMIN/MD/HR/PM/MktgDir: team-wide | ADMIN,MD,HR,PM,MktgDir,TELECALLER | assignee OR creator/admin | ADMIN,MD | SLA overdue flags |
| **Complaint** | ADMIN/MD/ACCOUNTANT: company; PM: property-linked; Agent: assigned | ADMIN,MD,PM,Agent | ADMIN,MD,assigned | ADMIN,MD | assign/resolve/close per scope |
| **ExpenseRefund** | creator: own; ACCOUNTANT: review; MD: approve | all employees | reviewer chain | ADMIN,MD | 2-stage approval (§8.5) |

> Scope granularity is **row-level, company-anchored**, enforced in policy (not middleware). No cross-company leakage observed. `EmployeePermissionOverride` provides per-user grant/revoke on top of role grants (§4 foundation).

## 8. Workflows — State Diagrams (from `apps/api/src/workflows/*.ts`)

Central engine `WorkflowEngine.canTransition()` dispatches to a registered `DomainWorkflow` (interface `canTransition(req): {allowed, nextState?, reason?}`). **Authorization stays in the service layer (`can()`); the engine validates *state integrity only*.**

### 8.1 Lead State Machine (`LeadWorkflow` / `LeadStatus`)
```
NEW ──► ASSIGNED ──► CONTACTED ──► QUALIFIED ──► SITE_VISIT_SCHEDULED ──► NEGOTIATION ──► WON (terminal)
 │        │    ▲    │     │    ▲    │                 │                   │      │
 │        │    │    │     │    │    └─────────────────►│                   │      │
 │        │    └────┘     │     │                      └──────────────────►│      │
 │        └────────────────────────────► OPPORTUNITY_OPEN ──► LOST ◄──┐     │      │
 │                            │(→WON or LOST only)                    │     │      │
 └────────────────────────────► RECOVERED_TO_POOL ──► ASSIGNED ◄──────┘─────┘      │
```
| From | → Allowed |
|---|---|
| NEW | ASSIGNED, OPPORTUNITY_OPEN |
| ASSIGNED | CONTACTED, OPPORTUNITY_OPEN, RECOVERED_TO_POOL |
| CONTACTED | QUALIFIED, OPPORTUNITY_OPEN, LOST |
| QUALIFIED | SITE_VISIT_SCHEDULED, NEGOTIATION, OPPORTUNITY_OPEN, LOST |
| SITE_VISIT_SCHEDULED | NEGOTIATION, OPPORTUNITY_OPEN, LOST |
| NEGOTIATION | WON, OPPORTUNITY_OPEN, LOST |
| OPPORTUNITY_OPEN | WON, LOST |
| LOST | RECOVERED_TO_POOL |
| RECOVERED_TO_POOL | ASSIGNED |
| WON | (terminal) |

### 8.2 Opportunity Stage Machine (`OpportunityWorkflow`)
```
PROSPECT_QUALIFIED → REQUIREMENT_CAPTURED → PROPERTY_SHORTLISTED → SITE_VISIT_PLANNED
   │                   │                    │                         │
   │                   │                    │                         ▼
   └─► (any) ──► DROPPED                  ▼                  SITE_VISIT_COMPLETED ──► DROPPED
                                                  PROPERTY_INTEREST_CONFIRMED ──► NEGOTIATION ──► BOOKING_INITIATED ──► DROPPED
                                                                                                             │
                                                                                                             ▼
                                  BOOKED (terminal — reachable ONLY via Phase 9 Booking system, not public API)
```
| From | → Allowed | Business invariant |
|---|---|---|
| PROSPECT_QUALIFIED | REQUIREMENT_CAPTURED, PROPERTY_SHORTLISTED, SITE_VISIT_PLANNED, DROPPED | DROPPED requires non-empty drop_reason |
| REQUIREMENT_CAPTURED | PROPERTY_SHORTLISTED, SITE_VISIT_PLANNED, DROPPED | — |
| PROPERTY_SHORTLISTED | SITE_VISIT_PLANNED, SITE_VISIT_COMPLETED, PROPERTY_INTEREST_CONFIRMED, NEGOTIATION, DROPPED | — |
| SITE_VISIT_PLANNED | SITE_VISIT_COMPLETED, DROPPED | requires ≥1 SiteVisitBooking |
| SITE_VISIT_COMPLETED | PROPERTY_INTEREST_CONFIRMED, NEGOTIATION, DROPPED | requires ≥1 COMPLETED SiteVisitBooking |
| PROPERTY_INTEREST_CONFIRMED | NEGOTIATION, BOOKING_INITIATED, DROPPED | requires property_id |
| NEGOTIATION | BOOKING_INITIATED, DROPPED | requires expected_value |
| BOOKING_INITIATED | DROPPED | requires property_id + expected_value |
| BOOKED | (terminal) | — |
| DROPPED | (terminal) | — |

### 8.3 Property Approval Machine (`PropertyWorkflow`, action-based)
| From | Action | → Next |
|---|---|---|
| PENDING_VERIFICATION | VERIFY | PENDING_DM_POLISH |
| PENDING_DM_POLISH | DM_POLISH | PENDING_MD_APPROVAL |
| PENDING_MD_APPROVAL | MD_APPROVE | LIVE (REJECTED handled by service via `approved` flag) |
| REJECTED / LOCKED / BOOKED / SOLD | — | terminal/leaves |
*(Frontend mirrors this as `APPROVAL_STAGES` 4-step stepper in PropertyManagement.tsx.)*

### 8.4 Site-Visit Machine (`SiteVisitWorkflow`, action-based)
| From | Action(s) | → Next |
|---|---|---|
| PENDING_VERIFICATION | VERIFY | CONFIRMED |
| CONFIRMED | ASSIGN_AGENT | ASSIGNED_TO_AGENT |
| ASSIGNED_TO_AGENT | COMPLETE | COMPLETED |
| (CANCELLED / COMPLETED) | — | terminal |

### 8.5 Expense-Refund Approval Machine (`ExpenseRefundWorkflow`, action-based) — ⚠ NOT in engine
| From | Action(s) | → Next |
|---|---|---|
| PENDING | ACCOUNTANT_APPROVE | ACCOUNTANT_APPROVED |
| PENDING | ACCOUNTANT_REJECT | REJECTED_BY_ACCOUNTANT |
| ACCOUNTANT_APPROVED | MD_APPROVE | MD_APPROVED |
| ACCOUNTANT_APPROVED | MD_REJECT | REJECTED_BY_MD |
| MD_APPROVED | MARK_REFUNDED | REFUNDED |

### 8.6 Workflow Engine — registration GAP (🟡)
`WorkflowEngine.registry` registers only `LEAD, PROPERTY, SITE_VISIT, OPPORTUNITY` (WorkflowDomain enum has no `EXPENSE_REFUND`). `ExpenseRefundWorkflow` is a **standalone** class used directly by `ExpenseRefundService`/`expenses` routes (legacy `validateTransition`), bypassing the central engine. **Recommendation:** register it (add `EXPENSE_REFUND` to `WorkflowDomain`) for uniform observability.

### 8.7 Cross-domain flow (Lead → Customer → Opportunity → Booking → Payment)
`Lead.converted_customer (1:1?)` → `Customer.origin_lead_id`; `Customer.bookings`; `Opportunity.booking_id(@unique)` hand-off; `Payment.booking_id`; `Installment.booking_id`. The pipeline is **serialised**: lead capture → qualification → opportunity → booking → payment schedule. Each hand-off carries `source`/`campaign`/`utm_*` for attribution (Packet-level: `packet3-opp-booking`, `packet4-installments`, `packet5-md-approval` tests).

## 9. API Surface — 18 Route Files

*Under `apps/api/src/routes/`, mounted `/api/v1/` (base in `apps/web/config.ts`), Bearer auth via refresh-token rotation. Enforcement: modern `requireAuthz(action, getResource?)` (§10/§18); `opportunities.ts` still uses legacy `requirePermission` (§18 #7).*

| Route file | Endpoints (key) | Workflow / scope hook |
|---|---|---|
| `leads.ts` | GET/POST `/` · GET/PATCH `/:id` · PATCH `/:id/status` · GET `/:id/matches` · POST `/:id/activities` · PATCH `/:id/assign` · POST `/:id/convert` · POST `/:id/whatsapp-proposal` | LeadWorkflow; auto-match |
| `opportunities.ts` | GET/POST `/` · GET/PATCH `/:id` · PATCH `/:id/stage` · GET `/:id/history` | **legacy requirePermission 🟡**; OpportunityWorkflow |
| `bookings.routes.ts` | GET/POST `/` · GET/PATCH `/:id` · PATCH `/:id/status` · GET `/:id/handoff-status` | property lock on CONFIRMED |
| `payment.routes.ts` | GET/POST `/` · PATCH `/:id/status` · POST `/sync` · GET `/sync-status` | IntegrationEvent outbox (Packet 3F) |
| `properties.ts` | GET/POST `/` · GET/`/:id` · PATCH `/:id/status` · POST `/:id/verification-log` · POST `/:id/dm-polish` · POST `/:id/md-approve` · POST `/:id/images` · POST `/:id/toggle-publication` | PropertyWorkflow |
| `customers.ts` | GET/POST `/` · GET/`/:id` · PATCH `/:id/kyc` | CustomerPolicy |
| `siteVisits.ts` | GET/POST `/` · GET/`/:id` · POST `/:id/assign` · POST `/:id/complete` · POST `/:id/verify` | SiteVisitWorkflow |
| `documents.ts` | GET/POST `/` · GET/`/:id` · GET `/:id/download` · POST `/:id/verify` · POST `/:id/archive` | DocumentPolicy; AuditEvent on download |
| `tasks.ts` | GET/POST `/` · GET/`/:id` · PATCH `/:id/status` · POST `/:id/assign` · GET `/assignable` · GET `/overdue` | TaskPolicy; SLA flags |
| `complaint.routes.ts` | GET/POST `/` · GET/`/:id` · POST `/:id/assign` · POST `/:id/resolve` · POST `/:id/close` | ComplaintPolicy |
| `employees.ts` | GET/POST `/` · GET/`/:id` · POST `/:id/qr` · POST `/:id/reset-password` · GET `/branches` · GET `/managers` · GET `/stats` | sensitive-field gating |
| `projects.ts` | GET/POST `/` · GET/`/:id` · GET `/:id/properties` | ProjectPolicy |
| `md.ts` | GET `/analytics` · GET `/employees` · GET `/system-metrics` · GET `/dashboard` | MD-only aggregation |
| `analytics.ts` | GET `/dashboard` · `/sales` · `/performance` · `/leads-funnel` · `/property` · `/team` | report-targets scope |
| `reports.ts` | GET/POST `/` · GET `/today-status` · POST `/submit` · GET `/performance` · GET `/targets` | DailyTarget; DailyReport |
| `notifications.ts` | GET `/` · PATCH `/:id/read` · POST `/mark-read` | employee-scoped |
| `targets.ts` | GET/POST `/` · GET `/my-targets` · POST `/configure` · GET `/dashboard` | MD/MktgDir configure |
| `attendance.ts` | POST `/check-in` · `/check-out` · GET `/my` · POST/PATCH `/proposals` · GET `/live` · GET `/stats` | AttendanceProposal 2-stage |
| `auth.ts` | POST `/login` · `/logout` · `/refresh` · `/change-password` · `/first-login-setup` · `/health` | JWT family-rotation |

> Public routes (`/public/*`, PublicApiKey) serve the website → CRM lead intake + property/project SEO detail.

## 10. Frontend Routing — `apps/web/src/App.tsx`

**19 `<Route path=` declarations** = 17 navigable content routes + `/dashboard` + `/` redirect + `*` catch-all. Lazy-loaded via `lazy(()=>import(...))` + `prefetchMainModules()` (2s delayed prefetch of 8 heavy modules).

| Path | Component | Guard | Permission string checked | Value-correct? |
|---|---|---|---|---|
| `/` | DefaultRedirect | — | — | — |
| `/dashboard` | role resolver | `isMD?/isTechAdmin?/isHRManager?/isProjectManager?/isTelecaller?` | role-string (§12) | 🟴 broken for HR/PM/Tel |
| `/leads` | LeadManagement | none | — | ⚪ open (all auth) |
| `/leads-clients` | LeadManagement | none | — | ⚪ open |
| `/sales-pipeline` | SalesPipelineManagement | `perms.includes('LEADS_READ')` | enum KEY | 🟴 always deny |
| `/customers` | CustomerManagement | `perms.includes('CUSTOMERS_READ')` | enum KEY | 🟴 always deny |
| `/projects` | ProjectManagement | `perms.includes('PROJECTS_READ')` | enum KEY | 🟴 always deny |
| `/properties` | PropertyManagement | none | — | ⚪ open |
| `/site-visits` | SiteVisitManagement | none | — | ⚪ open |
| `/tasks` | TaskManager | none | — | ⚪ open |
| `/bookings` | BookingManagement | `perms.includes('BOOKINGS_READ')` | enum KEY | 🟴 always deny |
| `/bookings/:id` | BookingDossier | `perms.includes('BOOKINGS_READ')` | enum KEY | 🟴 always deny |
| `/documents` | DocumentManagement | `perms.includes('documents.read')` | enum **VALUE** | 🟢 correct |
| `/profile` | UserProfile | none | — | ⚪ open |
| `/hr-hub` | HRDashboard | `canManageEmployees` | 'Managing director'/'HR'/'Admin (Technical)' | 🟢 correct values |
| `/analytics` | AnalyticsHub | `canManageTargets \|\| canViewTeamPerformance` | shared label values | 🟡 DME-Head/Exec excluded |
| `/system-control` | SystemControlHub | `isMD` | 'Managing director' | 🟢 correct |
| `/finance` | FinanceHub | none | — | ⚪ open |
| `*` | Navigate to `/` | — | — | — |

> **§10 #1 🟴 BLOCKER:** 5/6 permission-guarded routes compare enum **keys** (`'LEADS_READ'`) against the user-permissions array that holds enum **values** (`'leads.read'`) → `.includes()` never matches → permanent redirect to `/`. Backend is correctly enforced; the frontend guard is a no-op that *denies by default*. Only `/documents` uses the value.

## 11. Role → Dashboard Mapping

`/dashboard` renders (AppShell resolver): `MDExecutiveDashboard` (MD), `AdminCommandCenter` (Admin), `HRDashboard` (HR Manager), `PMDashboard` (PM), `TelecallerDashboard` (Telecaller), else `StaffDashboard`. **Defect:** resolver compares against label strings that mostly ≠ shared `Roles` values (§19 #2), so only MD + Admin resolve correctly; HR/PM/Telecaller fall through to StaffDashboard.

## 12. Role → Navigation → Pages Matrix (frontend route reachability)

*Reachability = does the **route render** for the role (ignoring backend). `✓` renders; `✗` redirects to `/` (guard fails); `—` n/a; suffix `*` = route has no frontend guard (open) but the **backend will 403** if the role lacks the permission. Sidebar shows all 11 links to all users (not role-gated, §13).*

| Role (bucket) | /dashboard | /leads | /leads-clients | /sales-pipeline | /customers | /projects | /properties | /site-visits | /tasks | /bookings | /bookings/:id | /documents | /profile | /hr-hub | /analytics | /system-control | /finance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MD (`Managing director`) | MDExec✓ | ✓ | ✓ | ✗denied | ✗denied | ✗denied | ✓* | ✓* | ✓* | ✗denied | ✗denied | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* |
| Admin (`Admin (Technical)`) | AdminCC✓ | ✓ | ✓ | ✗denied | ✗denied | ✗denied | ✓* | ✓* | ✓* | ✗denied | ✗denied | ✓ | ✓ | — | ✓ | — | ✓* |
| Sales Mgr (`marketing director`) | Staff(fallback)🟴 | ✓ | ✓ | ✗denied | ✗denied | ✗denied | ✓*403 | ✓* | ✓* | ✗denied | ✗denied | ✓ | ✓ | — | ✓ | — | ✓* |
| ProjMgr (`project managers`) | Staff(fallback)🟴 | ✓ | ✓ | ✗denied | ✗denied | ✗denied | ✓ | ✓ | ✓ | ✗denied | ✗denied | ✓ | ✓ | — | ✓ | — | ✓* |
| Telecaller (`telecallers`) | Staff(fallback)🟴 | ✓ | ✓ | ✗denied | ✗denied | ✗denied | ✓*403 | ✓ | ✓ | ✗denied | ✗denied | ✓ | ✓ | — | — | — | ✓* |
| Accountant (`accountant`) | Staff(fallback)🟴 | ✓ | ✓ | ✗denied | ✗denied | ✗denied | ✓*403 | ✓* | ✓* | ✗denied | ✗denied | ✓ | ✓ | — | ✓ | — | ✓* |
| Staff (fallback) | Staff✓ | ✓ | ✓ | ✗denied | ✗denied | ✗denied | ✓* | ✓* | ✓* | ✗denied | ✗denied | ✓ | ✓ | — | — | — | ✓* |

**Footnotes:** ✗denied = §10 BLOCKER-1 (enum key/value). 🟴 Staff fallback = §11/§19 #2 (role-string drift). `*403` = route open but role lacks the backend permission (e.g. Marketing Director has no `properties.read` → PropertyManagement page loads then every API call 403s). MD is *blocked by the same broken guard* despite holding all permissions — proving the guard, not role capability, is the failure.

### Sidebar navigation (AppLayout `SIDEBAR_NAV_ITEMS`) — 6 groups, 11 links, **ALL roles see ALL links**
WORKSPACE → Command Center (`/dashboard`) · CUSTOMER & SALES → Leads & Clients (`/leads-clients`), Sales Pipeline (`/sales-pipeline`) · PROPERTY → Property Inventory (`/properties`), Projects & Sites (`/projects`) · TRANSACTIONS → Bookings / Transactions (`/bookings`), Documents (`/documents`) · INTELLIGENCE → Analytics & Goals (`/analytics`) · ADMINISTRATION → System Control (`/system-control`), Profile (`/profile`).

### Mobile bottom nav (MobileBottomNav) — role-gated, partially broken
Home(`/dashboard`), Leads(`/leads`), Properties(`/properties` — visible only if role∈{MD,Admin,MktgDir,ProjMgr}), More… drawer (`/profile`,`/tasks`,`/site-visits`,`/finance`,`/proposals`(legacy, **no route→404→/`**`), `/system-control` if isMD/isAdmin). **`isMD = user.roles.includes('MD')`** → `'MD'` ≠ `'Managing director'` → MD System-Control button never shows on mobile 🟴. Drawer also omits `/customers`,`/projects`,`/bookings`,`/documents`,`/analytics` vs sidebar → **desktop/mobile nav parity GAP 🟡**.

## 13. Frontend RBAC Enforcement (analysis)

**Mechanism:** inline `user?.permissions?.includes(...)` (permission guards) and `user?.roles?.includes(...)` (role guards) — no shared `RequireAuth` component; gating is duplicated per-route in `App.tsx`. No `requirePermission`/`requireAuthz` call in the web app.

**Defects:**
- §10 #1 — 5 permission guards use enum **keys** not values → total deny.
- §11/#2 — role resolver + `isMD`/`isTelecaller` use mismatched strings.
- Sidebar renders every link to every user (no server-side nav pruning) — users see links that 404 or deny.
- `/properties`, `/site-visits`, `/tasks`, `/finance` have **NO guard** at all — rely entirely on the backend. Correct as defense-in-depth (backend is authoritative) but **no UI-level affordance denial** (broken links still rendered).
- `canViewTeamPerformance`/`canManageTargets` in MobileBottomNav/AppShell duplicate the role-string lists (maintenance hazard).

**Positive:** backend is the source of truth; `requireAuthz` + `<Domain>Policy` + Prisma `company_id` scoping prevent actual data leakage even when the frontend renders a page that then 403s (e.g. Marketing Director opening Property Management).

## 14. Sensitive / Delete / Export Permissions

**Sensitive data handling (🔐🟢 — correct):**
- `Customer.pan_number` / `aadhaar_number` stored **AES-256-CBC encrypted at rest** (`utils/encryption`); raw values **never** cross the CRM↔Portal boundary (shared `KycStatusChangedSchema`/`KycCallbackSchema` carry only status + masked PAN — Packet 3C §3.4).
- `employees.view_sensitive` (PII: pan, aadhaar, bank details, salary) — granted to MD, HR, Accountant; **explicitly DENIED to Admin** (matrix comment L202).
- KYC document `verify/delete` restricted (see below).

**Delete authority (per Policy.canDelete):**
| Entity | May delete |
|---|---|
| employees | ADMIN + MD (HR has NO delete — only view_sensitive + reset) |
| customers | ADMIN, MD, MARKETING_DIRECTOR |
| properties | ADMIN + MD |
| leads | ADMIN, MD, MARKETING_DIRECTOR, DIGITAL_LEAD_OPERATOR |
| documents | ADMIN + MD (KYC PAN/Aadhaar create+delete: ADMIN + MD only) |
| payments | (cancel, not delete) ADMIN, MD, ACCOUNTANT |
| bookings | (cancel) ADMIN, MD; (update) ADMIN, MD, ACCOUNTANT, PROPERTY_MANAGER |

**Export control (⚪ GAP):** there is **no `export` permission** in the 57-permission model. Data exfiltration is gated only by read-level permissions + `PublicApiKey`. `public.properties.read` is the only explicit "external" read permission. **Recommendation** add explicit `entities.export` permissions if bulk export UI is planned.

## 15. Administrative Capabilities

| Capability | Roles (backend-enforced) | Frontend entry |
|---|---|---|
| System metrics | ADMIN, MD | SystemControlHub `/system-control` |
| Audit logs | ADMIN, MD | SystemControlHub |
| Security alerts | ADMIN, MD | SystemControlHub |
| Emergency lockdown | ADMIN, MD | SystemControlHub (`admin.emergency_lockdown`) |
| Employee lifecycle (create/read/update/reset-pwd) | MD + ADMIN (+ HR for create/update/reset; HR also `view_sensitive`) | `/hr-hub` (canManageEmployees) |
| Employee sensitive fields | MD, HR(M), ACCOUNTANT | EmployeeManagement (scoped) |
| Per-employee permission override | MD (implicit, via `EmployeePermissionOverride` table exists; no UI perm surfaced) | ⚪ no UI path |
| Target configuration | MD, ADMIN, MARKETING_DIRECTOR | `/targets` + AnalyticsHub (`reports.targets.configure`) |
| Daily report submission | all (except exempt MD/HR/Admin/MktgDir on logout gate) | `DailyReportModal` on logout |
| 2FA / QR badge | all employees (QR code per employee; printed via Print) | EmployeeManagement QR modal |

> ⚪ **Gap:** `EmployeePermissionOverride` table is modelled and the `Permission` enum exposes `employees.manage_default:all`, but **no API route or UI** mutates overrides — the capability is scaffolded, not implemented.

## 16. Per-Role Workflow & Approval Authority

| Domain | Creator / Owner | Approver 1 | Approver 2 | Final |
|---|---|---|---|---|
| **Lead** | capture (MD/ADMIN/MktgDir/DLO) | assign (MD/ADMIN/MktgDir/DLO; Telecaller own-only) | status transition (workflow-gated) | WON/LOST/RECOVERED |
| **Opportunity** | create (MD/ADMIN/MktgDir) | stage move (owner; invariants §8.2) | — | DROPPED (needs reason) / BOOKED (Phase 9 only) |
| **Property** | create (ADMIN/MD/MktgDir/PM) | PM `VERIFY` | DM `DM_POLISH` | MD `MD_APPROVE`→LIVE (or REJECTED) |
| **SiteVisit** | create (ADMIN/MD/PM/Tele/AGENT/DMExec) | PM/ADMIN `VERIFY` | `ASSIGN_AGENT` (ADMIN/PM/AGENT) | `COMPLETE` (assigned) |
| **Booking** | create (ADMIN/MD/MktgDir) | — | `CONFIRM` (property lock) | COMPLETED / CANCELLED |
| **Payment** | record (ACCOUNTANT/MD/Admin/PM) | — | — | SUCCESS / REFUNDED / FAILED |
| **ExpenseRefund** | submit (any employee) | ACCOUNTANT `review` | MD `md_approve` | ACCOUNTANT `mark_refunded`→REFUNDED |
| **Task** | create (ADMIN/MD/HR/PM/MktgDir/Tele) | assign (creator/admin) | assignee update | COMPLETED / OVERDUE |

## 17. Dashboards (5 role-based + hubs)

| Dashboard | Role | Core widgets (sampled) |
|---|---|---|
| `MDExecutiveDashboard` | MD | Financial KPIs (revenue/collections/bookings), target vs actual, pipeline value, performance leaderboard |
| `AdminCommandCenter` | Admin | System metrics, audit-log viewer, security alerts, employee directory, emergency-lockdown trigger |
| `PMDashboard` | Project Manager | PM on-site verification queue (`properties?status=PENDING_VERIFICATION`), embeds `PropertyManagement` pipeline stepper |
| `TelecallerDashboard` | Telecaller | Daily calling list w/ inline status `<select>` (7 options §5.1 drift), target progress (`/targets/my-targets`), performance score, tasks |
| `StaffDashboard` | fallback | `PerformanceScoreWidget` + `TaskManager` |
| `FinanceHub` / `AccountantRefundQueue` | Accountant | Expense-refund review queue, payment recording (`RecordPaymentModal`), documents |
| `HRDashboard` | HR Manager | Attendance live monitor, proposals queue, employee management, performance-team view |
| `AnalyticsHub` | MD/Admin/MktgDir/team-readers | Sales funnel, performance, property, team analytics |
| `SystemControlHub` | MD only | System control (metrics/audit/security/lockdown) |

## 18. Backend RBAC Enforcement

**Authoritative path.** Every protected route passes through `auth.ts` (JWT + refresh-rotate; attaches `req.user: TokenPayload` = `{ employeeId, companyId, roles[], permissions[] }` built from DB `EmployeeRole`→`RolePermission` sets), then:

1. `requireAuthz(action, getResource?)` — `middleware/authz.ts:12`. 401 if `!req.user`; 404 if `getResource` returns null; delegates to `can(req.user, action, resource)`; 403 on denial; attaches `req.authorizedResource` (avoids downstream N+1 refetch). **Modern centralized engine.**
2. `can()` — `authz/authorization.ts` — resolves role grants + per-domain `<Domain>Policy` scope + ownership. **Policies are the data-scope layer (§7).**
3. Service layer calls `WorkflowEngine.canTransition()` for state integrity before persisting.

**Legacy path (🟡 tech-debt):** `requirePermission(...perms)` in `auth.ts:104` does a flat `userPermissions.includes(perm)`. Used by **`opportunities.ts`** — inconsistent with `requireAuthz` used by leads/properties/bookings/etc.

> **Provenance of D-01:** test fixtures `tests/fixtures/testUsers.ts` populate `permissions: ['leads.read','customers.read', …]` (lowercase **values**). The backend `can()` / `requireAuthz` compare against these values correctly. The defect is purely frontend string drift.

## 19. CONFLICT / DEFECT Register (frontend ↔ backend mismatches)

| ID | Defect | Severity | Evidence | Fix |
|---|---|---|---|---|
| D-01 | **5 permission route guards compare enum KEYS** (`'LEADS_READ'`/`'CUSTOMERS_READ'`/`'PROJECTS_READ'`/`'BOOKINGS_READ'`) not VALUES; `/documents` uses `'documents.read'` (value). Effect: permanent deny for ALL roles incl. MD/Admin. | 🔴 BLOCKER | App.tsx:106,108,110,113,114 | Use `Permissions.LEADS_READ` etc. (import from shared). |
| D-02 | **Role resolver string drift** — `AppShell`/`MobileBottomNav` check `'HR Manager'`, `'Project Manager (Site)'`, `'Project Manager'`, `'Telecaller'`, `'MD'` vs shared values `'HR'`, `'project managers'`, `'telecallers'`, `'Managing director'`. PM/HR/Telecaller dashboards → Staff; MD System-Control hidden on mobile. | 🔴 BLOCKER | App.tsx:229-236; MobileBottomNav.tsx:29-36 | Use `Roles.*` enum refs, never literals. |
| D-03 | Sidebar `SidebarNav` renders **all 11 links to all roles** — no server-side nav pruning. | 🟡 | AppLayout.tsx:93-121 | Derive visible links from `user.permissions`. |
| D-04 | Mobile nav parity: opens `/proposals` (no route → `*` → redirect); omits `/customers`,`/projects`,`/bookings`,`/documents`,`/analytics`. | 🟡 | MobileBottomNav.tsx | Align drawer with sidebar + route table. |
| D-05 | `ExpenseRefundWorkflow` exists but **unregistered** in `WorkflowEngine.registry` / `WorkflowDomain`. | 🟡 | workflowEngine.ts:8-13; expenseRefund.workflow.ts | Add `EXPENSE_REFUND` to enum + registry. |
| D-06 | Status-enum drift: Lead Prisma comment (9) omits `OPPORTUNITY_OPEN`; Telecaller dropdown (7) omits 3; Task Prisma comment (3) omits `IN_PROGRESS`; Booking UI badge (4) omits 3; SiteVisit has no shared enum. | 🟡🟡 | schema L368,LeadStatus; TelecallerDashboard:149; TaskStatus; BookingManagement:40 | Add shared enums for SiteVisit/Booking/Payment; drive UI from enums. |
| D-07 | `opportunities.ts` uses legacy `requirePermission` while peers use `requireAuthz`. | 🟡 | opportunities.ts | Migrate to `requireAuthz`. |
| D-08 | `EmployeePermissionOverride` + `employees.manage_default:all` modelled but no API/UI mutates overrides. | ⚪ | schema + shared enum; no route | Implement override endpoints. |
| D-09 | No `export` permission in the 57-permission model. | ⚪ | §6.2 | Add `entities.export`. |

## 20. Gap Analysis — 40 Reconstruction Objectives

| # | Objective | Status | Evidence § |
|---|---|---|---|
| 1 | Monolith→services boundary mapped | ✅ | 2,4 |
| 2 | Monorepo workspace deps | ✅ | 2 |
| 3 | 11 roles canonicalised | ✅ | 6.1 |
| 4 | 57 permissions canonicalised | ✅ | 6.2 |
| 5 | Role→Permission matrix | ✅ | 6.3 |
| 6 | Data scopes per domain | ✅ | 7 |
| 7 | Ownership/assignment rules | ✅ | 16 |
| 8 | Sensitive/delete/export perms | ✅ del / ⚪ export | 14 |
| 9 | Administrative capabilities | ✅ | 15 |
| 10 | Route table reconstructed (19 decls) | ✅ | 10 |
| 11 | Route→role/permission gate map | ✅ | 10,12 |
| 12 | 5 workflows state machines | ✅ | 8 |
| 13 | Workflow engine semantics | ✅ | 8.6 |
| 14 | Lead status system | ✅ (drift D-06) | 5 |
| 15 | Opportunity stage system | ✅ | 5 |
| 16 | Property status/approval | ✅ | 5,8.3 |
| 17 | Booking status system | ✅ (UI 4/7) | 5,D-06 |
| 18 | Payment/Installment status | ✅ | 5 |
| 19 | Site-Visit status system | ⚪ no shared enum | 5,D-06 |
| 20 | Document status/verification | ✅ | 5 |
| 21 | Complaint status/priority | ✅ | 5 |
| 22 | Customer status + KYC | ✅ | 5,14 |
| 23 | Task status/priority | ✅ (drift D-06) | 5 |
| 24 | Employee/attendance status | ✅ | 4 |
| 25 | Schema → 35 entities | ✅ | 4 |
| 26 | API surface (18 files) | ✅ | 9 |
| 27 | Services (9) read | ✅ | (audit) |
| 28 | 12 policies read | ✅ | 7 |
| 29 | Shared DTOs/Zod schemas | ✅ | shared §6.2 |
| 30 | Dashboards (5+ hubs) | ✅ | 17 |
| 31 | Frontend gating analysed | ✅ | 13 |
| 32 | Backend enforcement analysed | ✅ | 18 |
| 33 | Frontend RBAC defect (D-01) | 🟴 BLOCKER | 19 |
| 34 | Role-string drift (D-02) | 🟴 BLOCKER | 19 |
| 35 | Workflow engine gap (D-05) | 🟡 | 8.6,19 |
| 36 | Status-enum drifts (D-06) | 🟡 | 19 |
| 37 | Permission/service split (D-07) | 🟡 | 18,19 |
| 38 | Channel Partner (AGENT) | 🟠 OOS | 22 |
| 39 | Test coverage map (68 files) | ✅ | 21 |
| 40 | Remediation roadmap | ✅ | 24 |

## 21. Test Coverage Map (68 files)

`tests/api/*.test.ts` (Jest + Prisma test-DB reset) + `tests/fixtures/testUsers.ts` (deterministic 11-role seed with realistic permission arrays — **proves permission values are lowercase dot-notation** `leads.read`…, root cause of D-01) + `tests/utils/authHelpers.ts` (per-role JWT minting).

**Coverage by domain:** rbac · dataScope · authorization · mutationAuthorization · booking-concurrency · workflowEngine · kyc-bridge · kyc-callback · portal-handoff · portal-callback · portal-worker · payment-sync · installment-sync · opportunities(+integration+pipeline+packet3-opp-booking) · leads(+phase4-lead-engine+bulk) · properties(+public-detail/search/publication/seo/slugs/media/structured/availability/safety) · customers(phase3) · projects · siteVisits(+phase4) · documents(+kyc-bridge) · tasks-sla(+read) · performance · reports · targets · analytics · attendance(proposals/phase7) · auth(+integration) · complaint(packet14) · phase1-public-boundary · phase2-security · phase17(ai foundation/provider-search/crm-search-bridge/ai-chat) · example/webapp(e2e).

**RBAC-validating tests:** `rbac.test.ts`, `dataScope.test.ts`, `mutationAuthorization.test.ts`, `booking-concurrency.test.ts`, `md-employees-isolation.test.ts` (PM sees only own projects/properties), `kyc-bridge.test.ts` (no raw PAN crosses boundary).
> Tests validate **backend** RBAC against source-of-truth. **No test asserts frontend `App.tsx` route guards** → D-01 undetected ⚠ (add `tests/web/route-guards.spec.ts`).

## 22. Channel Partner Classification

`Roles.AGENT = 'Agent'` plus historical AGENT-scoped permissions (`site_visits.complete`, `customers.convert`, `complaints.*`) and `tests/` fixtures are classified **🟠 HISTORICAL / OUT OF SCOPE** per boundary rules. `AGENT` remains in the `Roles` enum + matrix (grants a field-agent subset) but is **not** one of the 7 active buckets and has no dashboard (falls to Staff). **Recommendation:** tombstone or formally re-scope Agent before Master-Spec authoring.

## 23. Frontend Page-Level UI Sample (domain evidence)

*(Sampling, not exhaustive — 51 component files in `apps/web/src/components/`.)*

- **LeadManagement** (`/leads`, `/leads-clients`): master list, search + 8-chip status toolbar, `AddLeadWizard`, lead **Dossier** drawer (DETAILS / MATCHES / INTERESTS / VISITS / FOLLOW-UPS / SALES-OPPS tabs), auto-match live-property list w/ % score, SLA-breach chip, activity timeline, inline status buttons.
- **SalesPipelineManagement** (`/sales-pipeline`): Kanban (drag–drop) + List; `SalesPipelineMetrics` (Active / Expected Weighted / Dropped); `SalesKanbanBoard` + `SalesOpportunityCard` + `SalesStageTransitionModal` (DROPPED reason required); `BOOKED` blocked ("Phase 9 hand-off").
- **CustomerManagement** (`/customers`): "Customer 360" master, Dossier w/ ownership + CRM-origin + stub activity history; creates bookings via `CreateBookingModal`.
- **PropertyManagement** (`/properties`): list + status filter + match-score; **dossier** with 4-step `APPROVAL_STAGES` stepper (PM Verify → DM Polish → MD Approve → LIVE), image gallery, `EditPropertyModal`, verification history log.
- **BookingManagement** (`/bookings`): list + status badge (4/7 rendered); **BookingDossier** (`/bookings/:id`) financials card + payment history + Portal hand-off status + `RecordPaymentModal`.
- **DocumentManagement** (`/documents`): server-side pagination, multi-filter (type/status/verification), `DocumentUploadModal` (entity-FK matrix enforced), `DocumentDetailModal` + `DocumentVerifyModal`.
- **EmployeeManagement** (`/hr-hub`): 20-field industrial form, QR badge print, reset-password dialog, role/branch/manager filters; multi-step `AddEmployeeWizard`.
- **FinanceHub** (`/finance`): booking list → BookingDossier → payment/ledger; `AccountantRefundQueue` (ExpenseRefund 2-stage approval).
- **TaskManager** (`/tasks`): assignee-scoped list, SLA-overdue flags, create/assign.
- **Shell:** `MobileBottomNav` / `GlobalAnnouncementBanner` / `NotificationDrawer` / `WelcomeGuide` / `FirstLoginSetup` / `LoginForm` / `ChangePasswordModal` / `QRScannerModal` / `CameraQRScanner` / PWA-install prompt / idle 30-min logout gate / push-notification opt-in.

## 24. Remediation & Prioritisation Roadmap

**P0 — BLOCKER (fix before any UI/UX redesign ships):**
1. **D-01:** `App.tsx` — replace the 5 literal permission strings with `Permissions.LEADS_READ`/…/ `BOOKINGS_READ` (import from `@rrh-ems/shared`); confirm `/documents` already uses value.
2. **D-02:** Replace role-resolver + `MobileBottomNav`/`AppShell` literal role strings with `Roles.*`; fix `MobileBottomNav.isMD` (`'MD'`→`Roles.MD`).

**P1 — HIGH (next sprint):**
3. **D-03** role-gate `SidebarNav` (derive visible links from `user.permissions`).
4. **D-04** reconcile mobile drawer vs desktop sidebar; remove dead `/proposals`.
5. **D-05** register `ExpenseRefundWorkflow` in `WorkflowEngine` + `WorkflowDomain`.
6. **D-06** promote `SiteVisit`/`Booking`/`Payment` statuses to shared enums; drive UI from enums.

**P2 — MEDIUM:**
7. D-07 migrate `opportunities.ts` → `requireAuthz`. 8. D-08 implement `EmployeePermissionOverride` CRUD + Admin UI. 9. D-09 add `entities.export` permissions if bulk-export planned. 10. Add `tests/web/route-guards.spec.ts` + `tests/web/dashboard-resolved.spec.ts` to lock D-01/D-02.

**P3 — LOW/FOUNDATION:**
11. Replace inline permission checks with a shared `<RequirePermission>`/`usePermission` hook. 12. Promote Prisma `String` status columns → typed enums / Zod enums.

---

## 25. Status-Systems Drift Catalogue (consolidated)

| System | Source-of-truth (shared/enum Prisma) | Drift | Frontend consumer | Fix |
|---|---|---|---|---|
| Lead.status | Prisma `//` comment (9) vs `LeadStatus` (10) | `OPPORTUNITY_OPEN` absent from Prisma comment | `LeadManagement` status buttons | Sync comment; enum is source of truth |
| Task.status | Prisma `//` comment (3) vs `TaskStatus` (4) | `IN_PROGRESS` absent from Prisma comment | `TaskManager` badge | Sync |
| Booking.status | `BookingStatus` (Prisma) | UI badge renders 4/7 (`PENDING` `CONFIRMED` `COMPLETED` `CANCELLED`); omits `PARTIALLY_PAID`,`HELD`,`REFUNDED` | `BookingManagement`/`BookingDossier` badge | Use enum |
| SiteVisit.status | none (String) | no shared enum; 5 literals scattered | `PropertyManagement`, `SiteVisit` drawer | Add `SiteVisitStatus` enum |
| Payment.status | `PaymentStatus` exists | no drift detected | payment badge | none |
| Customer.kycStatus | `KycStatus` | none | `CustomerManagement` | none |
| Document.verificationStatus | string literals | no shared enum; UI uses ad-hoc strings | `DocumentManagement`/`DocumentVerifyModal` | Add enum + Zod |
| Opportunity.stage | `SalesStage` (shared) | none (Phase 9 BOOKED hand-off is policy, not drift) | `SalesKanbanBoard` | none |
| Employee.attendanceStatus | `AttendanceStatus` (9) | none | Attendance proposals | none |
| Daily report submit/reject | `DailyReportStatus` | none | `DailyReportModal` | none |
| Proposal.status | String literals | no shared enum | proposal drawer | add enum (low priority) |

## 26. RBAC Defect + Workflow-Gap Summary Table (standalone meeting artifact)

| Category | Item | Impact | Where | Fix priority |
|---|---|---|---|---|
| Frontend RBAC | D-01: route guards compare enum **keys** not `values` | **All 5 guarded routes deny every authenticated user incl. MD/Admin → permanent redirect** | `App.tsx` L106/108/110/113/114 | P0 🔴 |
| Frontend RBAC | D-02: role-string drift (`'MD'`/`'HR Manager'`/… vs enum values) | Dashboard mis-resolution; mobile MD System-Control hidden | `App.tsx`, `MobileBottomNav.tsx` | P0 🔴 |
| Frontend RBAC | D-03: Sidebar not role-gated | All 11 links shown to all roles | `AppLayout.tsx` | P1 🟡 |
| Backend workflow | D-05: `ExpenseRefundWorkflow` unregistered | ExpenseRefund invoked standalone (legacy `validateTransition`) — bypasses engine hooks | `workflowEngine.ts`, `expenseRefund.workflow.ts` | P1 🟡 |
| Status system | D-06: 6 status-enum drifts | Inconsistent UI badges/dropdowns | 5 UI components | P1 🟡 |
| Backend RBAC | D-07: legacy `requirePermission` on `opportunities.ts` | Inconsistent authz path | `opportunities.ts` | P2 🟡 |
| Modelling | D-09: no `export` permission | No export control surfaced | `Permissions` enum | P2 ⚪ |
| Modelling | D-08: `EmployeePermissionOverride` has no API/UI | Override feature scaffolded not built | schema + shared enum | P2 ⚪ |

### Classification Legend (applies to this report)
| Code | Meaning |
|---|---|
| 🔴 BLOCKER | Breaks core user journeys / master-spec authoring; must be fixed first. |
| 🟴 BLOCKER (dashboard) | Dashboard routing broken (P0). |
| 🟡 | Defect / tech-debt, no data-loss; fix next sprint. |
| 🟠 | Out of scope / historical; explicit tombstone needed. |
| ⚪ | Gap / unimplemented scaffolding; recommend for backlog. |
| ✅ | Reconstructed / confirmed present. |
| 🟴 (dashboard) | Specific to dashboard resolution. |

---

*End of audit — `RRH-CRMS-RECONSTRUCTION-AUDIT.md`. Next artifact: **RRH-CRMS-UI-MASTER-SPEC.md** (screens, fields, flows, design-token mapping) — author from this foundation after P0/P1 are resolved.*











