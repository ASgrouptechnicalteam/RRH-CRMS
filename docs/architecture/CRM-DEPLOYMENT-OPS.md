# RRH-CRMS — Deployment & Operations Guide

> Gap-fill document. Sources: `apps/api/src/server.ts`, `tests/api/setup.ts`,
> `package.json`, per-workspace `package.json`/`tsconfig.json`, `.github/workflows/playwright.yml`,
> `.env.example`, `.gitignore`.

## 1. Environments & env files

| File           | Committed? | Purpose |
|----------------|------------|---------|
| `.env`         | ❌ git-ignored | Local dev runtime vars. |
| `.env.example` | ✅ template | **Incomplete** — only Portal + `ENCRYPTION_KEY` (see §2 gap). |
| `.env.test`    | ❌ git-ignored | Test DB URL + test secrets. Loaded by `tests/api/setup.ts`. |

Environment selected by `NODE_ENV` (`production`, `test`, dev default). Several
behaviors branch on it: fail-fast secret checks, the Express listener, and
rate-limit bypass in tests.

## 2. Environment variable reference

### Required at runtime
| Variable | Where used | Notes |
|----------|------------|-------|
| `JWT_ACCESS_SECRET` | `server.ts:233`, `utils/jwt.ts` | ≥32 chars; fail-fast in prod. |
| `JWT_REFRESH_SECRET` | `server.ts:237`, `utils/jwt.ts` | ≥32 chars; fail-fast in prod. |
| `ENCRYPTION_KEY` | `server.ts:241`, `utils/crypto.ts` | ≥32 chars (AES-256-CBC KYC encryption); fail-fast in prod. |
| `DATABASE_URL` | Prisma default | Hostinger MySQL connection string in prod. |
| `PORT` | `server.ts:44` | Default `3000`. |
| `APP_URL` | `server.ts:53` (CORS origin) | Default `http://localhost:5173`. |

### Portal / Customer-Portal integration (disabled by default)
| Variable | Default | Used by |
|----------|---------|---------|
| `PORTAL_API_URL` | `""` | `services/portalClient.ts` |
| `CRM_PORTAL_SECRET` | `""` | `routes/public.ts` (`/portal/*` HMAC) |
| `PORTAL_CRM_SECRET` | `""` | `routes/integration.routes.ts` callbacks |
| `PORTAL_WORKER_ENABLED` | `"false"` | `server.ts` (starts `PortalWorker`) |
| `PORTAL_POLL_INTERVAL_MS` | `"30000"` | `services/portalWorker.ts` |

### AI (Phase 17-A — disabled-by-default)
| Variable | Purpose | Used by |
|----------|---------|---------|
| `AI_ENABLED` | Feature flag | `services/ai/config.ts` |
| `AI_PROVIDER` | `mock` \| `openrouter` | `AIConfig` |
| `AI_MODEL` | Model identifier | `AIConfig` |
| `AI_TIMEOUT_MS` | Per-request timeout | gateway |
| `AI_MAX_TOKENS` | Output cap | gateway |
| `AI_MAX_RETRIES` | Bounded retry | gateway |

> ⚠️ **Gap:** `.env.example` does **not** document `JWT_ACCESS_SECRET`,
> `JWT_REFRESH_SECRET`, `DATABASE_URL`, `PORT`, `APP_URL`, `NODE_ENV`, or `AI_*`.
> New operators will miss required vars. Fix: complete `.env.example` (or add
> `.env.example.production`).

## 3. Startup sequence

Boot path in `apps/api/src/server.ts` (verified lines 231–257):

1. **Fail-fast (prod only)** — if `NODE_ENV === 'production'` and `JWT_ACCESS_SECRET`,
   `JWT_REFRESH_SECRET`, or `ENCRYPTION_KEY` is missing or < 32 chars →
   `console.error('FATAL: …')` + `process.exit(1)` (see §2).
2. **`if (NODE_ENV !== 'test')` branch:**
   - `app.listen(port)` → `[server]: API running at http://localhost:${port}`.
   - `bootstrapHostingerDatabase()` — upserts company `RRH`, branches
     `Miyapur (Main Branch)` + `Tarnaka Branch`, 11 role definitions, and — if
     `employee.count === 0` — seeds `RRH-ADMIN-001` (password `Radhareal@123`,
     bcrypt ×12). If employees exist, logs the count and returns.
   - `PortalWorker.start()` — **gated** on `PORTAL_WORKER_ENABLED` (§4).
3. **`export default app`** — so `test` and `start` can require it without
   re-listening.

> Tests never open a listener: the `NODE_ENV !== 'test'` guard plus Jest
> importing `app` directly avoids port/EADDRINUSE conflicts.

## 4. Portal background worker

- Starts only when `PORTAL_WORKER_ENABLED=true` (default `false`).
- Polls the Customer Portal for handoff/KYC/payment callbacks at
  `PORTAL_POLL_INTERVAL_MS` (default 30000).
- Uses `CRM_PORTAL_SECRET` (CRM→Portal) and `PORTAL_CRM_SECRET` (Portal→CRM).
- **Stay disabled until the Customer Portal is live** (`.env.example` warns).

## 5. Database migrations & seeding

- **Migrations**: `prisma/migrations/` — 15 ordered, additive migrations.
  `postinstall` runs `prisma generate`; `package.json` `prisma.seed` runs
  `ts-node prisma/seed.ts`.
- **Seed** (`prisma/seed.ts`): company, branches, and the full `Roles` +
  `Permissions` (84) + `RolePermissionsMatrix` from `@rrh-ems/shared`,
  idempotent via `upsert`.
- **Test DB sync**: `npm run db:push:test` → `ts-node scripts/push-test-db.ts`.
- **Scripts** (standalone CLI, not imported by app): `apply-migration.ts`,
  `check-migrations.ts`, `check-test-db.ts`, `verify-db.ts`, `show-tables.ts`,
  `execute-fixture.ts`, `run-jest.ts`.

## 6. Build & start

```bash
npm run build        # npm run build --workspaces --if-present
# api:  tsc            → apps/api/dist/server.js
# web:  tsc && vite    → apps/web/dist/
npm start            # node apps/api/dist/server.js
npm run dev          # → npm run dev --workspaces --if-present
# api:  nodemon --exec ts-node src/server.ts ;  web:  vite
```

- `postinstall`: `prisma generate`.
- Frontend static assets (`apps/web/dist`) are served by the API in fallback
  (`server.ts:94 express.static(apps/web/dist)`); production may host the SPA
  separately; `APP_URL` governs the CORS origin.

## 7. CI / pipeline

- **Committed CI**: `.github/workflows/playwright.yml` runs `npm ci` →
  `npx playwright install --with-deps` → `npx playwright test` on push/PR to
  `main|master`; publishes `playwright-report/` artifact.
- **No CI for** Jest (`test:api`), `typecheck`, `lint`, or `build`.
  (See `CRM-TESTING-STRATEGY.md` §8.)

## 8. Hosting / runtime

- **DB**: Hostinger MySQL (`DATABASE_URL`); the test DB must be isolated
  (enforced by `setup.ts`; the production DB name contains `u988844918_crms`).
- **App host**: Express on `PORT` (default 3000); `trust proxy: 1` set.
- **No containerization**: no `Dockerfile`, `docker-compose.yml`, or
  `render.yaml` — Node-direct deploy.
- **Security middleware active**: `helmet` (cross-origin policy `same-site`),
  `cors` (origin-gated, credentials), `cookie-parser`, `express-rate-limit`
  (login 5/min, public read 120/min, public write 10/min), correlation-id on
  public routes.

## 9. Operational runbook (quick start)

1. Copy `.env.example` → `.env`; add missing required vars from §2
   (`JWT_*_SECRET`, `DATABASE_URL`, `PORT`, `APP_URL`, `NODE_ENV=production`).
2. `npm ci && npm run postinstall` (generates the Prisma client).
3. `npm run prisma:seed` (or let `bootstrapHostingerDatabase()` seed on boot).
4. `npm run build && npm start`.
5. Verify: `curl http://localhost:3000/api/v1/health`.
6. Frontend: `cd apps/web && npm run dev` (Vite, port 5173).

## 10. Deployment gaps & recommendations

| # | Gap | Impact | Recommendation |
|---|-----|--------|----------------|
| 1 | `.env.example` incomplete (no JWT/DB/PORT/AI vars) | Onboarding failure | Complete it (or add `.env.example.production`). |
| 2 | No CI for tests/typecheck/build/lint | Regressions reach main | Add GitHub Jobs. |
| 3 | No Dockerfile / infra-as-code | Non-hermetic deploys | Add `Dockerfile` + compose/`render.yaml`. |
| 4 | Root scratch / investigation clutter | Confuses structure | Archive to `docs/investigation/` (see Code-Organization §6). |

