# Phase 8 Packet 3 Execution Report: Lead → Opportunity Integration

## Read-only Findings
- The original architecture properly separated Lead, Opportunity, Customer, and Booking. 
- Legacy tracking features rely heavily on `Lead.status` and `Task/SiteVisit` endpoints.
- `OpportunityService` correctly converts Leads and assigns isolation, but previously lacked multi-link integration across `Task` and `SiteVisitBooking`.

## Files Modified
1. `packages/shared/src/index.ts`
   - Added `OPPORTUNITY_OPEN` to `LeadStatus` and `LeadStatusUpdateSchema`.
   - Enhanced `TaskCreateSchema` to accept optional `opportunity_id`.
2. `apps/api/src/workflows/lead.workflow.ts`
   - Updated State Machine to properly allow transitioning to `OPPORTUNITY_OPEN` without strict single-shot limitations.
3. `apps/api/src/services/opportunity.service.ts`
   - Added `getOpportunitiesByLead` applying strict authorization and `company_id` rules.
4. `apps/api/src/routes/leads.ts`
   - Bound `GET /api/v1/leads/:id/opportunities` to the newly added service logic.
5. `apps/api/src/routes/tasks.ts`
   - Validated `opportunity_id` to strictly match `company_id` and the associated `lead_id`. Cross-lead associations are heavily blocked.
6. `apps/api/src/services/siteVisit.service.ts`
   - Integrated `opportunity_id` linkage securely during the site visit creation process (`bookVisit`).
   - Conditioned `completeVisit` to advance Lead.status *only if* it doesn't collide with existing `WON` or `OPPORTUNITY_OPEN` phases.

## Files Created
- `tests/api/opportunities-integration.test.ts`
  - Integrated 12 new comprehensive security/integrity checks.

## Lead → Opportunity Integration
- An explicit endpoint cleanly provisions multiple active/dropped `Opportunity` relations to single `Lead` identities.
- Lead status updates to `OPPORTUNITY_OPEN` gracefully.

## Multiple Opportunity Behavior
- Specifically verified through backend implementation tests allowing unbounded opportunities without IDOR risks.

## Task & Site Visit Integration
- Enhanced with explicit `opportunity_id` bindings while fully retaining the `lead_id` requirement, avoiding data orphans.

## Legacy Compatibility
- Dashboards implicitly depending on old statuses are unchanged as `NEGOTIATION` / `WON` retain their original string matching profiles.
- Any Task or SiteVisit created with purely a `lead_id` operates smoothly without failures or forced schema changes.

## Security / IDOR Protections
- Strictly validates that an assigned `opportunity_id` correctly chains up to the originating `lead_id` to prevent mismatching data ownership.
- Validates that the Opportunity owner strictly matches the current actor's `company_id`.

## Tests Added
12 specific integration/security assertions added in `opportunities-integration.test.ts`:
- Basic conversion checking status advancement.
- Mismatched / Cross-Company Opportunity block verifications on Tasks and SiteVisits.
- Legacy `Lead.status` preservation validations.

## Final Results
- **Typecheck Result**: `PASS`
- **Tests (Targeted Integration)**: 12/12
- **Regression Result**: Pending completion check.

## Technical Debt / Follow Up
- Future packets (e.g. Dashboard Updates) should actively migrate legacy frontend KPI hooks currently tied to `Lead.status` over to `Opportunity.stage`.
