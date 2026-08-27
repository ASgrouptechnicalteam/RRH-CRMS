# Phase 8 Packet 4 — Readiness & Reconciliation Report
# Opportunity Sales Engine & Pipeline Intelligence

## 1. Executive Summary & Readiness Verdict

**Verdict:** **READY FOR IMPLEMENTATION (with minor schema addition)**

The Phase 8 Opportunity foundation (Packets 1-3) provides a robust, isolated data layer for commercial real estate pipelines. However, to build an intelligence/kanban engine that is performant, historically accurate, and strictly governed by real-estate business rules, several additions to the API, workflow integrity checks, and a minor schema upgrade (for history duration) are required.

---

## 2. A. Current Opportunity Query Capabilities
Currently, `OpportunityService` supports:
- Basic filtering by `stage`, `project_id`, and `property_id`.
- Fetching a single Opportunity dossier with relations.
- A very primitive `getPipelineMetrics` returning active count, total expected value, and total weighted value.
- Enforcement of cross-company and owner boundaries via `OpportunityPolicy`.

## 2. B. Missing Query/Filter Capabilities
To support a robust Kanban and Pipeline view, we lack:
- Filtering by `owner_id` (crucial for manager views).
- Filtering by `date_range` (e.g., `created_at` or `updated_at`).
- Filtering by `expected_close_date` (for forecasting).
- Pagination (`limit`/`offset` or cursor) and sorting options.

## 2. C. Existing Metric Calculations (Legacy Lead Pipeline)
The `MDExecutiveDashboard` (`apps/api/src/routes/md.ts`) currently aggregates pipeline health directly from `Lead` records:
- `totalLeadsCount` (All Leads)
- `totalClosedDeals` (`Lead.status = 'WON'`)
- `siteVisitsScheduled` (`Lead.status = 'SITE_VISIT_SCHEDULED'`)

**Decision:** These legacy metrics MUST remain unchanged. They measure the historical/acquisition pipeline. The New Opportunity metrics will live alongside them and specifically measure the Commercial Opportunity pipeline. We will not destructively migrate or modify the MD dashboard during Packet 4.

## 2. D. Required Pipeline Metrics
Packet 4 must implement a new metrics service (`OpportunityMetricsService`) or extend existing logic to provide:
- Active Opportunity Count & Count by Stage.
- Estimated Pipeline Value & Weighted Pipeline Value.
- Opportunities segmented by Owner, Project, and Property.
- Stage Conversion Rates & Stage Aging (time spent in stage).
- Terminal counts (Dropped/Booking Initiated) & Dropped reasons distribution.

## 2. E. Weighted Pipeline Value Calculation
Currently, `OpportunityService` uses the exact formula requested:
`weighted_value = expected_value × probability / 100`
- **Recommendation:** Standardize this. We will extract this calculation into a robust pipeline summary endpoint. We will not invent probability values; they rely on user input (`probability` defaults to `10.0` in the schema).

## 2. F. OpportunityHistory Evaluation
**Current Schema:**
`OpportunityHistory` tracks `opportunity_id`, `from_stage`, `to_stage`, `changed_by_id`, and `created_at`.
**Limitation:** It does *not* track `exited_at` or `duration_minutes`. Calculating average stage aging on-the-fly requires complex window functions over millions of rows, which Prisma struggles with natively.
**Recommendation:** 
We must add `exited_at DateTime?` and `duration_minutes Int?` to `OpportunityHistory`. When an Opportunity leaves a stage, the system will stamp the `exited_at` on the prior history record and compute `duration_minutes`.

## 2. G. Stage Integrity Rules
The current `OpportunityWorkflow` only validates the `DROPPED` stage (requiring a `drop_reason`). We must enforce strict real-estate logic during transitions:
- **PROPERTY_SHORTLISTED:** Reject transition unless `project_id` or `property_id` is populated on the Opportunity.
- **SITE_VISIT_PLANNED:** Reject transition unless at least one `SiteVisitBooking` exists for this Opportunity.
- **SITE_VISIT_COMPLETED:** Reject transition unless at least one `SiteVisitBooking` is marked `COMPLETED`.
- **PROPERTY_INTEREST_CONFIRMED:** Reject transition unless `property_id` is definitively set (inventory target).
- **NEGOTIATION:** Reject transition unless `expected_value` and `budget_min`/`budget_max` exist.
- **BOOKING_INITIATED:** Reject transition unless `expected_value` and a definitive `property_id` exist.
- **BOOKED:** **Block entirely in Phase 8 API.** This stage can ONLY be entered via internal service-to-service calls triggered by the future Phase 9 Booking system.

## 2. H. Legacy Compatibility
- **LEGACY LEAD PIPELINE:** Measures Lead Acquisition.
- **NEW OPPORTUNITY PIPELINE:** Measures Commercial Sales Pursuit.
The two will coexist. The UI will feature two distinct reporting sections in the future. We will NOT migrate `WON` leads into `BOOKED` opportunities silently.

## 2. I. API Architecture Requirements
We need the following refined routes in `opportunities.ts`:
- `GET /api/v1/opportunities` (Enhanced with pagination, sorting, and owner/date filters).
- `GET /api/v1/opportunities/pipeline-metrics` (Aggregate funnel, weighted values, counts by stage).
- `GET /api/v1/opportunities/conversion-metrics` (Stage duration, drop reasons).
- `GET /api/v1/opportunities/:id/history` (History logs with duration).

## 2. J. Security
All endpoints will reuse `OpportunityPolicy.canList()` and `OpportunityPolicy.canView()`.
Metrics endpoints must aggregate **only** over the subset of opportunities permitted by `canList()`. This prevents cross-company leakage and enforces the Manager vs. Telecaller visibility boundary automatically.

## 2. K. Performance & Indexes
**Current Indexes:** `company_id`, `branch_id`, `owner_id`, `lead_id`, `stage`.
**Missing Indexes Required:**
- `@@index([project_id])`
- `@@index([property_id])`
- `@@index([created_at])` (Crucial for date-range filtering on Kanban).

## 2. L. Frontend Boundary
The backend will deliver pre-calculated aggregates (e.g., total weighted value, counts per stage) and pre-sorted lists. The frontend React components will simply render this data in Kanban or Chart format without executing business logic or metric aggregations locally.

## 2. M. Testing Strategy
- Unit tests for `OpportunityWorkflow` verifying every new strict transition rule (e.g., SITE_VISIT_PLANNED fails without a site visit).
- Integration tests for `pipeline-metrics` verifying that weighted values calculate accurately.
- Security tests ensuring a Telecaller cannot fetch pipeline metrics containing another user's opportunities.
- Integration tests proving `BOOKED` transitions are strictly rejected by the Phase 8 API.

---

## 3. Required Decisions Before Execution
1. **Approval of Schema Changes:** Do we have approval to add `exited_at` and `duration_minutes` to `OpportunityHistory`, as well as indexes for `project_id`, `property_id`, and `created_at` in `Opportunity`?
2. **Approval of Strict Integrity Rules:** Do you approve the strict stage transition validation (e.g., requiring a Site Visit to enter SITE_VISIT_PLANNED)? 

*If approved, we can proceed to Packet 4 Implementation.*
