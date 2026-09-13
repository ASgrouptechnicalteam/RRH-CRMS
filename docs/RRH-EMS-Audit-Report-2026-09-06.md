# RRH EMS (RSCRM) — Code Audit Report

**Date:** September 6, 2026
**Scope:** `apps/api` (Node/Express/Prisma backend), `apps/web` (React/Vite frontend), `packages/shared`, and repository-level configuration.
**Method:** Direct review of the source tree, security-critical middleware, authorization engine, server bootstrap, database schema, and package manifests.

This audit found a generally competent authorization design (centralized policy engine, role/permission model, data-scoping helpers) undermined by several concrete security gaps, a serious documentation/reality mismatch on the database engine, and heavy repository clutter that will slow down future work and increase the chance of shipping debug code to production.

---

## 1. Critical / High-Severity Findings

### 1.1 CORS origin check can be bypassed with a look-alike domain

`apps/api/src/server.ts` allows any origin where `origin.includes('radharealhomeproperties.com')` is true, combined with `credentials: true`. `String.includes()` is not anchored, so an attacker-controlled domain such as `radharealhomeproperties.com.evil-attacker.io` or `evilradharealhomeproperties.com` would also pass this check and be allowed to make authenticated, cookie-bearing cross-origin requests. The same block also allows **any** `*.vercel.app` origin — since Vercel preview subdomains can be claimed by anyone, this effectively trusts any third party who deploys a project on Vercel.

**Fix:** match the exact hostname or a properly anchored suffix, e.g. `origin === 'https://radharealhomeproperties.com' || origin.endsWith('.radharealhomeproperties.com')`, and drop the blanket `.vercel.app` allowance (or restrict it to your own known preview project prefix).

### 1.2 Multi-tenant data isolation is not enforced for Leads, Employees, Projects, or Customers

`apps/api/src/authz/dataScope.ts` defines `getBaseScope()` which **always returns `{}`**, with the comment "Global visibility across all companies by default (except Properties)". Every scope builder (`buildLeadScope`, `buildEmployeeScope`, `buildProjectScope`, `buildCustomerScope`) applies this base scope for Admin/Management roles, meaning those roles see records across **every company** in the database, not just their own. Only `buildPropertyScope` explicitly filters by `company_id`.

If the system is ever used for more than one company (the schema clearly models multi-tenancy via `company_id` on every major table), this is a data-leak: an Admin or Manager in Company A would see Company B's leads, employee records (including salary/PII fields judging by the seed data), projects, and customers. Even in a single-company deployment today, this is a landmine for the moment a second company/branch entity is onboarded.

**Fix:** apply `company_id: user.companyId` (with an explicit Admin-only global bypass) consistently across all scope builders, the same way Properties already does.

### 1.3 Symmetric encryption without integrity protection (KYC data)

`apps/api/src/utils/crypto.ts` encrypts sensitive data (used for KYC per the comments) with AES-256-CBC and no MAC/AEAD. Ciphertext integrity is not verified on decrypt, which makes the scheme vulnerable to bit-flipping/padding-oracle style tampering, and there's no way to detect corrupted or tampered stored values other than a decrypt exception.

**Fix:** switch to an authenticated cipher mode, e.g. `aes-256-gcm`, storing the auth tag alongside the IV and ciphertext.

### 1.4 Hardcoded, realistic-looking PII in production startup code

`apps/api/src/server.ts` (`bootstrapHostingerDatabase`) runs on **every server start** when the employee table is empty, and inserts a seed "Technical Admin" record containing a hardcoded Aadhaar number (`123456789012`), a PAN-shaped number, a bank account number and IFSC, and home addresses. It also falls back to a hardcoded weak password (`Radhareal@123`) when `DEFAULT_ADMIN_PASSWORD` isn't set (this path is blocked in production by a thrown error, which is good, but the fallback still exists for non-production runs and lives in the same function as the seeding logic).

This kind of demo/seed logic does not belong in the request-serving process at all — it should be a one-off script (e.g. `prisma/seed.ts`, which already exists in the repo and is the correct place for this).

**Fix:** delete `bootstrapHostingerDatabase` from `server.ts` entirely and move any legitimate first-run bootstrap into `prisma/seed.ts`, using environment variables (not hardcoded literals) for anything resembling real PII.

### 1.5 Database engine does not match the documented architecture

The project brief describes **PostgreSQL via Prisma ORM**, but `apps/api/prisma/schema.prisma` declares `provider = "mysql"`, and `server.ts` explicitly logs `"Connected to Hostinger MySQL"`. `.env.example` also documents a `mysql://` connection string. This is a meaningful mismatch between documentation and the deployed reality — anyone provisioning infrastructure, writing raw SQL, or onboarding from the docs would be misled about which database engine, feature set (e.g. MySQL JSON/array handling differs from Postgres), and hosting requirements apply.

**Fix:** update the project documentation to reflect MySQL (Hostinger), or if Postgres is the intended long-term target, treat this as an open migration item and say so explicitly.

---

## 2. Medium-Severity Findings

### 2.1 API rate limiter is applied twice

In `server.ts`, `apiRateLimiter` is mounted globally at line ~104 (`app.use(apiRateLimiter)`) **and again** at `app.use('/api/', apiRateLimiter)` a few lines later. Every request under `/api/` therefore consumes two hits against the same limiter window, silently halving the effective limit (300/15min becomes ~150/15min in practice) without that being documented or intended anywhere.

### 2.2 Every route is mounted twice under two different URL namespaces

Every route module (`authRoutes`, `leadRoutes`, `employeeRoutes`, etc.) is mounted both directly under `/api/v1/...` and again under `/api/v1/internal/...`, using the same router instances. The comment marks this "Phase 1 Migration," but as it stands it doubles the public attack surface (two live paths to every endpoint), makes it easy to apply a security control — e.g. a stricter rate limiter — to one path and forget the other, and adds long-term maintenance confusion. This migration should be finished (cut over fully to one namespace and remove the other) rather than left running both permanently.

### 2.3 Nested Git repository inside `apps/api`

`apps/api/.git` exists as its own, independent Git repository, separate from the root `RRH PWA/.git`. There's no `.gitmodules` file, so this isn't a properly configured submodule — it's either an accidental `git init` run inside a subfolder, or a leftover from restructuring. Depending on how the root repo currently tracks that path, this can mean: (a) the root repository silently ignores everything under `apps/api` (git treats a nested `.git` as a repository boundary), or (b) `apps/api` was committed as an opaque "gitlink" pointing at a commit nobody else can resolve. Either way, a fresh clone of the root repository is at real risk of arriving without a working `apps/api`, or with a stale one.

**Fix:** decide whether `apps/api` should be a real Git submodule (add `.gitmodules` and manage it explicitly) or a normal part of the monorepo (delete `apps/api/.git` and let the root repo track the files directly). Verify with `git status` at the root immediately after either choice.

### 2.4 Dependency versions are inconsistent and duplicated across the monorepo

- Root `package.json` lists nearly identical packages in **both** `dependencies` and `devDependencies` (`@playwright/test`, `bcryptjs`, `eslint`, `express`, `jest`, `openai`, `prettier`, `prisma`, `supertest`, `ts-jest`, `ts-node`, `typescript`). This is redundant, and for a few of these (e.g. `express`, `jest`) there's no reason for them to be root dependencies at all rather than devDependencies of the relevant workspace.
- `express-rate-limit` is `^7.4.0` in `apps/api` but `^8.6.2` in the root — a major version apart, with different behavior/typings, on the same monorepo.
- `@types/express-rate-limit` is `^6.0.0` in `apps/api` vs `^5.1.3` at root — also inconsistent, and largely unnecessary in modern versions since `express-rate-limit` ships its own types.

**Fix:** run a dependency audit across all three `package.json` files, remove duplicate root-level runtime dependencies that belong only in a workspace, and pin `express-rate-limit` to one version repo-wide.

### 2.5 `puppeteer` as a full production dependency

`apps/api/package.json` lists `puppeteer` (which bundles a full Chromium download) as a direct dependency. This significantly increases install time, deploy image size, and attack surface (a full browser engine running server-side) for what is likely a narrow PDF/screenshot-generation use case. Worth confirming whether `puppeteer-core` with an externally-managed Chromium, or a lighter PDF library, would suffice.

### 2.6 Generic/duplicated error handling swallows detail inconsistently

The global error handler in `server.ts` logs full Prisma errors and stack traces server-side (good), but some earlier catch blocks in `middleware/auth.ts` log the **full error object** (`logger.error('JWT VERIFICATION ERROR:', err.name, err.message, err)`) at `error` level for routine, expected conditions like an expired token — this will make genuine failures harder to spot in logs once the app is under real traffic, since expired-token noise dominates.

---

## 3. Repository Hygiene (Low severity individually, high cumulative cost)

The working tree is heavily cluttered with one-off debugging and migration scripts that were left in place rather than deleted or moved into a `scripts/` or `scratch/`-only area with clear naming:

- **Repo root:** `dummy.js`, `dummy_test.ts`, `check_admin.js`, `check_exit_reason.js`, `check-images.ts`, `diagnostic.ts`, `diagnostic_check.ts`, `patch.js`, `migrateAllPhases.js`, `migratePhase1.js`, `migratePhase1Strict.js`, `migratePhases234.js`, `search_secrets.js`, `find_unvalidated.js`, `replace_consoles.js`, `replace-imports.js`, `update-tailwind.js`, `verify_workflows.js`, plus large captured-output text files (`git_history.txt` at **86 MB**, `test_output.log` at 150 KB, `test-results.json` at 481 KB, `findUnique_all.txt`, `authz_usage.txt`, `authorization.diff.txt`, `auth_routes.txt`, `lead_diff.txt`, etc.) and multiple `.sql` scratch queries (`show_tables.sql`, `redisql.sql`, `count_tables.sql`, …).
- **`apps/api`:** `check.js`, `check2.js`, `check_company.js`, `check_counts.js`, `check_metrics.js`, `scratch.js` through `scratch6.js`, `test-fetch.js`, `test-login.js`, `test-notif.js`, `test-prisma.js`/`test-prisma2.js`, `test-db.js`, `rename.js`, `fix-property-perms.js`, `migrate_status.js`, `update_files.js`, and several ad-hoc `.ts` test/verify files (`test-demo.ts`, `test-escalation-queue.ts`, `test-properties.ts`, `verify_jobs.ts`) sitting next to real source — none of these are in the `tests/` directory.
- **`apps/api/prisma`:** `dev.db` (an empty leftover SQLite file, inconsistent with the MySQL datasource), plus more scratch scripts and `.sql` files (`check_lead.sql`, `drop_and_create.sql`, `final_verification.js`, `list_tables.js`, etc.).
- **`apps/web`:** `archive.zip`, `code.txt` (49 KB), `old_case5.txt`, and a stray Vite temp file `vite.config.ts.timestamp-....mjs` that should never be committed.

None of this is "wrong" in the sense of breaking functionality, but it: (1) makes it hard for a new contributor (or you, in six months) to tell real application code from throwaway debugging, (2) bloats the repository — the 86 MB `git_history.txt` alone is enormous for a web app repo, (3) risks one of these ad-hoc scripts containing a hardcoded credential or being run against production by accident, and (4) suggests there is no `.gitignore`/pre-commit discipline catching this before commit (the existing Husky + lint-staged setup only runs Prettier/ESLint on staged `.ts`/`.tsx`/`.json` files — it doesn't block stray files from being added).

**Fix:** sweep root, `apps/api`, and `apps/web` for anything that isn't application source, real tests, or config; move genuinely useful diagnostic scripts into a clearly-named `scripts/adhoc/` (git-ignored) folder, delete the rest, and add a `.gitignore` rule for `*.diff.txt`, `*_output.txt`, `scratch*.{js,ts}`, and similar patterns going forward.

---

## 4. Code Quality Observations

- **Very large single files:** `services/lead.service.ts` (~50 KB), `packages` aside, `shared/index.ts` (~62 KB), `services/analytics.service.ts` (~21 KB), `services/property.service.ts` (~26 KB), `services/siteVisit.service.ts` (~35 KB), and route files like `routes/attendance.ts` (~37 KB), `routes/employees.ts` (~35 KB), `routes/properties.ts` (~27 KB), `routes/public.ts` (~23 KB) are all large enough that they likely mix multiple responsibilities. Splitting these by sub-domain (e.g. `lead.service/assignment.ts`, `lead.service/scoring.ts`) would make the authorization and business logic easier to review and test in isolation — which matters given several of the findings above were only visible after reading full files closely.
- **Authorization design is a genuine strength.** The `can()` engine in `authz/authorization.ts` with an explicit, fail-closed default for resource-scoped permissions, plus dedicated policy modules per entity (`policies/*.policy.ts`), is a solid pattern and clearly more disciplined than the ad-hoc `requireRole`/`requirePermission` checks that still exist alongside it in `middleware/auth.ts`. Worth consolidating fully onto `requireAuthz`/`can()` over time and retiring the older role/permission-only middleware where it's still used, to avoid two competing authorization mechanisms.
- **Rate limiting has good intent** (separate limiters for login, public writes, AI search, refresh) and the login limiter usefully writes a `SECURITY_ALERT` audit event — but see 2.1 for the double-mount bug, and note the audit event's `actor_id: 0` is a magic number that should be a named constant (e.g. `SYSTEM_ACTOR_ID`) if `0` isn't a real employee id.
- **Input validation** via `zod` in `middleware/validate.ts` is implemented cleanly and gives client-friendly field-level errors — good practice, though it's only as strong as how consistently every route actually calls it (not independently verified for all ~30 route files in this pass).

---

## 5. Summary Table

| #   | Finding                                                                  | Severity         | Area                          |
| --- | ------------------------------------------------------------------------ | ---------------- | ----------------------------- |
| 1.1 | CORS origin substring match + open `*.vercel.app` trust                  | High             | Security                      |
| 1.2 | No company-level data isolation for Leads/Employees/Projects/Customers   | High             | Security / Multi-tenancy      |
| 1.3 | AES-256-CBC without integrity check for KYC data                         | High             | Security / Crypto             |
| 1.4 | Hardcoded PII-shaped seed data + weak default password in server startup | High             | Security / Data hygiene       |
| 1.5 | Docs say PostgreSQL, actual DB is MySQL                                  | High             | Documentation / Architecture  |
| 2.1 | `apiRateLimiter` mounted twice, halving effective limit                  | Medium           | Bug                           |
| 2.2 | Every route mounted twice (`/api/v1` and `/api/v1/internal`)             | Medium           | Architecture / Attack surface |
| 2.3 | Nested `.git` inside `apps/api` without submodule config                 | Medium           | Repo integrity                |
| 2.4 | Inconsistent/duplicated dependency versions across workspaces            | Medium           | Dependency management         |
| 2.5 | `puppeteer` as full production dependency                                | Medium           | Ops / Attack surface          |
| 2.6 | Full error objects logged at error level for routine auth failures       | Low-Medium       | Observability                 |
| 3.x | Dozens of scratch/debug files across root, api, prisma, web              | Low (cumulative) | Repo hygiene                  |
| 4.x | Several very large multi-responsibility files                            | Low              | Maintainability               |

---

## 6. Suggested Priority Order

1. Fix the CORS origin check (1.1) — quick fix, closes a real cross-origin authentication risk.
2. Enforce company scoping consistently in `dataScope.ts` (1.2) — before onboarding any second company/branch.
3. Move `bootstrapHostingerDatabase` out of `server.ts` and into the seed script (1.4).
4. Resolve the nested-git situation in `apps/api` (2.3) — verify nothing is silently untracked.
5. Fix the double rate-limiter mount (2.1) and decide on one route namespace (2.2).
6. Switch KYC encryption to an authenticated cipher (1.3).
7. Reconcile documentation with the actual MySQL/Hostinger stack (1.5).
8. Schedule a repository cleanup pass (section 3) and a dependency-version reconciliation (2.4).

---

_This audit covered the authentication/authorization core, server bootstrap, database schema header, and top-level repository structure in depth, and surveyed file sizes and naming across `apps/api`, `apps/web`, and `packages/shared` for hygiene issues. It did not exhaustively review every one of the ~30 route files, all service-layer business logic, or the frontend component tree line-by-line — those are good candidates for a follow-up, narrower audit (e.g. "audit every route for missing `requireAuthz` calls") if useful._
