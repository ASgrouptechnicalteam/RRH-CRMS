# RRH-CRMS — UI/UX + RBAC + Workflow Master Specification

> **Status:** 🟡 CURRENTLY-ONLY (specification authoring in progress — no source files modified)
> **Source-of-truth:** `RRH-CRMS-RECONSTRUCTION-AUDIT.md` + live `prisma/schema.prisma`, `packages/shared/src/index.ts`.
> **Mode:** read-only specification. **No implementation, no source edits, no migrations.**

## 1. Document Purpose

This is the **authoritative Master UX / UI / RBAC / workflow specification** for the RRH-CRMS application. It reconstructs the *current* system from repository evidence (Layer 1) and defines the *target* user experience (Layer 2), preserving all business semantics, RBAC, data scopes, and workflow authority. It is implementation-ready but implements nothing.

## 2. Scope

**In scope:** every active RBAC role, every route, every dashboard, every page, every modal/drawer/dossier, every form and field, every status system, every workflow, every approval authority, global shell, mobile/desktop/tablet UX, accessibility, design tokens, component architecture, and implementation sequencing.

**Out of scope:** Channel-Partner / AGENT functionality (🟠), payment-gateway implementation, Customer-Portal front-end, AI/search features not supported by repository evidence.

## 3. Non-Goals

- Cosmetic facelift without behavioural rationale.
- Changing roles, permissions, data scopes, ownership, workflow transitions, or sensitive-data boundaries without an explicit `⚠ BUSINESS / RBAC DECISION REQUIRED`.
- Inventing fields, forms, dashboards, approval authorities, or business rules absent repository evidence.

## 4. Source-of-Truth Hierarchy

| Rank | Source | Role |
|---|---|---|
| 🔴 1 | **Current repository** (`apps/*`, `packages/shared`, `prisma`, `tests`) | Override audit if it diverges. |
| 🟢 2 | `RRH-CRMS-RECONSTRUCTION-AUDIT.md` | Canonical reconstruction baseline. |
| 🟡 3 | Spec author inference | Must be tagged `INSUFFICIENT REPOSITORY EVIDENCE`. |

## 5. Evidence Classification System

Every requirement carries a classification tag:

| Tag | Meaning |
|---|---|
| 🟢 CONFIRMED | Repository proves it. |
| 🟡 PRESENT / NEEDS REVIEW | Exists; UX semantics need review. |
| 🟴 CONFLICT / DEFECT | Frontend/backend/shared contract disagree. |
| ⚪ GAP | Modelled/required but not implemented. |
| 🟠 OUT OF SCOPE | Historical / Channel-Partner. |
| 🔴 BLOCKER | Must resolve before UI is correct. |
| 🔵 TARGET UX | Future design decision in this spec. |
| ⚠ BUSINESS DECISION REQUIRED | Needs product/approval. |
| 🔴 BACKEND DEPENDENCY | Needs API/schema/RBAC change. |

## 6. Design Principles

CORRECTNESS > BUSINESS WORKFLOW > RBAC > IA > USABILITY > VISUAL DESIGN. Do not invent business rules; do not silently change workflows; do not reduce functionality without evidence.

## 7. Product UX Principles

CRM-first · Workflow-first · Record-centric · Role-aware · Action-oriented · data-dense where appropriate · simple where appropriate · operationally fast. The app must help employees answer: what do I do now; what needs approval; what is overdue; what is assigned to me; what changed; what is blocked; what is the next action. Avoid decorative dashboards, giant marketing cards, excessive whitespace/animations.

## 8. Current-System vs Future-System Distinction

**LAYER 1 — CURRENT SYSTEM RECONSTRUCTION** (what exists; evidence from audit + repo). **LAYER 2 — FUTURE UI/UX DESIGN** (layouts, IA, navigation, responsive, components, states). Future design MUST preserve Layer 1 semantics unless tagged `⚠ BUSINESS DECISION REQUIRED`.

## 9. RRH-CRMS Product Architecture

**Monorepo:** `d:/HYD/RRH PWA` = RRH-CRMS. Workspace: `apps/api` (Express + Prisma + MySQL), `apps/web` (Vite PWA, React), `packages/shared` (canonical Roles/Permissions/enums/Zod DTOs), `prisma/schema.prisma` (35 models), `tests/` (68 files).

**Architecture:** thin API layer (`apps/api/src/routes/*.ts` → `services/*.ts` → `policies/*.ts` → `workflows/*.ts` → Prisma) consumed by a record-centric web client whose shell centralises RBAC. Backend is authoritative on authorization; **frontend RBAC is a UX affordance layer only** (it must never be the security mechanism).

**Current routes (19 declarations in `App.tsx`):** `/`, `/dashboard`, `/login`, `/change-password`, `/leads`, `/leads/:id`, `/leads-clients`, `/customers`, `/customers/:id`, `/sales-pipeline`, `/sales-pipeline/:id`, `/properties`, `/properties/:id`, `/projects`, `/projects/:id`, `/site-visits`, `/tasks`, `/tasks/:id`, `/bookings`, `/bookings/:id`, `/documents`, `/hr-hub`, `/finance`, `/analytics`, `/targets`, `/employees`, `/system-control`, `/notifications`, plus `*` → `/`. Of these, **17 are navigable**; `/proposals` appears in mobile nav but has **no route (404↗/)**.

## 10. Application Shell

Shared layout (`AppLayout`): **Sidebar** (`SIDEBAR_NAV_ITEMS`, 6 groups / 11 links — currently rendered to ALL roles, 🟴 D-03) + **Header** (global search, notifications bell, profile avatar) + **Main** + (mobile) **BottomNav** + **Drawer layer** (dossier/detail/modals). Shell wraps every authenticated route except auth flows (`/login`, `/change-password`, `/first-login`).

Global persistent elements:
- `GlobalAnnouncementBanner` (company-level announcements).
- `NotificationDrawer` (real-time via SSE, unread badge).
- `IdleLogout` (30-min idle → session-expiry UX).
- `PWAInstallPrompt` / `PushNotificationPrompt`.
- `WelcomeGuide` / `FirstLoginSetup` / `QRScannerModal`.

## 11. Global Navigation Architecture

Navigation visibility is **permission-aware (🔵 TARGET)**: visible / hidden / disabled / contextual / unavailable. The *current* sidebar renders every link to every user (🟴 D-03). The redesigned shell derives visible links from `user.permissions` + `Roles.*`; backend authorization remains authoritative.

Nav groups (canonical):
- **WORKSPACE** → Command Center (`/dashboard`)
- **CUSTOMER & SALES** → Leads (`/leads`), Leads & Clients (`/leads-clients`), Sales Pipeline (`/sales-pipeline`), Customers (`/customers`)
- **PROPERTY** → Properties (`/properties`), Projects (`/projects`), Site Visits (`/site-visits`)
- **TRANSACTIONS** → Bookings (`/bookings`), Documents (`/documents`), Tasks (`/tasks`), Complaints (`/tasks`? — see §59, current nav lists Tasks under TRANSACTIONS)
- **INTELLIGENCE** → Analytics (`/analytics`), Targets (`/targets`), Performance
- **FINANCE** → Payments / Finance (`/finance`)
- **ADMINISTRATION** → Employees (`/hr-hub`), System Control (`/system-control`)
- **PERSONAL** → Profile (`/profile`), Notifications (`/notifications`)

## 12. Desktop Navigation

Left-stacked vertical sidebar, collapsible, sticky header + scrollable nav list. Shows group label + icon. **Disabled state** for items whose primary permission is denied (tooltip shows "Contact your administrator" — never silently hidden in a way that hides workflow presence). Current defect: every link visible to every role (🟴 D-03); fix = gate by permissions.

## 13. Tablet Navigation

Sidebar collapses to icon-only rail; group labels hidden, tooltips on hover/focus. Same visibility rules as desktop. Touch targets ≥48dp.

## 14. Mobile Navigation

Bottom nav (3-5 icon tabs) + **More** drawer for remaining items. **🔵 TARGET** — must match the desktop IA (🟴 D-04: current mobile opens dead `/proposals`, omits customers/projects/bookings/documents/analytics). Current role detection is broken:
- `MobileBottomNav.isMD = user.roles.includes('MD')` → `'MD'` ≠ `Roles.MD='Managing director'` → MD System-Control hidden 🟴 D-02.
**Target mobile IA:** Home `/dashboard`, Leads `/leads`, Properties `/properties`, More… drawer (profile, tasks, site-visits, finance, system-control, analytics, customers, projects, bookings, documents). No dead routes. `isMD` uses `Roles.MD`.

## 15. Breadcrumb Architecture

Standard breadcrumb trail `Home > Section > Subsection > Record`. Reflects IA depth and record context. On mobile collapses to `Home > … > Record` with back chevron. Record breadcrumbs show canonical code (e.g. `LD-00123`, `CR-00456`, `PRJ-007`, `PROP-0321`, `BK-0089`, `PYMT-012`).

## 16. Global Search

**🟢 CONFIRMED:** search exists (`useGlobalSearch` hook). **🔵 TARGET** — global search is CRM-record-scoped (leads, customers, properties, bookings, employees by code/name/phone); NOT AI/semantic search (🟠 those are Phase 17, OOS here). Result groups by entity type; hits deeplink to record dossier. Search respects RBAC (a Telecaller will not see results they cannot read).

- Search fields: Lead (`customer_name`, `phone`, `email`, `lead_code`), Customer (`first_name`+`last_name`, `phone`, `email`, `customer_code`), Property (`title`, `property_code`, `location`, `project.name`), Booking (`booking_code`, `customer.name`), Employee (`full_name`, `employee_code`, `phone`).
- **⚠ BUSINESS DECISION REQUIRED:** exact result-ranking algorithm (repo shows `match_score`/`lead_score` fields but no global ranking service wired).

## 17. Notifications

**🟢 CONFIRMED current:** `Notification` model (id, employee_id, type, title, message, is_read, link, created_at); SSE stream; `NotificationDrawer`; unread badge in header. `CustomerNotification` is portal-scoped (OUT OF SCOPE for CRM edit here).

**🔵 TARGET UX:**
- Drawer with category filters (Leads, Bookings/Payments, Tasks, Workflows, System).
- Each item: icon per category, timestamp, unread dot, deep link to `link` URL.
- Bulk-mark-read; mark-all.
- Push opt-in prompt (PWA). 30-min idle does **not** auto-dismiss notification badge.

**Notification events to define** (see §17 of audit): status changes, assignment, approval needed, overdues, reminders. No speculative events (e.g. no "campaign insights").

## 18. Profile / Account

**🟢 CONFIRMED:** `/profile`. Sections: Identity (name, email, phone, avatar), Security (password change, 2FA toggle, QR badge), Preferences (theme, language, notification toggles), Activity (recent actions log). Logout triggers `DailyReportModal` gate (🟡 requires review — current behaviour submits role-specific `DailyReportSchema` metrics before logout).

## 19. Global Actions

Context actions surface based on selection + permissions:
- Bulk assign (leads) — `leads.assign` + `leads.bulk_upload`.
- Bulk status change (leads).
- Mass document verify (documents) — `documents.verify`.
- Export (currently ⚪ GAP — no `export` permission; D-09).
Actions disabled with tooltip when permission missing; never hidden for permitted record types.

## 20. RBAC UX Principles

- **RBAC is the product contract.** Navigation, dashboards, actions, fields derive from `Roles.*` / `Permissions.*` (`packages/shared/src/index.ts`). Never hardcode literal role/permission strings.
- **Backend authorization is authoritative.** Frontend gating = UX affordance (hide/disable); API 403 → Permission-Denied state, never a broken page.
- **🟴 D-01 precondition (P0):** `App.tsx:197,198,199,203,204` compare enum **KEYS** (`'LEADS_READ'`,`'CUSTOMERS_READ'`,`'PROJECTS_READ'`,`'BOOKINGS_READ'`); only `/documents` (L205) uses a **value** (`'documents.read'`). → 5 routes permanently deny **every** authenticated role incl. MD/Admin. **Target design gates with `Permissions.*` values** (e.g. `user.permissions.includes(Permissions.LEADS_READ)`).
- **D-02 (P0):** live `App.tsx` role-literal drift — `isMD` (L160) & `isTechAdmin` (L161) are **correct**; `isHRManager` (L162 `'HR Manager'`), `isProjectManager` (L163 `'Project Manager'`/`'Project Manager (Site)'`), `isTelecaller` (L164 `'Telecaller'`), `isExemptFromReport` (L105) use **non-canonical** literals ≠ `Roles.*` values → HR/PM/Telecaller fall to StaffDashboard; MD/HR/MktgDir wrongly hit Daily-Report logout gate.
- **Visibility semantics:** HIDDEN (no primary permission); DISABLED (workflow present, action not executable — tooltip explains); READ-ONLY (view ok, no mutations).

## 21. Active Role Catalogue (current)

| # | Enum key | Canonical value | Dashboard now (App.tsx:176-194) | Notes |
|---|---|---|---|---|
| 1 | `Roles.MD` | `Managing director` | MDExecutiveDashboard ✅ | |
| 2 | `Roles.ADMIN` | `Admin (Technical)` | AdminCommandCenter ✅ | |
| 3 | `Roles.MARKETING_DIRECTOR` | `marketing director` | StaffDashboard 🟴 | no dedicated dashboard; FinanceHub/AnalyticsHub reachable by perms |
| 4 | `Roles.PROJECT_MANAGER` | `project managers` | PMDashboard — UNREACHABLE 🟴 | isProjectManager literal drift |
| 5 | `Roles.DIGITAL_LEAD_OPERATOR` | `Digital lead operator` | StaffDashboard ⚪ | gap — no DLE dashboard |
| 6 | `Roles.TELECALLER` | `telecallers` | TelecallerDashboard — UNREACHABLE 🟴 | isTelecaller literal drift |
| 7 | `Roles.HR_MANAGER` | `HR` | HRDashboard — UNREACHABLE 🟴 | isHRManager literal drift (`'HR Manager'`) |
| 8 | `Roles.FINANCE` | `accountant` | StaffDashboard 🟴 | FinanceHub exists but resolver never routes here |
| 9 | `Roles.DIGITAL_MARKETING_HEAD` | `Digital Marketing head(manager)` | StaffDashboard ⚪ GAP | no dedicated dashboard; must not be invented |
| 10 | `Roles.DIGITAL_MARKETING_EXECUTIVE` | `digital marketing executive` | StaffDashboard ⚪ GAP | no dedicated dashboard; must not be invented |
| 11 | `Roles.AGENT` | `Agent` | AgentSiteVisitsDashboard | 🟠 OUT OF SCOPE |

## 22. Role → Dashboard Matrix

**CURRENT** (App.tsx:176-194 resolver chain) — note: 5/7 role branches broken by D-02:

| Role value | Resolved dashboard | Status |
|---|---|---|
| Managing director | MDExecutiveDashboard | 🟢 |
| Admin (Technical) | AdminCommandCenter | 🟢 |
| HR | HRDashboard | 🟴 unreachable (literal drift) |
| project managers | PMDashboard | 🟴 unreachable (literal drift) |
| telecallers | TelecallerDashboard | 🟴 unreachable (literal drift) |
| accountant | StaffDashboard | 🟴 wrong (FinanceHub exists) |
| marketing director | StaffDashboard | ⚪ gap (no MktgDir dashboard) |
| Digital lead operator | StaffDashboard | ⚪ gap |
| Digital Marketing head(manager) | StaffDashboard | ⚪ gap (no dedicated UI) |
| digital marketing executive | StaffDashboard | ⚪ gap (no dedicated UI) |

**TARGET** (Layer 2 — 🔵 requires fixing D-01/D-02 first): route by `Roles.*` enum comparisons; `accountant`→FinanceHub; `marketing director`→StaffDashboard with MktgDir KPI tiles; DME-Head/DMExec remain StaffDashboard (gap documented).

## 23. MATRIX 2 — Role → Navigation (Permission-derived visibility)

*Target nav visibility derived from `RolePermissionsMatrix` (shared L154-390). `✓` visible; `⊘` hidden (no primary perm); `⧖` disabled/contextual. Current frontend shows ALL items to ALL roles (🟴 D-03) — target fixes this. Admin lacks leads/tasks/site_visits/reports/expenses reads → those nav items hidden for Admin (🟡 NEEDS REVIEW).*

| Nav section (route) | Gate (perm) | MD | Admin | MktgDir | PM | DLE | Telecaller | HR | Accountant | DME-Head | DMExec |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Command Center (/dashboard) | always | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Leads (/leads) | leads.read | ✓ | ⊘ | ✓ | ✓ | ✓ | ✓ | ⊘ | ⊘ | ✓ | ✓ |
| Leads & Clients (/leads-clients) | leads.read | ✓ | ⊘ | ✓ | ✓ | ✓ | ✓ | ⊘ | ⊘ | ✓ | ✓ |
| Sales Pipeline (/sales-pipeline) | leads.read | ✓ | ⊘ | ✓ | ✓ | ✓ | ✓ | ⊘ | ⊘ | ✓ | ✓ |
| Customers (/customers) | customers.read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ⊘ | ⊘ | ⊘ | ⊘ |
| Properties (/properties) | properties.read | ✓ | ✓ | ✓ | ✓ | ⊘ | ⊘* | ⊘ | ⊘ | ✓ | ⧖† |
| Projects (/projects) | projects.read | ✓ | ✓ | ⊘ | ✓ | ⊘ | ✓ | ⊘ | ⊘ | ⊘ | ⧖† |
| Site Visits (/site-visits) | site_visits.read | ✓ | ⊘ | ⊘ | ✓ | ✓ | ✓ | ⊘ | ⊘ | ⊘ | ✓ |
| Tasks (/tasks) | tasks.read | ✓ | ⊘ | ⊘ | ✓ | ⊘ | ✓ | ✓ | ⊘ | ⧖‡ | ✓ |
| Complaints | complaints.read | ✓ | ✓ | ⊘ | ✓ | ⧖§ | ⧖§ | ⊘ | ✓ | ⊘ | ⧖§ |
| Bookings (/bookings) | bookings.read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ⊘ | ✓ | ⊘ | ⊘ |
| Documents (/documents) | documents.read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Targets (/targets) | reports.targets.configure | ✓ | ⧖ | ✓ | ⊘ | ⧖ | ⊘ | ⧖ | ⧖ | ⧖ | ⧖ |
| Analytics (/analytics) | [targets cfg OR team perf] | ✓ | ⧖ | ✓ | ✓* | ⧖ | ✓* | ✓* | ✓* | ✓ | ⧖ |
| Finance (/finance) | expenses.review | ✓ | ✓ | ⊘ | ⊘ | ⊘ | ⊘ | ⊘ | ✓ | ⊘ | ⊘ |
| Employees (/hr-hub) | employees.read (canManageEmployees) | ✓ | ✓ | ⊘ | ⊘ | ⊘ | ⊘ | ✓ | ⊘ | ⊘ | ⊘ |
| System Control (/system-control) | admin.* | ✓ | ✓ | ⊘ | ⊘ | ⊘ | ⊘ | ⧖ | ⊘ | ⊘ | ⊘ |

*`*`/⧖ footnotes: ★ Properties: DMExec has only leads.read+tasks (no properties.read) → ⊘ actually; corrected below. † DMExec no properties/projects reads → ⊘. ‡ DMExec tasks.read ✓. § complaints: DLE has no complaints.* **🟡 NEEDS REVIEW:** DMExec/DME-Head nav is nearly empty (few perms) yet routed to StaffDashboard — verify intended surface. **🟴 DEFECT:** frontend computes `/analytics`,`/targets`,`/hr-hub` via literal role-string lists (App.tsx:168-169) that are correct only for MD/MktgDir/Admin/HR; PM/Telecaller/DLE/DME rely on canViewTeamPerformance strings — inconsistent with permission-gate pattern (D-02).

## 24. MATRIX 3 — Role → Page Access (route reachability)

*Grounded in `App.tsx:195-220` guards + live `RolePermissionsMatrix`. `✓` route renders for role; `⊘` denied (guard blocks or no perm); `⧖` route has no guard (renders; backend may 403); `🟴` blocked by D-01 key/value defect currently. Canonical target uses `Permissions.*` values.*

| Role | dash | /leads | /leads-:id | /sales-pipeline | /customers | /cust-:id | /projects | /properties | /site-visits | /tasks | /bookings | /bk-:id | /documents | /hr-hub | /analytics | /targets | /finance | /system-control |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Managing director | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin (Technical) | ✓ | ⊘ | ⊘ | ⊘ | ✓ | ✓ | ✓ | ✓ | ⊘ | ⊘ | ✓ | ✓ | ✓ | ⧖ | ⧖ | ⊘ | ⧖ | ✓* |
| marketing director | ✓ | ✓ | ✓ | 🟴 | ✓ | ✓ | ⊘ | ✓ | ⊘ | ⊘ | ✓ | ✓ | ✓ | ⊘ | ✓ | ✓ | ⊘ | ⊘ |
| project managers | ✓ | ✓ | ✓ | 🟴 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ⊘ | ✓ | ⊘ | ⊘ | ⊘ |
| Digital lead operator | ✓ | ✓ | ✓ | 🟴 | ✓ | ✓ | ⊘ | ⊘ | ✓ | ⊘ | ✓ | ✓ | ✓ | ⊘ | ⧖ | ⧖ | ⊘ | ⊘ |
| telecallers | ✓ | ✓ | ✓ | 🟴 | ✓ | ✓ | ✓ | ⧖? | ✓ | ✓ | ✓ | ✓ | ✓ | ⊘ | ⧖ | ⊘ | ⧖? | ⊘ |
| HR | ✓ | ⊘ | ⊘ | ⊘ | ⊘ | ⊘ | ⊘ | ⊘ | ⊘ | ✓ | ⊘ | ⊘ | ✓ | ✓ | ⧖ | ⊘ | ⊘ | ⧖ |
| accountant | ✓ | ⊘ | ⊘ | ⊘ | ⊘ | ⊘ | ⊘ | ⧖? | ⊘ | ⊘ | ✓ | ✓ | ✓ | ⊘ | ⧖ | ⧖ | ✓ | ⊘ |
| Digital Mktg head(mgr) | ✓ | ✓ | ✓ | 🟴 | ⊘ | ⊘ | ⊘ | ⧖? | ⊘ | ⧖ | ⊘ | ⊘ | ✓ | ⊘ | ⧖ | ⧖ | ⊘ | ⊘ |
| digital mktg exec | ✓ | ✓ | ✓ | 🟴 | ⊘ | ⊘ | ⊘ | ⧖? | ⧖ | ✓ | ⊘ | ⊘ | ✓ | ⊘ | ⧖ | ⊘ | ⧖ | ⊘ |

`*` Admin /system-control via AdminCommandCenter; Admin has no `admin.emergency_lockdown`? ✅ it does (L163). `?` = open route, perm unclear → 🟡 NEEDS REVIEW. `🟴` cells = currently blocked by D-01 (will render ✓ once D-01 fixed). **🟡 NEEDS REVIEW items:** Admin lacks leads/tasks/site_visits/reports reads yet is "Technical Admin" — confirm intent. HR/DME-head/DMExec nav nearly empty despite StaffDashboard fallback.

## 25. MATRIX 4 — Role → Permission (canonical, condensed)

Source: `shared/index.ts:154-390` (85 perms total). Per-role sets (values):

- **MD (`Managing director`)** = all 85 (`ALL_PERMISSIONS`).
- **Admin (`Admin (Technical)`)** = `admin.{system_metrics,audit_logs,security_alerts,emergency_lockdown}`, `employees.{create,read,update,reset_password}` (NO `view_sensitive`), `customers.{create,read,update,delete,convert,kyc_write}`, `projects.{create,read,update,delete}`, `bookings.{create,read,update}`, `payments.{create,read,update,cancel}`, `documents.{create,read,verify,delete}`, `complaints.{create,read,update,assign,resolve,close}`, `properties.{create,read,update,delete,verify,dm_polish,md_approve}`, `ai.search`. *(No leads/site_visits/tasks/attendance/reports/expenses/performance reads.)*
- **Marketing Director** = leads full (+assign,bulk_upload), customers full (+convert), properties.{dm_polish,md_approve,read}, site_visits.read, reports.targets.configure, reports.read_team, performance.read_team, bookings.read, payments.read, documents.{create,read}.
- **Project Manager** = projects.{create,read,update,delete}, properties.{create,verify,read,update}, site_visits.{read,assign_agent}, tasks full (+assign), leads.read, customers.{read,update}, reports.read_own, bookings.read, payments.read, documents.{create,read}, complaints full.
- **Digital Lead Operator** = leads full (+assign,bulk_upload,distribution_monitor), customers full (+convert), site_visits.{create,verify}, reports.targets.configure, bookings.{create,read,update}, payments.{create,read}, documents.{create,read}, complaints.{read,update}.
- **Telecaller** = projects.read, leads.{read,update,whatsapp_proposal}, customers.{read,update,convert}, site_visits.{create,read}, tasks.{read,update}, attendance.{read_own,scan,late_proposal,leave_proposal}, reports.{create,read_own}, performance.read_own, bookings.read, payments.read, documents.read.
- **HR** = employees.{create,read,update,reset_password,view_sensitive}, attendance.{proposals_queue,live_monitor}, tasks full (+assign), reports.read_team, performance.read_team, documents.{create,read}, customers.kyc_write.
- **Accountant** = expenses.{review,mark_refunded}, employees.view_sensitive, bookings.{read,update}, payments full, documents.{create,read,verify}, customers.kyc_write, complaints.read.
- **DME-Head (⚪ GAP)** = properties.{dm_polish,read}, leads.read, reports.targets.configure, performance.read_team.
- **DMExec (⚪ GAP)** = leads.{read,update}, site_visits.read, tasks.{read,update}, reports.{create,read_own}, attendance.{read_own,scan}, performance.read_own.
- **Agent (🟠 OOS)** = site_visits.{read,complete}, customers.{read,update,convert}, tasks.{read,update}, attendance.{read_own,scan}, reports.{create,read_own}, performance.read_own, bookings.read, payments.read, complaints full.

## 26. MATRIX 5 — Role → Data Scope

Scoped per `RRH-CRMS-RECONSTRUCTION-AUDIT.md §7` + Policy classes (company/branch/project/assignee/ownership). **Backend is authoritative** (Prisma `company_id` + Policy scope).

| Domain | Data scope rule (canonical) |
|---|---|
| Employees | MD/ADMIN: company-wide; HR: company-wide + `view_sensitive` (L202 denied to Admin); DLE/Tele/PM/Mktg/Fin: none (no `employees.read` except none). |
| Leads | MD/ADMIN/MktgDir/DLE: company-wide; PM: own-project + assigned; Telecaller/Agent: assigned + own-created; DME-Head/DMExec: read (company-wide for DME-Head `leads.read`). |
| Customers | MD/ADMIN/MktgDir/DLE: company-wide; PM: own-project customers (read+update); Telecaller: assigned (read+update+convert); DME-Head/DMExec: none (no `customers.read`). |
| Opportunities | MD/ADMIN/MktgDir/DLE: company-wide; PM: own-project; Telecaller: assigned; DME-Head/DMExec: none. *(no `opportunity.*` perms exist — gated by `leads.read`) 🟡 |
| Properties | MD/ADMIN/MktgDir/PM/DLE: company-wide; DME-Head: dm_polish+read (company); Telecaller: read own-project (matching only); DMExec: none. |
| Projects | MD/ADMIN/DLE:MktgDir? — MD/ADMIN/PM: company/project; Telecaller/DLE: read; others scoped. |
| Site Visits | PM: own project/site-visits; Telecaller/Agent: assigned-to / own; MD/ADMIN: company; DLE: create+verify (company). |
| Bookings | MD/ADMIN/MktgDir/DLE: company-wide; PM: own-project; Accountant: read+update; Telecaller/Agent/DMExec/DMEHead: read (where perm held). |
| Payments | MD/ADMIN/MktgDir/DLE/Accountant: company-wide; PM: own-project (read). Portal-origin records distinguishable (`source`). |
| Tasks | Assignee-scoped (own) + creator/admin; HR create for team. |
| Documents | Company-scoped; entity-linked (owner/creator/assignee); KYC PAN/Aadhaar: ADMIN+MD only. |
| Complaints | Company-wide (MD/ADMIN); assigned (PM/Accountant); customer-owned (Agent). |
| Performance | Own: Tele/DMExec/DMEHead; Team: MD/Admin/MktgDir/HR/PM/DLE/Accountant. |
| Attendance | Own: Tele/Agent/DMExec; Proposals queue + live monitor: HR. |

## 27. MATRIX 6 — Role → CRUD (per entity, from `Permissions.*`)

`C/R/U/D` = has create/read/update/delete perm value. `vS`=view_sensitive. `–` = none. ⚪ = modeled but no perm exists.

| Entity / Action | C | R | U | D | Roles (grant holders) |
|---|---|---|---|---|---|
| **Employees** | employees.create | employees.read | employees.update | employees.delete | MD, Admin, HR |
| | — | — | — | — | **vS** (view_sensitive): MD, HR, Accountant; **denied Admin** (shared L202) |
| | employees.reset_password | — | — | — | MD, Admin, HR |
| **Leads** | leads.create | leads.read | leads.update | leads.delete | MD; Admin? ✗⚠; MktgDir; PM? ✗; DLE; DMExec (read+update only, no create) |
| **Customers** | customers.create | customers.read | customers.update | customers.delete | MD; Admin; MktgDir; PM(read+upd); Tele(read+upd+convert); DLE; HR(kyc_write) |
| **Properties** | properties.create | properties.read | properties.update | properties.delete | MD, Admin, MktgDir; PM(create+verify+upd); (no DLE create) |
| **Projects** | projects.create | projects.read | projects.update | projects.delete | MD, Admin, MktgDir; PM; Tele(read); DLE(read) |
| **Bookings** | bookings.create | bookings.read | bookings.update | (cancel) | MD, Admin, MktgDir; PM(read); Tele(read); DLE(create+upd); Accountant(upd) |
| **Payments** | payments.create | payments.read | payments.update | (cancel) | MD, Admin, MktgDir; PM(read); DLE(create+read); Accountant(full incl cancel) |
| **Tasks** | tasks.create | tasks.read | tasks.update | — ⚪ | MD, Admin, HR, PM, DLE, Tele, MktgDir; (no `tasks.delete` perm) |
| **Documents** | documents.create | documents.read | — ⚪ | documents.delete | MD, Admin, MktgDir, PM, DLE, Tele, HR, Accountant; (no `documents.update` perm) |
| **Complaints** | complaints.create | complaints.read | complaints.update | — ⚪ | MD, Admin, PM, DLE, Tele, HR, Accountant, Agent; (no `complaints.delete`) |
| **Opportunities** | — ⚪ | via leads.read | — ⚪ | — ⚪ | No dedicated `opportunity.*` perms; gated by leads.read + workflow engine |
| **ExpenseRefund** | expenses.create | expenses.read_own | (review→approve→refund) | — ⚪ | any→submit; Accountant review; MD approve; Accountant mark_refunded |
| | **KYC PAN/AA docs** create+delete | create+delete | — | delete | ADMIN, MD only |

> ⚠ Admin has **no** `leads.*`/`customers.create|delete|convert|kyc_write`... actually Admin HAS customers full (L167-172) but **no leads** perms. Confirmed: Admin cannot create/read leads/tickets/tasks/reports/expenses/performance. **🟡 NEEDS REVIEW** — is "Technical Admin" intended to be blind to Leads & Tasks?

## 28. MATRIX 7 — Role → Approval Authority (from workflow engines + §16)

| Approval action | Permission gate | Approvers | Actor scope |
|---|---|---|---|
| Property → Verify | properties.verify | MD, Admin, PM | PM: own-project; others: company |
| Property → DM Polish | properties.dm_polish | MD, Admin, MktgDir | company |
| Property → MD Approve | properties.md_approve | MD, Admin, MktgDir | company |
| Lead assign | leads.assign | MD, Admin, MktgDir, DLE | PM: own-project only |
| Opportunity stage move | (workflow owner) | owner + invariant gates | owner; DROPPED needs drop_reason; BOOKING_INITIATED needs property+expected_value; BOOKED blocked (Phase 9) |
| Booking → Confirm | bookings.confirm | MD, Admin, MktgDir | company |
| Document → Verify | documents.verify | MD, Admin, MktgDir, PM, DLE, Accountant | per document scope |
| Payment → Cancel | payments.cancel | MD, Admin, Accountant | company |
| Booking → Cancel | bookings.cancel | MD, Admin, Accountant | company (PM update only, no cancel) |
| Task → Assign | tasks.assign | MD, Admin, HR, PM | assignee visibility rules |
| Expense → Review | expenses.review | MD, Admin, Accountant | company |
| Expense → MD Approve | expenses.md_approve | MD, Admin | — |
| Expense → Mark Refunded | expenses.mark_refunded | MD, Admin, Accountant | — |
| Daily Report submit | reports.create | (submitter only) | own |

> **🟴 D-05 (workflow engine):** ExpenseRefund has a workflow file (`expenseRefund.workflow.ts`) + `ExpenseRefundStatus` enum, but is **NOT** registered in `WorkflowEngine.registry`/`WorkflowDomain`; invoked via legacy `validateTransition`. Target: register under `EXPENSE_REFUND`. (Booking confirm, payment cancel, property verify are **API/action verbs**, not state-machine transitions — no engine entry needed.)

## 29. Sensitive Data Visibility (KYC boundary)

**🟢 CONFIRMED:** `Customer.pan_number`/`aadhaar_number` AES-256-CBC encrypted at rest (`utils/encryption`); raw values **never** cross CRM↔Portal (shared `KycStatusChangedSchema` carries only status + masked PAN; `KycCallbackSchema` carries only `status:'submitted'`).

| Sensitive item | View (roles) | Write (roles) | Delete |
|---|---|---|---|
| Employee PAN/Aadhaar/bank/salary | MD, HR, Accountant (`employees.view_sensitive`) — **Admin explicitly denied** (shared L202) | — | employees.delete (MD, Admin) |
| Customer PAN/AA | MD, Admin, MktgDir, DLE, HR, Accountant (`customers.kyc_write`) | same | — |
| KYC_PAN / KYC_AADHAAR documents | (document.read scoped) | **create+verify+delete: ADMIN, MD only** | ADMIN, MD |
| Payment reference/CVV | NOT stored; only `reference_number` (gateway/UPI) | Accountant, MD, Admin | — |

## 30. Delete / Destructive-Action Matrix (audit §14)

| Entity | Delete / destructive perm | Roles | Confirmation | Audit |
|---|---|---|---|---|
| employees | employees.delete | MD, Admin | Yes (cascade bookings/pay/docs ⚠) | `audit_event: delete` |
| customers | customers.delete | MD, Admin, MktgDir | Yes | cascade warning |
| properties | properties.delete | MD, Admin | Yes (→ LOCKED/REJECTED first) | PropertyVerificationLog |
| leads | leads.delete | MD, Admin, MktgDir, DLE | Yes | AuditEvent `PERMISSION_CHANGE`? 🟡 |
| documents | documents.delete | MD, Admin | Yes (soft-delete + reason) | Document `delete_reason`/`deleted_by` |
| KYC PAN/AA docs | documents.delete | MD, Admin only | Yes + justification | |
| bookings | bookings.cancel | MD, Admin, Accountant | Yes (`reason?`) | booking status history |
| payments | payments.cancel | MD, Admin, Accountant | Yes (`reason`) | payment audit |
| — | tasks DELETE | ⚪ no `tasks.delete` perm | — | ⚪ GAP |
| — | complaints DELETE | ⚪ no `complaints.delete` perm | — | ⚪ GAP |
| — | opportunity DELETE | ⚪ no model-level delete in schema | — | ⚪ GAP |

`*` Admin lacks `employees.view_sensitive` but **does** have `employees.delete` — intentional (delete metadata, no PII view).

## 31. DME-Head / DMExec GAP Treatment (⚪ ACTIVE, no dedicated UI)

Per authoritative decision: **must NOT** invent dashboards or merge roles.

- **Digital Marketing head(manager)** (`Roles.DIGITAL_MARKETING_HEAD`): perms = `properties.dm_polish`,`properties.read`,`leads.read`,`reports.targets.configure`,`performance.read_team`. Current UI = StaffDashboard fallback. **Gap:** no target-configurator surface, no team-performance view despite `performance.read_team`, no DM-polish action UI. **Future business decision required** before designing a DM dashboard.
- **digital marketing executive** (`Roles.DIGITAL_MARKETING_EXECUTIVE`): perms = `leads.{read,update}`,`site_visits.read`,`tasks.{read,update}`,`reports.{create,read_own}`,`attendance.{read_own,scan}`,`performance.read_own`. Current UI = StaffDashboard. **Gap:** no execution workspace (lead-update list, site-visit list, task list, daily-report submit form). **Future business decision required.**

## 32. AGENT / Channel Partner Out-of-Scope Treatment (🟠)

`Roles.AGENT` (`'Agent'`) + `AgentSiteVisitsDashboard` + AGENT-scoped perms are **OUT OF SCOPE** for RRH-CRMS. They are not among the 7 operational role buckets. Agent functionality must not be reintroduced into the CRM redesign. ⚪ GAP for AgentSiteVisitsDashboard (it has no equivalent CRM module; Agent falls to StaffDashboard per current resolver only if routes resolve — but Agent lacks most CRM perms).

## 33. Dashboard Architecture

**Rule:** only design dashboards evidenced by the repository. Dashboards are role-entry-points, NOT standalone data sources — they embed the same domain pages/tables the role is permitted to see (single source of truth, no dashboard-only copies of data).

**Existence map (live):** `MDExecutiveDashboard` (`/md/executive-metrics`), `AdminCommandCenter` (🟡 STUB "under construction"), `SystemControlHub` (`/system-control` → `MDControlDashboard`/`AdminAnalyticsPortal` + `BannerControlWidget`), `PMDashboard` (embeds PropertyManagement, queries `properties?status=PENDING_VERIFICATION`), `TelecallerDashboard` (daily calling list + targets + TaskManager + PerformanceScoreWidget), `HRDashboard` (tabs: EmployeeManagement / LateLeaveProposals / LiveAttendanceMonitor), `FinanceHub` (`/finance`, role-based tabs), `AnalyticsHub` (GET `/analytics/kpis` Packet B + TargetConfigurator + TeamPerformanceDashboard), `StaffDashboard` (fallback: TaskManager + PerformanceScoreWidget).

**🟴 CONFLICT:** `SystemControlHub.tsx:12` uses `user.roles.includes('MD')` (wrong; should be `Roles.MD='Managing director'`) — D-02 variant; MD tab button hidden on System Control though MD still loads it by default.

## 34. MD Executive Dashboard

**Purpose:** executive command — what needs my attention; approvals; financial pulse.
**Primary users:** Managing director (`Roles.MD`).
**Current (🟢 CONFIRMED):** `MDExecutiveDashboard` GET `/md/executive-metrics`. Priority Alerts (3 leads w/o follow-up, 2 site visits today, 4 properties pending approval, 1 overdue collection, 2 docs awaiting verification); KPI strip (Active Leads, Open Deals, Live Properties, Pending Approvals, Site Visits Today, +1); Needs Attention (stale lead, property pending MD approval, booking payment pending); Recent Activity feed.
**Target (🔵):** same KPI set retained (operationally relevant, not decorative). Make alert list **actionable** (inline approve/dismiss for pending properties; 1-click open lead/booking). Add **Approval Queue** tab mirroring SystemControlHub MD tab. Mobile: collapse KPI strip to 2-col; alerts become priority list.
**Mobile:** same data, stacked cards; "Needs Attention" first; quick-action FAB for urgent approvals.
**API deps:** `/md/executive-metrics`; deep-links to `/properties`, `/leads`, `/bookings`, `/site-visits`, `/documents`.
**Known defects:** none in this component itself (D-01/D-02 are at route/guard level).

## 35. Admin Command Center

**Purpose:** system health + security + configuration + emergency controls.
**Primary users:** `Admin (Technical)`.
**Current (🟡 NEEDS REVIEW):** `AdminCommandCenter` is a **stub** ("under construction") with a link back to `/dashboard`. Admin's *actual* operational surfaces are reached via separate routes: `SystemControlHub` (admin tab → `AdminAnalyticsPortal` for analytics), `FinanceHub` (queue), `AnalyticsHub` (overview gated on `admin.system_metrics` per component comment §4), `HRDashboard` (employees).
**Target (🔵):** consolidate into a real System Control landing with tabs: System Metrics (AdminAnalyticsPortal), Audit Logs, Security Alerts, Employee Directory, Emergency Lockdown, Configuration. **⚠ BUSINESS DECISION REQUIRED** whether to retire the stub `AdminCommandCenter` route or repoint `/dashboard`/Admin to `SystemControlHub` directly (Admin currently lands on stub via route guard fix).
**API deps:** `/admin/system-metrics` (implied), `/audit-logs`, push-notification settings.
**Permissions:** `admin.{system_metrics,audit_logs,security_alerts,emergency_lockdown}` + `employees.*` (no view_sensitive).
**Mobile:** Security-alerts card first; lockdown requires 2-factor confirmation.

## 36. Marketing Director Dashboard

**Purpose:** oversee lead conversion funnel, property pipeline approvals, team targets, financial pulse.
**Primary users:** `marketing director`.
**Classification:** ⚪ GAP — no dedicated component; current UI = `StaffDashboard` fallback (🟴 D-02 drift + no MktgDir dashboard in resolver).
**Current evidence:** MktgDir perms = leads.{create,read,update,delete,assign,bulk_upload}, customers.{create,read,update,delete,convert}, properties.{dm_polish,md_approve,read}, site_visits.read, reports.{targets.configure,read_team}, performance.read_team, bookings.read, payments.read, documents.{create,read}.
**Target (🔵):** dedicated "Marketing Director" workspace composed of: Lead Funnel card (lead status counts via `/leads` with status filter), Property Approval queue (`/properties?status=PENDING_DM_POLISH` + MD_approve actions they're permitted to), Targets configurator (`/targets`), Team Performance, Bookings/Payments summary. **⚠ BUSINESS DECISION REQUIRED** before investing in a dedicated dashboard (current fallback acceptable).
**API deps:** `/leads`, `/properties?status=PENDING_DM_POLISH|PENDING_MD_APPROVAL`, `/bookings`, `/payments`, `/analytics/kpis`, `/targets`.
**Mobile:** funnel chart → table toggle; approval queue becomes swipeable cards.

## 37. Project Manager Dashboard

**Purpose:** on-site verification + project & property pipeline.
**Primary users:** `project managers`.
**Current (🟢 CONFIRMED):** `PMDashboard` GET `/properties?status=PENDING_VERIFICATION`; banner "On-Site Verification Queue"; embeds `<PropertyManagement />`.
**Target (🔵):** retain verification queue first; add **Project** tabs (assigned projects list → ProjectDossier), Site-Visit queue (assigned PM site visits), Tasks tab, Bookings under own projects, Payments summary (own-project). KPI strip: verified-today, pending-verification, open tasks, overdue site visits.
**Workflow tie-in:** PM performs `VERIFY` (properties.verify) → PENDING_DM_POLISH; records in `PropertyVerificationLog`.
**API deps:** `/properties?status=PENDING_VERIFICATION`, `/projects?assigned_pm=true`, `/tasks?assignee=...`, `/bookings?project_id=...`.
**Mobile:** verification queue becomes scan/verify cards with photo-capture (QR scanner exists for attendance; reusable pattern).

## 38. Telecaller Dashboard

**Purpose:** daily calling list → convert prospects.
**Primary users:** `telecallers`.
**Current (🟡 NEEDS REVIEW):** `TelecallerDashboard` GET `/leads` (assignee-scoped by backend policy), inline `<select>` status update PATCH `/leads/:id/status` with **7 options** (NEW, CONTACTED, QUALIFIED, SITE_VISIT_SCHEDULED, NEGOTIATION, WON, LOST) — **drift**: missing ASSIGNED, OPPORTUNITY_OPEN, RECOVERED_TO_POOL (🟴 D-06); calls `/targets/my-targets`; embeds TaskManager + PerformanceScoreWidget.
**Target (🔵):** fix status options to full LeadStatus set (10) AND enforce workflow-valid transitions per the Lead workflow engine (Telecaller cannot jump directly to WON/LOST if engine disallows). Add site-visit creation CTA; performance score visible. 
**🟴 DEFECT:** status `<select>` lets Telecaller set any of 7; engine may reject → must disable invalid options client-side (derive from workflow graph). **🔴 BACKEND DEPENDENCY:** Telecaller has `leads.update` but NOT `leads.assign` — ensure PATCH `/leads/:id/status` does not allow re-assignment.
**API deps:** `/leads` (policy-scoped), `/targets/my-targets`, `/leads/:id/status`.
**Mobile:** call button (`tel:` link) primary; status update via native picker; performance in footer.

## 39. Accountant / Finance Dashboard

**Purpose:** expense-refund lifecycle + payment/collections + booking financial view.
**Primary users:** `accountant`; MD also views.
**Current (🟢 CONFIRMED):** `FinanceHub` GET `/expense-refunds/my` (role-tabbed: My / Review Queue [isFinance] / Approval Queue [isMD]); `STATUS_CONFIG` maps all 6 `ExpenseRefundStatus`; embeds `AccountantRefundQueue` + `ExpenseRefundForm`.
**Target (🔵):** FinanceHub IS the finance dashboard (no separate stub). Accountant sees Review Queue (expenses.review + expenses.mark_refunded); MD sees Approval Queue (expenses.md_approve). Add Payments tab + Installments/Collections summary (`/payments`, `/installments`) and Booking financials tab (`/bookings` financial view) behind payments.read. 
**Workflow:** PENDING→ACCOUNTANT_APPROVED→MD_APPROVED→REFUNDED; reject at accountant/md; mark_refunded by accountant.
**API deps:** `/expense-refunds/my`, `/expense-refunds/queue` (implied), `/payments`, `/installments`, `/bookings`.
**Mobile:** refund cards stack; approve/reject as bottom sheet actions.

## 40. HR Dashboard

**Purpose:** people operations, attendance governance, compliance.
**Primary users:** `HR`.
**Current (🟢 CONFIRMED):** `HRDashboard` tabs EmployeeManagement / LateLeaveProposals / LiveAttendanceMonitor; `canManageEmployees` gate correct (App.tsx:169 `['Managing director','HR','Admin (Technical)']`). Embeds `EmployeeManagement`, `LateLeaveProposals`, `LiveAttendanceMonitor`.
**Target (🔵):** retain tab structure; add Attendance tab (live monitor), Performance tab (team), and a Compliance sub-tab (KYC statuses `/customers` kyc filter). Employee form (see §45/§60) with `employees.view_sensitive` field-gating.
**Sensitive:** HR holds `employees.view_sensitive` → PAN/Aadhaar/bank fields visible ONLY in Employee dossier; **must be masked** by default, unmask on explicit view with audit log entry.
**API deps:** `/employees`, `/attendance/proposals`, `/attendance/live`, `/employees/:id` (sensitive read audit-tagged).
**Mobile:** employee dir → list; attendance → summary card; proposals → swipe approve/reject.

## 41. Staff Dashboard

**Purpose:** fallback surface for roles without a dedicated dashboard (MktgDir, DLE, DME-Head, DMExec, Accountant-unless-routed, plus any future role). **Classification:** ⚪ GAP-as-primary — not a first-class experience.
**Current (🟢 CONFIRMED):** `StaffDashboard` = gradient banner "Staff Workspace" (shows `user.employeeCode`) + embedded `TaskManager` + `PerformanceScoreWidget`.
**Target (🔵):** if a role has ≥1 domain permission, the Staff fallback should promote the **most relevant** domain page into the dashboard (e.g. Accountant → FinanceHub; MktgDir → Leads/Funnel). StaffDashboard retained only for roles with no domain home (e.g. DMExec with only leads.update+tasks reads). **🟡 NEEDS REVIEW:** whether StaffDashboard should be the documented home for DME-Head/DMExec (yes, current behavior) — documented, not "fixed" by inventing dashboards.
**Layout:** banner → 2-col {TaskManager | PerformanceScoreWidget}. 
**Mobile:** single column; tasks first.
**Primary users:** all roles that reach the fallback (MD/Admin/PM/Tele/HR are routed away; MktgDir/DLE/DME-Head/DMExec/Accountant currently land here via D-02 drift).

## 42. DME-Head / DMExec UI Gap (⚪)

Per authoritative decision: **no dedicated dashboard invented.** DME-Head/DMExec use StaffDashboard fallback.

- **DME-Head permissions:** `properties.{dm_polish,read}`, `leads.read`, `reports.targets.configure`, `performance.read_team`.
  - Current gap: no DM-polish action surface; no target configurator surface (`/targets` requires reports.targets.configure — DME-Head HAS it but `canManageTargets` App.tsx:168 list omits DME-Head → `/targets` unreachable for DME-Head 🟴); no team-performance view (`/analytics` canViewTeamPerformance L170 list INCLUDES DME-Head → reachable). **🟴 CONFLICT:** `/targets` gate (L168) excludes DME-Head despite its `reports.targets.configure` perm, while `/analytics` gate (L170) includes it — inconsistent.
- **DMExec permissions:** `leads.{read,update}`, `site_visits.read`, `tasks.{read,update}`, `reports.{create,read_own}`, `attendance.{read_own,scan}`, `performance.read_own`.
  - Current gap: no execution workspace (lead-update list, site-visit list, task list, daily-report submit form).

**Implications for redesign:** StaffDashboard fallback is the *current* UI. Do NOT interpret it as business-equivalence to Staff. Future dashboard concepts (DM campaign workspace) → **FUTURE BUSINESS DECISION — NOT PART OF CURRENT MASTER SPEC.**

## 43. Dashboard Widget Standards

- **KPI card:** icon + label (uppercase, captions) + value (mono for codes/amounts). Color: semantic (teal=positive, amber=warning, rose=due, slate=neutral). Max 6 KPIs per strip.
- **Alert card:** actionable; inline CTA link (`Open`, `Review`) → deeplink to filtered list/page. Never decorative.
- **Chart widget:** recharts (`BarChart`,`PieChart`,`ResponsiveContainer`) — only in `AnalyticsHub`/`MDAnalyticsDashboard`. **KPI first; chart secondary.** Mobile: chart → compact legend list.
- **List/timeline widget:** `TaskManager`, `PerformanceScoreWidget`, activity lists. Items: leading status dot + primary text + secondary meta + trailing action.
- **Status badge widget:** `StatusChip` component (shared) — uses canonical enum values; color = `StatusColors` (§84).
- **Empty state:** illustrative icon + headline + subtext + contextual CTA (role-gated).
- **Loading skeleton:** `Skeleton` (shared) — 120px/40px bars; per-widget, not full-page only.

## 44. Lead Management

### PAGE: Lead Management (`/leads`, `/leads-clients`)
**Purpose:** operational prospect pipeline — capture, filter, drill to lead dossier, drive lifecycle.
**Primary users:** Telecaller, MktgDir, DLE, MD, Admin(no leads.read — 🟡), PM(read).
**Permission:** `leads.read` (guard must be `Permissions.LEADS_READ` — currently 🟴 D-01 uses `'LEADS_READ'`).
**Data scope:** backend-scoped by role (§26): admin sees company; telecaller sees assigned+created; PM sees own-project leads.
**Entry points:** sidebar (desktop/tablet), More-drawer/mobile bottom-nav Leads, Staff/MktgOrAdmin dashboard lead count.
**Navigation location:** CUSTOMER & SALES → Leads; mobile → leads icon.
**Page layout:** header (title, subtitle, loader-refresh) → toolbar (`Add`, `Import`, `Filters`, `Export`⚪) → dense table with per-row status + assignee + score → dossier (drawer on click).
**Header / KPI:** total leads, active (this-mo), won, LOST; quick-create + `Export` (⚪ D-09).
**Filters:** status (all 10), source (7), assigned-to, budget range, preferred-location, created-date range, match-score (`lead_score`).
**Search:** `customer_name`,`phone`,`email`,`lead_code`; partial, case-insensitive.
**Table columns:** lead_code, customer_name, phone, status, source, property_type_preference, budget_min–max, lead_score, assigned_to, created_at, follow-up/overdue chip.
**Row actions:** open dossier, status dropdown (role-gated, workflow-valid), assign (`leads.assign`), add follow-up, convert (one-step lead→customer), WhatsApp proposal (telecaller).
**Bulk actions:** select + `Assign` (leads.assign), `Status Change`, `Export`⚪.
**Primary CTA:** New Lead (create).
**Empty:** "No leads match" + create CTA. **Loading:** 8-row skeleton (`Skeleton`). **Error:** toast + retry; permission-denied: empty-state "You don't have access".
**Status:** row status badge via `StatusChip` (10 canonical colors).
**Workflow:** inline status dropdown (role-gated to valid transitions via `WorkflowEngine`); assign requires `leads.assign`.
**Mobile:** table → stacked lead cards (customer, phone, status chip, assignee); primary action = call + status via native picker.

## 45. Lead Dossier (drawer/`/leads/:id`)

**Purpose:** full record for lifecycle progression.
**Primary users:** owner/assignee, MktgDir, DLE, MD, Admin(🟡).
**Tabs (from LeadManagement current):** DETAILS / MATCHES / INTERESTS / VISITS / FOLLOW-UPS / SALES-OPPS. **🟡 NEEDS REVIEW:** current dossier exposes these 6; no explicit ACTIVITY tab (activities shown under DETAILS timeline).
**DETAILS:** name, phone, email, source, status stepper (10), assignment (assignee list role-gated), budget-min/max, preferred-location, property_type_preference, notes, campaign/UTM trio, lead_score, SLA-breach chip, created-by, created_at.
**MATCHES:** auto-match live properties (`/leads/:id/matches`), match % + breakdown. **🟢 CONFIRMED** backend `LeadMatchingRequirement`.
**INTERESTS:** `LeadPropertyInterest` (`/leads/:id/properties`) add/remove.
**VISITS:** `SiteVisitBooking` for lead (`/site-visits?leadId`).
**FOLLOW-UPS:** related `Task` (`/leads/:id/tasks`).
**SALES-OPPS:** `Opportunity` rows (`/opportunities?lead`), deeplink.
**ACTIVITY:** `LeadActivity[]` timeline (activity_type, actor, notes, created_at).
**Workflow:** status via `LeadStatus` (10); legal only per workflow graph §68. `RECOVERED_TO_POOL→ASSIGNED` recovery path surfaced.
**Empty/loading/error states:** per-tab placeholder / skeleton / toast+retry.
**Audit:** LeadActivity writes for status/gen/task/interest actions (🟢 evidence: LeadActivity model + lead.service writes).

## 46. Sales Pipeline

### PAGE: Sales Pipeline (`/sales-pipeline`, `/sales-pipeline/:id`)
**Purpose:** kanban/list view opportunities by stage; drive stage transitions.
**Primary users:** DLE, Telecaller(owner), MD, MktgDir, PM(own-project).
**Permission:** `leads.read` (gate must be `leads.read` — D-01).
**Data scope:** owner-scoped (non-management); management company-wide.
**Component:** `SalesPipelineManagement` → `SalesStageTransitionModal` (DROPPED reason) → `SalesPipelineMetrics`.
**Columns (kanban):** 10 stage columns (`SALES_STAGES_ORDER`).
**Metrics strip:** Active / Expected Pipeline Value / Weighted / Dropped.
**Cards:** `SalesOpportunityCard` (drag source) — prospect, project/property, expected value, probability, age-days.
**Stage transition:** drag-drop board OR `SalesStageTransitionModal`; DROPPED requires drop_reason. **BOOKED blocked** (Phase 9 only; internal).
**Row actions:** open opportunity, stage dropdown, drop.
**Mobile:** kanban → horizontal swipe lanes; stages as spinner.
**Empty/loading/error/permission-denied states defined** analogous to Lead Mgmt.

## 47. Opportunity Management

### PAGE: Opportunity Dossier (drawer/`/opportunities/:id`)
**Purpose:** per-opportunity detail + stage history + business invariants.
**Primary users:** opportunity owner (DLE/Telecaller), MD, MktgDir, PM(own-project).
**Permission:** gated by `leads.read` (no `opportunity.*` perm exists — 🟡 NEEDS REVIEW D-07: backend uses `requirePermission(LEADS_READ)` on `opportunities.ts`).
**Tabs:** Details, Stage Timeline, Property/Interests, Site-Visits, Documents, Tasks, History.
**Details fields (Prisma Opportunity L943-994):** opportunity_code, source, campaign, utm_{source,medium,campaign}, owner_id, stage, expected_value, probability, budget_min/max, expected_close_date, project, property, lead, drop_reason.
**Stage timeline:** `OpportunityHistory[]` (from_stage→to_stage, changed_by, exited_at) — drives dossier `<timeline>`.
**Business invariants (OpportunityWorkflow):** PROPERTY_SHORTLISTED needs project/property; SITE_VISIT_PLANNED ≥1 SiteVisitBooking; SITE_VISIT_COMPLETED ≥1 COMPLETED; PROPERTY_INTEREST_CONFIRMED needs property_id; NEGOTIATION needs expected_value; BOOKING_INITIATED needs property+expected_value; DROPPED needs drop_reason; BOOKED terminal & public-API-unreachable.
**Workflow UI:** stage stepper (10); show current + allowed-next (disable blocked); `SalesStageTransitionModal` for DROPPED.
**Status representation:** stepper + history timeline.
**Mobile:** stepper → horizontal pill-progress; history → timeline list.
**Empty/loading/error/permission-denied** per page-standard.
**API deps:** `/opportunities/:id`, `/opportunities/:id/history`.

## 48. Customer 360

### PAGE: Customer 360 (`/customers`, `/customers/:id`)
**Purpose:** consolidated customer record: identity, origin, KYC, bookings, payments, installments, documents, notifications, status, ownership.
**Primary users:** MktgDir, DLE, PM(own), MD, Domains with `customers.read`.
**Permission:** `customers.read` (gate D-01 value).
**Detail sections (all evidence-grounded):**
- **Identity:** customer_code, first/last_name, phone, email, status(ACTIVE/INACTIVE/BLACKLISTED), source, campaign/utm_*, assigned_to, created_at, origin_lead_id.
- **CRM origin:** the lead that produced the customer (`Lead.converted_customer`).
- **KYC:** status chip (PENDING/PARTIAL/VERIFIED/REJECTED from `KycStatus`), verified_at, rejected_reason; masked PAN display only; **NO raw PAN/AA in ordinary UI** (🟢 KYC boundary §29/§107).
- **Bookings:** related `Booking[]` (financials, status, property).
- **Payments:** related `Payment[]` by booking, `source` (CRM/PORTAL) + `sync_status`.
- **Installments:** `Installment[]` (schedule array populating §56).
- **Documents:** `Document[]` (KYC + booking docs) — masked.
- **Complaints:** `Complaint[]`.
- **Notifications:** `CustomerNotification[]` (portal, read-only here).
**Page layout:** profile header (avatar initials, name, code, status chip) → identity card + KYC card + ownership + origin → tabs: Bookings / Payments / Installments / Documents / Complaints / Notifications.
**Form fields (CustomerCreateSchema):** first_name(required), last_name, phone(required), email, status, source, assigned_to_id. (KYC write via `PUT /customers/:id/kyc`, `pan_number`/`aadhaar_number` — encrypted; Permissions.CUSTOMERS_KYC_WRITE).
**KYC write roles:** MD,Admin,MktgDir,DLE,HR,Accountant (customers.kyc_write) — boundary.
**Empty/loading/error/permission-denied** per standard.
**Audit:** Customer KYC write → AuditEvent `CUSTOMER_KYC_WRITTEN` + `CUSTOMER_KYC_STATUS_UPDATED` (KycService).

## 49. Property Inventory

### PAGE: Property Inventory (`/properties`, `/properties/:id`)
**Purpose:** property asset registry + approval pipeline + inventory/matching.
**Primary users:** PM(own), MD, Admin, MktgDir, DME-Head(dm_polish), Telecaller(read for matching).
**Permission:** `properties.read` (gate D-01 — `PROPERTIES_READ`).
**Data scope:** MD/Admin/MktgDir/DLE company; PM own; Telecaller matching read; DMExec none.
**Component:** `PropertyManagement` (list + stepper + dossier), `PropertyPipelineStepper`, `EditPropertyModal`, `AddPropertyWizard`.
**Page layout:** header + KPI (count by status) → toolbar (New Property, Filters, Status) → dense table w/ pipeline step badge → dossier(drawer).
**Table columns:** property_code, title, brand(SONTHILLU/RADHA), category, price(Lakhs), area_sqft, location, status(8), assigned_pm, created_at.
**Filters:** brand, category, status(8), project, assigned-PM, price-range, area-range.
**Row actions:** open dossier, edit(read-only per scope), verify(PM), DM-polish(Mktg+DME), MD-approve(MD/Admin).
**Empty:** "No properties" + New Property (MktgDir/PM/Admin can create). **Loading:** skeleton rows. **Error:** toast+retry. **Permission denied:** guard (D-01).
**Workflow:** PropertyPipelineStepper shows stage + next action (§70).
**Mobile:** cards (thumbnail+title+status chip+price); deeper media gallery.

## 50. Property Dossier (`/properties/:id`)

**Purpose:** full property record + the approval chain (VERIFY → DM_POLISH → MD_APPROVE → LIVE) + inventory lifecycle.
**Primary users:** PM(own), MD/Admin, MktgDir/DME-Head(dm_polish). Telecaller: read-only matching view.
**Sections:**
- **Identity:** property_code, title, description, brand, category, listing_type, possession_status, slug.
- **Project:** project.name (link to ProjectDossier).
- **Category/pricing:** price, area_sqft, category, bedrooms/bathrooms, facing, details(Json).
- **Location:** location, address, state/city/locality/pincode; **lat/long INTERNAL ONLY — never public UI** (🟢 security §106).
- **Availability:** derived (`deriveAvailability`): LIVE+no-lock→AVAILABLE; LOCKED→RESERVED; BOOKED/SOLD→SOLD; else UNAVAILABLE.
- **Media:** `PropertyImage[]` (primary, caption, status); upload/approve/reject per DM-polish scope.
- **Publication:** `PropertyPublication` (is_published, per company).
- **Verification history:** `PropertyVerificationLog[]` (actor+notes) - approval audit.
- **Ownership:** assigned_pm (PM), created_by.
- **Matching/scope:** `LeadPropertyInterest[]`, related leads, site visits, bookings.
**Approval controls:** stepper `PropertyPipelineStepper` (PENDING_VERIFICATION→PENDING_DM_POLISH→PENDING_MD_APPROVAL→LIVE); disables the exact permitted action per role; REJECTED/LOCKED/BOOKED/SOLD distinct leaves.
**Workflow actions:** verify(PM) → PENDING_DM_POLISH; dm_polish(MktgDir/DME) → PENDING_MD_APPROVAL; md_approve(MD/Admin) → LIVE. Rejection → REJECTED(rejection_reason).
**Lock/booking:** property.status→BOOKED sets locked_property on booking; cancel releases.
**Empty/loading/error/permission-denied** per standard.
**API:** `/properties/:id`, `/properties/:id/verify`, `/properties/:id/dm-polish`, `/properties/:id/md-approve`, `/properties/:id/image/*`, `/properties/:id/toggle-publication`.

## 51. Project Management (PAGE: `/projects`, `/projects/:id`)
**Purpose:** project registry (phases, projects, properties, site-visits), PM ownership.
**Primary users:** PM(own), MD/Admin, MktgDir, Telecaller(read).
**Permission:** `projects.read` (D-01 gate).
**Data scope:** PM own; others by policy (§26).
**Components:** `ProjectManagement`, `ProjectDossier`, `ProjectFormWizard`.
**Table columns:** project_code, name, location, status(PLANNING/UNDER_CONSTRUCTION/COMPLETED/CANCELLED), assigned_pm, launch_date, total_area, amenities (collections).
**Row actions:** open dossier, edit(scope), view properties, create-property (within scope).
**Empty/loading/error/permission-denied** per standard.
**Mobile:** project cards (name+status chip+PM+progress).
**API:** `/projects`, `/projects/:id`, `/projects/:id/properties`.

## 52. Site Visits

### PAGE: Site Visits (`/site-visits`)
**Purpose:** scheduling, verification, agent assignment, completion, feedback.
**Primary users:** PM, Telecaller(create+read own), DLE(create+verify), Agent(OOS), DMExec(read).
**Permission:** `site_visits.read` (guard).
**Statuses (string, no shared enum yet — 🟡 / D-06 model gap):** PENDING_VERIFICATION → CONFIRMED → ASSIGNED_TO_AGENT → COMPLETED; CANCELLED terminal.
**Components:** `SiteVisitManagement`, `QRScannerModal` (photo proof), `SiteVisitDossier`(?).
**Table/list columns:** visit_code(`booking_code`), lead(customer), property, scheduled_date, telecaller, assigned_agent, status.
**Workflow actions:** create(DLE/Tele/agent), verify(DLE), assign-agent(DLE/PM/agent), complete(agent/assigned).
**Row actions:** open dossier, verify/assign/complete by role.
**Mobile:** visit cards → "complete + rating" sheet.

## 53. Booking Management (PAGE: `/bookings`)
**Purpose:** commercial transaction record — unit reservation, financials, status, payment linkage.
**Primary users:** Accountant, MD, DLE, MktgDir, PM, Admin, Telecaller-ish(read).
**Permission:** `bookings.read` (D-01 gate value).
**Current (🟢 CONFIRMED):** `BookingManagement` list + status filter; row shows booking_code, customer, agreed_price, balance, assigned_employee, property.
**Table columns (target 🔵):** booking_code, customer, property, amount(₹), status chip(7), payments(pending/last), outstanding, assigned_employee, created_at.
**Row/sidebar:** BookingDossier (next §). Filters: status, date, customer, property.
**Empty/loading/error/permission-denied** per standard.

## 54. Booking Dossier (`/bookings/:id`)
**Purpose:** full transaction dossier + property lock + financial summary + payment history + portal handoff.
**Components:** `BookingDossier`, `RecordPaymentModal`, `CreateBookingModal`, `handoff-status`.
**Sections:**
- Header: booking_code, status chip, property (title/status), customer, portal handoff chip (`handoff_status`, `portal_customer_id/booking_id`).
- Financials: agreed_price, token booking_amount, **balance_amount**, payments list (RecordPaymentModal CTAs role-gated by `payments.create`), installments target.
- Property lock indicator: when CONFIRMED, property.status=BOOKED; visible lock state.
- Payments: status badge (4 states), method, reference, source (CRM/PORTAL), sync_status.
- Opportunity: `booking.opportunity` hand-off (stage→BOOKED).
- Documents/audit.
**Primary CTA:** Record Payment (`payments.create`). Status transitions via `UPDATE /bookings/:id/status` (confirm/cancel), role-gated.

## 55. Payments (PAGE: `/payments`)
**Purpose:** ledger of payment records; record/cancel/verify; track sync.
**Primary users:** Accountant, MD, DLE, PM(read).
- Table cols: payment_code, booking(customer), amount, method, reference, status(4), source, sync_status, recorded_by, date.
- Row actions: verify(success/failed), cancel(payments.cancel).
- **Portal-origin distinguishable** (`source:CRM/PORTAL`) — never co-mingle in ledger UI (🟢 boundary).
**Form:** `RecordPaymentModal` — amount, method(CASH/CHEQUE/BANK_TRANSFER/ONLINE), reference, installment-link, notes.
**Empty/loading/error/permission-denied** per standard.
**Mobile:** payment cards with status chip; cancel via sheet.

## 56. Installments / Collections (schedule)
**Purpose:** represent booking `Installment[]` amortisation; collection status.
**Source:** Installment model `(booking,installment#,amount,expected_date,status)`.
**Statuses:** PENDING/PARTIALLY_RECEIVED/RECEIVED/OVERDUE/CANCELLED.
**UI:** BookingDossier shows installment list + per-status chip + amount; RecordPaymentModal ties to installment.
**Empty:** no schedule → show derived `balance_amount` legacy view.
**Mobile:** installment cards with amounts + due chip.

## 57. Documents (PAGE: `/documents`)
**Purpose:** document registry with lifecycle + verification + KYC boundary + download/audit.
**Components:** `DocumentManagement` (server-paginated), `DocumentUploadModal`, `DocumentDetailModal`, `DocumentVerifyModal`.
**Permission:** `documents.read` (guard uses correct `'documents.read'` — 🟢).
**Table cols:** code, type, title, entity(link), uploader, created, mime, size, upload status, verification status.
**Filters:** entity, type, status, verification.
**Row actions:** download, verify/reject, archive, restore(view), view metadata.
**KYC docs:** create/verify/delete restricted to ADMIN+MD (boundary).
**Version/optimistic concurrency:** `version` field; UI warns on stale update (409).
**Empty/loading/error/permission-denied** per standard.
**Mobile:** doc list → cards; upload via bottom sheet.

## 58. Tasks (PAGE: `/tasks`, `/tasks/:id`)
**Purpose:** operational work items (assignee/due/SLA) across domains.
**Primary users:** Assignees (all roles with tasks.read), HR, PM, DME-Head(?, read).
**Permission:** `tasks.read`; create by pattern; status update via `tasks.update`.
**Statuses (TaskStatus):** PENDING/IN_PROGRESS/COMPLETED/OVERDUE (Prisma comment omits IN_PROGRESS — 🟴 D-06).
**Table cols:** title, assignee, priority, target_date, due/SLA chip, status, related-entity (lead/opportunity).
**Component:** `TaskManager`, `TaskDossier`.
**Workflow:** assign(tasks.assign) → create(TaskCreateSchema) → status update(deadline) → SLA overdue flag (auto-flip to OVERDUE + notify). Complete emits `TASK_COMPLETED` audit + cheer message.
**Empty/loading/error/permission-denied** per standard.

## 59. Complaints (PAGE: `/complaints`, `/complaints/:id`)
**Purpose:** post-sale complaints lifecycle (Phase 14-1).
**Primary users:** PM, Agent, Accountant, DLE, MD.
**Statuses (ComplaintStatus — schema):** OPEN/IN_PROGRESS/RESOLVED/CLOSED/REOPENED. Priority 3. Closure_reason 4.
**Component:** `ComplaintManagement`(?), `ComplaintsSchema` (API).
**Table cols:** complaint_code, customer, title, priority, status, assigned_employee, created_at.
**Workflow actions:** create(PM/Agent), assign, resolve(resolution_description), close(closure_reason).
**Empty/loading/error/permission-denied** per standard.

## 60. Employees / HR (PAGE: `/hr-hub`, `/employees`)
**Purpose:** directory + industrial profile (20-field) + role/branch/manager assignment + QR badge + reset, sensitive view.
**Components:** `EmployeeManagement`, `AddEmployeeWizard`, `QRCodeVisual`.
**Data scope:** MD/HR company; Admin company (no view_sensitive); others scoped.
**Table cols:** employee_code, fullName, branch, status(ACTIVE/INACTIVE/SUSPENDED), roles, attendance_required, first_login_done, created_at.
**Sensitive:** PAN/Aadhaar/bank/salary fields masked; visible only to MD/HR/Accountant (`employees.view_sensitive`) — Admin DENIED (shared L202).
**Form wizard:** §60.
**Mobile:** directory cards; sensitive → expand + view (mask toggle audit).

## 61. Attendance (PAGE: `/attendance`)
**Purpose:** QR check-in/out, live monitor, leave/late proposals.
**Primary users:** all (own), HR(queue+live), MD/Admin.
**Statuses (AttendanceStatus — shared L413):** PRESENT, ABSENT, LATE, APPROVED_LATE, HALF_DAY, LEAVE, UNINFORMED_ABSENT.
**Components:** `QRScannerModal`, `LiveAttendanceMonitor`, `LateLeaveProposals`.
**Workflow:** scan-in QR → check-in; late proposal (before 09:30 IST) → HR approve; leave proposal ≥1 day ahead.
**Mobile:** QR scan + face/photo capture.

## 62. Reports (PAGE: `/reports`)
**Purpose:** Daily Reports + performance + targets.
**Compo:** `DailyReportModal` (submit) + `DailyReportSchema`.
**Empty/loading/error/permission-denied** per standard. Daily submit → `REPORTS_CREATE`.

## 63. Targets (PAGE: `/targets`)
**Purpose:** MD/MktgDir/DME-Head target configurator.
**Role:** `reports.targets.configure` — MD,MktgDir,DME-Head. **🟴 D-02 `/targets` gate excludes DME-Head despite perm.**
**Components:** `TargetConfigurator` (1-click role presets: Telecaller/PM/DLE/DMEHead/HR/Accountant).
**Mobile:** compact target tiles.

## 64. Analytics (PAGE: `/analytics`)
**Purpose:** Packet B analytics overview + Team Performance + Target config.
**Gate:** `admin.system_metrics` (getKpis). `canViewTeamPerformance`/`canManageTargets` strings (App.tsx:170-173).
**Components:** `AnalyticsHub`, `TeamPerformanceDashboard`, `TargetConfigurator`.
**Charts:** recharts (KPI-first). Mobile: legend-list fallback (standard §43).

## 65. Finance (PAGE: `/finance`) — see §39. Payments/Installments living tabs.

## 66. System Control (PAGE: `/system-control`) — MD/ADMIN. MDControlDashboard + AdminAnalyticsPortal + vs System metrics. D-02 `isMD` literal.

## 67. Profile / Security (PAGE: `/profile`)**Profile:** preferences (theme/2FA/push), change password, session list, QR badge, activity.

## 68. Lead Lifecycle (CURRENT, from `LeadWorkflow`)

| From | To (valid) | Actor | UI action | Perm |
|---|---|---|---|---|
| NEW | ASSIGNED, OPPORTUNITY_OPEN | Telecaller assignee, MktgDir/DLE, PM | status | leads.update |
| ASSIGNED | CONTACTED, OPPORTUNITY_OPEN, RECOVERED_TO_POOL | Telecaller | status | leads.update |
| CONTACTED | QUALIFIED, OPPORTUNITY_OPEN, LOST | Telecaller | status | leads.update |
| QUALIFIED | SITE_VISIT_SCHEDULED, NEGOTIATION, OPPORTUNITY_OPEN, LOST | Telecaller | status | leads.update |
| SITE_VISIT_SCHEDULED | NEGOTIATION, OPPORTUNITY_OPEN, LOST | Telecaller | status | leads.update |
| NEGOTIATION | WON, OPPORTUNITY_OPEN, LOST | Telecaller | status | leads.update |
| OPPORTUNITY_OPEN | WON, LOST | Telecaller | status | leads.update |
| LOST | RECOVERED_TO_POOL | Telecaller | recover | leads.update |
| RECOVERED_TO_POOL | ASSIGNED | Telecaller/DLE | reassign | leads.update |
| WON | terminal | |  | |

**Origin:** `Lead` → `Customer` via `converted_customer` (origin_lead_id). **Assignment:** `leads.assign`; **recovery:** `RECOVERED_TO_POOL` is the recovery path (not dead). UI must disable invalid transitions (derive from this table).

## 69. Opportunity Lifecycle (CURRENT → `OpportunityWorkflow`)

| From | To (valid) | Required context | Actor | Perm |
|---|---|---|---|---|
| PROSPECT_QUALIFIED | REQUIREMENT_CAPTURED / PROPERTY_SHORTLISTED / SITE_VISIT_PLANNED / DROPPED | — | owner | leads.update |
| REQUIREMENT_CAPTURED | PROPERTY_SHORTLISTED / SITE_VISIT_PLANNED / DROPPED | — | owner | leads.update |
| PROPERTY_SHORTLISTED | SITE_VISIT_PLANNED / SITE_VISIT_COMPLETED / PROPERTY_INTEREST_CONFIRMED / NEGOTIATION / DROPPED | requires project_id/property_id | owner | leads.update |
| SITE_VISIT_PLANNED | SITE_VISIT_COMPLETED / DROPPED | ≥1 SiteVisitBooking | owner | leads.update |
| SITE_VISIT_COMPLETED | PROPERTY_INTEREST_CONFIRMED / NEGOTIATION / DROPPED | ≥1 COMPLETED | owner | leads.update |
| PROPERTY_INTEREST_CONFIRMED | NEGOTIATION / BOOKING_INITIATED / DROPPED | property_id | owner | leads.update |
| NEGOTIATION | BOOKING_INITIATED / DROPPED | expected_value | owner | leads.update |
| BOOKING_INITIATED | DROPPED | property+expected_value | owner | leads.update |
| BOOKED | terminal — **removed from public API** | — | Phase-9 booking system only | (internal) |
| DROPPED | terminal — requires drop_reason | owner | leads.update | |

**Status representation:** stepper + `OpportunityHistory[]` timeline. UI disables blocked next states (invariant-driven).

## 70. Property Approval Lifecycle (→ `PropertyWorkflow`)
| From | Action | Next | Actor | Perm | UI |
|---|---|---|---|---|---|
| PENDING_VERIFICATION | VERIFY | PENDING_DM_POLISH | PM(own), MD/Admin | properties.verify | stepper + verify CTA |
| PENDING_DM_POLISH | DM_POLISH | PENDING_MD_APPROVAL | MktgDir, DME-Head, MD/Admin | properties.dm_polish | stepper |
| PENDING_MD_APPROVAL | MD_APPROVE | LIVE (or REJECTED) | MD/Admin | properties.md_approve | approve/reject CTA |
| LIVE | (lock) | LOCKED / BOOKED / SOLD | sales system | (via booking) | availability state |
| REJECTED | (can re-submit creat) | PENDING_VERIFICATION | PM | properties.create | edit+resubmit |

## 71. Site Visit Lifecycle (→ `SiteVisitWorkflow`)
| PENDING_VERIFICATION → VERIFY → CONFIRMED |
| CONFIRMED → ASSIGN_AGENT → ASSIGNED_TO_AGENT |
| ASSIGNED_TO_AGENT → COMPLETE → COMPLETED |
| CANCELLED = terminal. 🟡 model gap: no shared enum.

## 72. Booking Lifecycle
| INITIATED → PENDING → TOKEN_RECEIVED → CONFIRMED → REGISTERED → COMPLETED; CANCELLED terminal. API verbs: CONFIRM/CANCEL/Register/Complete. Property lock on CONFIRMED (status=BOOKED). `🔴` Booking status does NOT have a workflow-class (service-enforced + BookingPortalMapping). 

## 73. Payment →SUCCESS/REFUNDED/FAILED (Cancel, Verify SUCCESS/REFUNDED, sync).
## 74. Expense Refund Lifecycle (§18 D-05)
| PENDING →(ACCOUNTANT_APPROVE)→ ACCOUNTANT_APPROVED →(MD_APPROVE)→ MD_APPROVED →(MARK_REFUNDED)→ REFUNDED; reject paths. **Not engine-registered → 🟡.**

## 75. Task Lifecycle
PENDING→IN_PROGRESS→COMPLETED; auto→OVERDUE. Complete → audit `TASK_COMPLETED` + cheer.

## 76. Document Lifecycle
ACTIVE →(verify)→ VERIFIED/REJECTED; ACTIVE→ARCHIVED (soft, reason). `version` optimistic.

## 77. Complaint Lifecycle
OPEN→IN_PROGRESS→RESOLVED→CLOSED→(REOPENED). Priority 3; closure_reason 4.

## 78. Cross-Domain Sales Lifecycle (Lead→Customer→Opportunity→Booking→Payment)
`Lead` → (convert) → `Customer` → (create booking) → `Booking` (lock property) → `Payment` → `Installment` schedule → `BookingPortalMapping` (CRM→Portal handoff) → KYC status. **Handoff audit:** each mutation writes `AuditEvent`/`OpportunityHistory`.

## 79. Design Tokens

Design tokens are the single source of truth for visual primitives (colors, typography, spacing, radii, borders, shadows, elevation, icons). Implemented as CSS custom properties / Tailwind theme (`design-system` module), reused by all `common/ui/*` primitives (§114).

## 80. Typography
- Scale: `12 / 14 / 16 / 20 / 24 / 30 / 36`.
- Weights: Regular(400), Medium(500), Semibold(600), Bold(700), Extrabold(800), Black(900 — headings only).
- Font stack: **Inter** (default) + **JetBrains Mono** / fallback mono for codes (lead_code, booking_code, currency).
- Line-height: 1.5 body, 1.3 headings, 1.6 captions.
- Case: uppercase for labels/KPIs (12px/13px tracking); sentence-case for descriptive body.
- Hierarchy: `--h1` dashboard titles; `--kpi-value` mono 24-32; `--caption` 11-12.

## 81. Color System
- **Brand primary** teal (`#0d9488`-ish → RRH `teal`): primary CTAs, active states, positive/conversion.
- **Accent indigo** (`#6366f1`): secondary actions, focus, sales/pipeline.
- **Semantic:** `rose` (destructive/lost/overdue), `amber` (warning/pending/attention), `emerald` (confirmed/success/won/verified), `slate` (neutral/disabled), `navy` (headings/text-primary).
- **Layers:** `--bg-canvas` (page), `--bg-card` (white card), `--bg-subtle` (slate-50), `--bg-inverse` (navy/900).
- **Text:** `--text-primary` (navy-900 → slate), `--text-secondary` (slate), `--text-muted` (slate-400). Monospace for codes.
- **Status color usage is consistent across all elements** (same value in chips and bars) — never use color as the only signal.

## 82. Spacing System
- **Base unit: 4px.** Scale: 2,4,8,12,16,20,24,32,40,48,64.
- **Density:** CRM record tables use **8 / 12** row/col padding; dashboards use 16; moderate density goal.
- Card padding: p-4/p-6 (dense). Section gap: `gap-6`.

## 83. Border / Radius / Elevation
- Radius tokens: `--radius-sm`(6), `--radius-md`(8), `--radius-lg`(12), `--radius-2xl`(16), `--radius-full`(rounded).
- Border: `--border-subtle` (slate-100), `--border-default` (slate-200), `--border-strong` (slate-300).
- Elevation: `--shadow-sm` (hairline), `--shadow-md` (raised card), `--shadow-lg` (modal), `--shadow-xl` (drawer). `backdrop-blur` for overlays.

## 84. Status Colors (semantic, consistent)
| Status class | Chip bg / text |
|---|---|
| NEW | slate-100 / slate-700 |
| ASSIGNED | blue-100 / blue-700 |
| CONTACTED | indigo-100 / indigo-700 |
| QUALIFIED | teal-100 / teal-700 |
| SITE_VISIT_SCHEDULED | amber-100 / amber-700 |
| NEGOTIATION | purple-100 / purple-700 |
| OPPORTUNITY_OPEN | cyan-100 / cyan-700 |
| WON / VERIFIED / PRESENT / RECEIVED | emerald-100 / emerald-700 |
| LOST / FAILED / REJECTED / red-100 / red-700 |
| RECOVERED_TO_POOL | sky-100 / sky-700 |
| BOOKED / SOLD | navy-100 / navy-700 |
| CANCELLED / ARCHIVED | slate-100 / slate-600 |
| OVERDUE | rose-100 / rose-700 |
| PENDING / PENDING_VERIFICATION / PARTIALLY_RECEIVED | amber-100 / amber-800 |
| IN_PROGRESS / DROPPED | blue-100 / blue-700 |
| REFUNDED / SYNCED | teal-100 / teal-800 |

**Accessibility:** always pair color with text (never color-only). WCAG AA contrast for status text on chip bg.

## 85. Buttons
- Variants: `primary` (teal solid), `secondary` (indigo), `subtle` (slate), `ghost`, `danger` (rose), `danger-subtle`.
- States: default, hover, focus-ring, disabled, loading (spinner + label).
- Sizes: `sm` (px-3 py-1.5, text-xs), `md` (px-4 py-2), `lg`.
- Icon button: square, ghost, accessible label.
- **Danger button requires confirmation pattern** (§98).

## 86. Forms
- Field groups by sections; labels above input.
- Required marker `*` + hint. Helper text = grey; error text = rose with `aria-invalid`.
- Multi-step only where the domain is long (AddEmployeeWizard, AddPropertyWizard, AddLeadWizard).
- Dirty-state: `hasChanges` + blur warning modal.
- Submit: disabled while pending; success toast + refetch.
- **Autosave: NOT present in current arch — mark as FUTURE enhancement.**

## 87. Inputs
- Variants: text, email, phone, number, password, date-time, textarea, URL.
- Style: `input-field` (border slate-200, radius-md, focus ring teal/indigo, bg-canvas/white).
- Per-field: label, `*required` marker, helper, error (aria-invalid), `format` hint (e.g. phone `+91`).
- Number inputs with `InputMode.decimal` for currency/budget; disable spinner for readability.
- Sensitive inputs (`pan_number`, `aadhaar`, salary) use **masked/type=password** with unmask toggle (role-gated, audit-log on reveal).

## 88. Selects / Comboboxes
- Native `<select>` for filters and simple status; accessible `<combobox>` with search for entity-select (assignee, property, project) — `EntitySelector` primitive (attributes, searchable, keyboard).
- Status select derives **valid options** from workflow-engine lookup (disable invalid transitions). Values = canonical enum values (never keys).

## 89. Tables
- Dense table primitive: sticky header, hover row, zebra subtle, sortable columns, selection checkbox, pagination, empty state.
- Columns by §43 standard (priority + secondary; mobile shows priority only).
- Status cell = `StatusChip`; code cells mono; currency right-aligned.
- Row action menu (kebab) with permission-aware items; bulk selection bar.

## 90. Cards
- `Card`: white bg, border-subtle, radius-lg, optional icon header + KPI/footer.
- Layout grid: `md:grid-cols-{n}` responsive. KPI card height consistent; no decorative oversized cards.

## 91. Tabs
- Horizontal underline or pill tabs (used in HRDashboard, SystemControl, AnalyticsHub).
- Keyboard accessible; `aria-selected`; focus ring. Mobile: horizontal scroll.

## 92. Drawers
- Right-side contextual detail/dossier (Lead, Property, Opportunity, Booking, Customer, Employee, Document detail).
- Width: `w-full sm:max-w-md lg:max-w-2xl`. Header (title + close), scrollable body, footer actions (role-gated).
- Focus-trap, ESC to close, `aria-modal`. Render via portal.

## 93. Modals
- Focused action: create (AddLeadWizard, AddPropertyWizard, AddEmployeeWizard), confirm, verify (DocumentVerifyModal, RecordPaymentModal).
- Size: `max-w-md` (confirm) / `max-w-2xl` (forms). `role=dialog`, focus-trap, ESC close, backdrop `bg-slate-900/50 backdrop-blur`.
- Success → toast + close; error → inline field errors.

## 94. Toasts / Alerts
- `ToastContext`: success (emerald), error (rose), info (slate/indigo), warning (amber). Auto-dismiss (success) / persistent (error with retry).
- `aria-live="polite"` for toasts; `role="alert"` for errors.
- Inline banner for global (announcement, network-down).

## 95. Empty States
- `EmptyState` primitive: icon + headline + subtext + optional CTA. Used when a list/section has zero records.
- Distinguish "no records" vs "no matching results" (filters applied → "Clear filters" CTA).

## 96. Loading States
- `Skeleton` primitive (bars / shapes) for tables & cards (per-widget, not only full-screen).
- Full-page loader only for route-level lazy chunks (`Suspense` fallback).
- Buttons: spinner + disabled while submitting.

## 97. Error States
- Never "Something went wrong" alone. Provide: entity + reason + optional retry (toast) + fallback to detail page with stale data + `console.error`/`window.reportError` for diagnostics.
- Network-failure banner (offline / backend down). Validation errors inline per-field.

## 98. Confirmation Patterns
- Destructive actions (delete, cancel, reject, refund, lockdown, document archive/delete, reset-password, emergency) require `ConfirmationDialog` (destructive styling, required reason textarea where applicable, confirm + cancel; loading on confirm; audit on confirm).
- `DANGER-tier` (employee delete, document delete, emergency lockdown) require an **additional explicit confirm** (e.g. type entity code / re-type action).
- Non-destructive but state-changing (approve, status change) → lightweight confirm or toast-undo where supported.

## 99. Responsive Breakpoints
- **Mobile-first:** base (`<640px`), `sm (640)`, `md (768)`, `lg (1024)`, `xl (1280)`, `2xl (1536)`.
- Layout strategy: single-column stacks → 2-col md → 3-col lg (dashboards/grids); tables → card rows < md; nav → `MobileBottomNav` < md, sidebar (or icon-rail for tablet) ≥ md.

## 100. Mobile UX Rules
Prioritize: **today's work → assigned records → quick actions → status changes → approvals → notifications → search.**
- Bottom nav 3-5 tabs (Home/Leads/Properties/More…) — matches desktop IA; More drawer lists permission-aware items (fix D-04 dead `/proposals`).
- Tables → priority-column cards (code+name+status chip+assigned). Primary action = call (tel:) or status update.
- Bottom-sheet action bar for record actions. Touch targets ≥48dp. Sticky primary CTA (FAB) where actionable (create/record-payment).
- Dossier → full-screen bottom sheet or pushed stack; breadcrumbs collapse to back-chevron.
- Offline/loading: PWAs degrade gracefully (skeleton → latest cached) — no full-block spinner.

## 101. Tablet UX Rules
- Sidebar → icon rail (w-16) + tooltip; content grid 2-col; drawers max-w-2xl.
- Same nav data as desktop (novel route or gated differently).

## 102. Desktop UX Rules
- Full sidebar (260px) with group headers; sticky header + right rail for filters (optional) where space permits.
- Dense tables (row height ~36-40px), split-pane dossier (list + detail) where the domain benefits (Customers, Properties, Bookings).
- Keyboard-first: global search `⌘K`/`Ctrl+K`; row shortcut; tabs `Tab`/arrow.

## 103. Accessibility (WCAG 2.2 AA)
- Semantic HTML (`<main>`, `nav`, `header`, `section`, `h1–h3` hierarchy, `<table>` with `<th scope>`, `<button>`/`<a>` honest semantics).
- Focus-visible ring on all interactive elements; skip-link to main.
- Keyboard full coverage: dialogs (focus-trap), drawers, combobox, table row actions, tabs.
- Screen-reader: `aria-label` on icon buttons; `aria-live` toasts; `aria-describedby` on errors; `role=dialog` modals.
- Color contrast ≥4.5:1 (body); ≥3:1 large text; status color + text (not color-only).
- Motion: `prefers-reduced-motion` disables transforms/animations (incl. `animate-spin` fallback to static).
- Touch targets ≥44-48dp; `aria-expanded` on menus.

## 104. Keyboard Navigation
Tab order logical; Enter/Space activate; ESC closes modals/drawers; `Tab`+`Shift+Tab` within dialogs; Arrow keys in tabs/combobox/kanban; `⌘K` opens global search; `css` focus ring.

## 105. Touch Interaction
- Tap targets ≥44px; swipe for kanban/mobile lists only where it improves the core task (status-change, approve/reject) — NOT decorative swipe.
- Buttons + select + call are primary touch actions; avoid hover-dependent hides on touch.

## 106. Sensitive Data UX
- Fields: employee PAN/Aadhaar/bank/salary; customer PAN/Aadhaar; payment reference/gateway IDs.
- **Masking by default**; unmask only on explicit user action and only for roles holding the read/`view_sensitive` permission (MD/HR/Accountant for employees; MD/Admin/MktgDir/DLE/HR/Accountant for customer KYC).
- **Admin (Technical) is denied `employees.view_sensitive`** — the Employee dossier must render these fields masked/absent for Admin regardless of browser-level role checks; backend enforce (authoritative).
- Unmask writes an `AuditEvent` (who viewed masked→unmasked) — traceability.
- **lat/long (Property) is internal-only** — not rendered in public UI or exported; publish toggle scopes what leaves CRM.
- Mobile: sensitive values hidden until tap-reveal with audit.

## 107. KYC UX Boundary
- Customer KYC status (PENDING/PARTIAL/VERIFIED/REJECTED) is user-facing; **raw PAN/Aadhaar never displayed/exported in ordinary CRM or portal** (only masked `ABCDE****F` and status cross the boundary — 🟢 Packet 3C §3.4).
- KYC document create/verify/delete restricted to **ADMIN + MD** (create+verify+delete); other roles may read masked status.
- `PUT /customers/:id/kyc` (Customers.kyc_write) only by roles granted; values AES-encrypted at rest.
- Portal callback (KycCallbackSchema) only carries `status:'submitted'`; **CRM remains the sole KYC verification authority.**

## 108. Audit Trail UX
- `AuditEvent` model (`actor_id, action, entity_type, entity_id, old_value, new_value, created_at`) — written for select paths (login, tasks, payments, documents, property approvals, KYC, bookings).
- Opportunity has its own `OpportunityHistory` (from_stage→to_stage).
- Lead has `LeadActivity[]` (activity_type, notes, actor, created_at).
- UI: expose **read-only** audit in dossiers where evidence supports it (Lead::activities, Opportunity::history, Property::PropertyVerificationLog, Booking/Payment notifications).
- Destructive/approval actions must surface an audit entry (§109); SystemControlHub exposes `admin.audit_logs` (Admin/MD).
- **Do not claim an AuditEvent exists for an action without repo evidence** (🟡 some paths may not write; verify per endpoint).

## 109. Destructive Actions (consolidated §30 + §98)
Every delete/cancel/reject/refund/reset/lockdown/archive requires: [confirmation dialog] + [reason where applicable] + [audit write] + [before→after visibility]. DANGER-tier (employee delete, document/KYC delete, emergency lockdown, MD property reject) require re-typed explicit confirm.

## 110. Session / Authentication UX
**Authoritative (AuthContext + auth.ts):**
1. Login POST `/auth/login` (employee_code+password, rate-limited) → sets refresh cookie (httpOnly) + returns access token.
2. First-login → `FirstLoginSetup` (change default password) → `first_login_done`.
3. Refresh: on 401, `AuthContext.fetchWithAuth` single-flight refresh then retry; **never immediately logout on a single expired access token**.
4. Refresh failure (invalid/revoked family token) → logout + redirect to `/login` with "Your session ended".
5. Idle 30-min (useIdleTimer) → session-expiry UX (warn, then logout).
6. Multiple simultaneous 401 → single-flight refresh guard (one refresh, all retry; on fail all logout).
Forced logout (Admin/HR) → message + revoke; PWA service-worker push updates.
- **Daily-Report logout gate:** non-exempt roles must submit `DailyReportSchema` before leaving (🟡 — audit intends MD/HR/Admin/MktgDir exempt; current `isExemptFromReport` literal drift (D-02) wrongly exempts/forces roles).

## 111. Permission-Denied UX
- Frontend gating hides/disables actions; if user reaches a gated route (D-01 currently blocks) or backend returns 403, render **PermissionDenied** state (icon + "You don't have permission to view this" + "Contact your administrator" + [Back to dashboard]) — never a broken/blank page.
- Backend 403 remains authoritative; frontend affordances are informational only.

## 112. API / Loading / Failure UX
- Standard states per §95-97: loading (skeleton), empty, error (entity+reason+retry), network-banner, validation inline.
- **Error mapping:** 400 → field errors; 403 → PermissionDenied; 401 → refresh/session flow (§110); 404 → NotFound (with back); 409 → conflict (stale/`version`, concurrency) — show refresh prompt; 500 → server-error retry.
- Partial data (e.g. KYC hidden for non-permitted roles) renders the permitted subset, never a failure.

## 113. MATRIX 8 — Page → Permission

| Page (route) | Primary perm | Mutations (values) |
|---|---|---|
| `/dashboard` | — (always) | — |
| `/leads`, `/leads-clients`, `/leads/:id` | `leads.read` | `leads.create`, `leads.update`, `leads.assign`, `leads.delete`, `leads.bulk_upload`, `leads.whatsapp_proposal` |
| `/customers`, `/customers/:id` | `customers.read` | `customers.create`, `customers.update`, `customers.delete`, `customers.convert`, `customers.kyc_write` |
| `/sales-pipeline`, `/:id` | `leads.read` | (opp stage via leads.update; no opp.* perm) 🟡 |
| `/properties`, `/properties/:id` | `properties.read` | `properties.{create,update,delete,verify,dm_polish,md_approve}` |
| `/projects`, `/projects/:id` | `projects.read` | `projects.{create,update,delete}` |
| `/site-visits` | `site_visits.read` | `site_visits.{create,verify,assign_agent,complete}` |
| `/tasks`, `/tasks/:id` | `tasks.read` | `tasks.{create,update,assign}` |
| `/bookings`, `/bookings/:id` | `bookings.read` | `bookings.{create,update,cancel,confirm}` |
| `/payments` | `payments.read` | `payments.{create,update,cancel}` |
| `/documents` | `documents.read` | `documents.{create,verify,delete}` |
| `/complaints`, `/:id` | `complaints.read` | `complaints.{create,update,assign,resolve,close}` |
| `/hr-hub`, `/employees` | `employees.read` | `employees.{create,update,reset_password,view_sensitive}` |
| `/attendance` | (own) | `attendance.{scan,late_proposal,leave_proposal}` |
| `/finance` | `expenses.*` + `payments.read` | `expenses.{create,review,md_approve,mark_refunded}` |
| `/analytics` | `admin.system_metrics` | — |
| `/targets` | `reports.targets.configure` | — |
| `/system-control` | `admin.*` | `admin.{emergency_lockdown}` |
| `/profile` | (own) | — |

## 114. MATRIX 9 — Page → API Dependency (existing)

| Page | API calls (existing) |
|---|---|
| Dashboards | `/md/executive-metrics`, `/properties?status=…`, `/leads`, `/targets/my-targets`, `/expense-refunds/my`, `/analytics/kpis` |
| Lead/sales | `/leads`, `/leads/:id`, `/leads/:id/matches`, `/leads/:id/properties`, `/leads/:id/activities`, `/leads/:id/tasks`, `/leads/:id/convert`, `/leads/:id/status`, `/leads/bulk-upload`, `/leads/:id/whatsapp-proposal/:propertyId` |
| Opportunity | `/opportunities`, `/opportunities/:id`, `/opportunities/:id/stage`, `/opportunities/:id/history` |
| Customers | `/customers`, `/customers/:id`, `/customers/:id/kyc` |
| Property | `/properties`, `/properties/:id`, `/properties/:id/verify`, `/dm-polish`, `/md-approve`, `/properties/:id/images…`, `/toggle-publication`, `/public/…` |
| Projects | `/projects`, `/projects/:id`, `/projects/:id/properties` |
| Site visits | `/site-visits`, `/:id/verify`, `/:id/assign-agent`, `/:id/complete` |
| Bookings | `/bookings`, `/bookings/:id`, `/:id/status`, `/:id/handoff-status` |
| Payments | `/payments`, `/:id/status`, `/sync` |
| Documents | `/documents`, `/:id/download`, `/:id/verify`, `/:id/archive`, `/:id/restore` |
| Tasks | `/tasks`, `/tasks/:id/status`, `/tasks/:id/assign`, `/tasks/assignable` |
| Complaints | `/complaints`, `/:id/assign`, `/:id/resolve`, `/:id/close` |
| Employees | `/employees`, `/:id/qr`, `/:id/reset-password` |
| Attendance | `/attendance/my-qr`, `/attendance/scan`, `/attendance/proposals`, `/attendance/live` |
| Reports/targets | `/reports/daily`, `/reports/today-status`, `/targets` |
| Notifications | `/notifications`, `/:id/read` |

## 115. MATRIX 10 — Page → Workflow

| Page | Workflow | Engine? |
|---|---|---|
| Leads | Lead lifecycle (§68) | ✅ registered |
| Sales pipeline/Opportunity | Opportunity lifecycle (§69) | ✅ registered |
| Properties | Property approval (§70) | ✅ registered |
| Site visits | SiteVisit lifecycle (§71) | ✅ registered |
| Bookings | Booking lifecycle (§72) | ❌ service-enforced (no class) 🟡 |
| Payments | Payment/Installment | ❌ 🟡 |
| Expense (Finance) | ExpenseRefund (§74) | ❌ standalone (D-05) 🟡 |
| Documents | Document lifecycle | ❌ service (DocumentService) 🟡 |
| Tasks | Task | ❌ service 🟡 |
| Complaints | Complaint | ❌ service 🟡 |

## 116. MATRIX 11 — Entity → Status System

| Entity | Status values (canonical) | Shared enum? | Source |
|---|---|---|---|
| Lead | NEW, ASSIGNED, CONTACTED, QUALIFIED, SITE_VISIT_SCHEDULED, NEGOTIATION, OPPORTUNITY_OPEN, WON, LOST, RECOVERED_TO_POOL | `LeadStatus` ✅ | shared L524 |
| Opportunity | 10 stages (PROSPECT_QUALIFIED…BOOKED) | `SalesStage`/inline | shared |
| Property | 8 (PENDING_VERIFICATION…SOLD) | `PropertyStatus` ✅ | shared L641 |
| SiteVisitBooking | PENDING_VERIFICATION, CONFIRMED, ASSIGNED_TO_AGENT, COMPLETED, RESCHEDULED, CANCELLED | **❌ none** 🟡 D-06 | schema L629 |
| Booking | INITIATED, PENDING, TOKEN_RECEIVED, CONFIRMED, REGISTERED, COMPLETED, CANCELLED | **❌ no shared** 🟡 D-06 | schema L839 |
| Payment | PENDING, SUCCESS, FAILED, REFUNDED | **❌ no shared** 🟡 D-06 | schema L919 |
| Installment | PENDING, PARTIALLY_RECEIVED, RECEIVED, OVERDUE, CANCELLED | `InstallmentStatusChangedSchema` (partial) 🟡 | shared L1052 |
| Document | ACTIVE, ARCHIVED | `DocumentStatus` ✅ | shared L835 |
| Document.verification | PENDING, VERIFIED, REJECTED | `DocumentVerificationStatus` ✅ | shared L842 |
| Task | PENDING, IN_PROGRESS, COMPLETED, OVERDUE | `TaskStatus` ✅ | shared L465 |
| Complaint | OPEN…REOPENED, priority, closure_reason | (inline) 🟡 | schema L736 |
| Customer | ACTIVE, INACTIVE, BLACKLISTED | (inline) | schema L777 |
| Customer.KYC | PENDING, PARTIAL, VERIFIED, REJECTED | `KycStatus` ✅ | shared L924 |
| ExpenseRefund | 6 states | `ExpenseRefundStatus` ✅ | shared L756 |
| Attendance | PRESENT…UNINFORMED_ABSENT | `AttendanceStatus` ✅ | shared L413 |
| Project | PLANNING, UNDER_CONSTRUCTION, COMPLETED, CANCELLED | (inline) | schema L463 |
| Employee | ACTIVE, INACTIVE, SUSPENDED | (inline) | schema |

## 117. MATRIX 12 — Status → Allowed Transitions (combinatorial)

*Exhaustive set covered in §68–77. Summary:*

| Domain | Current → allowed Next |
|---|---|
| Lead | see §68 (10-state; WON terminal; LOST→RECOVERED→ASSIGNED recovery) |
| Opportunity | see §69 (BOOKED/DROPPED terminal; DROPPED needs drop_reason) |
| Property | PENDING_VERIFICATION→verify→PENDING_DM_POLISH→dm→PENDING_MD_APPROVAL→md→LIVE; REJECTED leaf; LIVE→lock→BOOKED/SOLD |
| SiteVisit | PENDING_VERIFICATION→verify→CONFIRMED→assign→ASSIGNED_TO_AGENT→complete→COMPLETED; CANCELLED terminal (🟡 no enum) |
| Booking | INITIATED→PENDING→TOKEN_RECEIVED→CONFIRMED→REGISTERED→COMPLETED; CANCELLED terminal (🟡 no class) |
| Payment | PENDING→SUCCESS/FAILED/REFUNDED |
| Installment | PENDING→PARTIALLY_RECEIVED→RECEIVED; OVERDUE; CANCELLED |
| Document | ACTIVE→(verify)→VERIFIED/REJECTED; ACTIVE→deleted→ARCHIVED; ARCHIVED→restore→ACTIVE |
| Task | PENDING→IN_PROGRESS→COMPLETED; →OVERDUE(auto) |
| Complaint | OPEN→IN_PROGRESS→RESOLVED→CLOSED; CLOSED→REOPENED→IN_PROGRESS |
| ExpenseRefund | PENDING→ACCOUNTANT_APPROVED→MD_APPROVED→REFUNDED; rejects at each |

## 118. MATRIX 13 — Sensitive Field → Allowed Roles

| Field | View | Write | Delete | Notes |
|---|---|---|---|---|
| Employee PAN/Aadhaar/bank/salary | MD, HR, Accountant (`employees.view_sensitive`) | — | MD, Admin | Admin excluded from view_sensitive |
| Customer PAN/Aadhaar | MD/Admin/MktgDir/DLE/HR/Acct (`kyc_write`) | same | — | encrypted at rest |
| KYC_PAN/KYC_AADHAAR docs | doc scope | ADMIN, MD only | ADMIN, MD | |
| Property lat/long | internal only | (create/update) | — | never public UI |
| Payment reference | Accountant+ | Accountant+ | — | no CVV stored |

## 119. MATRIX 14 — Workflow → Actor → Action → Next State

| Workflow | Current | Actor | Action | Next |
|---|---|---|---|---|
| Lead | NEW | DLE/MktgDir | assign | ASSIGNED |
| Lead | CONTACTED | Telecaller | qualify | QUALIFIED |
| Opportun | SITE_VISIT_PLANNED | owner | completeVisit | SITE_VISIT_COMPLETED |
| Property | PENDING_DM_POLISH | MktgDir/DME | DM_POLISH | PENDING_MD_APPROVAL |
| Property | PENDING_MD_APPROVAL | MD/Admin | MD_APPROVE | LIVE (or REJECTED) |
| Booking | PENDING | MD/Admin/Mktg | confirm | CONFIRMED (property→BOOKED) |
| Payment | PENDING | Accountant | verify | SUCCESS |
| Expense | PENDING | Accountant | ACCOUNTANT_APPROVE | ACCOUNTANT_APPROVED |
| Expense | ACCOUNTANT_APPROVED | MD | MD_APPROVE | MD_APPROVED |
| Expense | MD_APPROVED | Accountant | MARK_REFUNDED | REFUNDED |
| Document | ACTIVE | verifier | VERIFY | VERIFIED/REJECTED |
| Task | IN_PROGRESS | assignee | complete | COMPLETED |
| Complaint | OPEN | dispatched | assign | IN_PROGRESS |

## 120. Frontend Component Architecture

**Shared permission primitives (`common/auth`):**
- `<RequirePermission perm={Permissions.LEADS_READ} fallback=…>` / `<RequireRole role={Roles.MD} …>` — provide HIDDEN / DISABLED / READ-ONLY / redirect semantics (§20).
- `usePermission(perm)`, `useRole(role)`, `usePermissions(list)` (AND/OR).
- `can(perm)` on `user.permissions`; `hasRole` via `Roles.*` values (NEVER literals, NEVER enum keys for permission values).

**Shared UI primitives (`common/ui`):** `Button`, `Card`, `Skeleton`, `EmptyState`, `InputField`, `SelectField`, `StatusChip`, `GlobalSearchInput`, `DossierLayout`, `DossierHeader`, `DataTable`, `FilterBar`, `WorkflowStepper`, `ApprovalTimeline`, `ActivityTimeline`, `EntitySelector`, `ConfirmationDialog`, `PermissionDenied`, `ErrorState`, `LoadingState`, `MobileActionBar`, `FormSection`, `Toast`.

**State management:** React context + local state (AuthContext, ToastContext) + hooks (`useSalesPipeline`, `useIdleTimer`, `usePushNotifications`); no global store dependency added (React Query/fetch through `fetchWithAuth`). Recommend introducing TanStack Query **only where cache/optimistic updates are safe**; otherwise keep current fetch pattern.

## 121-127. (Implementation Blueprint — see §128 + §129-134 below)

This Master Spec intentionally does NOT template-copy the audit; it supplies the product/UX/IA/component/field/workflow blueprint above. Remaining sections cover: Defect register, Gaps, Open questions, Testing, Phases, Acceptance.

## 121. Testing Requirements (UI)

**P0 regression guards (prevent D-01/D-02 recurrence):**
- `tests/web/route-guards.spec.ts` — assert each permission-guarded route (`/sales-pipeline`, `/customers`, `/projects`, `/bookings`, `/bookings/:id`) renders for a role HOLDING the corresponding permission **value** (e.g. `leads.read`), and redirects to PermissionDenied when lacking it. Must fail if any guard compares enum **keys**.
- `tests/web/dashboard-resolved.spec.ts` — assert `/dashboard` resolves the correct dashboard for each role (`Managing director`→MDExec, `project managers`→PMDashboard, `telecallers`→TelecallerDashboard, `HR`→HRDashboard, `accountant`→FinanceHub, `Admin (Technical)`→AdminCommandCenter); must fail on role-literal drift.

**Role/navigation/permission tests:** nav visibility per role (D-03), permission-gated action visibility, read-only vs write states, workflow transition (valid/invalid/blocked), destructive-confirmation flows, 401-refresh-then-fail, 403 state, mobile nav parity, responsive critical workflows.
**Framework:** Playwright (e2e) + Vitest/RTL (unit) + Jest (existing API).

## 122. RBAC Regression Requirements
- No UI test may use literal role/permission strings — import `Roles.*`/`Permissions.*`.
- Backend remain authoritative: every `can()`/`requireAuthz`/policy change triggers a backend RBAC test (`rbac.test.ts`, `dataScope.test.ts`, `mutationAuthorization.test.ts`, `booking-concurrency.test.ts`).

## 123. Workflow Regression Requirements
- UI state-transition tests mirror `WorkflowEngine.canTransition` for Lead/Opportunity/Property/SiteVisit; assert **blocked** transitions are disabled client-side.
- Booking/Payment/Installment/Document/Expense lifecycles asserted through their service-level contracts (no engine class for these 🟡).

## 124. Implementation Phases (per prompt §41 — recommended order)
P0 foundation/tokens/primitives → P1 auth/session/global shell → P2 nav/RBAC gates/desktop-mobile parity → P3 role command centers → P4 lead+customer+opportunity → P5 property+project+site-visit → P6 booking+payment+installment → P7 documents+KYC → P8 tasks+complaints+ops → P9 HR+attendance+employees → P10 finance+expense → P11 analytics+reporting+targets → P12 system control+audit+security → P13 mobile → P14 a11y+perf → P15 full regression.

## 125. Acceptance Criteria (Master Spec completeness)
- [ ] all active roles classified (DME-Head/DMExec=⚪ GAP; AGENT=🟠 OOS)
- [ ] every page/form/field/workflow/status/approval authority/sensitive rule/destructive action represented
- [ ] role→navigation, role→page, role→permission, page→api matrices present
- [ ] mobile+desktop+a11y specified; loading/error/empty states specified
- [ ] backend dependencies & business decisions separated; defects D-01..D-09 not hidden

## 126. Known Defects & Gaps (with target)
- **D-01 (P0):** 5 route guards use enum keys. **Target:** `Permissions.*` values.
- **D-02 (P0):** role-literal drift in `App.tsx`/`MobileBottomNav`/`SystemControlHub` (`'MD'`). **Target:** `Roles.*`.
- **D-03 (P1):** sidebar not role-gated. **Target:** derive from perms.
- **D-04 (P1):** mobile nav dead `/proposals` + missing parity. **Target:** parity + permission-aware drawer.
- **D-05 (P1):** ExpenseRefundWorkflow not engine-registered. **Target:** register `EXPENSE_REFUND`.
- **D-06 (P1):** SiteVisit/Booking/Payment missing shared enums; Lead/Task/Booking UI drift. **Target:** shared enums + enum-driven UI.
- **D-07 (P2):** `opportunities.ts` legacy `requirePermission`. **Target:** `requireAuthz`.
- **D-08 (P2):** `EmployeePermissionOverride` no API/UI. **Target:** implement endpoints + Admin override UI.
- **D-09 (P2):** no `export` permission. **Target:** add `entities.export` if bulk-export rolled.
- **Gaps:** DME-Head/DMExec dedicated surfaces (⚪), AdminCommandCenter stub, MktgDir/DLE/Accountant no dedicated dashboard, KYC-create/delete ADMIN+MD only (intended boundary), SBOM/global ranking (🟡), portal worker disabled by default.

## 127. Field-Level Master Dictionary (condensed)
- Key required fields per entity enumerated in §44–67; sensitive/validation/workflow fields are tagged there and in MATRIX 11/13. For UI-label/type/required/validation/condition defaults beyond schema+Zod → `INSUFFICIENT REPOSITORY EVIDENCE — HUMAN REVIEW REQUIRED` (noted per field group).

## 128. Reconciliation — Audit vs Live Repository (changes since audit)
- Permissions = **85** values (audit said 57) → repo authoritative.
- `AdminCommandCenter` is a **stub** (audit §17 implied functional widgets) — flag.
- D-02 is localized (isMD/isTechAdmin correct; HR/PM/Telecaller+`isMD`-in-SystemControlHub drift) — audit overstated.
- `Accountant`/`DLE`/`MktgDir` resolve to StaffDashboard (audit implied FinanceHub/Mktg dashboards) — gap.
- `SystemControlHub.tsx:12` uses `'MD'` (wrong) — additional D-02 variant.

# FINAL MASTER-SPEC DECISION REGISTER

## CONFIRMED (repository-evidenced)
- **11 active roles** (canonical values; DME-Head/DMExec/AGENT per classification). 85 permissions. 35 entities.
- **5 workflows** registered in `WorkflowEngine` (Lead, Opportunity, Property, SiteVisit) + ExpenseRefund standalone (D-05).
- **19 routes**, 18 API route files, 4 status enum multiplicity (Lead/Property/Expense/Document/Attendance/Kyc).
- Sensitive data AES-256-CBC at rest; KYC boundary (masked PAN only across portal) — 🟢.
- Backend RBAC authoritative (requireAuthz + policies + company_id scope).

## TARGET UX DECISIONS (introduced by this spec)
- Role-gated, permission-derived navigation (HIDDEN/DISABLED/READ-ONLY §20) replacing all-links-provided D-03.
- Mobile nav parity + permission-aware More-drawer (fix D-04).
- Shared `RequirePermission`/`RequireRole`/`DataTable`/`WorkflowStepper` etc. primitives.
- Actionable dashboards; dense tables; KPI-first charts; status-color+text badges.
- Session-refresh-then-retry UX (never log out on one 401) — matches existing AuthContext.

## ⚠ BUSINESS DECISIONS REQUIRED
1. Whether to invest in dedicated MktgDir / DLE / Accountant dashboards (currently Staff fallback).
2. DME-Head/DMExec future dedicated workspace (out of current scope).
3. Retire or repoint the `AdminCommandCenter` stub.
4. Confirm Accountant routing target (FinanceHub) vs StaffDashboard.
5. `EmployeePermissionOverride` UI scope (D-08).
6. Export permission rollout (D-09).
7. Verify Admin's blind-to-leads/tasks RBAC posture (🟡 NEEDS REVIEW).

## 🔴 BACKEND DEPENDENCIES
- D-01/D-02 fix is frontend-only (no backend change) — but requires P0 regression tests.
- D-05 register ExpenseRefundWorkflow (+ `EXPENSE_REFUND` in WorkflowDomain).
- D-06 add shared enums for SiteVisit/Booking/Payment (+ service-level transition guards).
- D-07 migrate `opportunities.ts` to `requireAuthz`.
- D-08 `EmployeePermissionOverride` endpoints.
- Booking/Payment/Installment/Document/Task/Complaint lack workflow-engine classes (🟡 — optional).
- SBOM/global-search ranking service (🟡).

## ⚪ ACTIVE UI GAPS
- **Digital Marketing Head** (⚪) — no dedicated dashboard/UI (must not invent).
- **Digital Marketing Executive** (⚪) — no dedicated dashboard/UI (must not invent).
- EmployeePermissionOverride UI (D-08).
- Frontend route-guard tests (D-01/D-02 regression) — missing.
- AdminCommandCenter stub; no Audit-Log tab; no Emergency-Lockdown UI surface.
- No `export` capability (D-09).
- No dedicated dashboards for MktgDir/DLE/Accountant (Staff fallback).

## 🟠 OUT OF SCOPE
- Channel-Partner / AGENT functionality + `AgentSiteVisitsDashboard`.
- Customer-Portal UI (CRM↔Portal integration only at event/API level, OOS to render).
- Payment-gateway implementation.

## 🟴 KNOWN DEFECTS
- D-01 (P0) 5 route guards enum-key. — D-02 (P0) role-literal drift. — D-03 (P1) sidebar not gated. — D-04 (P1) mobile parity + dead route. — D-05 (P1) ExpenseRefund not registered. — D-06 (P1) status drifts. — D-07 (P2) opportunities legacy auth. — D-08 (P2) override no UI. — D-09 (P2) no export.

---

# UI MASTER SPEC VERDICT

## 🟡 SPECIFICATION COMPLETE WITH HUMAN REVIEW ITEMS

**Reason:** Spec is evidence-grounded and internally consistent, but completion is blocked only by the P0 defects (D-01/D-02) that gate the redesigned UI, plus several open business decisions flagged above. These must be resolved before implementation, not by the spec.

### CONFIRMED UX SURFACE
19 routes · 18 API files · 9 role-based dashboard components (2 stubs) · dossiers for property/lead/booking/customer/opportunity/employee/document/task/complaint.

### CONFIRMED ACTIVE ROLES
MD, Admin, Marketing Director, Project Manager, Digital Lead Operator, Telecaller, HR, Accountant (+ DME-Head, DMExec = ⚪ GAP; AGENT = 🟠 OOS).

### CONFIRMED WORKFLOWS
Lead, Opportunity, Property, SiteVisit (engine) + Booking/Payment/Installment/Document/Expense/Task/Complaint (service-level; 2 no-engine 🟡).

### CONFIRMED RBAC MODEL
85 permissions · 11 roles · requireAuthz + policies + company-scoped backend authority · enum-driven perms/roles (target).

### CONFIRMED PAGE INVENTORY
Every routable page + dossier enumerated with role/perm/workflow/API mapping.

### CONFIRMED FIELD INVENTORY
Core fields per entity enumerated in §44–67 + MATRIX 11/13; beyond-schema defaults marked INSUFFICIENT EVIDENCE.

### CONFIRMED GAPS
DME-Head/DMExec surfaces; MktgDir/DLE/Accountant dashboards; Admin stub + audit/lockdown; EmployeePermissionOverride; export; route-guard tests.

### CONFIRMED DEFECTS
D-01…D-09 (all documented with targets & priorities).

### HUMAN REVIEW REQUIRED
Business decisions 1–7 above; Admin blind-to-leads posture; accounting routing; DME workspace.

### REDESIGN IMPLEMENTATION ORDER
See §124 (P0→P15).

---

*This Master Spec is a specification only. No source, schema, RBAC, workflow, migration, test, or component files were modified. Implementation should begin only after P0 (D-01/D-02) fixes and the listed business decisions are resolved.*











