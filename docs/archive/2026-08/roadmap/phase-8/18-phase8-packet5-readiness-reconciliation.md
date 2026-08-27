# Phase 8 Packet 5 — Frontend Opportunity & Pipeline Application
# Architectural Readiness & Reconciliation Report

## 1. Frontend Architecture Findings
The existing frontend is a React SPA built with Vite, utilizing React Router DOM for navigation and Tailwind CSS for styling. 
State management is handled via React's native Context API (`AuthContext`) and local state (`useState`, `useEffect`). There is no active heavy state-management library (like Redux or Zustand) driving the application data layer; data is fetched directly using a custom `fetchWithAuth` hook.
The UI relies heavily on Lucide React for iconography.

## 2. Existing Lead UI Dependencies
- `LeadManagement.tsx` is a monolithic component (60kb+) that handles the list view, filtering, and the detailed Lead Dossier (via `selectedLead`).
- `Lead.status` heavily dictates the UI: it drives the `statusFilter`, powers the `getStatusBadge` color mappings, and is modified via a direct API call to `/leads/:id/status`.
- Tasks and Site Visits are currently rendered directly inside the Lead Dossier tabs. 
- Dashboards like `MDExecutiveDashboard` fetch aggregate metrics directly from `/analytics` endpoints, explicitly displaying `totalClosedDeals` and `totalLeadsCount`. These dashboards assume Lead is the terminal entity.

## 3. Actual Opportunity API Contracts (Verified from Backend)
The backend Opportunity API (implemented in Packets 1–4) has the following definitive shapes:
- **`GET /api/v1/opportunities`**: 
  - **Query Params**: `stage`, `owner_id`, `project_id`, `property_id`, `date_from`, `date_to`, `expected_close_from`, `expected_close_to`, `sort_by`, `sort_order`, `limit`, `offset`.
  - **Response**: `{ opportunities: Array<{ id, stage, expected_value, probability, drop_reason, owner, project, property, ... }>, total, limit, offset }`
- **`GET /api/v1/opportunities/:id`**: 
  - **Response**: `{ opportunity: { ...base, lead, owner, project, property, history: [], tasks: [], site_visits: [] } }`
- **`GET /api/v1/opportunities/pipeline-metrics`**: 
  - **Response**: `{ metrics: { activeCount, totalCount, totalExpectedValue, totalWeightedValue, countByStage, byOwner, byProject, byProperty, droppedCount, droppedReasons, bookingInitiatedCount, bookedCount, avgAgeDays } }`
- **`GET /api/v1/opportunities/conversion-metrics`**: 
  - **Response**: `{ metrics: { stageAging: Record<string, number>, transitionCount: number, stageTransitions: Record<string, number> } }`
- **`GET /api/v1/opportunities/:id/history`**:
  - **Response**: `{ history: Array<{ from_stage, to_stage, created_at, exited_at, duration_minutes, changed_by }> }`

## 4. Recommended Navigation Structure
The `App.tsx` main navigation bar should be updated to insert **Opportunities** logically between Leads and Site Visits.
**Recommended Structure:**
- Leads (Acquisition)
- **Opportunities (Sales Pipeline)** `<- NEW`
- Site Visits (Field Dispatch)
- Tasks
- Bookings (Phase 9)

## 5. Opportunity Pipeline UX Architecture
The Pipeline will feature a **Kanban Board** by default, with a toggle for a **List View** (better for bulk data).
- **Kanban Columns**: Mapped exactly to the backend stages (`PROSPECT_QUALIFIED`, `REQUIREMENT_CAPTURED`, etc.).
- **Opportunity Cards**: Will display Customer Name (from Lead), Project/Property, Owner, Expected Value, Probability, and Weighted Value.
- **Top Metrics Banner**: Will display the pre-calculated `totalExpectedValue` and `totalWeightedValue` from `/pipeline-metrics`.
- **Backend Responsibility**: React will strictly render the `pipeline-metrics` response. No client-side summation will be performed.

## 6. Opportunity Dossier Architecture
Clicking an Opportunity card will open a dedicated `OpportunityDossier` (likely a modal or a slide-over panel, similar to the Lead Dossier).
- **Header**: Opportunity ID, Stage Badge, Expected Value, Probability.
- **Context Panel**: Read-only display of the attached Lead, Owner, Project, and Property.
- **Tabs**:
  1. **History & Aging**: Displays the timeline of stage transitions and the `stageAging` duration.
  2. **Tasks**: Opportunities' associated follow-ups.
  3. **Site Visits**: Site visits linked specifically to this Opportunity.

## 7. Lead Dossier Integration
`LeadManagement.tsx` will be modified to include a new **Opportunities Tab** in the Lead Dossier.
- It will fetch and display a list of Opportunities where `lead_id === selectedLead.id`.
- Clicking a row in this list will open the `OpportunityDossier`.
- We will NOT duplicate Opportunity logic inside `LeadManagement.tsx`.

## 8. Permission Mapping
Opportunity authorization defers to the existing `LEADS_READ` and `LEADS_UPDATE` permissions, utilizing the backend `OpportunityPolicy` to enforce multi-tenant (Company) and hierarchical (Manager vs. Telecaller) visibility constraints.
- **View Pipeline**: Requires `LEADS_READ`. The backend automatically filters out unowned records for non-managers.
- **Transition/Update**: Requires `LEADS_UPDATE`. 

## 9. Backend/Frontend Responsibility Boundary
- **Frontend**: Renders the Kanban, handles drag-and-drop intent, captures required data (e.g., `drop_reason` in a modal), and displays errors.
- **Backend**: Validates invariants (e.g., ensuring a Site Visit exists before moving to `SITE_VISIT_PLANNED`), calculates weighted values, and computes stage aging.

## 10. Dashboard Integration Strategy
During Packet 5, existing dashboards (e.g., `MDExecutiveDashboard`) will remain untouched. They will continue to read legacy Lead metrics to avoid disrupting operations. Opportunity metrics will be isolated to the new **Opportunity Pipeline** view. Once Phase 8 is stable, a future dashboard overhaul will integrate Opportunity metrics into the executive views.

## 11. Responsive Strategy
- **Desktop/Tablet**: Horizontal scrolling Kanban board.
- **Mobile**: The UI will gracefully fallback to a stacked List View, or a single-column Kanban with a dropdown to select the active stage column to view.

## 12. Testing Strategy
New frontend tests (Vitest/React Testing Library) should cover:
- Kanban rendering and correct column mapping.
- Modal intercept for stage transitions requiring data (e.g., DROPPED requires `drop_reason`).
- Graceful error handling when the backend rejects a transition (409 Conflict).
- Lead Dossier rendering the new Opportunities tab.

## 13. Reusable Component Recommendations
- Reuse the `statusBadge` styling logic but map colors to the new `PROSPECT_QUALIFIED`, `PROPERTY_SHORTLISTED`, etc., stages.
- Reuse the `Modal` and `Toast` contexts.
- Reuse `fetchWithAuth`.

## 14. Migration/Backward Compatibility Considerations
- Legacy Leads with status `WON` or `LOST` will not appear in the Opportunity Pipeline. They remain in the Lead Management view, preserving historical data integrity.

## 15. Risks
- **Drag-and-Drop Rejection**: Users may drag a card to `SITE_VISIT_PLANNED` without creating a site visit first. The backend will return a 409. The frontend must snap the card back to its original column and show an actionable error toast (e.g., "Please create a Site Visit first").
- **BOOKED Stage**: The UI must not allow dragging to the `BOOKED` column, as the backend blocks it. The column can be read-only or hidden.

## 16. Packet 5 Implementation Sub-Packets
- **Packet 5A**: Scaffold Routing, Navigation Tab, and Opportunity API hooks.
- **Packet 5B**: Implement the Pipeline Metrics Banner and Kanban/List View.
- **Packet 5C**: Implement the `OpportunityDossier` and Stage Transition Validation Modals.
- **Packet 5D**: Integrate the Opportunities Tab into `LeadManagement.tsx`.

## 17. Business Decisions Requiring Input
- **Creating Opportunities**: From the Kanban board, if a user clicks "Add Opportunity", should it open a modal that searches existing Leads to attach to, or should Opportunities only be created directly from inside the Lead Dossier? (Recommendation: Start by only allowing creation from the Lead Dossier to ensure data lineage, and evaluate if a standalone "Create" button is needed later).

---

## VERDICT
**READY FOR PACKET 5 IMPLEMENTATION**
No architectural blockers exist. The backend contract is strictly defined, and the frontend component boundaries are clearly mapped.
