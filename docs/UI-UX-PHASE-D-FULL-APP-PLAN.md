# RRH-CRMS — UI/UX Phase D: Full-Application UX Overhaul

**Extends:** `docs/UI-UX-MASTER-PLAN.md` (Phases A–C are done: tokens, sidebar, 7 dashboards).
**Fixes:** Phases A–C only changed *color*. Every non-dashboard page still has the old structure — old layout, old information density, no tabs, no CRM-first content priority. This phase is a **structural UX rebuild**, not a re-skin.

**Your 25% score, reframed as a rubric.** "Done" for a page means all four of these, not just the first one:
1. Navy/gold visual system applied (tokens, shared components) — *this is the only part Phases A–C actually delivered app-wide.*
2. Correct information architecture for that role/page — the right things grouped, the right things primary, nothing requiring more than 2 clicks to reach from the page it's most needed on.
3. CRM-relevant content density — every page should visibly connect to the lead pipeline (`LEAD-WORKFLOW-SPEC.md`), not read as a generic admin-panel CRUD screen. If a page could belong to any SaaS app and not specifically a real-estate lead pipeline, it hasn't been done.
4. One clear primary action per page — a person landing on the page should know in 3 seconds what they're supposed to *do* here today, not just what they can *view*.

A page painted navy with the old layout underneath is still a 25%-score page. This plan is entirely about #2–#4.

---

## 0. Before you run any prompt below

I don't have your current page inventory beyond what's been named across the four docs so far (`LeadManagement.tsx`, `EmployeeManagement.tsx`, the 7 dashboards, the now-removed `DocumentManagement.tsx`). To turn §2 below into exact per-page session prompts instead of a template you fill in yourself, paste me:

```
ls apps/web/src/pages    # or wherever your route-level page components live
```

or the nav item list straight out of `AppLayout.tsx`. Once I have that, I'll expand §2 into one concrete, ready-to-paste prompt per page, grouped exactly like your sidebar (`docs/UI-UX-MASTER-PLAN.md` §2: HOME / SALES / PROPERTY / BOOKINGS / WORK / FINANCE / HR / INSIGHTS / ADMINISTRATION).

Until then, this doc gives you the group-level content spec and a page-level prompt template you can run today, per group.

---

## 1. CRM-centric content rule (applies to every group below)

This app's job is to move a lead through `NEW → ... → BOOKED`. Every page, regardless of which sidebar group it lives in, should answer one question for the person using it: **"What does this screen tell me about leads/deals I'm responsible for, right now?"** Concretely:

- **List/table pages** (Leads, Properties, Bookings, Employees) get a **status pill row** and **quick-filter chips** tied to workflow state — not a generic sortable table with no workflow awareness.
- **Detail pages** (Lead Detail, Property Detail, Booking Detail) lead with **action buttons for valid next steps**, not a wall of read-only fields. Read-only detail goes below the fold.
- **Non-sales pages** (HR, Finance, Admin) still get a **"how this connects to the pipeline" widget** where one genuinely exists — e.g. HR's staff performance should surface lead-conversion numbers per employee, not just attendance; Finance's payments list should link every payment row back to its Lead/Booking, not stand alone.
- If a page truly has nothing to do with the CRM pipeline (e.g. a generic settings page), that's fine — don't force it. But most pages in an 11-role CRM do connect, and the audit below should say so explicitly per page.

---

## 2. Group-by-group content spec

### SALES group
Lead List, Lead Detail, Qualification Capture, Matched Properties, Demo Scheduler, Site Visit Request, Site Visit Acceptance Queue, Reassignment History (exec-only), Site Visit Outcome, Negotiation/Deal View, Booking Confirmation.
→ **These 11 screens are already fully spec'd** in `UI-UX-MASTER-PLAN.md` §4 as "Phase D" — they were blocked on the Phase 5 backend. If Phase 5 (schema + workflow engine) is now merged, this is the **highest-priority group to build first**, since it's the actual product, not surrounding admin screens. Use §4 of that doc directly as your content spec per screen.

### PROPERTY group
Property List, Property Detail, Project Management.
- Property List: card grid (using the `PropertyCard` component already built in Phase A), filter by project/type/status, and — CRM-specific — a visible **"interested leads" count per property**, pulled from `SiteVisitProperty` outcomes. This is the thing a generic real-estate-listing UI wouldn't have, and it's what makes this page CRM-centric instead of a catalog page.
- Project Management: which PM is assigned (drives the site-visit routing in §2 of the workflow spec), unit inventory status, and a rollup of active site visits tied to that project.

### BOOKINGS group
Bookings List, Booking Detail, Payments.
- Every row/detail must link back to the originating Lead — a booking or payment with no visible path back to "which lead became this" breaks the CRM narrative.
- Payments: status pills (paid/pending/overdue), and the "Due payments" figure that already exists on `MDExecutiveDashboard` should be click-through-able to this exact filtered view — consistency between dashboard KPIs and the underlying list pages is itself a UX bug if missing.

### WORK group
(Whatever your current task/activity screens are — Telecaller call logs, PM task queues, etc.)
- These are the most "daily functional" pages you mentioned — the ones a Telecaller or PM actually lives in all day. Prioritize speed of the primary action (log a call, accept/reassign a visit) over information density. Buttons above the fold, history below.

### FINANCE group
- Same CRM-linkage rule as Bookings: every financial record traces to a Lead/Booking. Add the trace, don't just format the numbers nicely.

### HR group — structural change you specifically flagged
**"HR should have tabs for every action on the dashboard."** Concretely: HR currently is likely one long scrolling page per function (attendance, leave, performance, onboarding, etc.). Restructure as a **tabbed layout** — one persistent header (employee/context selector if applicable) with tabs across the top: e.g. `Overview | Attendance | Leave | Performance | Onboarding | Documents` (internal HR docs only, per the Document-module removal in the workflow spec — customer-facing docs are gone, HR's own internal ones are a separate question, confirm which apply). Each tab is its own focused view, not a fragment of one long page. This is a layout pattern, not a one-off — if any other WORK/ADMIN screens have accumulated multiple unrelated sections on one page, apply the same tabbed restructuring there.
- CRM linkage for HR specifically: Performance tab should show each salesperson's lead-conversion numbers (leads assigned → contacted → qualified → booked), not just generic attendance/HR metrics — this is what makes HR relevant to a CRM-centric app rather than a bolted-on generic HR module.

### INSIGHTS group
- This is your analytics surface beyond the dashboard KPI rows — deeper cuts (conversion by source, by telecaller, by project, drop-off analysis by stage using `exited_from_status`). Since `exited_from_status` was added specifically for "dropped from QUALIFIED vs dropped from NEGOTIATION tell very different stories" (per the workflow spec), this is the page where that field should actually get used — a funnel/drop-off chart broken down by exit stage.

### ADMINISTRATION group
- Lower priority for the CRM-centric rework — this is system config, roles, users. Apply the visual system (Phase A tokens) but don't force pipeline content onto genuinely administrative screens.

---

## 3. Session prompt template (repeat per page, same discipline as Phase C)

One page per session. Commit after every page — same non-negotiable rule as the rest of this plan.

**Prompt for Antigravity:**
> Rebuild `[PAGE COMPONENT NAME]` using the shared components from `apps/web/src/components/ui/` (StatCard, StatusPill, DonutChart, TrendChart, ListWidget, PropertyCard, DataTable). This is a **structural rebuild, not just a re-theme** — apply the content spec for the `[GROUP NAME]` group in `docs/UI-UX-PHASE-D-FULL-APP-PLAN.md` §2: [paste the specific bullet(s) for this page]. The page must have one clear primary action above the fold, and must visibly connect to the lead pipeline per the CRM-centric rule in §1 of that doc — [name the specific CRM linkage for this page, e.g. "each payment row links to its source Lead/Booking"]. Do not change API calls or data-fetching logic unless the content spec explicitly requires new data (e.g. interested-leads count) — flag if new backend data is needed rather than faking it client-side. Run `npm run build`, confirm no errors, then **commit with `git add -A && git commit -m "feat: rebuild [page name] — structural UX + navy/gold theme" before ending the session.**

**Suggested order** (highest CRM-value first, matching your own "daily functional pages" priority):
1. SALES group screens (11 screens, per Phase D spec already written) — if Phase 5 backend is merged
2. WORK group (daily-use screens for Telecaller/PM)
3. HR (tabbed restructure)
4. PROPERTY, BOOKINGS
5. FINANCE, INSIGHTS
6. ADMINISTRATION

---

## 4. Non-negotiable (unchanged from the master plan)

Every session ends with a git commit, one page per session, verify build before moving on. If a session ends without a confirmed commit, commit it yourself immediately:
```
git add -A && git commit -m "wip: <describe what was done>"
```
