# RRH-CRMS — Implementation Roadmap (Single Source of Truth)

**How to use this document:** Work through the phases in order — each one is a prerequisite for the next being done cleanly. For each phase, copy the "Prompt for Antigravity" block as-is (or lightly adapted) into a fresh Antigravity session. After Antigravity finishes a phase, run the listed verification steps yourself first; only bring me (Claude) the `git diff` for judgment calls — not full files, not routine build-pass confirmation. Do not start Phase 5 (the actual workflow rewrite) until Phases 0–4 are verified complete — implementing new business logic on top of an unstable, undocumented, un-audited base is exactly how the current drift happened.

Companion document: `docs/LEAD-WORKFLOW-SPEC.md` (the workflow spec itself — Phase 5 implements it).

---

## Phase 0 — Documentation Archive

**Goal:** Every historical audit/investigation/report document moves out of active view into a dated archive, without deleting anything. `docs/LEAD-WORKFLOW-SPEC.md` and this roadmap stay live — they are not archived, they're the current source of truth.

**Current state (verified):** 22 markdown files at repo root (audit/gate/result reports), plus 40+ more inside `docs/investigation/` and `docs/architecture/`.

**Tasks:**
1. Create `docs/archive/2026-08/`.
2. Move every root-level `.md` file that is a report/audit/gate document (not `README.md`) into `docs/archive/2026-08/`, preserving filenames.
3. Move the entire current `docs/investigation/` and `docs/architecture/` folders into `docs/archive/2026-08/` as subfolders (`docs/archive/2026-08/investigation/`, `docs/archive/2026-08/architecture/`).
4. Create one new file, `docs/architecture/CURRENT-STATE.md`, containing only: current tech stack, current Prisma model count/list, and a link to `docs/LEAD-WORKFLOW-SPEC.md` as "the current pipeline design." Keep it under one page — this is meant to stay accurate, not comprehensive.
5. Do not touch `README.md` or anything inside `docs/roadmap/` if it's actively referenced by code comments (check first with `grep -rn "docs/roadmap" apps/`).

**Prompt for Antigravity:**
> Move all root-level markdown audit/report/result files (everything except README.md) into a new folder `docs/archive/2026-08/`, preserving filenames and git history (use `git mv`, not delete+recreate). Move the existing `docs/investigation/` and `docs/architecture/` folders into `docs/archive/2026-08/investigation/` and `docs/archive/2026-08/architecture/` the same way. Then create a new, short `docs/architecture/CURRENT-STATE.md` with: current tech stack, current Prisma model list, and a link to `docs/LEAD-WORKFLOW-SPEC.md`. Before moving anything, run `grep -rn "docs/roadmap\|docs/architecture\|docs/investigation" apps/ packages/` to check if any source file references these paths directly (e.g., in a comment linking to a spec) — if so, list them for me before proceeding, don't silently break the reference. Do not modify any file content, only move files. Confirm with `git status` and `git diff --stat` when done.

**Verify yourself:** `git status` shows only renames (not add+delete pairs, which would lose history), repo root `ls *.md` shows only `README.md`.

---

## Phase 1 — Safe Cleanup of Temporary, Log, and Unused Files

**Goal:** Remove clutter without any risk of breaking the running app. Per your instruction, we use the safer **move-then-gitignore** approach rather than outright deletion.

**Current state (verified):** 45 stray `.txt` debug/build-log files at repo root (`.build_*.txt`, `.tsc_*.txt`, `build_output*.txt`, `.test_output.txt`, etc.), plus loose scripts at root (`patch.js`, `update-tailwind.js`, `test_db.js`) whose current usage is unverified.

**Tasks:**
1. Create `_hygiene_archive/` at repo root, and add `_hygiene_archive/` to `.gitignore`.
2. Move all root-level `.txt` files matching `.build*`, `.tsc*`, `build_output*`, `.test*` into `_hygiene_archive/logs/`.
3. For each root-level loose script (`patch.js`, `update-tailwind.js`, `test_db.js`) — **do not move blindly**. First check if it's referenced anywhere: `grep -rn "patch.js\|update-tailwind.js\|test_db.js" package.json apps/ packages/ .github/ 2>/dev/null`. If referenced (e.g., in an npm script or CI workflow), leave it in place and instead move it into `scripts/` and update the reference. If unreferenced anywhere, move it into `_hygiene_archive/unused-scripts/`.
4. Run `npx knip` and `npx depcheck` (already installable via `npx`, no new dependency needed) to get an **objective** list of unused files/exports — don't delete anything based on guesswork. Move (not delete) anything both tools agree is unused into `_hygiene_archive/unused-source/`, preserving folder structure so it can be restored if something breaks.
5. Do **not** touch anything under `node_modules/`, `.git/`, `prisma/migrations/`, or any file matching `*.test.ts`/`*.spec.ts`.

**Prompt for Antigravity:**
> Create `_hygiene_archive/` at the repo root and add it to `.gitignore`. Move every root-level file matching `.build*.txt`, `.tsc*.txt`, `build_output*.txt`, `.test*.txt` into `_hygiene_archive/logs/` using `git mv`. Then check whether `patch.js`, `update-tailwind.js`, and `test_db.js` (currently at repo root) are referenced anywhere in `package.json`, any file under `apps/` or `packages/`, or any CI config — run `grep -rn "patch.js\|update-tailwind.js\|test_db.js" package.json apps/ packages/ .github/ 2>/dev/null` and show me the results before doing anything with these three files. Then run `npx knip` and `npx depcheck` from the repo root and show me the full output — do not delete or move any source file based on this output without me confirming first. Run `npm run typecheck` and `npm test` (or the closest equivalents in package.json) after the log-file move to confirm nothing broke, and show me the results.

**Verify yourself:** `npm run build` (or equivalent) still succeeds after the move, `git status` shows the archive folder as untracked (confirming `.gitignore` worked), typecheck/test results unchanged from before the move.

---

## Phase 2 — Single Theme: Navy Blue

**Goal:** One consistent color system across the entire frontend, navy blue as the primary.

**Tasks:**
1. First, audit current color usage: `grep -rn "bg-\(blue\|indigo\|slate\|teal\|sky\)-[0-9]" apps/web/src --include="*.tsx" | wc -l` — get a real count of how scattered it currently is before touching anything.
2. Define the palette **once**, in `apps/web/tailwind.config.js` (or wherever the Tailwind theme is configured), as a custom color token, e.g. `navy: { 50: '#...', 100: '#...', ..., 900: '#...' }` — a full 50–900 scale, not just one hex value, so hover/active/disabled states have somewhere to come from.
3. Replace ad hoc Tailwind color classes (`bg-indigo-600`, `bg-teal-600`, `text-blue-700`, etc.) across components with the new `navy-*` tokens — this should be a mechanical find-and-replace per color family, not a component-by-component redesign.
4. Keep semantic colors separate and unchanged: success/error/warning states (green/red/amber) should **not** become navy — only the primary/brand color family gets unified.
5. Do this in one dedicated PR/commit, not mixed into other changes, so it's easy to review as a pure visual diff.

**Prompt for Antigravity:**
> Audit current color class usage across `apps/web/src` with `grep -rn "bg-\(blue\|indigo\|slate\|teal\|sky\)-[0-9]\|text-\(blue\|indigo\|teal\|sky\)-[0-9]" apps/web/src --include="*.tsx"` and show me the count and a sample of 20 lines before changing anything. Then define a `navy` color scale (50 through 900) in the Tailwind config as the single primary brand color. Replace primary/brand-colored Tailwind classes (buttons, active nav states, links, primary headers) across the frontend with the new `navy-*` scale. Do NOT change classes used for semantic states — success (green), error (red), warning (amber/yellow) stay as they are. Make this a single, isolated commit with no other logic changes mixed in, so the diff is purely visual. Run the app locally and take a screenshot of 3-4 key screens (dashboard, leads list, a modal) before and after if possible, or at minimum confirm the build succeeds and there are no console errors.

**Verify yourself:** Visually spot-check the app in the browser — this is the one phase where automated tooling can't confirm correctness, you need to actually look at it.

---

## Phase 3 — Production-Ready Codebase (Dev DB Stays on XAMPP)

**Important clarification for Antigravity, stated up front:** this phase is about code quality and configuration hygiene, **not** switching infrastructure. Local development continues against the XAMPP-hosted MySQL database exactly as now — do not change the database engine, connection setup, or add deployment infrastructure (Docker, CI/CD, hosting config) in this phase. That's a separate, later decision.

**Tasks:**
1. Remove all remaining `console.log`/`console.debug` statements from non-startup code paths (startup/lifecycle logs in `server.ts` and `portalWorker.ts` are fine to keep — confirmed clean in the last review). Delete the commented-out debug block left in `siteVisit.service.ts` rather than leaving it commented.
2. Confirm all secrets/config (DB connection string, JWT secret, any API keys) are read from environment variables via `.env`, never hardcoded — `grep -rn "mysql://\|password.*=.*['\"]" apps/api/src --include="*.ts"` as a sanity check for anything hardcoded.
3. Ensure `.env` is gitignored and a `.env.example` exists with placeholder values, so the environment setup is documented without secrets being committed.
4. Reduce `: any` usage in the API layer where low-effort — specifically, `tx: any` in every `$transaction` callback should become `Prisma.TransactionClient` (a direct type import, no logic change, purely a type-safety fix). Leave harder `any` cleanup for a separate pass — this phase only takes the easy, mechanical wins.
5. Run `npx prisma generate` and then `npm run typecheck` to get a true, current TypeScript error count (last check was inflated by a stale/sandbox Prisma client on my end) and fix any real remaining errors, including the confirmed `referral_person_name` type gap in `Lead`/`LeadManagement.tsx`.
6. Register the still-missing `ExpenseRefundWorkflow` in `workflowEngine.ts` (confirmed still absent as of the last review).

**Prompt for Antigravity:**
> This is a code-quality pass only — do not change the database engine, connection method, or add any deployment/hosting configuration. Local dev continues against the existing XAMPP MySQL setup unchanged. Tasks: (1) Remove all `console.log`/`console.debug` calls from `apps/api/src` and `apps/web/src` except the startup/lifecycle logs already in `server.ts` and `portalWorker.ts`. Delete (don't comment out) the dead debug block in `apps/api/src/services/siteVisit.service.ts`. (2) Run `grep -rn "mysql://\|password.*=.*['\"]" apps/api/src --include="*.ts"` and show me any hardcoded secrets found. (3) Confirm `.env` is in `.gitignore` and create/update `.env.example` with placeholder (non-real) values matching every variable actually used in `apps/api/src`. (4) Replace every `tx: any` parameter in `$transaction` callbacks with the proper `Prisma.TransactionClient` type — this is a type annotation change only, no logic changes. (5) Run `npx prisma generate` then `npm run typecheck` in both `apps/api` and `apps/web`, fix the `referral_person_name` type mismatch on `Lead` in `apps/web/src/components/leads/LeadManagement.tsx`, and report the full remaining error count and list. (6) Register `ExpenseRefundWorkflow` in `apps/api/src/workflows/workflowEngine.ts` alongside the existing Lead/Property/SiteVisit/Opportunity registrations. Show me the typecheck output before and after.

**Verify yourself:** `npm run typecheck` in both apps shows 0 errors (or a documented, understood remainder), app still runs locally against XAMPP exactly as before.

---

## Phase 4 — Security & Data-Leak Audit

**Goal:** Close known gaps and systematically check for the same class of issue elsewhere.

**Known, already-verified issues to fix:**
1. **Cross-tenant existence leak in `GET /api/v1/projects/:id`** (`apps/api/src/routes/projects.ts`) — the `getResource` lookup for `requireAuthz` doesn't filter by `company_id`, so a cross-tenant project ID returns 403 instead of 404, leaking that the ID exists. Fix: scope the lookup by tenant (`company_id: req.user!.companyId`), with an explicit branch for Admin cross-company access matching `ProjectPolicy.canRead`.
2. **Lead code generation race condition** (`generateNextLeadCode()` in `lead.service.ts`) — uses `p.lead.count()` outside/inconsistent with the enclosing transaction despite a comment claiming otherwise. Fix: generate the sequential number using a proper atomic mechanism (a dedicated counter row with `SELECT ... FOR UPDATE`, or a Postgres/MySQL sequence) inside the actual transaction, not a `count()`-based guess.
3. **`updateLeadStatus` stamps `last_contacted_at` on every transition**, including `DROPPED`/`RECOVERED_TO_POOL`. Fix: only update it on transitions that represent actual customer contact (`CONTACTED`, and any call-logging action).

**Systematic checks to run (not just fix the three above — check the whole API for the same patterns):**
4. **IDOR sweep:** for every route using `requireAuthz` with a `getResource` callback, confirm the lookup query filters by `company_id` (or the equivalent tenant boundary) before the policy check ever runs. `grep -rn "requireAuthz(" apps/api/src/routes` to get the full list, then check each one.
5. **Mass-assignment sweep:** for every `create`/`update` Prisma call fed from `req.body`, confirm a Zod schema strips unexpected fields first (the way `LeadCreateSchema` already does for `created_by_id`) — check especially any route where `req.body` is spread directly into a Prisma `data:` object.
6. **PII exposure sweep:** the employee PAN/Aadhaar/bank masking fix in `EmployeeManagement.tsx` was applied to the dossier view — confirm the same fields aren't returned unmasked in any API list/export endpoint (e.g., `GET /employees` bulk list, any CSV/Excel export feature) even if the detail view is now masked.
7. **Rate limiting / brute force:** confirm login and any OTP/password-reset endpoints have rate limiting; if not, flag it as a finding rather than silently skipping.
8. **CORS and JWT config:** confirm CORS is not set to allow-all in a way that would ship to production, and JWT expiry/refresh handling doesn't allow indefinite token life.

**Prompt for Antigravity:**
> Fix these three verified issues first: (1) In `apps/api/src/routes/projects.ts`, the `GET /:id` route's `getResource` callback for `requireAuthz` must filter by `company_id: req.user!.companyId` (with an Admin bypass matching the logic already in `ProjectPolicy.canRead`), so cross-tenant IDs return 404 instead of 403. (2) Fix the race condition in `generateNextLeadCode()` in `apps/api/src/services/lead.service.ts` — replace the `count()`-based approach with an atomic sequence generation that's actually safe under concurrent lead creation (propose your approach and show it to me before implementing — I want to review the concurrency strategy specifically). (3) In `updateLeadStatus` in the same file, only update `last_contacted_at` when the new status represents actual customer contact, not on every transition. Then run these systematic checks and report findings before fixing anything further: (4) List every route using `requireAuthz` with a `getResource` callback (`grep -rn "requireAuthz(" apps/api/src/routes`) and for each one, confirm whether the lookup filters by `company_id`. (5) Search for any route where `req.body` is spread directly into a Prisma `data:` object without a Zod schema validating it first. (6) Confirm PAN/Aadhaar/bank account fields are masked or excluded in every list/export endpoint for employees, not just the detail dossier view already fixed. (7) Confirm whether login/password-reset endpoints have rate limiting. (8) Show me the current CORS configuration and JWT expiry settings. Report all findings from (4)-(8) to me before making changes — I'll decide priority and approach per finding.

**Verify yourself:** Don't just trust Antigravity's self-report on this phase — this is exactly the phase where I'd recommend bringing me the diff for a second look, since security fixes are the highest-cost-of-being-wrong category in this whole roadmap.

---

## Phase 5 — Lead Workflow Implementation

**Goal:** Implement `docs/LEAD-WORKFLOW-SPEC.md` in full. Only start this after Phases 0–4 are verified.

**Suggested implementation order** (schema first, then backend enforcement, then frontend, matching how the rest of this codebase is already structured):

1. **Schema migration** — new fields (`Lead.exit_reason`, `Lead.exited_from_status`, `Lead.demo_scheduled_at`, `Lead.demo_handler_id`), new tables (`SiteVisitProperty`, `SiteVisitReassignment`, `MessageTemplate`), updated `SiteVisitBooking.status` enum values per §2 of the spec.
2. **Workflow engine update** — rewrite `LeadWorkflow`'s transition matrix to match §1 of the spec exactly (states, guards, required fields per transition). This replaces the current matrix entirely, including the `BOOKED`/`DROPPED` terminology.
3. **Backend enforcement** — every service that currently writes `Lead.status` directly (confirmed: `OpportunityWorkflow`'s trigger point, `siteVisit.service.ts`) must be rewired to go through `WorkflowEngine.canTransition()` exclusively — no direct `tx.lead.update({ status })` calls anywhere outside the workflow engine.
4. **Site visit sub-workflow** — implement the acceptance/reassignment/escalation chain and the distinct reschedule rule (§2) as its own service, with `SiteVisitReassignment` logging and the executive-only reason visibility (confirm the exact role list with me before implementing — this was left as an open item).
5. **Message templates** — build the `MessageTemplate` CRUD (admin-editable) and the `wa.me` deep-link generator used at each touchpoint in §5.
6. **Frontend** — replace the free-form status dropdown in `LeadManagement.tsx` with action-specific buttons that only offer valid next transitions (querying the workflow engine's allowed-transitions for the lead's current state, not hardcoding a list in the component).
7. **Opportunity demotion** — remove the independent stage-editing UI for Opportunity; it now auto-creates on `NEGOTIATION` entry per §4 of the spec.

**Prompt for Antigravity (schema + workflow engine, do this sub-phase first, don't proceed to backend/frontend until this is reviewed):**
> Implement schema and workflow-engine changes from `docs/LEAD-WORKFLOW-SPEC.md`, sections 1 and 2 only, for now. Create the Prisma migration for: new fields on `Lead` (`exit_reason`, `exited_from_status`, `demo_scheduled_at`, `demo_handler_id`), new tables `SiteVisitProperty` and `SiteVisitReassignment` per the spec's field lists, and a new `MessageTemplate` table. Update `SiteVisitBooking.status` to support the new state list in §2. Then rewrite `apps/api/src/workflows/lead.workflow.ts`'s transition matrix to exactly match the table in §1 of the spec, including the `BOOKED`/`DROPPED` terminology (not `WON`/`LOST`). Do not touch any service or route logic yet — this sub-phase is schema and the workflow engine's transition rules only. Show me the migration file and the new `lead.workflow.ts` for review before continuing to backend service changes.

**Do not generate the remaining sub-phase prompts (steps 3–7 above) until step 1–2 is reviewed and confirmed** — this workflow touches the most business-critical part of the app, and reviewing it in small, confirmed increments matters more here than anywhere else in this roadmap.

---

## Outstanding decisions needed from you before Phase 5, sub-phase 4

1. Exact role list for "executive department" reassignment-reason visibility (assumed MD/Admin/Marketing Director in the spec — confirm or adjust).
2. Confirm the `Document` module removal (Phase covered separately, not in this roadmap — flagged in the spec, §7) is scoped correctly before that work starts.
