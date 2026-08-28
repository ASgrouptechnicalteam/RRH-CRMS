# RRH-CRMS — UI/UX Master Plan (Single Source of Truth)

**Status:** Planning document. Do not start building against this until `IMPLEMENTATION-ROADMAP.md` Phases 0–5 are complete (workflow rewrite done) — this plan assumes the `BOOKED`/`DROPPED` pipeline and the demoted `Opportunity` model from `LEAD-WORKFLOW-SPEC.md` already exist in the backend.

**Agent note:** Phases A–C below are Antigravity's work (visual, mechanical, self-contained files — ideal for the faster, higher-credit model). Phase D depends on Hermes's Phase 5 backend work being merged first; once that API is stable, Phase D's screens go to whichever agent has bandwidth, since by then they're just UI wiring against a fixed contract, not logic design. See `docs/TASK-ASSIGNMENTS.md` for the live tracker across both roadmaps.

**Commit this file immediately after creation, before writing anything else.** Given what just happened with the last UI/UX planning work, this document is only safe once it's in git history, not while it exists only as a chat artifact.

---

## 1. Design System (extracted from your reference image)

Your reference is a clean, confident, professional real-estate CRM aesthetic — dark navy + gold, generous white space, soft rounded cards, restrained use of color reserved for status and data. This translates well onto your existing base: you already migrated to a `navy` primary in Phase 2 (`#203873` / `#172A52`), so this extends that work rather than replacing it.

### Color tokens (extend `apps/web/tailwind.config.js`)

| Token | Value | Usage |
|---|---|---|
| `navy-950` → `navy-50` | Full 10-step scale anchored on existing `#172A52` (950) and `#203873` (700) | Sidebar, headers, primary buttons, active states |
| `gold-600` (new) | `#C9A227` | Logo accent, primary CTA buttons ("+ Add New"), premium/featured badges |
| `gold-100` (new) | `#F6EACB` | Gold icon-chip backgrounds, subtle highlight backgrounds |
| `surface` | `#F4F6FA` | Page background (not white — matches the soft gray-blue in the reference, distinguishes page bg from card bg) |
| Status: `hot` | rose-100 / rose-600 | Lead temperature = Hot |
| Status: `warm` | amber-100 / amber-700 | Lead temperature = Warm |
| Status: `cold` | sky-100 / sky-700 | Lead temperature = Cold |
| Status: `success` | emerald-100 / emerald-700 | Confirmed, Booked, Completed |
| Status: `pending` | amber-100 / amber-700 | Pending, awaiting action |
| Status: `danger` | red-100 / red-700 | Dropped, overdue, rejected |

**Rule going forward:** the `navy`/`gold` scale is reserved for brand/structural UI (sidebar, headers, primary actions). The status colors above are reserved exclusively for workflow state — never reuse `hot`/`warm`/`cold` colors decoratively elsewhere, or status meaning gets diluted across the app (same principle Phase 2 already applied by keeping semantic colors separate from the brand color).

### Component patterns to standardize (build once, reuse everywhere)

1. **KPI Stat Card** — icon in a soft-colored rounded chip, large bold number, label above, small delta line below with up/down arrow (green/red) and "vs last period" text. Used on every dashboard variant.
2. **Donut/Ring Chart with center total** — used for any "breakdown by category" view (leads by source, leads by status, properties by type).
3. **Trend Line Chart with period selector** — dropdown (This Month/Week/Quarter) top-right, tooltip on hover showing exact values for that date.
4. **Status Pill/Badge** — rounded-full, soft background + solid text color, used consistently for lead temperature, booking status, and (new, per your workflow) the macro pipeline status (`QUALIFIED`, `SITE_VISIT_SCHEDULED`, `NEGOTIATION`, `BOOKED`, `DROPPED`, etc.).
5. **Compact List Widget** (Upcoming Tasks / Recent Bookings pattern) — icon chip + title + subtitle + right-aligned meta (time/price/status), "View All" link in the widget header.
6. **Property Card** — image, favorite toggle, featured ribbon (optional), name + location, spec row (BHK · sqft · price).
7. **Data Table with inline status pills** — for Leads, Bookings, Payments lists; sortable columns, row-level "Assigned To" avatar+name.

**Do this as a real shared component library** — `apps/web/src/components/ui/` (StatCard, StatusPill, DonutChart, TrendChart, ListWidget, PropertyCard, DataTable) — not copy-pasted per page. This directly prevents the exact "same UI pattern reimplemented slightly differently five times" bloat found in the earlier codebase audit.

---

## 2. Information Architecture

Your existing sidebar (grouped: HOME / SALES / PROPERTY / BOOKINGS / WORK / FINANCE / HR / INSIGHTS / ADMINISTRATION) is actually better suited to your system than the reference's flat list — you have 40+ screens across 11 roles, not a small admin panel, and RBAC-gated grouping is the right call. **Keep the existing grouped structure, apply the reference's visual polish to it** (dark navy background, gold-accented active state, icon consistency). Two structural changes required to match decisions already made:

1. **Remove `Documents` from the sidebar entirely** — per your instruction, that module moves to the customer portal.
2. **`Sales Pipeline` gets renamed/reworked once Phase 5 lands** — since `Opportunity` is demoted to a `NEGOTIATION`-onward sub-record (not an independent pipeline), this nav item should become something like **"Deals in Negotiation"**, scoped only to leads that have reached that stage — not a parallel kanban competing with the Leads screen for attention.

---

## 3. Role-Based Dashboards — Content Spec

You already have seven dashboard components (`AdminCommandCenter`, `MDExecutiveDashboard`, `PMDashboard`, `SalesManagerDashboard`, `StaffDashboard`, `TelecallerDashboard`, `AgentSiteVisitsDashboard`). Rather than redesigning from scratch, each gets a **content spec tied directly to the workflow stages that role owns** — this is what makes the dashboard actually useful day-to-day instead of a generic stat wall.

| Dashboard | Primary KPI row | Distinctive widget (this is what makes it role-specific) |
|---|---|---|
| **TelecallerDashboard** | Leads assigned, Contacted today, Qualification-pending count, WhatsApp follow-ups due | **"Reconfirm Tomorrow's Visits"** list — every `PENDING_CUSTOMER_RECONFIRMATION` visit due today, one-tap call-logged + WhatsApp deep-link button per row |
| **PMDashboard** | Assigned demos, Site visits pending my acceptance, Active projects | **"Pending My Response"** — every `PENDING_ACCEPTANCE`/`PENDING_PM_RECONFIRMATION` visit request routed to me, with Accept/Reassign inline |
| **AgentSiteVisitsDashboard** | Today's visits, Completed this week | **Today's `ACTIVE` visits pinned at the very top**, above all else — this was flagged as a hard requirement in the workflow spec §2, not optional |
| **SalesManagerDashboard** | Team lead load, Conversion rate, Site visits this week | **Team distribution view** — leads per telecaller with active load, matching the existing "Active Load"/"Closure Rate" fields already referenced in `LeadManagement.tsx` |
| **MDExecutiveDashboard** | Total leads, Bookings, Sales value, Due payments (matches your reference image's top row almost exactly) | **Reassignment escalations** — the only dashboard that surfaces `ESCALATED_TO_MARKETING_DIRECTOR` items and reassignment-reason detail, since that's restricted to executive visibility per the workflow spec |
| **AdminCommandCenter** | System health, active users, role distribution | Unchanged scope — operational, not sales-facing |
| **StaffDashboard** | My tasks, my attendance, my performance score | Unchanged scope — general employee view |

---

## 4. Core Workflow Screens (mapped to `LEAD-WORKFLOW-SPEC.md`)

These are the screens that actually implement the pipeline — this is the highest-value part of the whole UI/UX effort, since it's what fixes the "clumsy/unclear" flow problem this entire project started from.

1. **Lead List** — data table pattern, status pill = macro pipeline status (not the old free-text dropdown), quick-filter chips for temperature (Hot/Warm/Cold) and stage.
2. **Lead Detail** — replaces the current free-form status dropdown entirely with **action buttons showing only valid next transitions** for the lead's current state (queried live from the workflow engine, never hardcoded) — e.g. a `QUALIFIED` lead shows "Schedule Demo" and "Schedule Site Visit" buttons, not a raw list of ten statuses.
3. **Qualification Capture Form** — modal triggered automatically when moving `CONTACTED → QUALIFIED` with missing fields; this is the forced-detail gate from the spec, and should feel like a natural short form, not a blocking error message.
4. **Matched Properties Panel** — shown inline on the Lead Detail once qualified, using the property card component, with the WhatsApp deep-link button ("Send to Customer") attached per property.
5. **Demo Scheduler** — simple date/handler picker, optional branch.
6. **Site Visit Request & Property Picker** — property multi-select constrained to one project (per your confirmed rule), date/time picker.
7. **Site Visit Acceptance Queue** (PM/Agent-facing) — this is the screen behind the "Pending My Response" dashboard widget; Accept / Reassign-to (role-filtered to PM/Agent only) / Escalate actions live here.
8. **Reassignment History Panel** (Executive-only visibility) — the reassignment chain with reasons, gated to MD/Admin/Marketing Director per the access rule already defined in the spec.
9. **Site Visit Outcome Form** — per-property interested/not-interested + reason, submitted by the attending PM/Agent after the visit.
10. **Negotiation / Deal View** — the demoted Opportunity record; price, payment plan, property finalization.
11. **Booking Confirmation & Customer Handoff** — triggers the `BOOKED` transition, customer account provisioning, and the WhatsApp credential-share message.

---

## 5. Implementation Roadmap

Same discipline as the main implementation roadmap: work in order, commit after every phase, verify before moving on. **Given the recent data loss, every prompt below explicitly requires a git commit as its final step — this is not optional.**

### Phase A — Design Tokens & Shared Components (do this first, everything else depends on it)

**Prompt for Antigravity:**
> Extend `apps/web/tailwind.config.js` with a full `navy` color scale (50–950, anchored on the existing `#172A52`/`#203873` values), a new `gold` scale (600: `#C9A227`, 100: `#F6EACB`), a `surface` background token (`#F4F6FA`), and status tokens `hot`/`warm`/`cold`/`success`/`pending`/`danger` per the table in `docs/UI-UX-MASTER-PLAN.md` §1. Then build the shared component library in `apps/web/src/components/ui/`: `StatCard`, `StatusPill`, `DonutChart`, `TrendChart`, `ListWidget`, `PropertyCard`, `DataTable` — each matching the patterns described in §1 of that doc. Do not wire these into any page yet — this phase is only the design tokens and the reusable components in isolation, so they can be reviewed before being adopted anywhere. Run `npm run build` to confirm no errors, then **run `git add -A && git commit -m "feat: navy/gold design tokens and shared UI component library"` as the final step of this phase — do not end the session without this commit.**

### Phase B — Sidebar & Navigation Polish

**Prompt for Antigravity:**
> Update `apps/web/src/components/common/AppLayout.tsx` to apply the navy/gold visual treatment from `docs/UI-UX-MASTER-PLAN.md` to the existing sidebar structure — do not change the grouping or the RBAC-gating logic, only the visual styling (background, active-state highlight, icon treatment). Remove the `documents` nav item entirely (already decided — that module is moving to the customer portal). Leave `sales-pipeline` as-is for now; it gets reworked in a later phase once the Opportunity demotion from the workflow rewrite is live. Run `npm run build`, confirm no errors, then **commit with `git add -A && git commit -m "feat: apply navy/gold theme to sidebar navigation"` before ending the session.**

### Phase C — Role Dashboards (one at a time, in this order)

Do these **one dashboard per session**, not all seven at once — smaller reviewable chunks, and a commit after each means a bad change in one dashboard never risks the others.

**Prompt template for Antigravity (repeat per dashboard, substituting the name and spec row from §3):**
> Rebuild the `[DASHBOARD NAME]` component using the shared UI components from `apps/web/src/components/ui/` (StatCard, ListWidget, etc.) per the content spec for this dashboard in `docs/UI-UX-MASTER-PLAN.md` §3. Do not change any data-fetching logic or API calls — this is a presentation-layer rebuild only, using the same data the component already receives. Run `npm run build`, confirm no errors, then **commit with `git add -A && git commit -m "feat: redesign [dashboard name] with navy/gold theme"` before ending the session.**

Suggested order: `TelecallerDashboard` → `PMDashboard` → `AgentSiteVisitsDashboard` → `SalesManagerDashboard` → `MDExecutiveDashboard` → `AdminCommandCenter` → `StaffDashboard` (ordered by how directly each ties to the core lead pipeline).

### Phase D — Core Workflow Screens (only after `LEAD-WORKFLOW-SPEC.md` Phase 5 backend work is live)

This phase implements §4 above. Each of the 11 screens listed should be its own Antigravity session with its own commit — do not batch multiple workflow screens into one session. I'll draft the specific prompt for each screen when you're ready to start this phase, since the exact prompt depends on the final shape of the Phase 5 backend API, which isn't built yet.

---

## 6. Non-negotiable process rule for this entire plan

**Every single phase above ends with a git commit, stated explicitly in the prompt, every time — no exceptions, even for small changes.** This is the direct fix for what just happened. If you notice a session end without Antigravity confirming a commit, do it yourself immediately before closing that session:
```
git add -A && git commit -m "wip: <describe what was done>"
```
A messy commit history you can clean up later is infinitely better than a clean history with two days of work missing from it.
