# RRH-CRMS — Authoritative Transformation Roadmap

> **This document is the authoritative roadmap source of truth for RRH-CRMS unless a newer explicitly-authorized roadmap document supersedes it.**

> **Created:** 2026-08-13
> **Purpose:** Single source of truth after major roadmap reconciliation. Supersedes all prior roadmap status documents, reconciliation documents, and phase-specific status files.

---

## 1. Document Purpose

This document establishes the authoritative roadmap state for the RRH-CRMS transformation. It replaces all prior roadmap status documents, reconciliation reports, and phase-specific status files as the single source of truth.

Any future roadmap work must reference this document before beginning implementation.

---

## 2. Current Repository Checkpoint

| Metric | Value |
|---|---|
| Prisma Models | 35 |
| API Route Files | 24 |
| Service Files | 10 |
| Workflow Files | 6 |
| Policy Files | 10 |
| Frontend TSX Files | 57 |
| Test Suites | 25 |
| Tests Passing | 222/222 |
| shared Typecheck | PASS |
| API Typecheck | PASS |
| Web Typecheck | PASS |
| Production Database | NOT TOUCHED |
| Channel Partner Contamination | CLEAN (zero active references) |

---

## 3. Master Phase Status Table

| Phase | Description | Status |
|---|---|---|
| **Phase 0** | Repository Baseline & Protection | ✅ COMPLETE |
| **Phase 1** | Architecture & Domain Foundation | ✅ COMPLETE |
| **Phase 2** | Security & Authorization Hardening | ✅ COMPLETE |
| **Phase 3** | Customer 360 Foundation | ✅ COMPLETE |
| **Phase 4** | Lead Management Engine | ✅ COMPLETE |
| **Phase 5** | Property + Project + Inventory Architecture | ✅ COMPLETE |
| **Phase 6** | Property Matching Engine | ✅ COMPLETE |
| **Phase 7** | Site Visit System | ✅ COMPLETE |
| **Phase 8** | Opportunity & Sales Pipeline | ✅ COMPLETE |
| **Phase 9** | Booking System | ✅ COMPLETE |
| **Phase 10** | Payment & Finance Integration | ✅ COMPLETE |
| **Phase 10 Packet 1** | Channel Partner Excision | ✅ GREEN |
| **Phase 11** | Document Management | ❌ NOT STARTED |
| **Phase 12** | Marketing Attribution | ❌ NOT STARTED |
| **Phase 13** | Channel Partner Ecosystem | 🚫 PERMANENTLY EXCISED |
| **Phase 14** | After-Sales CRM | ❌ NOT STARTED |
| **Phase 15** | SLA + Automation Engine | ❌ NOT STARTED |
| **Phase 16** | Dashboards & Business Intelligence | 🟡 PARTIAL |
| **Phase 17** | AI Layer | ❌ NOT STARTED |
| **Phase 18** | Full QA / Security / Performance | 🟡 PARTIAL |
| **Phase 19** | Brand / UI Transformation | ❌ NOT STARTED |
| **Phase 20** | Production Readiness | ❌ NOT STARTED |

---

## 4. Phase 0–10 Completion Statement

Master Phases 0 through 10 are COMPLETE. This has been verified against the actual repository state:

- **Phase 0:** Documentation audit artifacts exist in `docs/transformation/phase-0/`.
- **Phase 1:** `apps/api`, `apps/web`, `packages/shared` separation complete. Server, middleware, auth architecture in place.
- **Phase 2:** `authorization.ts`, `dataScope.ts`, RBAC engine implemented. 25 test suites, 222 tests ALL PASS.
- **Phase 3:** `Customer` model, `customer.service.ts`, `customer.policy.ts`, `phase3-customer.test.ts` all exist.
- **Phase 4:** `Lead` model has `campaign`, `utm_source`, `utm_medium`, `utm_campaign`, `lead_score`, `sla_breach_at`. Duplicate detection, scoring, SLA tracking, OPPORTUNITY_OPEN workflow, IDOR protection via `LeadPolicy.canMutate` all functional. `leads.test.ts` passes 9/9.
- **Phase 5:** `Project` model exists with `Project→Property(Many)` hybrid architecture. `project.service.ts`, `projects.ts` routes, `projects.test.ts` all exist.
- **Phase 6:** `matchingEngine.ts` with deterministic scoring (location 40pts, budget 40pts, category 20pts). `LeadMatchingRequirement`, `LeadPropertyInterest` models. `GET /matches` endpoint.
- **Phase 7:** `SiteVisitBooking` model, `siteVisit.service.ts`, `SiteVisitWorkflow`, `SiteVisitPolicy`, 4+ test suites.
- **Phase 8:** `Opportunity` model with `booking_id`, `OpportunityHistory`. `opportunity.service.ts` with pipeline metrics, conversion analytics. 3+ test suites.
- **Phase 9:** `Booking` model, Property locking (`locked_until`, `locked_by_booking_id`), `Opportunity→Booking` conversion, KYC fields, MD approval. 5 packets executed.
- **Phase 10:** `Payment` model, `Installment` model, collections, overpayment prevention.
- **Phase 10 Packet 1:** Channel Partner excision complete (1A app layer, 1B database, 1C regression). All GREEN. Zero active CP references.

---

## 5. Channel Partner Excision Statement

Channel Partner functionality was intentionally removed from RRH-CRMS. It is PERMANENTLY EXCISED from the current product scope.

The following must NEVER be recreated:
- `ChannelPartner` model
- `CPPayout` model
- `LeadProtectionLock` model
- `CHANNEL_PARTNER` or `CHANNEL_PARTNER_MANAGER` roles
- `CHANNEL_PARTNERS_*` permissions
- CP routes (`/cp`)
- CP UI components (`AddCPWizard`, `ChannelPartnerManagement`)
- CP data-scope branches
- CP seed logic

Historical migration files and documentation may contain CP references. These are frozen artifacts and must not be modified.

Active application code must remain free of Channel Partner functionality.

---

## 6. Current Architecture Summary

### Schema (35 Prisma Models)
```
Company, Branch, Employee, Role, Permission, RolePermission, EmployeeRole,
EmployeePermissionOverride, EmployeeQrCode, AttendanceLog, AttendanceProposal,
Task, DailyReport, AuditEvent, Notification, DailyTarget, PerformanceSnapshot,
Lead, LeadActivity, LeadMatchingRequirement, LeadPropertyInterest,
Project, Property, PropertyImage, PropertyVerificationLog, SiteVisitBooking,
ExpenseRefund, PushSubscription, AuthSession, Customer, Booking, Payment,
Installment, Opportunity, OpportunityHistory
```

### API Routes (24 files)
```
admin, announcement, attendance, auth, booking.routes, customers, employees,
expenseRefunds, health, installment.routes, leads, md, notifications,
opportunities, payment.routes, performance, projects, properties, public,
pushSubscriptions, reports, siteVisits, targets, tasks
```

### Services (10 files)
```
booking, customer, expenseRefund, installment, lead, opportunity, payment,
project, property, siteVisit
```

### Workflows (6 files + engine)
```
expenseRefund, lead, opportunity, property, siteVisit, types, workflowEngine
```

### Policies (10 files)
```
booking, customer, expenseRefund, lead, opportunity, payment, project,
property, siteVisit, task
```

### Frontend (57 TSX files)
Full React SPA with Vite, React Router, Tailwind CSS, Context API. Covers: Auth, Leads, Sales Pipeline, Site Visits, Bookings, Customers, Properties, Projects, Tasks, Employees, HR, Finance, Dashboards, Analytics, Performance, Notifications, Profile, System Control.

### Tests (25 suites, 222 tests)
```
auth, auth-integration, authorization, baseline, booking-concurrency,
dataScope, leads, mutationAuthorization, opportunities, opportunities-integration,
opportunity-pipeline, packet3-opp-booking, packet4-installments,
packet5-md-approval, phase2-security, phase3-customer, phase4-lead-engine,
phase4-site-visits, phase7, phase8, projects, properties, rbac, siteVisits,
workflowEngine
```

### Migrations (6 total)
```
20260812072148_phase5_commercial_foundation
20260812160000_phase5_project_foundation
20260812183000_phase8_opportunity_foundation
20260813000000_phase8_opportunity_pipeline_intelligence
20260813101500_phase9_packet1_booking_inventory_installments
20260813162651_phase10_packet1b_remove_channel_partner_domain
```

---

## 7. Current Business Flow

The end-to-end business flow supported by the current repository:

```
Lead (Creation, Assignment, Routing, Scoring, SLA)
  → Qualification (Status Workflow)
  → Requirement Capture (Budget, Location, Property Type)
  → Property Matching (Deterministic Engine)
  → Site Visit (Scheduling, Verification, Agent Assignment, Completion)
  → Opportunity (Pipeline Stages, Metrics, Analytics)
  → Negotiation
  → Booking (INITIATED → TOKEN_RECEIVED → CONFIRMED → REGISTERED/CANCELLED)
  → Payment / Collections (Installments, Overpayment Prevention)
  → Documents (NOT YET IMPLEMENTED — Phase 11)
  → Registration / Closure
  → After-Sales (NOT YET IMPLEMENTED — Phase 14)
  → Analytics / AI (NOT YET IMPLEMENTED — Phases 16/17)
```

---

## 8. Completed Capabilities

| Domain | Capabilities |
|---|---|
| **CRM** | Lead creation, assignment, routing, scoring, SLA tracking, duplicate detection, UTM/campaign attribution, workflow state machine (11 states including OPPORTUNITY_OPEN), recovery to pool |
| **Customer** | Idempotent creation from Lead, KYC fields (PAN, Aadhaar), soft duplicate check |
| **Sales** | Opportunity pipeline (10 stages), pipeline metrics, conversion analytics, Lead→Opportunity integration, Opportunity→Booking conversion |
| **Property** | Project→Property hierarchy, verification lifecycle (PENDING_VERIFICATION → LIVE), inventory locking, deterministic matching engine |
| **Site Visits** | Full lifecycle, agent assignment with fallback, workflow state machine, IDOR protection |
| **Booking** | Full lifecycle (INITIATED → REGISTERED/CANCELLED), MD approval, KYC enforcement, concurrency protection |
| **Collections** | Installment schedule, payment recording/two-step verification, overpayment prevention, Admin blocked from verify |
| **Security** | Multi-tenant isolation (company_id), RBAC, object-level policies, IDOR protection, data-scope engine |
| **Operations** | Task management, attendance, daily reports, targets |
| **EMS** | Employee management, roles, permissions, hierarchy |
| **Reporting** | MD executive dashboard, analytics hub, role-based visibility |

---

## 9. Remaining Phases

| Phase | Description | Status | Potential Scope |
|---|---|---|---|
| **Phase 11** | Document Management | NOT STARTED | Booking documents, receipts, KYC references, agreements, legal docs, metadata, ownership, lifecycle, access control, audit, generation, e-signature |
| **Phase 12** | Marketing Attribution | NOT STARTED | Campaign management, ROI tracking, multi-touch attribution |
| **Phase 14** | After-Sales CRM | NOT STARTED | Complaints, support ticketing, customer feedback |
| **Phase 15** | SLA + Automation Engine | NOT STARTED | Timer-based escalation, automated workflows |
| **Phase 16** | Dashboards & BI | PARTIAL | Unified cross-module BI, real-time data, custom reports |
| **Phase 17** | AI Layer | NOT STARTED | AI lead scoring, predictive analytics, recommendations |
| **Phase 18** | Full QA / Security / Performance | PARTIAL | Load testing, penetration testing, accessibility |
| **Phase 19** | Brand / UI Transformation | NOT STARTED | Design system, component library, responsive overhaul |
| **Phase 20** | Production Readiness | NOT STARTED | CI/CD, monitoring, logging, alerting, backup/restore |

---

## 10. Current Next Phase

**MASTER PHASE 11 — DOCUMENT MANAGEMENT**

This is the next unstarted phase in the Master Roadmap sequence. It will be started separately after human review. Implementation will follow the packet structure defined in the Phase 11 discovery/planning process.

---

## 11. Important Roadmap Rules

1. **Historical phase-numbering drift:** The repository was executed using a temporary phase numbering that drifted from the Master Roadmap. Some historical phases were executed out of order (e.g., Site Visits and Bookings were built before Lead Engine and Property/Project). All phases are now COMPLETE regardless of execution order.

2. **Stale documents:** Multiple roadmap documents contain outdated claims about missing phases, test failures, and security vulnerabilities. These are superseded by the latest verified repository state and this authoritative roadmap.

3. **Channel Partner is permanently excised.** Do not propose bringing it back. Do not recreate CP functionality under any alternative name.

4. **Each phase must follow the packet structure.** No implementation begins without explicit discovery/planning packet review and human authorization.

5. **Repository evidence is authoritative.** When documents conflict with the actual repository state, the repository takes precedence.

---

## 12. Historical Phase-Numbering Drift

The repository was executed using a temporary phase numbering that drifted from the Master Roadmap:

| Execution Order | Historical Phase | Master Phase |
|---|---|---|
| 1–4 | Phases 0–3 | Phases 0–3 (aligned) |
| 5 | Phase 4 (historical) | **Phase 7** (Site Visits) |
| 6 | Phase 5 (historical) | **Phase 9 + 10** (Booking + Payment) |
| 7 | Phase 4-lead-engine | **Phase 4** (Lead Engine) |
| 8 | Phase 5 (property/project) | **Phase 5** (Property/Project) |
| 9–10 | Phases 6–7 | Phases 6–7 |
| 11 | Phase 8 | Phase 8 |
| 12 | Phase 9 (Packets 1–5) | Phase 9 |
| 13–15 | Phase 10 Packet 1 (A/B/C) | CP Excision |

Master Phases 4, 5, 6 were executed AFTER Master Phases 7, 9, 10 were already built. This is the reverse of the intended Master Roadmap order. All phases are now COMPLETE regardless of execution order.

---

## 13. Known Stale / Superseded Roadmap Documents

The following documents contain outdated claims that are superseded by this authoritative roadmap and the verified repository state:

| Document | Issue |
|---|---|
| `docs/roadmap/phase-0/13-roadmap-status.md` | Claims Phase 3 "NOT STARTED", Phase 8/9/10 "NOT STARTED", Phase 13 "SUBSTANTIALLY COMPLETE" |
| `docs/roadmap/reconciliation/03-roadmap-reconciliation.md` | Claims Phase 4/5/6 "PARTIAL/MISSING", Phase 8 "Missing", Phase 9 "NOT STARTED" |
| `docs/roadmap/reconciliation/04-recommended-next-phase.md` | Recommends "IMPLEMENT MASTER PHASE 4" as next step |
| `docs/roadmap/reconciliation/05-phase-4-reconciliation.md` | Claims 7 test failures, IDOR vulnerabilities, workflow bypass |
| `docs/roadmap/reconciliation/05-phase-5-property-project-inventory-audit.md` | Claims Project "MISSING", Unit "MISSING" |
| `docs/roadmap/phase-5/09-phase-5-execution-status.md` | States "Master Phase 4 — Lead Management Engine" is next |
| `docs/roadmap/phase-9/01-phase9-architecture-reconciliation.md` | Claims Booking lacks Opportunity link, Property lacks locking |

These documents are preserved for historical reference but must not be used as current implementation instructions.

---

## 14. AI-Agent Operating Rules

**RULE 1:** Never infer the next phase from old historical documents. Always read this authoritative roadmap first.

**RULE 2:** Always read this authoritative roadmap before beginning roadmap work.

**RULE 3:** Never implement a later phase merely because related code already exists.

**RULE 4:** Existing functionality must be treated as completed only when repository evidence supports it.

**RULE 5:** Do not remove working functionality merely because an old roadmap document says it is missing.

**RULE 6:** Do not resurrect Channel Partner functionality.

**RULE 7:** Before implementing a phase, perform a read-only discovery/audit of the current repository.

**RULE 8:** Each phase must have explicit packets.

**RULE 9:** Each packet must have: scope, objective, dependencies, files likely affected, database impact, API impact, frontend impact, security impact, test strategy, acceptance criteria, rollback/safety considerations.

**RULE 10:** Do not start implementation until the relevant discovery/planning packet has been reviewed and explicitly authorized.

**RULE 11:** Do not run the full expensive `npm run test:api` suite automatically unless explicitly instructed. Targeted tests may be run when appropriate.

**RULE 12:** Never modify production database or production infrastructure during development/audit work.

**RULE 13:** Never treat historical migration files as active business code.

**RULE 14:** When roadmap documents conflict, the newest explicitly-authorized authoritative roadmap and verified repository evidence take precedence over historical documents.

---

## 15. Checkpoint Verification

This authoritative roadmap was created after verifying:

- [x] 35 Prisma models confirmed
- [x] 24 API route files confirmed
- [x] 10 service files confirmed
- [x] 25 test suites confirmed
- [x] 222 tests passing (full suite run)
- [x] Zero CP references in source code (apps/api/src, apps/web/src, tests, packages)
- [x] No CP models in schema.prisma
- [x] No CP routes in apps/api/src/routes/
- [x] 6 migrations confirmed (5 historical + 1 CP excision)
- [x] Typecheck passes (shared, api, web)
- [x] Production database NOT touched
- [x] Phase 0–10 ALL COMPLETE verified against repository evidence
- [x] Phase 10 Packet 1 (CP Excision) GREEN verified

---

**END OF AUTHORITATIVE ROADMAP**

*This document supersedes all prior roadmap status documents unless a newer explicitly-authorized roadmap document replaces it.*
