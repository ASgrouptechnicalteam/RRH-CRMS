**RRH-CRMS**  
**Complete Current-State → Future-State Portal Implementation Blueprint**

*Pre-Execution Architecture, Security Remediation, RBAC, Workflows, Pages, Daily Operations & Verification Specification*

Document status: PRE-EXECUTION / NO IMPLEMENTATION STARTED

Purpose: establish exactly what is wrong in the present portal, what will change, how the new portal will be implemented, how authorization will work, what every role can see/do, how daily work flows through the system, and how completion will be verified.

# **1\. Executive Summary**

The existing RRH-CRMS codebase contains functional modules, role-aware frontend navigation and multiple business workflows, but the second-pass verification identified security, authorization, data-scope, workflow, auditability and architecture weaknesses. The implementation must therefore be treated as a controlled portal transformation rather than a collection of isolated bug fixes.

The target architecture is a server-authoritative, permission-based and scope-aware CRM/operations portal. Frontend visibility is only a usability layer. Every API operation must independently enforce permission, resource scope, ownership/assignment and workflow state.

Implementation will proceed in gated phases: baseline and evidence first; security/data-scope fixes second; centralized RBAC third; domain/workflow extraction fourth; audit/rate-limit/dashboard hardening fifth; then missing business modules and operational enhancements.

# **2\. Present Portal: What Exists Today**

| Area | Current State | Implication |
| :---- | :---- | :---- |
| Authentication | Login, change-password, me, logout exist; refresh-token utility exists but no refresh route | Issued refresh tokens are not operationally used |
| JWT secrets | Development fallback secrets exist in jwt utility | Unsafe if deployed without explicit environment configuration |
| Web token storage | Access token stored in localStorage | XSS can expose bearer token |
| Authorization | Frontend hides navigation; backend relies heavily on role checks | Direct API calls can bypass UI visibility |
| Employee data | Sensitive fields are returned from employee endpoint without field-level response authorization | PAN/Aadhaar/bank/salary need explicit authorization |
| Site visits | Completion endpoint lacks assigned-agent ownership validation | Authenticated user may complete another user's visit |
| Properties | Workflow endpoints use role checks without complete assignment/scope enforcement | A permitted role may act on another PM's property |
| Leads | Reassignment lacks complete data-scope validation | Unauthorized cross-scope reassignment risk |
| Audit | Expense refund and CP commission approval actions lack required audit events | Critical business decisions lack traceability |
| Performance | Score formula duplicated across endpoints/frontend | Different surfaces can drift |
| Login protection | No login rate limiting | Brute-force/credential-stuffing exposure |
| Business modules | Customer, Project, Booking, Payment, Document and escalation/preferences modules are absent | Portal does not yet cover full operational lifecycle |

# **3\. Verified Security Findings and Remediation Strategy**

| ID | Verified present-code problem | Planned response |
| :---- | :---- | :---- |
| SF-001 | Missing /auth/refresh | Add refresh endpoint; validate server-side session/token; rotate refresh token; reuse detection; revoke token family. |
| SF-002 | Hardcoded JWT development fallbacks | Require environment secrets; separate access/refresh secrets; fail production startup when missing/insecure. |
| SF-003 | Access token in localStorage | Move access token to memory; keep refresh token in secure httpOnly cookie; refresh automatically. |
| SF-004 | No refresh rotation/reuse detection | Persist session/token-family state; rotate on refresh; revoke on reuse/logout. |
| SF-005 | Sensitive employee fields exposed without field-level filtering | Introduce employees.view\_sensitive; filter server-side; decrypt only after authorization; never expose unauthorized fields. |
| SF-006 | Site visit IDOR | Require assigned\_agent\_id match for agent actions; apply ownership checks to read/update/complete endpoints; preserve MD/Admin override. |
| SF-007 | Property workflow IDOR | Require assigned\_pm\_id for PM workflow actions; organization override only for authorized roles. |
| SF-008 | Lead reassignment/data scope | Apply ownership/scope rules to read, update, status changes, assignment and matching. |
| SF-009 | Missing audit events | Create auditable events for expense, CP payout, security and sensitive-data actions. |
| SF-010 | Duplicated performance calculation | Create one performance service and make every dashboard/API consume it. |
| SF-011 | No login rate limit | Apply 5 attempts/min/IP plus account protection, proxy awareness, 429 responses and security events. |
| SF-012 | Frontend-only visibility | Replace UI-only assumptions with server-side permission enforcement on every protected endpoint. |

# **4\. Security Design Principles for the New Portal**

* Backend is the final authority for authorization; frontend route guards and hidden buttons never grant access.  
* Authorization is evaluated as Permission \+ Role \+ Resource \+ Action \+ Data Scope \+ Ownership/Assignment \+ Workflow State.  
* Sensitive data is denied by default and returned only when the caller has explicit employees.view\_sensitive permission.  
* Refresh tokens are never accepted from localStorage.  
* Security-sensitive events are auditable and include actor, action, target, result and timestamp without storing secret values.  
* Database/query filtering is preferred over fetching broad datasets and filtering in React.  
* Workflow transitions are explicit and state-validated; endpoints cannot arbitrarily jump between states.  
* Every critical vulnerability receives a regression test.  
* Changes are introduced in phases with a verification gate before the next phase.

# **5\. Target Portal Architecture**

| Layer | Target responsibility |
| :---- | :---- |
| Web/PWA | Role-aware navigation, dashboards, forms, workflow controls, offline-friendly UX where appropriate; never authoritative for security. |
| API Controllers | Validate request shape, authenticate user, invoke permission/scope checks, call domain services, return sanitized DTOs. |
| Authorization Service | Central can(user, permission, resource, scope) evaluation. |
| Data Scope Service | Resolves NONE/OWN/TEAM/DEPARTMENT/ORGANIZATION/ASSIGNED filters at query level. |
| Domain Services | Lead, Property, Site Visit, Expense, CP and Performance business logic. |
| Workflow Layer | Validates current state, allowed transition, actor permission/scope and side effects. |
| Persistence | Prisma/database models, session/token families, audit events, business entities. |
| Notification Layer | Workflow notifications and user preferences. |
| Scheduled/Background Jobs | SLA overdue detection, escalation and other asynchronous operational tasks. |
| Audit/Security Layer | Immutable-style event trail for critical actions, access and security events. |

# **6\. Target Role Model — 13 Authoritative Roles**

| Role | Display | Primary scope | Landing/dashboard |
| :---- | :---- | :---- | :---- |
| MD | Managing Director | Executive / organization-wide | MDExecutiveDashboard |
| ADMIN | Admin (Technical) | System administration; no sensitive employee fields | AdminAnalyticsPortal / SystemControlHub |
| MARKETING\_DIRECTOR | Marketing Director | Marketing \+ organization lead management | LeadManagement |
| PROJECT\_MANAGER | Project Manager | Assigned properties/site visits \+ team tasks | PMDashboard |
| DIGITAL\_LEAD\_OPERATOR | Digital Lead Operator | Lead operations/distribution | LeadManagement |
| TELECALLER | Telecaller | Assigned leads and daily calling workflow | TelecallerDashboard |
| CHANNEL\_PARTNER\_MANAGER | Channel Partner Manager | CP lifecycle and payouts | ChannelPartnerManagement |
| DIGITAL\_MARKETING\_HEAD | Digital Marketing Head | Marketing/content/property polish | LeadManagement \+ PropertyManagement |
| HR\_MANAGER | HR | Employees, attendance, HR queues | HRDashboard |
| FINANCE | Accountant | Expense review/refunds and financial visibility | FinanceHub |
| AGENT | Agent | Assigned field site visits | AgentSiteVisitsDashboard |
| CHANNEL\_PARTNER | Channel Partner | Own CP information, protected leads, own visits/payouts | SiteVisitManagement (limited) |
| DIGITAL\_MARKETING\_EXECUTIVE | Digital Marketing Executive | Assigned leads/content/daily marketing work | LeadManagement |

# **7\. Canonical Permission Model**

* employees.create / read / update / delete / view\_sensitive / manage\_default:all / reset\_password  
* leads.create / read / update / delete / assign / bulk\_upload / distribution\_monitor / whatsapp\_proposal  
* properties.create / read / update / delete / verify / dm\_polish / md\_approve  
* site\_visits.create / read / verify / assign\_agent / complete  
* channel\_partners.create / read / update / calculate\_commission / protect\_lead / payouts.read / payouts.approve  
* tasks.create / read / update / assign  
* attendance.read\_own / scan / late\_proposal / leave\_proposal / proposals\_queue / live\_monitor  
* reports.create / read\_own / read\_team / targets.configure  
* expenses.create / read\_own / review / md\_approve / mark\_refunded  
* performance.read\_own / read\_team / history  
* admin.system\_metrics / audit\_logs / security\_alerts / emergency\_lockdown  
* public.properties.read / public.leads.create

# **8\. Role → Permission Operating Model**

| Role | Core capabilities |
| :---- | :---- |
| MD | ALL permissions; organization-wide override; final approvals; executive dashboards; targets and governance. |
| ADMIN | System metrics, audit/security, emergency controls, employee read/update and technical administration; explicitly denied sensitive employee fields. |
| HR\_MANAGER | Employee create/read/update/reset password; sensitive employee data; attendance queues/live monitor; HR tasks/reports/performance. |
| MARKETING\_DIRECTOR | Full lead operations, manual assignment, bulk upload, DM polish/approval workflow participation, targets and team performance. |
| PROJECT\_MANAGER | Assigned property verification, assigned site-visit dispatch/management, team tasks, assigned lead visibility. |
| DIGITAL\_LEAD\_OPERATOR | Lead creation/update/assignment/bulk distribution/monitoring; site-visit creation/verification; CP read; targets. |
| TELECALLER | Assigned leads, lead updates, WhatsApp proposal, site visits, own tasks, attendance proposals/scan, own reports/performance. |
| CHANNEL\_PARTNER\_MANAGER | CP management, commission calculation, protected leads, payout operations and team performance. |
| DIGITAL\_MARKETING\_HEAD | Property DM polish, marketing leads/content visibility, targets and team performance. |
| FINANCE | Expense review/refund processing, CP payout financial visibility/calculation, authorized sensitive employee fields. |
| AGENT | Assigned site visits, completion with feedback/photo, own tasks/checklist, attendance, reports/performance. |
| CHANNEL\_PARTNER | Own CP records/payouts, protected leads, own site visits. |
| DIGITAL\_MARKETING\_EXECUTIVE | Assigned leads, lead updates, site visits, own tasks/reports/attendance/performance. |

# **9\. Page Visibility and Route Behavior**

| Role | Pages/navigation visible | Data scope |
| :---- | :---- | :---- |
| MD | Executive dashboard; Employees; Leads; Properties; Site Visits; Channel Partners; Tasks; Attendance; Reports; Expenses; Performance; Admin/security where applicable | Organization-wide |
| ADMIN | System Control/Admin analytics; technical employee management; audit/security; permitted operational pages | Organization-wide but sensitive employee fields denied |
| HR\_MANAGER | HR Dashboard; Employee Directory; Attendance queues/live; Tasks; Team Reports; Team Performance | HR/team scope |
| MARKETING\_DIRECTOR | Lead Management; Property DM workflow; Site Visits; Targets; CP read; Performance | Marketing/org scope per permission |
| PROJECT\_MANAGER | PM Dashboard; assigned Properties; Site Visits; Team Tasks; assigned Leads; own Reports | Assigned/team |
| DIGITAL\_LEAD\_OPERATOR | Lead Management; Distribution Monitor; Site Visits; CP read; Targets | Org lead scope |
| TELECALLER | Telecaller Dashboard; My Leads; Site Visits; My Tasks; Attendance; Daily Reports; My Performance | Own/assigned |
| CHANNEL\_PARTNER\_MANAGER | CP Management; CP Payouts; protected leads; relevant Site Visits; Performance | CP organization scope |
| DIGITAL\_MARKETING\_HEAD | Lead Management; Property Management/DM Polish; Targets; Performance | Marketing/department |
| FINANCE | Finance Hub; Expense queues; authorized financial views; CP payout read | Finance/department |
| AGENT | Agent Site Visits Dashboard; assigned visits; checklist; own tasks/reports/attendance/performance | Assigned/own |
| CHANNEL\_PARTNER | Limited Site Visit Management; Own CP/Payouts; Protected Leads | Own |
| DIGITAL\_MARKETING\_EXECUTIVE | Lead Management (assigned); Site Visits; own tasks/reports/attendance/performance | Own/assigned |

Important: page visibility is not permission. A hidden page is still protected if a user directly calls its API or URL.

# **10\. Daily Workflow by Role**

| Role | Expected daily operating sequence |
| :---- | :---- |
| MD | Review executive KPIs → lead funnel → property pipeline → attendance exceptions → CP/payout status → approve final workflows → review escalations/security → set targets/decisions. |
| ADMIN | Monitor system health → review security alerts/audit → manage technical controls → investigate failures → execute emergency controls only when authorized. |
| MARKETING\_DIRECTOR | Review lead intake/distribution → bulk/manual assignment → monitor conversion → review marketing targets → participate in property content workflow → monitor team performance. |
| PROJECT\_MANAGER | Review assigned properties → verify pending properties → review today's site visits → assign agents → monitor completion → manage team tasks → review operational reports. |
| DIGITAL\_LEAD\_OPERATOR | Review new/unassigned leads → bulk upload/distribute → rebalance workloads → monitor telecaller load → create/verify site visits → review lead closure metrics. |
| TELECALLER | Check attendance → open assigned leads → call/contact → qualify/update status → follow up → book and verify site visits → update tasks → submit daily report. |
| CHANNEL\_PARTNER\_MANAGER | Review CP pipeline → register/manage partners → protect leads → calculate commissions → monitor payout queue → coordinate partner follow-ups → review performance. |
| DIGITAL\_MARKETING\_HEAD | Review content/property polish queue → polish/approve DM content as authorized → monitor marketing leads → coordinate DME work → review department metrics. |
| HR\_MANAGER | Review employee directory → onboard/update staff → review late/leave queue → monitor live attendance → resolve HR requests → review team reports/performance. |
| FINANCE | Review expense queue → accountant approve/reject → process MD-approved refunds → record refund → review financial CP payout data → reconcile records. |
| AGENT | Check attendance → open assigned site visits → travel/visit → complete checklist → capture feedback/proof photo → submit completion → update own tasks/report. |
| CHANNEL\_PARTNER | Review own protected leads → follow partner/site-visit activity → view own payouts → submit/coordinate protected lead actions → attend assigned visits. |
| DIGITAL\_MARKETING\_EXECUTIVE | Review assigned leads/content tasks → update lead status → create/follow site visits → execute daily marketing targets → update tasks → submit daily report. |

# **11\. Core Business Workflows After Implementation**

## **11.1 Lead Workflow**

NEW → ASSIGNED/NEW → CONTACTED → QUALIFIED → SITE\_VISIT\_SCHEDULED → CONFIRMED → ASSIGNED\_TO\_AGENT → COMPLETED → outcome (QUALIFIED/NEGOTIATION/CONTACTED) → WON or LOST. LOST leads may be recovered to the pool by authorized DLO/MD actions.

* Creation and bulk upload trigger distribution.  
* Manual reassignment requires leads.assign and valid scope.  
* Telecaller/DME can update only records within their assigned scope.  
* Site-visit booking creates the operational visit record and notification.  
* Every critical transition produces the defined audit event.

## **11.2 Property 3-Stage Approval**

DRAFT → PENDING\_VERIFICATION → PENDING\_DM\_POLISH → PENDING\_MD\_APPROVAL → LIVE, with rejection paths.

* Creator creates property and it is assigned for verification.  
* PM verifies only assigned property unless MD/Admin override applies.  
* DM Head/DLO/Marketing Director/MD/Admin perform authorized polish actions.  
* MD/Admin performs final approval.  
* Verification and approval history is retained.

## **11.3 Site Visit Workflow**

PENDING\_VERIFICATION → CONFIRMED/CANCELLED → ASSIGNED\_TO\_AGENT → COMPLETED.

* Tele/DME creates and verifies the visit within ownership scope.  
* PM assigns an agent only where permitted.  
* Agent can complete only assigned visits.  
* Completion records feedback/photo and updates related lead status.

## **11.4 Expense Refund Workflow**

PENDING → ACCOUNTANT\_APPROVED or REJECTED → MD\_APPROVED or REJECTED → REFUNDED.

* Employee submits own expense request.  
* Finance reviews and records accountant decision.  
* MD performs final approval.  
* Finance records payment/refund.  
* Every stage is audited.

## **11.5 CP Commission Workflow**

Commission calculation → two PENDING\_MD\_APPROVAL payout records (Level 1 \+ Level 2\) → MD approval → DISBURSED.

* Calculation is permission and scope protected.  
* Payout approval is separately authorized.  
* Commission/payout actions are audited.

# **12\. New Modules / Features Introduced**

| New feature/module | Purpose |
| :---- | :---- |
| Customers | New entity linked to leads/bookings; customer lifecycle and authorization. |
| Projects | Project entity linked to properties/leads; project-level operational context. |
| Bookings | Separate booking entity from SiteVisitBooking; booking lifecycle tied to customer/project/lead. |
| Payments | Payment records related to bookings/customers with authorized financial access. |
| Documents | Document entity, secure upload/storage, metadata and role/scope-controlled access. |
| Workflow SLA/Escalation | SLA definitions, due times, overdue detection, escalation rules and background processing. |
| Notification Preferences | Per-user preferences respected by notification service. |
| Digital Marketing Calendar | Content planning, assignment, approval, publishing and performance tracking. |
| Daily Work Requirements | Configurable role-specific targets, progress tracking and manager visibility. |
| Central RBAC | Canonical permissions, scopes and reusable authorization middleware/service. |
| Central Workflow Engine | Explicit state transitions, actor validation and side effects. |
| Central Performance Service | One authoritative scoring formula consumed by API/UI. |
| Security/Audit Layer | Security events, sensitive-data access events, approval history and refresh-token reuse detection. |

# **13\. Digital Marketing Workflow**

Marketing Strategy → Marketing Calendar → Task Creation → DME Assignment → Content Creation → Approval → Scheduling → Publishing → Performance Tracking → Lead Generation.

* Marketing Calendar stores content\_id, content\_type, platform, project, topic, content\_brief, assigned\_dme, creation deadline, approval deadline, publishing date/time, status, approval status, approved\_by, published URL, performance and leads generated.  
* Revision loop: READY\_FOR\_APPROVAL → REJECTED → REVISION → READY\_FOR\_APPROVAL.  
* DME sees own work; DM Head/Marketing Director see team/department; MD sees organization-wide.  
* Publishing and performance data must remain connected to campaign/content and lead-generation outcomes.

# **14\. Daily Work Requirements Module**

| Role | Example target categories |
| :---- | :---- |
| DME | Posts, reels, shorts, campaigns, website updates, video editing |
| Telecaller | Calls, connected, qualified, follow-ups, site visits |
| PM | Lead follow-ups, customer meetings, site visits, negotiations, bookings |
| CP Manager | New partners, partner follow-ups, agent follow-ups, partner leads |

* Management configures targets.  
* Employee sees own target and progress.  
* Managers see team/department progress according to scope.  
* Daily reports consume or reference target progress.

# **15\. Implementation Plan — How the Portal Will Actually Be Built**

| Phase | Implementation objective |
| :---- | :---- |
| Phase 0 — Discovery & Baseline | Freeze requirements; inspect repository; establish Jest/Playwright; create fixtures/users; execute existing behavior tests; document actual current routes/models; do not change business logic. |
| Phase 1 — P0 Security | Refresh/session security, JWT secrets, token storage, sensitive employee fields, IDORs, lead scope, audit gaps, performance centralization, login rate limit. |
| Phase 2 — Central RBAC | Create shared permission constants, AuthorizationService and requirePermission middleware; migrate route authorization. |
| Phase 3 — Data Scope | Implement reusable scope resolver and enforce query-level filtering across employees, leads, properties, site visits, expenses, CP, performance, targets, tasks and attendance. |
| Phase 4 — Domain Services | Extract lead, property, site visit, expense, CP and performance logic from routes into services. |
| Phase 5 — Workflow Engine | Formalize state machines, transition validation, side effects, notifications and audit events. |
| Phase 6 — Audit Completion | Close every missing critical audit event and verify security-event coverage. |
| Phase 7 — Performance | Ensure all score views use one authoritative service; remove frontend recalculation. |
| Phase 8 — Rate Limiting/API Hardening | Complete login controls, proxy awareness, account protection, 429 behavior and security events. |
| Phase 9 — Dashboard Refactor | Move dashboards to authorized APIs; remove duplicated calculations and unauthorized data fetching. |
| Phase 10 — Business Modules | Implement customers, projects, bookings, payments, documents, SLA/escalation and notification preferences. |
| Phase 11 — Digital Marketing | Implement marketing calendar and content workflow. |
| Phase 12 — Daily Work | Implement role-specific targets/progress and reporting integration. |
| Phase 13 — Full Verification | Run P0, workflow, regression, typecheck, lint, build, security and requirement-by-requirement acceptance. |

# **16\. File/Code Change Strategy**

| Current/target area | Planned change |
| :---- | :---- |
| apps/api/src/routes/auth.ts | Refresh endpoint, session validation, rotation/reuse behavior. |
| apps/api/src/utils/jwt.ts | Remove insecure fallbacks; strict environment configuration. |
| apps/api/src/middleware/auth.ts | Authentication/rate-limit integration as appropriate. |
| apps/api/src/routes/employees.ts | Field filtering, sensitive authorization, scope enforcement. |
| apps/api/src/routes/siteVisits.ts | Assignment/ownership checks and domain-service delegation. |
| apps/api/src/routes/properties.ts | Assignment/workflow scope checks and service delegation. |
| apps/api/src/routes/leads.ts | Ownership, scope and assignment enforcement. |
| apps/api/src/routes/expenseRefunds.ts | Authorization, workflow service and audit events. |
| apps/api/src/routes/cp.ts | Commission/payout scope, permissions and audit. |
| apps/api/src/routes/performance.ts | Consume performanceService instead of duplicating formula. |
| apps/api/src/services/authorization.ts | New central authorization engine. |
| apps/api/src/services/dataScope.ts | New reusable data-scope engine. |
| apps/api/src/middleware/requirePermission.ts | New permission middleware. |
| apps/api/src/services/{lead,property,siteVisit,expense,cp,performance}Service.ts | New domain services. |
| packages/shared/src/permissions.ts | Canonical permission definitions. |
| apps/web/src/context/AuthContext.tsx | Remove localStorage bearer token; in-memory access token \+ refresh flow. |
| apps/web dashboards | Remove authorization assumptions/calculations; consume protected APIs. |
| Prisma schema/migrations | Session/token family, new business entities and supporting relations. |

# **17\. Data Scope Rules**

| Scope | Meaning | Example |
| :---- | :---- | :---- |
| NONE | No records can be accessed | CP cannot read employee directory |
| OWN | Records directly owned by current user | Telecaller reads assigned leads |
| TEAM | Direct/team reporting scope | PM sees team tasks |
| DEPARTMENT | Department scope | Marketing sees department reports |
| ORGANIZATION | Organization-wide | MD executive reporting |
| ASSIGNED | Explicit resource assignment | Agent completes assigned visit; PM verifies assigned property |

# **18\. Sensitive Data Handling**

* Sensitive employee fields: PAN, Aadhaar, bank account number, bank IFSC and salary CTC.  
* MD, HR and Finance are the specified roles allowed to view sensitive fields; ADMIN is explicitly denied.  
* API DTOs must omit unauthorized fields rather than return encrypted placeholders unless the contract explicitly requires them.  
* Decryption occurs only after permission evaluation.  
* Sensitive values must never appear in logs, audit payloads, error messages or analytics.  
* Frontend components must not assume sensitive properties exist; they should render only when the authorized API response contains them.

# **19\. Authentication & Session Lifecycle**

1. User submits credentials to login endpoint.  
2. Server applies rate-limit/account protection and validates credentials.  
3. Server issues a short-lived access token and secure refresh-token session.  
4. Access token is held in application memory, not localStorage.  
5. When access token expires, the client performs one coordinated refresh operation.  
6. Server validates refresh token signature, expiry and database-backed session/token-family state.  
7. Server rotates the refresh token and issues a new access token.  
8. If reuse of an already-rotated token is detected, the token family/session is revoked and a security audit event is generated.  
9. Logout revokes the server-side session/token family and clears the refresh cookie.

# **20\. Testing and Verification Model**

Testing must be API-direct wherever authorization is being verified. A successful/hidden frontend button is not evidence of authorization.

| Test group | Acceptance requirement |
| :---- | :---- |
| T-001–T-016 | All P0 security tests pass with expected ALLOW/DENY outcomes. |
| W-001–W-014 | All workflow transitions pass and invalid actors/scopes are rejected. |
| Regression | Existing valid workflows continue to operate after each phase. |
| Typecheck | No type errors. |
| Lint | No blocking lint violations. |
| Production build | Build completes successfully. |
| Security | No known P0/P1 regression; sensitive fields protected; IDOR tests pass. |
| Requirement traceability | Every requirement maps to code, test and evidence. |

# **21\. Execution Gates**

10. Gate A — Repository baseline verified: current routes, models, middleware, dashboards and utilities confirmed against the source.  
11. Gate B — Test baseline established: P0/workflow fixtures and test users exist.  
12. Gate C — Security remediation verified before central refactor proceeds.  
13. Gate D — Central RBAC verified against the role/resource/action matrix.  
14. Gate E — Data scopes verified with positive and negative tests.  
15. Gate F — Workflow services verified without changing approved business transitions.  
16. Gate G — Dashboard/UI verified against API authorization; direct API tests remain mandatory.  
17. Gate H — New modules verified independently before being exposed in production navigation.  
18. Gate I — Final full regression and requirement-by-requirement sign-off.

# **22\. Definition of Done**

* All 12 verified security findings are remediated or explicitly accepted with documented risk.  
* All 13 roles exist and match the authoritative role list.  
* Permissions are centralized and backend-enforced.  
* Data scopes are enforced at query/API level.  
* Every protected endpoint has authorization independent of frontend visibility.  
* Refresh-token rotation and reuse detection are operational.  
* Sensitive employee fields are explicitly protected.  
* All critical workflows validate state, actor, permission and scope.  
* Audit events exist for critical approvals, security events and sensitive access.  
* Performance calculation exists in one authoritative service.  
* Dashboards consume authorized APIs and do not recalculate protected business values.  
* New business modules have models, services, routes, permissions, scopes and tests.  
* Daily work requirements and digital marketing workflows are integrated.  
* All P0/workflow/regression tests pass.  
* Typecheck, lint and production build pass.  
* Requirement-by-requirement evidence is attached to the final verification report.

# **23\. FINAL MASTER CHECKLIST — USER-PROVIDED IMPLEMENTATION CHECKLIST**

The following checklist is preserved as the execution checklist and must be completed only after the corresponding implementation and evidence exist.

## **Phase 0: Baseline Tests & Safety Infrastructure**

☐ Set up Jest for API unit tests

☐ Set up Playwright for E2E tests (already configured)

☐ Create test utilities and fixtures

☐ Create test users for each role

☐ Configure CI pipeline

☐ T-001: Telecaller can read own leads (ALLOW)

☐ T-002: Telecaller cannot read another user's leads (DENY)

☐ T-003: Telecaller cannot view sensitive employee fields (DENY)

☐ T-004: HR can view sensitive employee fields (ALLOW)

☐ T-005: ADMIN cannot view sensitive employee fields (DENY)

☐ T-006: PM can verify assigned property (ALLOW)

☐ T-007: PM cannot verify unassigned property (DENY)

☐ T-008: Agent can complete assigned site visit (ALLOW)

☐ T-009: Agent cannot complete unassigned site visit (DENY)

☐ T-010: Finance can review expense refunds (ALLOW)

☐ T-011: Finance cannot MD-approve expense refunds (DENY)

☐ T-012: MD can MD-approve expense refunds (ALLOW)

☐ T-013: DLO can reassign leads (ALLOW)

☐ T-014: DLO cannot reassign leads cross-org (DENY)

☐ T-015: Refresh token endpoint exists and works (ALLOW)

☐ T-016: Login rate limiting works (DENY after 5 attempts)

☐ W-001: Lead NEW → ASSIGNED (DLO creates)

☐ W-002: Lead ASSIGNED → ASSIGNED (MktDir reassigns)

☐ W-003: Lead QUALIFIED → SITE\_VISIT\_SCHEDULED (Tele books)

☐ W-004: Property PENDING\_VERIFICATION → PENDING\_DM\_POLISH (PM approves)

☐ W-005: Property PENDING\_DM\_POLISH → PENDING\_MD\_APPROVAL (DM Head polishes)

☐ W-006: Property PENDING\_MD\_APPROVAL → LIVE (MD approves)

☐ W-007: SiteVisit PENDING\_VERIFICATION → CONFIRMED (Tele verifies)

☐ W-008: SiteVisit CONFIRMED → ASSIGNED\_TO\_AGENT (PM assigns)

☐ W-009: SiteVisit ASSIGNED\_TO\_AGENT → COMPLETED (Agent completes)

☐ W-010: Expense PENDING → ACCOUNTANT\_APPROVED (Finance approves)

☐ W-011: Expense ACCOUNTANT\_APPROVED → MD\_APPROVED (MD approves)

☐ W-012: Expense MD\_APPROVED → REFUNDED (Finance marks refunded)

☐ W-013: CP Commission calculation creates PENDING\_MD\_APPROVAL (×2)

☐ W-014: CP Commission PENDING\_MD\_APPROVAL → DISBURSED (MD approves)

## **Phase 1: Security & Data-Scope Fixes**

☐ Create POST /api/v1/auth/refresh

☐ Validate refresh token from httpOnly cookie

☐ Verify signature and expiry

☐ Validate session/token state server-side

☐ Issue new short-lived access token (15–30 min)

☐ Rotate refresh token

☐ Detect refresh-token reuse

☐ On reuse: invalidate token family, require re-auth, create audit event

☐ Never accept refresh tokens from localStorage

☐ Remove hardcoded fallback JWT secrets

☐ Production startup fails if secrets missing/insecure

☐ Use separate access/refresh secrets

☐ Update environment examples/documentation

☐ Remove access token from localStorage

☐ Keep access token in memory

☐ Automatic refresh on expiry

☐ Retry original request after refresh

☐ Prevent simultaneous refresh requests

☐ Logout cleanly when refresh fails

☐ Implement database-backed token-family/session tracking

☐ Revocation support

☐ Reuse detection

☐ Logout invalidation

☐ Survive API restarts

☐ Create employees.view\_sensitive

☐ Server-side field filtering

☐ MD/HR/Finance allowed

☐ ADMIN denied

☐ Other roles denied

☐ Decrypt only when authorized

☐ Never log decrypted values

☐ Frontend never receives unauthorized fields

☐ Site visit complete ownership check

☐ Site visit read ownership check

☐ All site-visit cross-user access prevention

☐ MD/Admin organization override

☐ Property PM assignment check

☐ MD/Admin organization override

☐ All property endpoints scope checked

☐ Lead GET ownership/assignment

☐ Lead UPDATE ownership

☐ Status-change ownership

☐ Assignment/reassignment scope

☐ Matching ownership

☐ Expense submission audit

☐ Accountant approval/rejection audit

☐ MD approval/rejection audit

☐ Refund completion audit

☐ CP commission calculation audit

☐ CP payout approval audit

☐ Refresh reuse audit

☐ Sensitive-field access audit

☐ Role/permission change audit

☐ Create performanceService with one formula

☐ Remove duplicate endpoint formulas

☐ Remove duplicate frontend formula

☐ API/frontend consume same calculated values

☐ Login rate limit 5/min/IP

☐ Proxy awareness

☐ Account/email protection

☐ Successful-login reset

☐ HTTP 429

☐ No user enumeration

☐ Audit excessive failures

☐ Every protected endpoint enforces authorization server-side

☐ Direct API testing without frontend

## **Phase 2: Central Authorization Model**

☐ Create packages/shared/src/permissions.ts

☐ Define all canonical permissions

☐ Export permission constants

☐ Create apps/api/src/services/authorization.ts

☐ Implement can(user, permission, resource, scope)

☐ Support role/permission/resource/action/data scope/ownership/team/department/org/assignment/sensitive authorization

☐ Create requirePermission middleware

☐ Replace requireRole checks

☐ Preserve business behavior

## **Phase 3: Role/Resource/Action Matrix**

☐ Create dataScope.ts

☐ Support NONE/OWN/TEAM/DEPARTMENT/ORGANIZATION/ASSIGNED

☐ Enforce at database/query level

☐ Reusable scope resolver

☐ getFilter(user, resource, permission)

☐ employees.ts scope \+ sensitive

☐ leads.ts ownership/assignment

☐ properties.ts PM assignment/workflow

☐ siteVisits.ts ownership

☐ expenseRefunds.ts queue scope

☐ cp.ts commission/payout scope

☐ performance.ts team/org scope

☐ targets.ts role access

☐ tasks.ts assignment scope

☐ attendance.ts proposal queue scope

## **Phase 4: Workflow/Domain Service Extraction**

☐ Create leadService.ts

☐ Move lead business logic

☐ Auto-assignment/bulk/reassignment/status transitions

☐ Thin controllers

☐ Create propertyService.ts

☐ 3-stage approval

☐ Verification logs/audits

☐ Create siteVisitService.ts

☐ 4-stage workflow

☐ Lead status transitions

☐ Create expenseService.ts

☐ 3-level approval

☐ Audit each transition

☐ Create cpService.ts

☐ 2-level MLM

☐ Protection locks

☐ Create performanceService.ts

☐ Single authoritative formula

☐ All performance endpoints use it

## **Phase 5: Central Workflow Engine**

☐ Lead workflow definitions

☐ Property workflow definitions

☐ Site Visit workflow definitions

☐ Expense workflow definitions

☐ CP Commission workflow definitions

☐ Task workflow definitions

☐ Validate actor permissions

☐ Validate current state

☐ Validate role

☐ Validate scope

☐ Validate ownership/assignment

☐ Validate transition

☐ Execute side effects/notifications/audit

## **Phase 6–8: Audit / Performance / Rate Limiting**

☐ Complete expense audits

☐ Complete CP audits

☐ Refresh reuse audit

☐ Sensitive access audit

☐ Role/permission audit

☐ Security-sensitive actions

☐ Central performance formula

☐ my-score/team/leaderboard use service

☐ TeamPerformanceDashboard consumes API

☐ Remove duplicate calculations

☐ Login 5/min/IP

☐ Proxy awareness

☐ Account protection

☐ Successful-login reset

☐ 429

☐ No enumeration

☐ Excessive-failure audit

## **Phase 9: Dashboard Architecture**

☐ Shared lead funnel analytics

☐ Property pipeline analytics

☐ Attendance metrics

☐ Team metrics

☐ KPI calculations

☐ MD dashboard authorized APIs

☐ Admin portal authorized APIs

☐ HR dashboard authorized APIs

☐ Lead Management scope

☐ Property Management scope

☐ Site Visit Management scope

☐ CP Management scope

☐ Employee Management sensitive handling

☐ FinanceHub queue access

☐ Telecaller own data

☐ PM assigned data

☐ Agent assigned data

☐ Staff own data

☐ TeamPerformanceDashboard API-only

## **Phase 10: Missing Business Modules**

☐ Customers: Prisma model/service/routes/auth/Lead relationship

☐ Projects: model/service/routes/auth/Property/Lead relationships

☐ Bookings: separate model/service/routes/auth and Lead/Customer/Project relationships

☐ Payments: model/service/routes/auth and Booking/Customer relationships

☐ Documents: model/service/routes/auth/upload/storage/access control

☐ SLA/escalation: model/due time/overdue detection/rules/background mechanism

☐ Notification preferences: model/service/routes and notification enforcement

## **Phase 11: Digital Marketing Workflow**

☐ Marketing Calendar model

☐ content\_id/content\_type/platform/project/topic/content\_brief

☐ assigned\_dme/created\_date/creation\_deadline/approval\_deadline

☐ publishing\_date\_time/status/approval\_status/approved\_by

☐ published\_url/performance/leads\_generated

☐ Strategy → Calendar → Tasks

☐ DME assignment → creation → approval

☐ Scheduling → publishing → performance → lead generation

☐ READY\_FOR\_APPROVAL → REJECTED → REVISION → READY\_FOR\_APPROVAL

☐ DME own content

☐ DM Head/Marketing Director team/department

☐ MD organization-wide

## **Phase 12: Daily Work Requirements**

☐ DME targets: Post/Reel/Short/Campaign/Website/Video

☐ Telecaller targets: Calls/Connected/Qualified/Follow-ups/Site Visits

☐ PM targets: Follow-ups/Meetings/Site Visits/Negotiations/Bookings

☐ CP Manager targets: New Partners/Partner Follow-ups/Agent Follow-ups/Partner Leads

☐ Management configurable targets

☐ Employee own targets/progress

☐ Managers team/department progress

☐ Daily report integration

## **Phase 13: Testing & Final Verification**

☐ API-direct T-001 through T-016

☐ W-001 through W-014 state/permission/scope/ownership tests

☐ Regression test for every fixed vulnerability

☐ TypeScript/typecheck

☐ Lint

☐ Production build

☐ Existing functionality intact

☐ Requirement-by-requirement verification report

# **24\. Final Sign-Off**

| Gate | Status | Evidence / reference | Reviewer | Date |
| :---- | :---- | :---- | :---- | :---- |
| Current-state repository verification | PENDING |  |  |  |
| Security findings verified | PENDING |  |  |  |
| Implementation design approved | PENDING |  |  |  |
| Phase 0 baseline tests | PENDING |  |  |  |
| Phase 1 security fixes | PENDING |  |  |  |
| Phase 2–3 RBAC/scope | PENDING |  |  |  |
| Phase 4–8 services/security hardening | PENDING |  |  |  |
| Phase 9 dashboards | PENDING |  |  |  |
| Phase 10–12 new modules | PENDING |  |  |  |
| Phase 13 final verification | PENDING |  |  |  |
| Production readiness approval | PENDING |  |  |  |

Final rule: A checkbox may be marked complete only when implementation exists, automated/manual evidence exists, and the behavior has been verified against the approved requirement. Do not mark a requirement complete merely because code was written.