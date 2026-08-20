# RRH-CRMS — Testing Strategy

> Gap-fill document. Sources: `jest.config.js`, `tests/api/setup.ts`,
> `package.json`, `.github/workflows/playwright.yml`, and the test tree.

## 1. Test stack

| Layer        | Tool          | Runner       | Config / entry | Scope |
|--------------|---------------|--------------|----------------|-------|
| API (unit + integration + contract) | Jest 29 + ts-jest + supertest | `npm run test:api` (`jest --runInBand`) | `jest.config.js` | 46 files under `tests/api/` |
| Frontend E2E | Playwright    | `npx playwright test` | `playwright.config.ts` | `tests/example.spec.ts`, `tests/webapp.spec.ts` |
| Build/Types  | tsc           | `npm run typecheck` (workspace) | per-workspace `tsconfig.json` | Compile-only |

## 2. Running tests

```bash
# API unit/integration (ts-jest, single process for DB determinism)
npm run test:api
# e.g. a single file
npx jest tests/api/baseline.test.ts --runInBand

# Frontend browser E2E
npx playwright test            # requires a running API + browser binaries
```

- `npm run test:api` uses `--runInBand` (serial) because the suites share a
  single isolated **test database** (see §3). Parallel workers would collide.
- Global timeout: `testTimeout: 10000`; `forceExit: true` and
  `detectOpenHandles: true` are set in `jest.config.js`.

## 3. Test database isolation (safety guard)

Enforced in `tests/api/setup.ts` (runs before every Jest worker). It will
**`process.exit(1)`** if any of these fail:

1. `DATABASE_URL_TEST` must be defined in `.env.test`.
2. `DATABASE_URL_TEST` must **differ** from the production `DATABASE_URL`.
3. It must **not** contain `u988844918_crms` (the Hostinger production DB name).
4. `process.env.DATABASE_URL` is then overridden to the test URL **before**
   `PrismaClient` is instantiated, and fallback JWT secrets are set.

Operational runbooks:
- Provision an isolated MySQL DB per developer/CI branch.
- Record its connection string in `.env.test` (git-ignored).
- Never point `DATABASE_URL_TEST` at production. The guard exits before any
  wipe (Phase 0 deliberately does **not** truncate data).

## 4. Jest wiring (aliases)

In `jest.config.js` `moduleNameMapper`:
- `@rrh-ems/shared` → `packages/shared/src/index.ts` (so shared schemas/roles
  are exercised from source).
- `@/(.*)` → `apps/api/src/$1` (so tests can import internal modules by alias).

> `tsconfig.json` defines **no** `paths`; aliases are Jest/Vite-only.
> Production builds use relative imports.

## 5. Test identity model

`tests/fixtures/testUsers.ts` exports `setupDeterministicTestUsers()` and
`deterministicUsers` — a fixed roster of employees (incl. `RRH-ADMIN-001`)
with known roles/permissions. Tests authenticate with JWTs whose claims are
derived from these fixtures, so **no real passwords or external services**
are involved. Helpers live in `tests/utils/authHelpers.ts`.

## 6. Test inventory (by phase / domain)

| Phase / Concern | Suites (`tests/api/`) |
|-----------------|----------------------|
| Phase 0 — baseline + public boundary | `baseline.test.ts`, `phase1-public-boundary.test.ts` |
| Phase 1 — auth + RBAC | `auth.test.ts`, `auth-integration.test.ts`, `authorization.test.ts`, `rbac.test.ts`, `mutationAuthorization.test.ts`, `md-employees-isolation.test.ts` |
| Phase 2 — security | `phase2-security.test.ts` |
| Phase 3 — customer | `phase3-customer.test.ts` |
| Phase 4 — lead engine + site visits | `phase4-lead-engine.test.ts`, `phase4-site-visits.test.ts`, `leads.test.ts`, `siteVisits.test.ts` |
| Phase 5 — MD approvals | `packet5-md-approval.test.ts` |
| Phase 7 — customer portal foundation | `phase7.test.ts`, `kyc-bridge.test.ts`, `customer-notifications.test.ts` |
| Phase 8 — website readiness | `phase8.test.ts`, `wr1-availability.test.ts`, `wr1-property-publication.test.ts`, `wr1-public-safety.test.ts`, `wr2-structured-property.test.ts`, `wr3-property-media.test.ts`, `wr5-project-publication.test.ts`, `wr6-seo-slugs.test.ts`, `wr7-property-search.test.ts`, `packet12-1-attribution.test.ts`, `public-property-detail.test.ts`, `public-project-api.test.ts` |
| Phase 9 — booking/opportunity | `packet3-opp-booking.test.ts` |
| Phase 10 — payments/installments | `packet4-installments.test.ts`, `installment-sync.test.ts`, `payment-sync.test.ts` |
| Phase 11 — portal handoff/sync | `portal-handoff.test.ts`, `portal-callback.test.ts`, `portal-worker.test.ts`, `phase11` (in name) |
| Phase 12 — complaints | `packet14-1-complaint.test.ts` |
| Phase 13 — attribution | `packet12-1-attribution.test.ts` |
| Phase 14 — MD/executive | `md-employees-isolation.test.ts` |
| Phase 16 — analytics/performance | `analytics-routes.test.ts`, `performance-metric.test.ts`, `performance-routes.test.ts`, `integration-metrics.test.ts`, `opportunities-integration.test.ts`, `projects.test.ts`, `properties.test.ts` |
| Phase 17-A — AI foundation | `phase17a-ai-foundation.test.ts` |
| Workflow engine | `workflowEngine.test.ts` |
| Tasks / SLA | `tasks-sla.test.ts`, `tasks-sla-read.test.ts` |
| Authz data scope | `dataScope.test.ts` |
| Documents | `documents.test.ts` |
| Leads | `leads.test.ts` |
| Opportunities | `opportunities.test.ts`, `opportunity-pipeline.test.ts` |
| Public safety | `public-property-detail.test.ts` |
| Booking concurrency | `booking-concurrency.test.ts` |
## 7. Conventions

- **Determinism**: fixed test users (§5); no real credentials or live APIs.
- **Company scoping**: every assertion is company-isolated; cross-company access
  expects `403` (e.g. `kyc-callback.test.ts` cross-org case).
- **HTTP via supertest**: API tests import the Express `app` and assert on the
  response object — no listener is opened (`server.ts` skips `listen` when
  `NODE_ENV === 'test'`).
- **Run order**: `test:api` is `--runInBand`; suites are phase-numbered.

## 8. CI coverage (gap)

The only committed CI workflow is `.github/workflows/playwright.yml`, which runs
**Playwright E2E only** on push/PR to `main|master`. There is **no CI** for
`test:api` (Jest), `typecheck`, `lint`, or `build`. Recommendation: add GitHub
jobs for `npm run typecheck`, `npm run lint`, `npm run test:api`, and
`npm run build` to prevent regressions.
