# RRH-CRMS — NEXT+2 — MASTER BETA READINESS AUDIT
# Forensic Analysis: Security · Authorization · Tenant Isolation · Data Integrity

**Audit Date:** 2026-08-22
**Build Status:** ✅ `npm run build` → exit code 0

---

## 1. Executive Summary

The RRH-CRMS platform has a solid architectural foundation: proper tenant isolation patterns, a centralized authorization engine, schema-validated routes, and a functioning RBAC permission matrix. However, the audit reveals **three P0 blockers** that prevent beta release:

1. **TELECALLER role cannot create leads** — `LEADS_CREATE` is missing from the `TELECALLER` role permissions matrix. This is the single most critical business workflow failure in the system.
2. **SALES_MANAGER is excluded from `LeadPolicy.isManagement()`** — the Sales Manager has `LEADS_ASSIGN` permission but the policy engine will deny it because SM is not in `isManagement()`. Lead reassignment is broken for SMs.
3. **`POST /tasks` has no `requireAuthz` permission guard** — any authenticated user can create a task and assign it to any employee within their company.

Additionally, four P1 issues were found, the most significant being a missing route guard on `/finance` and a dangerous `companyId ?? 1` fallback in the analytics API.

**Beta Readiness: CONDITIONALLY READY — resolve P0-001, P0-002, P0-003, and P1-001 before beta launch.**

---

## 2. Repository Architecture

| Layer | Exists | Notes |
|---|---|---|
| Monorepo | ✅ | `apps/api`, `apps/web`, `packages/shared` |
| Auth (JWT) | ✅ | Cookie-based JWT, `authenticateToken` middleware |
| RBAC | ✅ | `RolePermissionsMatrix` in shared, `requireAuthz`, `can()` engine |
| DataScope | ✅ | `dataScope.ts`: buildLeadScope, buildCustomerScope, buildPropertyScope, buildProjectScope |
| Policies | ✅ | lead, customer, property, siteVisit, task, document, kyc, expenseRefund |
| Prisma ORM | ✅ | MySQL, 1183-line schema |
| Tenant isolation | ✅ (with gaps) | `company_id` enforced in most queries — see §5 |
| PWA | ✅ | Service Worker, Manifest, MobileBottomNav, PWAInstallPrompt |
| Onboarding/Tour | ✅ | ProductTour mounted in AppLayout |
| Analytics | ✅ | Centralized AnalyticsService |
| Notifications | ✅ | In-app + push (web-push) |
| Test infrastructure | ❌ | No test runner in any package.json |

---

## 3. Role Audit — All 12 Roles

### MD (Managing director)
- **Dashboard:** ✅ `MDExecutiveDashboard`
- **Permissions:** ✅ ALL permissions
- **Scope:** Company-scoped via `company_id` in JWT

### ADMIN (Admin Technical)
- **Dashboard:** ✅ `AdminCommandCenter`
- **Permissions:** ✅ Technical/system ops; no LEADS/FINANCE workflow perms (correct per SDD)
- **Gap:** `admin/system-metrics` returns global DB counts (no company scope) — intentional for ADMIN

### MARKETING_DIRECTOR
- **Dashboard:** ❌ **No dedicated dashboard — falls to `StaffDashboard`**
- **Lead access:** ✅ Full company scope via `isManagement`
- **Analytics:** ✅ Has `REPORTS_READ_TEAM`, visible in analytics route

### SALES_MANAGER
- **Dashboard:** ✅ `SalesManagerDashboard`
- **Lead read:** ✅ In `MANAGEMENT_ROLES` in `dataScope.ts`
- **Lead assign:** 🔴 **P0** — Has `LEADS_ASSIGN` permission. Route calls `can(user, LEADS_ASSIGN, lead)` → `LeadPolicy.canReassign()` → `isManagement()`. `SALES_MANAGER` is NOT in `isManagement()` list. Always returns 403.
- **Lead create:** ✅ Not in matrix — correct (SMs manage, don't create)

### PROJECT_MANAGER
- **Dashboard:** ✅ `PMDashboard`
- **Scope:** Only assigned projects; LIVE properties + own assigned
- **Leads:** Read-only, no update or assign

### DIGITAL_LEAD_OPERATOR
- **Dashboard:** ❌ **No dedicated dashboard — falls to `StaffDashboard`**
- **Lead create/bulk/assign:** ✅ All three permissions present
- **Policy:** ✅ Included in `isManagement()`

### TELECALLER (telecallers)
- **Dashboard:** ✅ `TelecallerDashboard`
- **Lead read/update:** ✅
- **Lead create:** 🔴 **P0 CRITICAL** — `LEADS_CREATE` is NOT in `TELECALLER` permissions matrix (lines 324-346). `POST /leads` requires `requireAuthz(Permissions.LEADS_CREATE)`. All wizard submissions return 403. The `AddLeadWizard` UI displays but backend rejects.
- **Site visit create:** ✅

### DIGITAL_MARKETING_HEAD
- **Dashboard:** ❌ **No dedicated dashboard — falls to `StaffDashboard`**
- **Permissions:** Narrow: `PROPERTIES_DM_POLISH`, `PROPERTIES_READ`, `LEADS_READ`, `REPORTS_TARGETS_CONFIGURE`, `PERFORMANCE_READ_TEAM`

### HR_MANAGER
- **Dashboard:** ✅ `HRDashboard`
- **Leads:** No lead perms (correct per business design)
- **Sensitive data:** ✅ `EMPLOYEES_VIEW_SENSITIVE`

### FINANCE (accountant)
- **Dashboard:** ❌ **No dedicated dashboard — falls to `StaffDashboard`**
- **Finance hub:** ✅ Accessible via role guard in sidebar; **but route itself is unguarded — see P1-001**
- **KYC:** ✅ `CUSTOMERS_KYC_WRITE`

### AGENT
- **Dashboard:** ❌ `AgentSiteVisitsDashboard.tsx` is deprecated (file is literally `// Deprecated - Removed in Phase 1`). Falls to `StaffDashboard`.
- **Leads:** ❌ No `LEADS_READ` permission — agents cannot view the leads list
- **Site visits:** ✅ `SITE_VISITS_COMPLETE`, `SITE_VISITS_READ`

### DIGITAL_MARKETING_EXECUTIVE
- **Dashboard:** ❌ **No dedicated dashboard — falls to `StaffDashboard`**
- **Lead update:** ✅ Within own scope (downstream scope applied)

---

## 4. Authorization Audit

### Authorization Engine (`authorization.ts`)
Well-structured: permission check → resource policy → company boundary fallback.

**P2 Gap:** The `default` case (line 122-131) returns `true` if resource has same `company_id`. New permissions added to the matrix without a corresponding policy `case` will silently grant access.

### Critical Findings

**P0-003 — `POST /tasks` — No permission guard:**
```ts
router.post('/', authenticateToken, validateRequestBody(TaskCreateSchema), ...
```
No `requireAuthz`. Any authenticated user can create tasks and assign them to colleagues. Company boundary check exists at line 107 (assignee's company), but no role/permission filter.

**P0-002 — SALES_MANAGER reassignment blocked by policy:**
- Permission matrix: `LEADS_ASSIGN` ✅
- Route: `requireAuthz(Permissions.LEADS_ASSIGN)` → calls `can()` with resource
- `can()` → `LeadPolicy.canReassign()` → `this.isManagement(user)`
- `isManagement()` lists: MD, ADMIN, HR_MANAGER, MARKETING_DIRECTOR, DIGITAL_LEAD_OPERATOR — **SALES_MANAGER absent**
- Result: Every reassignment by SM returns 403

**P0-001 — TELECALLER lead creation blocked:**
- `POST /leads` → `requireAuthz(Permissions.LEADS_CREATE)`
- `TELECALLER` matrix: `LEADS_READ`, `LEADS_UPDATE`, `LEADS_WHATSAPP_PROPOSAL` — **no `LEADS_CREATE`**
- Result: All AddLeadWizard submissions return 403

**P1-001 — `/finance` route unguarded:**
```ts
// App.tsx:230
<Route path="/finance" element={<FinanceHub />} />
```
No permission or role check. Any authenticated user can navigate to `/finance`. Sidebar hides the item by role but direct URL bypasses that.

---

## 5. Tenant Isolation Audit

### Tenancy Risk Matrix

| Entity | Query Pattern | Company Scoped | Risk |
|---|---|---|---|
| Leads (list) | `buildLeadScope()` | ✅ | No issue |
| Leads (single, mutations) | `findUnique(id)` then policy | ⚠️ | P2 — fetch-first IDOR pattern |
| Customers (list/single) | `buildCustomerScope()` + `findFirst(id, scope)` | ✅ | No issue |
| Properties | `buildPropertyScope()` | ✅ | No issue |
| Projects | `buildProjectScope()` | ✅ | No issue |
| Tasks (list) | `findMany({ assignee: { company_id } })` | ✅ | No issue |
| Tasks (single update) | `findUnique` + company check via assignee | ✅ | No issue |
| Site visits | Service-level company check | ✅ | No issue |
| Analytics | `company_id = req.user.companyId` | ✅ | P1: `?? 1` fallback |
| HR/Employees | `buildEmployeeScope()` | ✅ | No issue |
| Admin routes | Global counts — intentional | ✅ (Admin) | Intentional |

### Lead Single-Fetch IDOR Pattern
Multiple service methods use:
```ts
const lead = await p.lead.findUnique({ where: { id: leadId } });
// then: if (!can(user, ..., lead)) throw 403
```
This reveals lead existence (404 vs 403) before authorization. If policy logic ever regresses, cross-company data is exposed. **P1** for mutations, **P2** for reads.

**Recommended pattern:**
```ts
const lead = await p.lead.findFirst({ where: { id: leadId, company_id: user.companyId } });
if (!lead) throw new AppError(404, 'Lead not found or access denied');
```

---

## 6. Lead Lifecycle Audit

| Transition | Route | Service | `created_by_id` mutated? |
|---|---|---|---|
| Create (manual) | `POST /leads` | `createLead()` | Set from `user.employeeId` + `delete dto.created_by_id` ✅ |
| Create (bulk) | `POST /leads/bulk-upload` | `bulkUploadLeads()` | Set from `user.employeeId` ✅ |
| Reassign | `POST /leads/:id/assign` | `reassignLead()` | Only `assigned_to_id` ✅ |
| Status update | `PATCH /leads/:id/status` | `updateLeadStatus()` | Only `status`, `last_contacted_at` ✅ |
| Site visit verify | `POST /site-visits/:id/verify` | `verifyVisit()` | Only lead `status` ✅ |
| Site visit complete | `POST /site-visits/:id/complete` | `completeVisit()` | Only lead `status` ✅ |
| Customer convert | `POST /leads/:id/convert-to-customer` | `convertFromLead()` | Only lead `status = WON` ✅ |

**`created_by_id` is immutable across all verified mutation paths.**

**P2 Note:** `LeadPolicy.getValidTransitions()` defines a narrow state machine (NEW→ASSIGNED→CONTACTED→QUALIFIED→SITE_VISIT_SCHEDULED→WON) that does not include LOST, NEGOTIATION, OPPORTUNITY_OPEN, RECOVERED_TO_POOL — all of which are in `LeadStatus` in shared. The actual `WorkflowEngine.canTransition()` used by the service handles the real transitions. The policy's `getValidTransitions` appears unused/legacy — causes confusion about which rules are authoritative.

---

## 7. Analytics Audit

### KPI Definitions

| KPI | Numerator / Filter | Denominator | Tenant Safe | Issue |
|---|---|---|---|---|
| Total Leads | `count WHERE company_id` | — | ✅ | No issue |
| Won Leads | `count WHERE status=WON AND company_id` | — | ✅ | No issue |
| Site Visits Scheduled | `lead.count WHERE status=SITE_VISIT_SCHEDULED` | — | ✅ | Note: counts lead status, not visit records |
| Total Bookings | `booking.count WHERE company_id` | — | ✅ | Includes all statuses (cancelled too) |
| Attendance Exceptions | Active employees - (stamped today) | Company employees | ✅ | Server local midnight — verify IST |
| Team Performance | Per-employee formula score | Company employees | ✅ | No issue |
| Target Attainment | IST daily | Report employee company | ✅ | Clear definition |

### SM Dashboard KPIs — Specific Issues

| KPI | Issue |
|---|---|
| `newLeads` | status=NEW, not "created today" — ambiguous label **P3** |
| `conversionRate` | `won / totalLeads * 100` — denominator is all leads. Low rate, potentially misleading **P3** |
| `overdueTasks` | Only counts `PENDING` past deadline, not `IN_PROGRESS` **P3** |
| Attribution table | Groups by `created_by_id` ✅ |
| Team performance table | Groups by `assigned_to_id` ✅ |

---

## 8. Mobile/PWA Audit

### What Exists
- `MobileBottomNav.tsx` — bottom navigation for mobile
- `PWAInstallPrompt.tsx` — install banner
- Vite PWA plugin — service worker + manifest generated
- `overflow-x-auto` on all tables

### Issues
- **Sidebar always DOM-present** at 260px fixed width. No hamburger toggle. On phones, content is compressed and potentially unusable without scrolling. `MobileBottomNav` provides navigation but the sidebar overlaps. **P2**
- **ProductTour on mobile** — may fail to overlay correctly when target elements are in collapsed sidebar groups. **P2**
- **Modal forms** (`AddLeadWizard`, Lead Dossier) — built for desktop. Functional but tight on small viewports. **P2**
- **Tables** — `overflow-x-auto` applied, acceptable for beta.

---

## 9. Dashboard Coverage

| Role | Dashboard | Status |
|---|---|---|
| MD | `MDExecutiveDashboard` | ✅ |
| ADMIN | `AdminCommandCenter` | ✅ |
| HR_MANAGER | `HRDashboard` | ✅ |
| PROJECT_MANAGER | `PMDashboard` | ✅ |
| SALES_MANAGER | `SalesManagerDashboard` | ✅ |
| TELECALLER | `TelecallerDashboard` | ✅ |
| MARKETING_DIRECTOR | **StaffDashboard fallback** | ❌ |
| DIGITAL_LEAD_OPERATOR | **StaffDashboard fallback** | ❌ |
| DIGITAL_MARKETING_HEAD | **StaffDashboard fallback** | ❌ |
| FINANCE | **StaffDashboard fallback** | ❌ |
| AGENT | **StaffDashboard fallback** (AgentSiteVisitsDashboard deprecated) | ❌ |
| DIGITAL_MARKETING_EXECUTIVE | **StaffDashboard fallback** | ❌ |

6 of 12 roles have no dedicated dashboard. StaffDashboard shows tasks + performance score — functional but generic.

---

## 10. Testing Infrastructure

**No test runner in any package.json.** No Jest, Vitest, Mocha, or Supertest.

### Recommended Framework
- **Backend:** Vitest + Supertest
- **Frontend:** Vitest + React Testing Library

### Highest-Priority Tests (in order)

1. `TELECALLER can POST /leads` — core P0 flow
2. `SALES_MANAGER can POST /leads/:id/assign` — core SM function
3. `created_by_id cannot be set by client in POST /leads` — attribution immutability
4. `Cross-company lead read denied` — tenant isolation
5. `Lead status state machine transitions` — business rule correctness
6. `buildLeadScope returns correct filters per role` — tenant safety

---

## 11. P0 Findings — MUST FIX BEFORE BETA

### P0-001 — TELECALLER Cannot Create Leads
**File:** `packages/shared/src/index.ts`, `RolePermissionsMatrix[Roles.TELECALLER]`, lines 324–346
**Problem:** `LEADS_CREATE` missing from TELECALLER permissions.
**Fix:** Add `Permissions.LEADS_CREATE` to `[Roles.TELECALLER]` array.

### P0-002 — SALES_MANAGER Cannot Reassign Leads
**File:** `apps/api/src/policies/lead.policy.ts`, `isManagement()`, lines 14–24
**Problem:** `SALES_MANAGER` not in `isManagement()`. `canReassign()` always returns `false` for SM.
**Fix:** Add `Roles.SALES_MANAGER` to the `isManagement()` array. Also add to `canMutate()` management check.

### P0-003 — `POST /tasks` Has No Permission Guard
**File:** `apps/api/src/routes/tasks.ts`, line 100
**Problem:** `router.post('/')` uses only `authenticateToken` — no `requireAuthz`. Any authenticated user can create and assign tasks.
**Fix:** Introduce `TASKS_CREATE` permission (or reuse `TASKS_ASSIGN`) and add `requireAuthz` to `POST /tasks`. Add to matrix for: MD, ADMIN, MARKETING_DIRECTOR, SALES_MANAGER, HR_MANAGER, PROJECT_MANAGER, DIGITAL_LEAD_OPERATOR.

---

## 12. P1 Findings

### P1-001 — `/finance` Route Unguarded
**File:** `apps/web/src/App.tsx`, line 230
**Problem:** Any authenticated user can navigate to `/finance` by URL. No route-level guard.
**Fix:**
```tsx
<Route path="/finance" element={
  (isMD || isTechAdmin || user?.roles?.includes(Roles.FINANCE))
    ? <FinanceHub />
    : <Navigate to="/" replace />
} />
```

### P1-002 — Analytics `companyId ?? 1` Fallback
**File:** `apps/api/src/routes/analytics.ts`, lines 37, 52
**Problem:** If `companyId` is undefined in JWT, silently queries company ID 1.
**Fix:** Replace with explicit check:
```ts
const companyId = req.user!.companyId;
if (!companyId) return res.status(400).json({ error: 'Company context required' });
```

### P1-003 — Lead Single-Fetch IDOR Pattern
**File:** `apps/api/src/services/lead.service.ts`, multiple locations
**Problem:** `p.lead.findUnique({ where: { id } })` without company scope before policy check.
**Fix:** Change to `findFirst({ where: { id, company_id: user.companyId } })` for all mutation paths.

### P1-004 — Task Assignee Lookup Leaks Existence
**File:** `apps/api/src/routes/tasks.ts`, line 106
**Problem:** `p.employee.findUnique({ where: { id: assignee_id } })` — if the employee exists but belongs to another company, response reveals existence.
**Fix:** Add `where: { id: assignee_id, company_id: req.user!.companyId }` to fail fast.

---

## 13. P2 Findings

| ID | Area | Description | File |
|---|---|---|---|
| P2-001 | Authorization | `can()` default fallback silently grants access for unmapped permissions | `authorization.ts:122` |
| P2-002 | Lead lifecycle | `LeadPolicy.getValidTransitions()` is unused/legacy — conflicts with WorkflowEngine | `lead.policy.ts:88` |
| P2-003 | Mobile | Sidebar fixed 260px, no hamburger toggle for mobile | `AppLayout.tsx:112` |
| P2-004 | Mobile | ProductTour may not position correctly on mobile | `ProductTour.tsx` |
| P2-005 | Mobile | Modal forms overflow on ~360px viewports | Various |
| P2-006 | Security | `reassignLead` — `findUnique` without company scope before policy | `lead.service.ts:313` |
| P2-007 | Roles | 6 roles have no dedicated dashboard | `App.tsx:186-204` |
| P2-008 | Security | `reassignLead` doesn't verify assignee belongs to same company as lead | `lead.service.ts:320` |

---

## 14. P3 Findings

| ID | Area | Description |
|---|---|---|
| P3-001 | Analytics | SM "New Leads" = status=NEW, not created-today — ambiguous |
| P3-002 | Analytics | SM `conversionRate = won/total` — misleading denominator |
| P3-003 | Analytics | Overdue tasks only counts PENDING, not IN_PROGRESS past deadline |
| P3-004 | UX | `AgentSiteVisitsDashboard.tsx` is deprecated stub |
| P3-005 | UX | `ContextualRail` is placeholder with non-functional filters |
| P3-006 | UX | `GlobalSearchInput` header search is non-functional |
| P3-007 | Testing | No test infrastructure |
| P3-008 | Auth | 30-min idle timer affects all roles equally — may disrupt long-running MD sessions |
| P3-009 | Roles | DME `LEADS_UPDATE` scope not confirmed via dataScope audit |
| P3-010 | Admin | `activeConnections: 1` in system-metrics is hardcoded |

---

## 15. Fixes Applied (This Phase)

**None.** This is an audit-only phase per instructions.

**NEXT+1 fixes confirmed working:**
- ✅ `delete dto.created_by_id` in `lead.service.ts:156`
- ✅ Attribution immutability contract comment block
- ✅ Lead Dossier visual distinction (Introduced By / Assigned To)
- ✅ AddLeadWizard: attribution badge, orphaned state removed
- ✅ SalesManagerDashboard: operational vs attribution pills
- ✅ tourDefinitions: lead-attribution-block step

---

## 16. Build Results

```
npm run build → exit code 0

@rrh-ems/api    → tsc ✅
@rrh-ems/web    → tsc && vite build ✅ (2375 modules, 8.91s)
@rrh-ems/shared → tsc ✅

Pre-existing Vite warnings (not from this audit):
- TaskManager.tsx: dynamic + static import conflict
- PropertyManagement.tsx: dynamic + static import conflict
```

---

## 17. Recommended NEXT+3 Scope

**Required before beta (P0+P1):**

1. Add `LEADS_CREATE` to `TELECALLER` permissions matrix — `shared/src/index.ts`
2. Add `SALES_MANAGER` to `LeadPolicy.isManagement()` — `lead.policy.ts`
3. Add `requireAuthz` to `POST /tasks` — introduce `TASKS_CREATE` permission — `tasks.ts`
4. Guard `/finance` route in `App.tsx`
5. Remove `?? 1` fallback from analytics routes
6. Fix assignee company check in `reassignLead` — `lead.service.ts:320`

**Important quality (P2):**

7. Dedicated dashboards for: MARKETING_DIRECTOR, DIGITAL_LEAD_OPERATOR, AGENT
8. Mobile sidebar: hamburger toggle or mobile-only bottom-nav-only mode
9. Change all `findUnique(id)` lead fetches to `findFirst(id, company_id)` pattern
10. Add explicit deny to `can()` default fallback

**Future improvement (P3):**

11. Fix SM dashboard KPI definitions
12. Add test infrastructure (Vitest + Supertest)
13. Replace deprecated `AgentSiteVisitsDashboard` stub
14. Implement `GlobalSearchInput`

---

## Beta Readiness Verdict

```
BETA READINESS: NOT READY → CONDITIONALLY READY

Three P0 bugs prevent core workflows from functioning:

1. Telecallers — the primary lead-capture workforce — receive 403 on every
   lead creation attempt. The UI presents the AddLeadWizard but the backend
   rejects all submissions.

2. Sales Managers — whose entire function is team pipeline management —
   receive 403 on every lead reassignment attempt. The `LEADS_ASSIGN`
   permission is granted but blocked by missing policy registration.

3. Any authenticated user can create and assign tasks without permission
   through POST /tasks, constituting a privilege escalation vulnerability.

Resolve P0-001 through P0-003 and P1-001 (finance route guard).
After those four targeted fixes, the system is CONDITIONALLY READY for a
controlled internal beta with live monitoring.

The tenant isolation architecture is sound. Lead attribution is immutable.
The authorization engine is correctly structured. The build is clean.
The platform is very close to beta — these are narrow, fixable gaps.
```
