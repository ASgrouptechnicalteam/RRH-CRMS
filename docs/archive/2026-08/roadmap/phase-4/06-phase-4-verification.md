# 06 Phase 4 Verification

## Backend Verification
- **API Tests**: `npm run test:api` was run encompassing the new `phase4-site-visits.test.ts` as well as all legacy suites.
- **Workflow Integrity Tests**: Explicitly verified that a user cannot bypass the `PENDING_VERIFICATION` and `CONFIRMED` steps to directly trigger `COMPLETED`. An out-of-order transition correctly returns `409 Conflict`.
- **Tenant Isolation Tests**: Verified that listing, verifying, and assigning agents returns `403 Forbidden` if the `SiteVisitBooking` belongs to a different company than the logged-in user.
- **Ownership Tests**: Verified that Telecallers cannot assign Field Agents (requires Project Manager role / `site_visits.assign_agent`).

## Frontend Verification
- Verified that the `SiteVisitManagement.tsx` correctly interprets the Phase 4 workflow states (`PENDING_VERIFICATION` to `COMPLETED`).
- Verified that the UI uses the exact backend permission strings (`SITE_VISITS_VERIFY`, `SITE_VISITS_ASSIGN_AGENT`, `SITE_VISITS_COMPLETE`) to govern action buttons.
- The pre-existing TypeScript error in `SiteVisitManagement.tsx(310,26)` (Property 'property' does not exist on type 'SiteVisit') was left intact as instructed by the do-not-break rules. It does not inhibit the Phase 4 workflow backend and must be resolved in an independent frontend chore ticket.
