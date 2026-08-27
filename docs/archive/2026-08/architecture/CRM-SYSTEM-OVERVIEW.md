# CRM-SYSTEM-OVERVIEW

> Executive and technical overview of the **RRH-CRMS** monorepo, verified against the
> repository at commit `93cf058` (main, ahead of origin).

## 1. Purpose & Scope

RRH-CRMS is a **multi-tenant, role-based real-estate CRM** plus a **Progressive Web App
(PWA)** serving the RRH Group brands (**RADHA_REAL_HOMES**, **SONTHILLU**). It covers the
full internal sales operations pipeline: lead management, opportunity pipeline, customer
& KYC, project & property inventory, site visits, bookings, payments & installments,
expense refunds, complaint management, document management, employee HR/attendance,
daily targets, task/SLA, performance scoring, notifications, audit, and analytics. It
also exposes **public APIs** for website integration and a **customer-portal integration**
layer (Phase 11) with a *future* customer portal.

**Phase 17-A** adds an **AI natural-language → structured-search-intent** boundary. Per the
approved architecture this AI is an **interpretation layer only**: it converts natural
language into a structured `SearchIntent`; the CRM performs all deterministic matching,
scoring, ranking, and business decisions. See [CRM-AI-ARCHITECTURE](CRM-AI-ARCHITECTURE.md).

## 2. Monorepo Layout (verified)

```text
RRH PWA/                          # repo root
├── apps/
│   ├── api/                      # Express + TypeScript REST API  (CommonJS, rootDir src)
│   │   ├── src/
│   │   │   ├── server.ts         # app bootstrap, middleware, route mounting
│   │   │   ├── authz/            # can() engine + data-scope builders
│   │   │   ├── middleware/       # auth (JWT/service token), authz, validate, rate limiter, correlation
│   │   │   ├── policies/         # object-level authorization policies
│   │   │   ├── routes/           # Express routers (one per domain)
│   │   │   ├── services/         # business services (+ ai/ Phase 17-A)
│   │   │   ├── utils/            # jwt, crypto, matchingEngine, hierarchy, slugify, qr, etc.
│   │   │   └── workflows/        # workflow engine + domain workflows
│   │   └── dist/                 # compiled output
│   └── web/                      # Vite + React + TypeScript PWA
│       └── src/                  # components/, context/, hooks/, pages via React Router
├── packages/
│   └── shared/                   # canonical Roles, Permissions, RolePermissionsMatrix, zod schemas
├── prisma/
│   ├── schema.prisma             # source of truth for the data model
│   ├── seed.ts                   # seeds Roles/Permissions/branches/company
│   └── migrations/               # 20+ migration folders (MySQL)
├── tests/
│   ├── api/                      # Jest + ts-jest integration/unit tests
│   ├── fixtures/                 # testUsers.ts
│   └── utils/                    # authHelpers.ts
├── scripts/                      # DB push/verify/migration scripts
├── docs/                         # roadmap + transformation reports (context)
├── uploads/                      # server-side uploads (expense proofs, property images)
├── QR/                           # QR assets
├── .env / .env.example / .env.test
├── package.json / tsconfig.json / jest.config.js / playwright.config.ts
```

## 3. Runtimes & Toolchain (verified)

| Layer | Technology | Source evidence |
|-------|-----------|-----------------|
| API backend | Node.js + TypeScript + Express 4 | `apps/api/src/server.ts`, `package.json` |
| ORM | Prisma 5 (schema-first, MySQL provider) | `prisma/schema.prisma` (`datasource db`, `provider = "mysql"`) |
| Validation | Zod (shared schemas + route-level `validateRequestBody`) | `packages/shared/src/index.ts`, `apps/api/src/middleware/validate.ts` |
| Auth | JWT access tokens (Bearer) + httpOnly refresh cookie + refresh rotation | `apps/api/src/utils/jwt.ts`, `apps/api/src/routes/auth.ts` |
| Authorization | Central `can()` engine + `requireAuthz` middleware + object policies + data scopes | `apps/api/src/authz/*`, `apps/api/src/middleware/authz.ts`, `apps/api/src/policies/*` |
| Shared constants | Roles, Permissions, RolePermissionsMatrix, zod schemas | `packages/shared/src/index.ts` |
| API tests | Jest + ts-jest + supertest (path alias `@`→`apps/api/src`, `@rrh-ems/shared`→`packages/shared`) | `jest.config.js`, `tests/api/*` |
| E2E | Playwright (declared) | `playwright.config.ts`, `tests/*.spec.ts` |
| Frontend | Vite + React + TypeScript PWA | `apps/web/src/main.tsx`, `App.tsx` |
| Extra deps | `openai`, `@openrouter/sdk` (declared, **unused by AI wire-up**), `sharp`, `bcryptjs`, `express-rate-limit` | `package.json` |

> ⚠️ `package.json` declares `openai` and `@openrouter/sdk` but Phase 17-A ships **only a
> mock provider**. Neither SDK is referenced by the current AI code path — see
> [CRM-AI-ARCHITECTURE](CRM-AI-ARCHITECTURE.md#5-ai-provider-abstraction). These are **declared but
> currently unused dependencies**.

## 4. Request Lifecycle (API)

1. **Proxy/security** — `app.set('trust proxy', 1)`; `helmet()`; CORS (credentials);
   `cookie-parser`; JSON body parser.
2. **Rate limit** — domain-specific limiters (`publicReadLimiter`, `publicWriteLimiter`,
   `loginRateLimiter`, etc.) in `apps/api/src/middleware/rateLimiter.ts`.
3. **Authenticate** — one of:
   - `authenticateToken` (employee JWT) → `req.user: TokenPayload`;
   - `authenticateServiceToken` (Portal service secret, constant-time) → `req.service`;
   - `authenticatePublicKey` (public website API key) → `req.apiKeyContext`.
4. **Authorize (scope)** — `requireAuthz(Permission, getResource?)` →
   `can(user, action, resource)` → base-permission check + object-level policy +
   company boundary (ADMIN bypass). Legacy `requireRole`/`requirePermission` still used
   on some routes.
5. **Validate** — `validateRequestBody(ZodSchema)` (strict shapes).
6. **Execute** — service → Prisma → MySQL.
7. **Respond** — JSON; errors mapped to `{ error, code }` (401/403/404/422/500).

## 5. Environments & Secrets

- `.env` is authoritative and **never committed** (`.gitignore`). `.env.example` exists.
- In production the server **fails fast at boot** if `JWT_ACCESS_SECRET`,
  `JWT_REFRESH_SECRET`, or `ENCRYPTION_KEY` are missing/too short
  (`apps/api/src/server.ts`, `if (process.env.NODE_ENV === 'production')`).
- `ENCRYPTION_KEY` is required for AES-256-CBC encryption of customer KYC
  (PAN/Aadhaar) via `apps/api/src/utils/crypto.ts`.
- **Phase 17-A**: `AI_*` configuration (`AI_ENABLED`, `AI_PROVIDER`, `AI_MODEL`,
  `AI_TIMEOUT_MS`, `AI_MAX_TOKENS`, `AI_MAX_RETRIES`) is consumed by `AIConfig.fromEnv`
  but is **not present in `.env.example`** → AI is **disabled by default** (`mock`).

## 6. Startup Seeding

On server start, `bootstrapHostingerDatabase()` (in `server.ts`) checks the employee count;
if zero, it seeds the company, main branch, and a single technical **ADMIN** account
(`RRH-ADMIN-001`) with a default password hash. The Portal worker
(`PortalWorker.start()`) is launched but **disabled by default** (`PORTAL_WORKER_ENABLED=false`).
`prisma/seed.ts` seeds branches, company, and **all Roles/Permissions/RolePermissionsMatrix**.

## 7. Conventions

- **Company scoping is the norm**: tenant-facing queries carry `company_id` derived from
  the authenticated token / API key / service payload — **never from the client**.
- **RBAC is canonical**: `Roles`, `Permissions`, `RolePermissionsMatrix` live once in
  `packages/shared` and are consumed by the API seed, route guards, and test fixtures.
- **Defense in depth**: route guard (`requireAuthz`) **and** data-scope builder
  (`buildXScope` in `authz/dataScope.ts`) **and** object-level policies.
- **Schema-first validation**: Zod `.strict()`/`.strip()` inbound to reject field injection.

## 8. Build / Test / Run

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run workspaces (API + web) in dev mode |
| `npm run build` | Build all workspaces |
| `npm run typecheck` | TypeScript type check |
| `npm test` / `npm run test:api` | Jest API tests (`--runInBand`) |
| `npm run prisma:seed` | Seed Roles/Permissions/data |
| `npm run db:push:test` | Push test database (MySQL) |

> The user runs the full regression suite manually; this documentation does not re-run it.

