## **CRM+EMS Production Standards & Operations Handbook**

### **1\. General Coding Standards (follow on every commit, no exceptions)**

* Use a linter \+ formatter (ESLint \+ Prettier) enforced automatically via a git pre-commit hook (Husky) — nothing unformatted or lint-failing should ever reach the repository.  
* Consistent naming: camelCase for JS variables/functions, PascalCase for components/classes, consistent casing for DB columns across the whole Prisma schema.  
* Every function/module does one thing. If a function is doing three unrelated things, split it.  
* **No hardcoded values** — no URLs, credentials, API keys, or "magic numbers" directly in code. Everything configurable lives in environment variables or a central config file.  
* Comments explain *why*, not *what* — the code itself should read clearly; comments justify non-obvious decisions.  
* No `console.log` left in production code — use a real logger (see §9).  
* Every new feature ships with: input validation, error handling, and a loading \+ error UI state. A feature isn't "done" without all three.  
* Write (or have the agent write) tests for critical business logic — commission calculations, lead assignment, attendance rollups — before marking that feature complete.

### **2\. Codebase Management**

* **Branching**: `main`/`production` is always deployable. All work happens on feature branches, merged via pull request — never commit directly to main, even solo.  
* **Commits**: meaningful messages describing what changed and why, not "fix" or "update."  
* **Secrets**: `.env` files are always in `.gitignore`. Never commit API keys, DB passwords, or JWT secrets — check this before every commit, not just once.  
* **Dependencies**: lock file (`package-lock.json`) always committed. Review any new dependency before adding it. Run `npm audit` regularly and address flagged vulnerabilities — don't let them accumulate.  
* **Environments**: separate `.env` configuration for development, staging, and production. These must never share a database or point to the same secrets.  
* **Code review**: even reviewing your own PR before merge — check for: exposed secrets, missing input validation, missing error handling, missing pagination on new list endpoints.  
* Keep a running `CHANGELOG.md` — what shipped, when, and why.

### **3\. Security Instructions (mandatory, every time, no shortcuts)**

* **Auth tokens**: JWT with a short expiry \+ refresh token rotation. Prefer httpOnly cookies over localStorage where feasible — this meaningfully reduces XSS token-theft risk.  
* **Authorization**: every internal endpoint enforces role- and ID-based access **server-side**. Never trust a role or user ID sent from the frontend — always derive it from the verified token.  
* **Input validation**: every single endpoint validates its input (Zod or Joi) before touching the database. No exceptions, including "trusted" internal admin routes.  
* **SQL injection**: always use Prisma's parameterized queries — never string-concatenate raw SQL.  
* **XSS**: sanitize/escape any user-generated content before rendering it in the frontend.  
* **Rate limiting**: on all public endpoints and especially on login/auth endpoints, to block brute-force attempts and scraping.  
* **CORS**: restrict to your known frontend domains explicitly — never a wildcard (`*`) in production.  
* **HTTPS everywhere**, HSTS enabled once stable.  
* **File uploads**: restrict allowed file types and sizes server-side, sanitize filenames, never trust the client-supplied MIME type alone.  
* **Passwords**: hashed with bcrypt or argon2 — never stored plaintext or in reversible encryption.  
* **Least privilege**: the database user Prisma connects with should have only the permissions it actually needs — never a root/admin DB account.  
* **2FA**: enable on every account with production access — Hostinger, Render, GitHub, domain registrar.  
* **Session invalidation**: tokens/sessions invalidated on logout and on password change.  
* **Dependency scanning**: run `npm audit` (or enable Dependabot/Snyk) on a regular cadence, not just once at project start.  
* **Backups**: automated, and periodically *actually restored* to confirm they work — an untested backup is not a backup.  
* **Logging security events**: log failed logins and permission denials, but never log the sensitive data itself (passwords, full tokens, card numbers).

### **4\. Data Handling Instructions**

* **Single source of truth**: CRM data (leads, properties, employees, associates) lives in the Core DB only. Any other service consuming it fetches live via API — it does not maintain its own independently-updated copy.  
* **Validate at every layer**: frontend (for UX), API layer (Zod/Joi), and database layer (schema constraints — `NOT NULL`, foreign keys, unique constraints where appropriate). Don't rely on just one layer.  
* **Soft deletes** for important records (a `deleted_at` flag) instead of hard-deleting — so mistakes and disputes are recoverable.  
* **Audit trail**: track `created_by`, `updated_by`, and `updated_at` on sensitive tables (leads, deals, employee/associate records) — or a dedicated audit log table for critical entities, so you can always answer "who changed this, and when."  
* **Consistent formats**: dates in ISO 8601, currency stored as integers (smallest unit) or fixed-precision decimals, phone numbers in one consistent format — pick the standard once and enforce it everywhere.  
* **Migrations**: every schema change goes through Prisma's migration system (`prisma migrate dev` / `deploy`) — never a manual `ALTER TABLE` run by hand. Migrations should be tested against a copy of production data before being run for real, and run during low-traffic windows.  
* **PII**: collect only what's needed, restrict access by role, and never write PII into plaintext application logs.

### **5\. CRM Data Handling Rules (specific to your consolidated architecture)**

* All writes to shared entities (leads, properties, employees, associates) happen through the Core API only — no service, including Customer Portal or Associate Portal, writes directly to the Core database.  
* Any side effect of a data change (e.g., updating a lead status triggering a notification) happens in application code, never via a manual database edit that bypasses that logic.  
* Every shared record carries `updated_at` so any consuming portal can detect if its cached copy is stale.  
* Explicitly document, at the schema level, which fields are "public-safe" (exposable to Sonthillu/Radha) vs. "internal-only" — don't leave this as an implicit, ad-hoc decision made per-endpoint.  
* Before renaming, removing, or changing the meaning of any field exposed on `/api/internal/*`, check what depends on it (Customer Portal, Associate Portal) first — treat these as a real API contract, not internal implementation detail you can change freely.

### **6\. Cron Job Standards**

* Run all scheduled jobs in a **separate worker process** from the web server, so a long-running job never blocks live user requests.  
* Every job logs: start time, end time, duration, and success/failure.  
* Every job is **idempotent** — safe to re-run without duplicating effects (e.g., don't send a duplicate reminder email if the job runs twice).  
* Add a locking mechanism so a job can't start a second overlapping run if the previous run hasn't finished.  
* Failures alert (email/notification) — a cron job should never fail silently.  
* Document every job: what it does, its schedule, and what tables/services it touches.  
* Required jobs for this system: lead follow-up reminders, stale lead flagging, daily attendance rollup, commission calculation, backup verification, public content cache/ISR revalidation, weekly/monthly report generation, expired session cleanup, and (only while on interim free-tier hosting) a health-check keep-alive ping.

### **7\. Performance & Optimization Standards**

* **Prisma Client as a singleton** — instantiated once at startup, reused across all requests. Never instantiate per-request.  
* **Paginate every list endpoint** — no endpoint returns an entire table.  
* **Select only needed fields** (Prisma `select`) instead of returning full row objects, especially on public endpoints.  
* **Index every foreign key and every column used in `WHERE`/`ORDER BY`** on frequently-queried endpoints.  
* **Eliminate N+1 queries** — use `include`/`select` to fetch related data in one query, never loop-and-query.  
* **Compression middleware** enabled on all API responses.  
* **Client-side caching** via React Query or SWR — cached data shown instantly, refreshed quietly in the background.  
* **Static generation with revalidation** for public pages (Sonthillu, Radha listings) instead of client-side fetching on every visit.  
* **In-memory TTL caching** on the backend for rarely-changing reference data (dropdowns, categories, settings).  
* **Image optimization**: resize/compress on upload, lazy-load below-the-fold images, serve responsive sizes.  
* **Rate limiting** on public and auth endpoints to protect performance from abuse, not just security.

### **8\. Production Readiness Checklist (run through this before every real deploy)**

* All environment variables set correctly for production — no dev/test values present  
* SSL/HTTPS confirmed active  
* Rate limiting confirmed active on public \+ auth endpoints  
* Backups configured **and** verified by an actual test restore  
* Error monitoring and uptime monitoring in place  
* Staging environment tested identically before promoting to production  
* Rollback plan documented — know exactly how to revert a bad deploy before you need it

### **9\. Monitoring & Logging Standards**

* Use structured logging (timestamp, level, message, context) rather than scattered `console.log` calls.  
* Never log sensitive data — no passwords, full tokens, or full card/account numbers in any log, ever.  
* Track: API response times, error rates, database query times, and cron job success/failure rates.  
* Set up alerts for: server downtime, elevated error rate, failed backups, failed cron jobs.  
* Review logs on a regular cadence (weekly, at minimum, while the system is this size) — don't wait for a user complaint to look.

### **10\. Documentation Standards (keep these living, not one-time)**

* API docs stay in sync with actual endpoints — every time an endpoint changes, the doc updates in the same PR.  
* ERD/schema diagram updated whenever the schema changes.  
* Each repository has a README covering: setup steps, required environment variables, and how to run it locally.  
* A runbook covering: how to deploy, how to roll back, how to restore a backup, how to add a new cron job — written so that even someone unfamiliar with the project could follow it in an emergency.

