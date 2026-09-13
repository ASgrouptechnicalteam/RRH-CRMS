# Sonthillu Website — Product Readiness Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make the Sonthillu website product-ready as a professional real estate platform — seed the admin account, fix failing tests, populate local demo data, and resolve all website gaps — WITHOUT touching the production CRM database.

**Architecture:** The site is already fully built. This plan focuses on: (1) operational setup — seed admin, fix tests, seed local demo data; (2) product polish — fill content gaps, fix UX issues, add missing sections. All test/demo data goes into the local MySQL (`sonthillu_web`), NEVER into the production CRM at `rs-crms.onrender.com`.

**Tech Stack:** Next.js App Router, Prisma + MySQL (XAMPP, `sonthillu_web`), vitest, bcryptjs, Tailwind CSS.

**Constraints (non-negotiable):**

- 🚫 NEVER write test properties, leads, or customer data to the production CRM (`rs-crms.onrender.com`)
- ✅ Local MySQL (`sonthillu_web`) is safe for all test/demo data
- ✅ Admin seed script (`prisma/seed-admin.ts`) writes to local MySQL only — safe to run
- ✅ All work uses existing code — no new CRM dependencies

---

## Current State

### What's DONE

- CRM integration: Phases 1-7 complete. CRM connected, leads verified, 245/245 tests pass for non-admin code.
- Admin panel code: 9 pages fully built with RBAC, session management, audit logging.
- Admin auth: `src/lib/admin/auth.ts` — bcrypt, CSPRNG tokens, cookie sessions, 4-role hierarchy, permission-based access control.
- Admin DB schema: `Admin`, `AdminSession`, `AdminAuditLog`, `HeroSlide` models in Prisma schema.
- Gate checks: Build ✅, Lint ✅ (13 pre-existing warnings), Typecheck ✅.

### What's BLOCKED / MISSING

- **Admin account not seeded** — `prisma/seed-admin.ts` exists but never run. No admin can log in.
- **2 admin test files fail** — `src/lib/admin/admin.test.ts` and `src/lib/admin/analytics/analytics.test.ts` have TypeScript errors (JSON.stringify/parse mismatches in analytics layer).
- **Local demo data empty** — No hero slides, no test customers, no activity events. Admin pages show "No data" everywhere.
- **Website content gaps** — See Section 4 below.

---

## Phase 1: Admin Account & Test Infrastructure

### Task 1: Fix TypeScript errors in admin test files

**Objective:** Make `src/lib/admin/admin.test.ts` and `src/lib/admin/analytics/analytics.test.ts` pass typecheck.

**Root cause:** The `ActivityEvent` model stores `searchContext` and `metadata` as `String` (JSON.stringify'd). The analytics functions read them as plain objects. Tests pass plain objects.

**Files to fix:**

- `src/lib/admin/analytics/overview.ts` — add JSON.parse when reading searchContext/metadata
- `src/lib/admin/analytics/searches.ts` — same fix
- `src/lib/admin/analytics/ai.ts` — same fix
- `src/lib/admin/analytics/analytics.test.ts` — JSON.stringify all fixtures

**Pattern:** Every read of `searchContext` or `metadata` from a DB row must be wrapped in:

```typescript
let ctx: Record<string, any> = {};
try {
  ctx = JSON.parse(row.searchContext || '{}');
} catch {
  /* ignore */
}
```

**Step 1:** Fix all 3 analytics source files (overview.ts, searches.ts, ai.ts)

**Step 2:** Fix test fixtures in analytics.test.ts — wrap all `searchContext:` and `metadata:` values in `JSON.stringify(...)`

**Step 3:** Verify: `npx tsc --noEmit` → exit 0

**Step 4:** Verify: `npx vitest run src/lib/admin/` → all pass

**Step 5:** Verify: `npm run test:run` → 245+ pass, 0 fail

---

### Task 2: Seed the admin account

**Objective:** Create the first SUPER_ADMIN account in local MySQL so the admin panel is usable.

**Files:**

- Read: `prisma/seed-admin.ts` (already exists, 78 lines)
- Modify: `.env` — add `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD`

**Step 1: Add admin seed env vars to `.env`**

Add these lines to `D:\HYD\Sonthillu\.env`:

```env
ADMIN_SEED_EMAIL=admin@sonthillu.com
ADMIN_SEED_PASSWORD=ChangeMeImmediately123
```

Use a strong password (≥12 chars). This file is gitignored — safe to add secrets.

**Step 2: Run the seed script**

```bash
cd /d/HYD/Sonthillu
npx tsx prisma/seed-admin.ts
```

Expected output:

```
[seed-admin] Created SUPER_ADMIN: id=1, email=admin@sonthillu.com, name=Super Admin
```

If it says "already exists", that's fine — the account is already seeded.

**Step 3: Verify admin can log in**

1. Go to `http://localhost:3000/admin/login`
2. Enter `admin@sonthillu.com` / your password
3. Should redirect to `/admin/overview`

**Step 4: Document credentials**

Create `docs/ADMIN_CREDENTIALS.md` with login URL, email, role, permissions, and all admin page descriptions.

**Step 5: Commit**

```bash
git add .env docs/ADMIN_CREDENTIALS.md
git commit -m "chore: seed admin account and document credentials"
```

---

### Task 3: Seed local demo data (NOT CRM)

**Objective:** Populate local MySQL with demo data so admin analytics pages show meaningful numbers. NOTHING goes to CRM.

**Files:**

- Create: `prisma/seed-demo.ts` — demo data seed script for local MySQL only

**What to seed (all in local MySQL `sonthillu_web`):**

1. **Hero slides** (for homepage carousel) — 4 slides with Unsplash image URLs, headlines, subtext, CTAs
2. **Test customers** — 10-20 customers with realistic data, mix of seller statuses
3. **Activity events** — 150-300 events across all types: searches, property views, shortlists, compares, AI searches, lead submissions, recommendation clicks

**IMPORTANT:** ActivityEvent `searchContext` and `metadata` fields must be JSON.stringify'd strings.

**Step 1: Write the seed script**

Create `prisma/seed-demo.ts` with:

- `main()` function that seeds all the above
- Uses `PrismaClient` from `@prisma/client`
- Checks for existing data before creating (idempotent)
- NEVER imports or calls any CRM function
- Has a clear banner: "// LOCAL DEMO DATA ONLY — NEVER runs against production CRM"

**Step 2: Run the seed script**

```bash
npx tsx prisma/seed-demo.ts
```

**Step 3: Verify data in admin panel**

1. Log into admin at `http://localhost:3000/admin/login`
2. Check `/admin/overview` — should show non-zero metrics
3. Check `/admin/searches` — should show top locations, zero-result demand
4. Check `/admin/leads` — should show lead volume chart

**Step 4: Commit**

```bash
git add prisma/seed-demo.ts
git commit -m "feat: add local demo data seed script for admin analytics"
```

---

## Phase 2: Website Product Polish

### Task 4: Create admin credentials documentation

**Objective:** Document admin login details, permissions, and available controls.

**Files:**

- Create: `docs/ADMIN_CREDENTIALS.md`

**Content includes:**

- Login URL, email, password location, role
- Role hierarchy table (ANALYST → CONTENT_MANAGER → ADMIN → SUPER_ADMIN)
- All 9 admin pages with their metrics, tables, and controls
- Security notes (separate sessions, CSPRNG tokens, audit logs)
- Local vs production warning

---

### Task 5: Hero CMS — create default slides

**Objective:** Populate the homepage hero carousel with real slides.

**Files:** Use `prisma/seed-demo.ts` from Task 3 or extend it.

**4 slides to create:**

| #   | Image                        | Headline                            | Subtext                                         | CTA                |
| --- | ---------------------------- | ----------------------------------- | ----------------------------------------------- | ------------------ |
| 1   | Unsplash: modern living room | Find Your Dream Home in Hyderabad   | Premium apartments, villas & independent houses | Explore Properties |
| 2   | Unsplash: villa exterior     | Exclusive Villas in Gachibowli      | 3 & 4 BHK villas with modern amenities          | View Villas        |
| 3   | Unsplash: apartment building | Apartments in Hitec City            | 2 & 3 BHK flats near IT hubs                    | Browse Apartments  |
| 4   | Unsplash: luxury home        | Independent Houses in Jubilee Hills | Luxury independent homes with private gardens   | See Properties     |

**Step 1:** Add hero slide creation to seed-demo.ts

**Step 2:** Verify homepage carousel shows 4 slides

**Step 3:** Commit

---

### Task 6: Populate trust section with real content

**Objective:** Replace placeholder trust stats with realistic content.

**Files:** `src/components/home/TrustSection.tsx`

**Step 1:** Read current TrustSection

**Step 2:** Update with realistic stats:

- Years in business: realistic number
- Properties facilitated: realistic number
- Satisfied customers: realistic number
- Cities covered: Hyderabad + nearby
- RERA registration: placeholder number (verify before production)

**Step 3:** Verify on homepage

**Step 4:** Commit

---

### Task 7: Comprehensive footer

**Objective:** Add a professional footer with all standard sections.

**Files:** Footer component (find existing or create new)

**Footer sections:**

1. Company info: logo, tagline, description, contact
2. Quick Links: Home, Properties, Projects, About, Contact, Sell Property
3. Resources: Blog, FAQs, Privacy Policy, Terms, RERA
4. Contact: address, phone, email, hours
5. Social: Facebook, Instagram, LinkedIn, YouTube
6. Legal: copyright, RERA number, "Powered by Sonthillu"
7. Newsletter: email signup (UI-only for V1)

**Step 1:** Read existing footer or create new component

**Step 2:** Add all sections

**Step 3:** Add footer to root layout

**Step 4:** Commit

---

### Task 8: About page expansion

**Objective:** Expand `/about` page with real content.

**Files:** `src/app/about/page.tsx`

**Sections to add:**

1. Hero: "About Sonthillu" headline + tagline
2. Our Story: history, mission
3. What We Do: mediation platform explanation
4. Why Choose Us: trust factors
5. Locations Covered: Hyderabad neighborhoods
6. Property Types: apartments, villas, independent houses
7. Contact info

**Step 1:** Read current about page

**Step 2:** Add all sections

**Step 3:** Commit

---

### Task 9: Blog section skeleton

**Objective:** Create blog section with placeholder content.

**Files:**

- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx` (stub)
- Create: `src/components/blog/BlogCard.tsx`

**Step 1:** Create blog listing with 6-8 placeholder posts

**Step 2:** Create blog post stub page

**Step 3:** Create reusable BlogCard component

**Step 4:** Add Blog link to footer

**Step 5:** Commit

---

### Task 10: Mobile responsiveness QA and fixes

**Objective:** Verify all pages render correctly on mobile (375px) and fix issues.

**Pages to check:**

- `/` — hero, categories, trust, CTA, footer
- `/properties` — filters, grid, pagination
- `/properties/[id]` — gallery, specs, form, recommendations
- `/projects` — project cards
- `/search` — search UI, results
- `/login`, `/register`, `/forgot-password` — forms
- `/sell-property`, `/sell-property/submission` — multi-step form
- `/shortlist`, `/compare` — saved items
- `/account`, `/account/profile` — account pages
- `/admin/*` — admin panel

**Step 1:** Check each page at 375px width

**Step 2:** Fix any layout issues (overflow, overlapping, non-responsive elements)

**Step 3:** Commit

---

### Task 11: Testimonials section

**Objective:** Add social proof section to homepage.

**Files:**

- Create: `src/components/home/TestimonialsSection.tsx`
- Modify: `src/app/page.tsx`

**Step 1:** Create testimonial card grid (3-6 cards, responsive)

**Step 2:** Add to homepage after TrustSection

**Step 3:** Commit

---

### Task 12: FAQ section

**Objective:** Add FAQ section to homepage or `/faq` page.

**Files:**

- Create: `src/components/home/FaqSection.tsx` or `src/app/faq/page.tsx`

**FAQs to include (10-15):**

- How does Sonthillu work?
- Is it free to list a property?
- How do I enquire?
- Are properties verified?
- What areas do you cover?
- Can I sell my property?
- How long does verification take?
- Is my data secure?
- Can I shortlist and compare?
- How do I contact a seller?

**Step 1:** Create accordion FAQ component

**Step 2:** Add to homepage or create `/faq` page

**Step 3:** Commit

---

### Task 13: Company profile section

**Objective:** Add trust-building company info section.

**Files:**

- Create: `src/components/home/CompanyProfileSection.tsx`
- Modify: `src/app/page.tsx`

**Content:** Company name, tagline, description, key stats, RERA display, contact info.

**Step 1:** Create section component

**Step 2:** Add to homepage after TrustSection

**Step 3:** Commit

---

## Phase 3: Final Verification

### Task 14: Full test suite and gate checks

**Step 1:** `npm run test:run` — all pass

**Step 2:** `npx tsc --noEmit` — exit 0

**Step 3:** `npm run lint` — 0 errors

**Step 4:** `npm run build` — exit 0

**Step 5:** Manual verification:

- Homepage: hero carousel, categories, trust, testimonials, FAQ, CTA, footer
- Admin login → overview → all 9 admin pages have data
- Mobile viewport on key pages

**Step 6:** Commit

---

## Phase 4: Documentation Updates

### Task 15: Update status documents

**Files to update:**

- `docs/CURRENT_STATUS.md` — add all new completions
- `docs/CRM_INTEGRATION_PLAN.md` — Phase 7 admin section
- `docs/10_P10_LAUNCH/p10_acceptance_matrix.md` — Admin row → COMPLETE
- `docs/10_P10_LAUNCH/p10_crm_dependencies.md` — note admin seeded

---

## Files Likely to Change (Summary)

| File                                            | Change                                    |
| ----------------------------------------------- | ----------------------------------------- |
| `src/lib/admin/analytics/overview.ts`           | JSON.parse for searchContext/metadata     |
| `src/lib/admin/analytics/searches.ts`           | JSON.parse for searchContext/metadata     |
| `src/lib/admin/analytics/ai.ts`                 | JSON.parse for metadata                   |
| `src/lib/admin/analytics/analytics.test.ts`     | JSON.stringify fixtures                   |
| `prisma/seed-admin.ts`                          | Already exists — just run it              |
| `prisma/seed-demo.ts`                           | Create — local demo data                  |
| `.env`                                          | Add ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD |
| `docs/ADMIN_CREDENTIALS.md`                     | Create — admin reference                  |
| `src/components/home/TrustSection.tsx`          | Update stats                              |
| Footer component                                | Expand or create                          |
| `src/components/home/TestimonialsSection.tsx`   | Create                                    |
| `src/components/home/FaqSection.tsx`            | Create                                    |
| `src/components/home/CompanyProfileSection.tsx` | Create                                    |
| `src/app/page.tsx`                              | Add new sections                          |
| `src/app/about/page.tsx`                        | Expand content                            |
| `src/app/blog/page.tsx`                         | Create                                    |
| `src/app/blog/[slug]/page.tsx`                  | Create stub                               |
| `src/components/blog/BlogCard.tsx`              | Create                                    |
| `docs/CURRENT_STATUS.md`                        | Update                                    |
| `docs/CRM_INTEGRATION_PLAN.md`                  | Update Phase 7                            |
| `docs/10_P10_LAUNCH/p10_acceptance_matrix.md`   | Update Admin row                          |

---

## Tests / Validation

| Check           | Command                         | Expected                      |
| --------------- | ------------------------------- | ----------------------------- |
| Typecheck       | `npx tsc --noEmit`              | Exit 0                        |
| All tests       | `npm run test:run`              | 245+ pass, 0 fail             |
| Admin tests     | `npx vitest run src/lib/admin/` | All pass                      |
| Build           | `npm run build`                 | Exit 0                        |
| Lint            | `npm run lint`                  | 0 errors                      |
| Admin login     | Browser: `/admin/login`         | Redirect to `/admin/overview` |
| Admin overview  | Browser: `/admin/overview`      | Non-zero metrics              |
| Admin searches  | Browser: `/admin/searches`      | Data tables populated         |
| Admin leads     | Browser: `/admin/leads`         | Chart shows data              |
| Homepage hero   | Browser: `/`                    | Carousel shows 4 slides       |
| Homepage footer | Browser: `/`                    | Footer has all sections       |
| Mobile          | Browser DevTools: 375px         | No layout breaks              |

---

## Risks & Open Questions

1. **Admin password in `.env`**: gitignored locally. Production needs separate admin account with different credentials.
2. **Demo data is local only**: `seed-demo.ts` only writes to local MySQL. Never touches CRM.
3. **Blog is skeleton only**: Full blog CMS is out of scope. Placeholder content for now.
4. **Testimonials are placeholders**: Collect real testimonials before production launch.
5. **RERA number is placeholder**: Verify actual RERA registration before production.
6. **Mobile QA is manual**: Automated mobile testing out of scope.
7. **Hero images are Unsplash placeholders**: Replace with real property images when CRM inventory available.

---

## Execution Order

**Blocking (do first):** Tasks 1 → 2 → 3 (sequential — tests must pass before admin seed, admin must exist before demo data makes sense)

**Parallelizable:** Tasks 4-13 (all independent of each other)

**Final:** Tasks 14 → 15 (verification then docs)

**Recommended:** Use subagent-driven-development. Dispatch one subagent per task. Start with Tasks 1-3, then parallelize 4-13, then 14+15.
