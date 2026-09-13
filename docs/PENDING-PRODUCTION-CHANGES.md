# Pending Production Changes

**Do not apply anything in this file until Sandeep explicitly says so.**

This file exists because of a deliberate decision made on 2026-09-06: while working through `docs/RRH-CRM-Implementation-Plan.md`, the production database (Hostinger MySQL, `u988844918_RSCRM_DB` at `82.25.121.145`) stays completely untouched — no schema changes, no data writes — until the **entire** implementation plan is complete and fully verified end-to-end (frontend and backend both) against the local staging setup (XAMPP `test_db`, `127.0.0.1:3306`). Sandeep is separately rolling back the current production deployment so that ongoing `git push`es of backend code during this work don't risk live production behavior — but that only covers _code_. The _database_ still needs its own explicit, deliberate pass at the end, which is what this checklist is for.

Every item below was implemented and verified against `test_db` first. Nothing here has been run against production. When Sandeep gives the go-ahead (after full plan sign-off), work through this list top to bottom, take a fresh backup immediately before starting (even though Phase 0.2's backup exists, more will have changed by then), and check items off as they're applied — the same way the main plan tracks its own tasks.

---

## 1. Apply the `add_employee_company_access` migration (from Phase 1.2)

- [ ] **Status: not applied to production.** Applied and verified against `test_db` only.
- **What it does:** adds one new table, `EmployeeCompanyAccess` (`employee_id`, `company_id`, composite primary key, cascading FKs to `Employee` and `Company`). Purely additive — no existing columns/tables touched, no data loss risk on its own.
- **Migration file:** `apps/api/prisma/migrations/20260906113909_add_employee_company_access/migration.sql`
- **How to apply:**
  ```bash
  cd apps/api
  # DATABASE_URL must point at production for this — confirm with `echo $DATABASE_URL` (or check .env) before running, per the same guard discipline as tests/api/setup.ts
  npx prisma migrate deploy
  ```
- **Before running:** production's `_prisma_migrations` table needs to actually reflect which of the existing 4 migrations are really applied. When this was done against `test_db`, `migrate deploy` initially failed (`P3018`, duplicate column) because `test_db` had earlier been synced via `prisma db push` rather than `migrate`, so its migration history was out of sync with its real structure. Production has (as far as this session verified) never had `db push` run against it, so it likely doesn't have this problem — but check `SELECT migration_name, finished_at FROM _prisma_migrations` on production first, and don't proceed if any row has `finished_at IS NULL` (a stuck/failed migration) without resolving it the same way (`prisma migrate resolve --applied <name>`).

## 2. Seed `EmployeeCompanyAccess` grant rows for the current shared employee base (from Phase 1.2)

- [ ] **Status: not applied to production.**
- **Why:** `dataScope.ts` now resolves company access from this table, falling back to an employee's single `company_id` only when they have **zero** grant rows. Radha Real Homes (id `1`) and Sonthillu Constructions (id `17`) currently share one employee base and every current employee needs to keep seeing both companies' data — so every employee needs **two** grant rows (their own company **and** the other one). Granting only the second company would silently remove their access to the first, since the fallback only kicks in when there are no rows at all.
- **As of 2026-09-06 (read-only check, not a live count — re-verify before running):** production has 10 employees, all tagged `company_id = 1`, none tagged `17`. A stray test-fixture company (`Perf Metrics Test Co`, id `15`) also exists in production — exclude it; it should not receive grants (see §3).
- **Idempotent seed script** (safe to re-run; skips existing grants; only touches the two real companies, not test fixtures like id 15):
  ```sql
  INSERT IGNORE INTO EmployeeCompanyAccess (employee_id, company_id)
  SELECT id, 1 FROM Employee WHERE deleted_at IS NULL
  UNION
  SELECT id, 17 FROM Employee WHERE deleted_at IS NULL;
  ```
- **Re-verify before running:** confirm company ids `1` (Radha) and `17` (Sonthillu) haven't changed (`SELECT id, name, code FROM Company;`), and confirm the employee count/roster looks as expected — don't run this against a materially different employee base than the one this plan was designed against without re-checking the logic still makes sense (e.g., if the employee bases have already been split apart for real by the time this runs, **do not run this at all** — re-read Phase 1.2's notes in the main plan first).

## 3. Re-encrypt KYC/bank data to AES-256-GCM (from Phase 1.4)

- [ ] **Status: not applied to production.** Script implemented and verified against `test_db` only.
- **What it does:** `apps/api/src/utils/crypto.ts` was upgraded from AES-256-CBC to AES-256-GCM (an authenticated cipher). New writes already use GCM. This script (`apps/api/scripts/reencrypt-kyc-gcm.ts`) re-encrypts _existing_ rows — Employee's `pan_number`/`aadhaar_number`/`bank_name`/`bank_account_number`/`bank_ifsc`/`bank_branch` and Customer's `pan_number`/`aadhaar_number` — from whatever format they're currently in (legacy CBC, or even plaintext — see next bullet) to GCM.
- **Important context found during 1.4:** a separate, now-fixed bug in `apps/api/src/routes/employees.ts` meant the two employee-profile-update routes wrote these fields as **plaintext**, bypassing encryption entirely, for as long as that bug was live in production. This script handles that too — `decryptData()` treats a plaintext-shaped value as already "decrypted" and this script re-encrypts it properly — but it means **production's actual current exposure is worse than "using a weaker cipher"**: some employees' real PAN/Aadhaar/bank account numbers are likely sitting in production as plain, unencrypted text right now, for any row that was ever edited via those two routes since they were introduced. This script fixes it going forward; it does not itself constitute a breach disclosure decision — that's Sandeep's call once this is applied and it's clear which rows were actually affected.
- **How to run** (safe to interrupt or re-run; skips rows already in GCM format):
  ```bash
  cd apps/api
  # Preview first — no writes:
  npx ts-node scripts/reencrypt-kyc-gcm.ts --dry-run
  # Then actually apply:
  CONFIRM_REENCRYPT=yes-reencrypt npx ts-node scripts/reencrypt-kyc-gcm.ts
  ```
- **Verified on `test_db` (2026-09-06):** found and fixed 13 plaintext `pan_number` values (test fixtures, not production data). Re-run afterward confirmed idempotent — 0 changes, all 13 recognized as already-GCM.
- **Before running on production:** `DATABASE_URL` must point at production for this. Consider running `--dry-run` first specifically to get a count of how many rows are legacy-CBC vs. genuinely plaintext in production — that count is useful information for Sandeep before deciding whether any customer/employee notification is warranted for the plaintext cases.

## 4. Housekeeping noticed along the way (not urgent, not yet done)

- [ ] A stray test-fixture company, `Perf Metrics Test Co` (id `15`, code `PERFTEST`), exists in the production `Company` table. Found 2026-09-06 during a read-only check for Phase 1.2. Doesn't appear to be real business data — likely leaked in from a test run at some point. Worth deleting (after confirming no real records reference it) as part of Phase 4 (Repository Hygiene) or whenever production cleanup happens — logged here so it isn't forgotten, and so §2's seed script above is never accidentally pointed at it.

## 5. RBAC data gaps found during Phase 5.3's manual QA pass (2026-09-07)

Both items below are **data-only** (no schema change) — they add missing `Role`/`RolePermission` rows so the database matches what `apps/api/src/shared/auth.ts`'s `RolePermissionsMatrix` already declares in code. Neither is safe to assume is already true in production; both were found missing in `test_db` and confirmed by directly querying it, not by assumption.

- [ ] **5a. The "Channel partner manager" role has no `Role` row at all in `test_db`**, discovered via `[DIAGNOSTIC] Missing roleId for roleName: Channel partner manager` printed by the Jest test-fixture helper. Confirmed by direct query — `test_db`'s `Role` table is missing this one role that `apps/api/prisma/seed.ts` (line ~71) does create, meaning `test_db` was seeded before this role existed in the seed script and has never been re-seeded since. **If production was seeded around the same era, it likely has the identical gap** — check with `SELECT * FROM Role WHERE name = 'Channel partner manager';` before assuming otherwise. If missing, any CPM employee in production currently has **zero effective permissions** (their `EmployeeRole` would point at a role with no `RolePermission` rows, or the role doesn't exist for them to be assigned at all). Fix applied to `test_db` (not production) via a small idempotent script, not the destructive full `seed.ts` (which does `rolePermission.deleteMany({})` before rebuilding — safe on `test_db` alone since every other role there was confirmed to already match the canonical names in `RolePermissionsMatrix`, but worth re-confirming that's still true of production before ever running full `seed.ts` there):
  ```sql
  -- if missing:
  INSERT INTO Role (name, is_system, is_invisible) VALUES ('Channel partner manager', 0, 0);
  -- then sync its 16 RolePermission rows from RolePermissionsMatrix[Roles.CHANNEL_PARTNER_MANAGER]
  -- in apps/api/src/shared/auth.ts (leads.create/read/update, customers.read/update,
  -- site_visits.create/read/complete, projects.read, properties.read, reports.read_own,
  -- attendance.read_own/scan, performance.read_own, tasks.read/update)
  ```
- [ ] **5b. `Roles.MARKETING_DIRECTOR` was missing `properties.read`** in both the in-code matrix and (once added there) `test_db`'s `RolePermission` rows for that role. This role has `properties.dm_polish` and `properties.md_approve` — it's meant to review and approve properties — but there is no single-property-fetch endpoint anywhere in this codebase (`routes/properties/crud.ts` only has `GET /` for the list, gated by `properties.read`), so without that permission a Marketing Director's Properties page 403s immediately and they can never reach the list to find anything to polish or approve. Fixed in code (`apps/api/src/shared/auth.ts`) and in `test_db`'s `RolePermission` table. **Production's `RolePermission` table needs the same one row added** (role `marketing director` + permission `properties.read`) once the code change ships:
  ```sql
  INSERT IGNORE INTO RolePermission (role_id, permission_id)
  SELECT r.id, p.id FROM Role r, Permission p
  WHERE r.name = 'marketing director' AND p.name = 'properties.read';
  ```

## 6. Other production-affecting work already anticipated by the main plan

These aren't done yet either, but they're already tracked in `docs/RRH-CRM-Implementation-Plan.md` itself rather than here — listed for visibility so this file is a complete picture of "what still has to happen to production":

- **Phase 0.2** — a production backup was already taken (2026-09-06, by Sandeep) before this work began. Take a **fresh** one immediately before applying anything in this file, since more will have changed by then.

---

## How to use this file

1. Do not touch production until the entire implementation plan (`docs/RRH-CRM-Implementation-Plan.md`) is complete and verified — all phases, both frontend and backend, against `test_db`.
2. When ready, take a fresh production backup first.
3. Work through this file top to bottom. Check off each item as it's applied, with a date and who ran it, the same way the main plan records progress.
4. If new production-affecting findings come up during later phases, add them here immediately (same rule as the main plan: log new issues as they're found, don't fix them silently and don't forget them).
