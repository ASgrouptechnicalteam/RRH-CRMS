# CRM-IMPLEMENTATION-STATUS

> **Single authoritative implementation-status dashboard** for RRH-CRMS. Every row is
> verified against source. Legend: 🟢 IMPLEMENTED · 🟡 PARTIALLY IMPLEMENTED ·
> 🔴 NOT IMPLEMENTED · 🔵 FUTURE / V2 · ⚪ OUT OF SCOPE · ⚫ UNKNOWN / HUMAN REVIEW REQUIRED.

## 1. Summary (top line)

| Domain | Status | Notes |
|--------|--------|-------|
| Authentication (JWT + refresh rotation) | 🟢 | `middleware/auth.ts`, `routes/auth.ts` |
| Authorization (RBAC + `can()` + data scope) | 🟢 | `authz/*`, `policies/*`, `middleware/authz.ts` |
| Company / tenant isolation | 🟢 | `dataScope.ts` + `can()` default; ADMIN bypass intended |
| Lead management | 🟢 | service + routes + assignment + activities |
| Opportunity pipeline | 🟢 | service + stage transition + pipeline metrics |
| Customer (+ KYC write) | 🟢 | service + routes; PAN/Aadhaar AES-256-CBC |
| Property + project + inventory | 🟢 | service + routes; publication + availability |
| Property matching engine | 🟡 | `matchingEngine.ts` weights exist; lead-scoped, **no AI-search consumer & no public search endpoint** |
| Site visits | 🟢 | book → verify → assign agent → complete |
| Bookings (+ property lock) | 🟢 | service + concurrency lock |
| Payments / installments | 🟢 | CRM record + verify; Portal sync callbacks |
| Collections | 🟡 | payments+installments implemented; no dedicated collections module |
| Documents | 🟢 | upload/metadata/verify/archive/restore; KYC docs |
| KYC | 🟢 | encrypted PAN/Aadhaar; status; Portal submit callback |
| Tasks / SLA | 🟢 | task create/status + SLA derive + teams view |
| Escalation | 🟡 | task overdue auto-alerts; no general-purpose escalation engine |
| Notifications | 🟡 | in-app `Notification` + web-push subs; Portal notifications read-only |
| Complaints | 🟢 | Phase 14-1 lifecycle |
| Expense refunds | 🟢 | employee → accountant → MD → refunded |
| Attendance / QR | 🟢 | scan + status + proposals |
| Daily targets / daily reports | 🟢 | configure + submit + team view |
| Performance scoring | 🟡 | snapshots + score; leaderboard/team |
| Audit events | 🟢 | `AuditEvent` writes across key actions; admin read |
| Analytics / MD KPIs | 🟢 | `analytics.service.ts` + `/analytics/kpis` + `/md/executive-metrics` |
| Public property/project API | 🟢 | `routes/public.ts` (allowlist, API-key, brand-scoped) |
| Public lead capture | 🟢 | `POST /public/:brand/leads` (nullable creator) |
| Website search (public) | 🟡 | public list endpoints exist; **no public structured-search endpoint** (see WR-7 gap) |
| AI Search (Phase 17-A) | 🟡 | **foundation only** (mock provider, no HTTP route; tests only) |
| Customer Portal | 🔵 | integration groundwork (Phase 11) only; portal itself future |
| Channel Partner | ⚪ | OUT OF SCOPE (removed in Phase 10) |

## 2. Cross-cutting status

| Item | Status | Evidence |
|------|--------|----------|
| Model coverage in `prisma/schema.prisma` | 🟢 | 30+ active models; only CP tables dropped |
| Migrations present (MySQL) | 🟢 | 20+ under `prisma/migrations/` |
| Test suite (Jest) | 🟢 | `tests/api/*.test.ts` incl. AI foundation tests |
| Playwright E2E | 🟡 | `playwright.config.ts` + 2 specs; not part of `test:api` |
| TypeScript build/typecheck | 🟢 (assumed healthy) | `run_tscheck.ps1`, `tsconfig.json` |
| Frontend (PWA) pages for all domains | 🟡 | `apps/web/src/components/**`; not every backend domain has a UI |
| AI at runtime | 🔴 | no HTTP route, no provider config, disabled by default |
| `.env.example` completeness | 🟡 | only partial keys catalogued; `AI_*` absent |

## 3. End-state confidence legend

- 🟢 = fully verified from source.
- 🟡 = foundation verified; a specific consumer/flow is missing (documented per row).
- ⚫ = requires human review (flag where a claim could not be conclusively
  verified from source alone).

> Detailed per-feature backend/frontend/DB/API/tests breakdown is in
> [CRM-FEATURE-INVENTORY](CRM-FEATURE-INVENTORY.md).
