# RRH-CRMS — System Documentation (Master Index)

> Authoritative, **repository-verified** reference for the **RRH-CRMS** monorepo
> (`RRH PWA`). Every claim is traceable to source files (paths are relative to the
> repo root). This package is the **current-state technical reference**, and it
> strictly separates **CURRENT IMPLEMENTATION** from **APPROVED ARCHITECTURE**,
> **FUTURE / V2**, and **OUT OF SCOPE**.

## How to read this documentation (recommended order)

```text
README
 ↓
CRM-SYSTEM-OVERVIEW          (purpose, monorepo, runtimes, request lifecycle)
 ↓
CRM-IMPLEMENTATION-STATUS    (single authoritative implementation dashboard)
 ↓
CRM-FEATURE-INVENTORY        (feature-by-feature status matrix)
 ↓
CRM-WORKFLOWS                (end-to-end business workflows)
 ↓
CRM-DATABASE-ARCHITECTURE    (Prisma models, relations, lifecycle enums)
 ↓
CRM-API-CATALOG              (all HTTP endpoints, guards, permissions)
 ↓
CRM-SECURITY-ARCHITECTURE    (authN, RBAC, company isolation, audit, boundaries)
 ↓
CRM-AI-ARCHITECTURE          (Phase 17-A AI search boundary, JSON contract, provider abstraction)
 ↓
CRM-WEBSITE-INTEGRATION      (website ↔ CRM responsibility boundary)
 ↓
CRM-V2-ROADMAP               (deferred / future / out-of-scope)
```

## Document index

| # | Document | Covers |
|---|----------|--------|
| 1 | [CRM-SYSTEM-OVERVIEW](CRM-SYSTEM-OVERVIEW.md) | Purpose & scope, monorepo layout, runtimes, request lifecycle, conventions |
| 2 | [CRM-IMPLEMENTATION-STATUS](CRM-IMPLEMENTATION-STATUS.md) | Single status dashboard across every domain (legend applied) |
| 3 | [CRM-FEATURE-INVENTORY](CRM-FEATURE-INVENTORY.md) | Feature matrix: backend / frontend / DB / API / tests |
| 4 | [CRM-WORKFLOWS](CRM-WORKFLOWS.md) | Authentication, Lead, Customer, Property, Site Visit, Booking, Payment, Collections, Documents, KYC, Task/SLA, Complaints, Expense Refund, Reporting |
| 5 | [CRM-DATABASE-ARCHITECTURE](CRM-DATABASE-ARCHITECTURE.md) | Every active Prisma model, relations, lifecycle enums, relationship map |
| 6 | [CRM-API-CATALOG](CRM-API-CATALOG.md) | Internal, Public, Auth, AI, Integration endpoints with guards/permissions |
| 7 | [CRM-SECURITY-ARCHITECTURE](CRM-SECURITY-ARCHITECTURE.md) | authN (JWT + refresh rotation), RBAC, `can()` engine, company isolation, audit, uploads, public API; implemented vs missing |
| 8 | [CRM-AI-ARCHITECTURE](CRM-AI-ARCHITECTURE.md) | Phase 17-A boundary, AI Search workflow, SearchIntent JSON contract, provider abstraction, security, limitations, V2 boundaries |
| 9 | [CRM-WEBSITE-INTEGRATION](CRM-WEBSITE-INTEGRATION.md) | Website ↔ CRM responsibility boundary, public APIs, AI-search flow, brand separation |
| 10 | [CRM-V2-ROADMAP](CRM-V2-ROADMAP.md) | Deferred functionality, V2 boundaries, out-of-scope exclusions |

## Status legend (used throughout)

| Icon | Meaning |
|------|---------|
| 🟢 | IMPLEMENTED (verified in source) |
| 🟡 | PARTIALLY IMPLEMENTED |
| 🔴 | NOT IMPLEMENTED |
| 🔵 | FUTURE / V2 |
| ⚪ | OUT OF SCOPE |
| ⚫ | UNKNOWN / HUMAN REVIEW REQUIRED |

## Evidence discipline

- The repository is the **source of truth**: code, routes, services, Prisma schema,
  permissions, workflows, validation, business logic, tests, configuration.
- Roadmaps / existing reports are **supporting evidence only**.
- If documentation says X but code does not implement X → marked **NOT IMPLEMENTED**.
- If code implements something undocumented → marked **IMPLEMENTED / UNDOCUMENTED**.
- If a claim cannot be conclusively verified → **⚫ INSUFFICIENT REPOSITORY EVIDENCE — HUMAN REVIEW REQUIRED**.

## Related (supporting, not canonical)

- `docs/roadmap/**`, `docs/transformation/**` — phase planning & reconciliation reports.
- Supporting reports: `docs/investigation/` (phase reconciliation & WR audits,
  e.g. `FINAL-SUMMARY.md`, `phase-summary-all-phases.md`, `wr-10-deployment-readiness.md`),
  `docs/reference/` (transcripts, PDFs, blueprints, e.g.
  `RRH-CRMS-Master-Roadmap-Post-Website-Readiness.md`,
  `RRH_CRMS_Complete_Current_State_to_Future_Portal_Implementation_Blueprint.md`,
  `CRM-WEBSITE-READINESS-GAP-MATRIX-VALIDATED.md`).
- Legacy root files were moved to `scripts/` (dev utilities) and
  `docs/reference/` — see `docs/architecture/CRM-CODEBASE-ORGANIZATION.md` §7.
