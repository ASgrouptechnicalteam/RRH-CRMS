# Phase D Execution Plan: Structural UX Rebuild

This document outlines the phased execution plan for rebuilding all UI components to use the shared components from `apps/web/src/components/ui/` (`StatCard`, `StatusPill`, `DonutChart`, `TrendChart`, `ListWidget`, `PropertyCard`, `DataTable`). 

This is a **structural rebuild**, not just a re-theme. Every page must adhere to the CRM-centric rule: visibly connecting to the lead pipeline and featuring one clear primary action above the fold.

## Prompt Template

Use the following prompt for each page/component to ensure consistency across the rebuild:

```text
Rebuild `[PAGE COMPONENT NAME]` using the shared components from `apps/web/src/components/ui/` (StatCard, StatusPill, DonutChart, TrendChart, ListWidget, PropertyCard, DataTable). This is a structural rebuild, not just a re-theme — apply the content spec for the `[GROUP NAME]` group in docs/UI-UX-PHASE-D-FULL-APP-PLAN.md §2: `[SPECIFIC BULLETS]`. The page must have one clear primary action above the fold, and must visibly connect to the lead pipeline per the CRM-centric rule in §1 of that doc — `[CRM LINKAGE]`. Do not change API calls or data-fetching logic unless the content spec explicitly requires new data (e.g. interested-leads count) — flag if new backend data is needed rather than faking it client-side. Run npm run build, confirm no errors, then commit with `git add -A && git commit -m "feat: rebuild [page name] — structural UX + navy/gold theme"` before ending the session.
```

---

## Phase 1: SALES Group (Highest CRM Value)
*Target: Components in `apps/web/src/components/leads/`, `components/sales/`, and `components/siteVisits/`*

1. **LeadManagement** (`LeadManagement.tsx`)
   - **Group:** SALES
   - **Content Spec:** List with status pill row and quick-filter chips tied to workflow state.
   - **CRM Linkage:** Direct entry point to pipeline.

2. **Lead Detail / Qualification Capture** (Within Leads module)
   - **Group:** SALES
   - **Content Spec:** Lead with action buttons for valid next steps (not a wall of fields).
   - **CRM Linkage:** The core CRM detail view.

3. **SalesPipelineManagement** (`SalesPipelineManagement.tsx`)
   - **Group:** SALES
   - **Content Spec:** Visual pipeline, negotiation/deal view.
   - **CRM Linkage:** Central funnel tracking.

4. **SiteVisitManagement** (`SiteVisitManagement.tsx`)
   - **Group:** SALES
   - **Content Spec:** Site Visit Request, Acceptance Queue, Outcome tracking.
   - **CRM Linkage:** Link visits back to specific leads and PMs.

## Phase 2: WORK Group (Daily Functional Pages)
*Target: Components in `apps/web/src/components/tasks/` and telecaller/PM specific views*

1. **TaskManager** (`TaskManager.tsx`)
   - **Group:** WORK
   - **Content Spec:** Prioritize speed of primary action (log a call, accept/reassign a visit). Buttons above the fold, history below.
   - **CRM Linkage:** Connect every task to a lead or booking.

## Phase 3: HR Group (Tabbed Restructure)
*Target: Components in `apps/web/src/components/hr/` and `components/attendance/`*

1. **HRDashboard** (`HRDashboard.tsx`)
   - **Group:** HR
   - **Content Spec:** Restructure as a **tabbed layout** (Overview | Attendance | Leave | Performance | Onboarding | Documents). Each tab is its own focused view.
   - **CRM Linkage:** Performance tab must show each salesperson's lead-conversion numbers (leads assigned → contacted → qualified → booked).

2. **LateLeaveProposals / Kiosk** (Attendance/Leave)
   - **Group:** HR
   - **Content Spec:** Refactor into HR tabs if applicable or standalone workflow.
   - **CRM Linkage:** Show impact of absence on active pipeline assignments.

## Phase 4: PROPERTY & BOOKINGS Groups
*Target: Components in `apps/web/src/components/properties/`, `components/projects/`, and `components/commercial/`*

1. **PropertyManagement** (`PropertyManagement.tsx`)
   - **Group:** PROPERTY
   - **Content Spec:** Card grid using `PropertyCard`, filter by project/type/status.
   - **CRM Linkage:** Include visible "interested leads" count per property pulled from `SiteVisitProperty` outcomes.

2. **ProjectManagement** (`ProjectManagement.tsx`)
   - **Group:** PROPERTY
   - **Content Spec:** Assigned PM, unit inventory status, rollup of active site visits.
   - **CRM Linkage:** Tie inventory and active visits back to the CRM funnel.

3. **BookingManagement & BookingDossier** (`BookingManagement.tsx`, `BookingDossier.tsx`)
   - **Group:** BOOKINGS
   - **Content Spec:** Use `DataTable` for listings, status pills for payment states.
   - **CRM Linkage:** Every row/detail must link back to the originating Lead.

## Phase 5: FINANCE & INSIGHTS Groups
*Target: Components in `apps/web/src/components/finance/` and `components/analytics/`*

1. **FinanceHub** (`FinanceHub.tsx`)
   - **Group:** FINANCE
   - **Content Spec:** Use `DataTable`, status pills (paid/pending/overdue). Match dashboard "Due payments" figures.
   - **CRM Linkage:** Every financial record traces back to a Lead/Booking.

2. **AnalyticsHub** (`AnalyticsHub.tsx`)
   - **Group:** INSIGHTS
   - **Content Spec:** Deep analytics beyond dashboard KPIs (conversion by source, drop-off analysis). Use `DonutChart`, `TrendChart`.
   - **CRM Linkage:** Funnel/drop-off chart broken down by exit stage (`exited_from_status`).

## Phase 6: ADMINISTRATION Group
*Target: Components in `apps/web/src/components/system/`, `components/settings/`, and `components/profile/`*

1. **SystemControlHub** (`SystemControlHub.tsx`)
   - **Group:** ADMINISTRATION
   - **Content Spec:** Apply navy/gold visual system and `ListWidget`/`DataTable`.
   - **CRM Linkage:** Lower priority; don't force pipeline content onto genuinely administrative screens.

2. **UserSettings / UserProfile** (`UserSettings.tsx`, `UserProfile.tsx`)
   - **Group:** ADMINISTRATION
   - **Content Spec:** Standardized forms, simple actions.
   - **CRM Linkage:** N/A (Generic settings).

---

## Execution Rules
- One page per session.
- Commit after every page (`git add -A && git commit -m "feat: rebuild [page] — structural UX + navy/gold theme"`).
- Run `npm run build` and confirm no errors before ending the session.
- Only change API/data logic if explicitly required (e.g., adding an interested-leads count).
