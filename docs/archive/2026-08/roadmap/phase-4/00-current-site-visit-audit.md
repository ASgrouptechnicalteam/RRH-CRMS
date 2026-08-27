# 00 Current Site Visit Audit

## 1. What SiteVisitBooking currently represents
`SiteVisitBooking` represents a physical visit to a property by a Lead. It tracks the scheduled date, the associated Lead, the Property being visited, the Telecaller who booked it, the Project Manager overseeing the property, and the assigned Field Agent who conducts the visit.

## 2. Current States/Statuses
- `PENDING_VERIFICATION`: Initially created state.
- `CONFIRMED`: Verified by telecaller/agent.
- `ASSIGNED_TO_AGENT`: Project Manager has assigned a field agent.
- `COMPLETED`: Agent has conducted the visit, uploaded proof, and captured feedback.
- `CANCELLED`: Visit was cancelled during verification.
- `RESCHEDULED`: (Present in schema comment, but not utilized in current transitions).

## 3. Existing API endpoints
- `GET /api/v1/site-visits`: List site visits (with filters for status and leadId).
- `POST /api/v1/site-visits`: Telecaller books a site visit.
- `POST /api/v1/site-visits/:id/verify`: Verify & confirm (or cancel) schedule.
- `POST /api/v1/site-visits/:id/assign-agent`: PM assigns a Field Agent.
- `POST /api/v1/site-visits/:id/complete`: Complete visit and capture feedback/proof.

## 4. State Transitions
Defined centrally in `apps/api/src/workflows/siteVisit.workflow.ts`:
- `PENDING_VERIFICATION` -> `VERIFY` action -> `CONFIRMED` or `CANCELLED`
- `CONFIRMED` -> `ASSIGN_AGENT` action -> `ASSIGNED_TO_AGENT`
- `ASSIGNED_TO_AGENT` -> `COMPLETE` action -> `COMPLETED`

## 5. Who can perform each transition
Governed by `SiteVisitPolicy`:
- List: MD/Admin/PM/HR/Marketing see all within company. Others see their assigned visits within company.
- Book/Create: Telecaller with `site_visits.create` for a Lead in their company.
- Verify: Anyone with `site_visits.verify` for their company.
- Assign: PM with `site_visits.assign_agent` for their company.
- Complete: Assigned Agent (or MD/Admin fallback) with `site_visits.complete` for their company.

## 6. Current Tenant Filtering
Tenant isolation is deeply embedded in `SiteVisitPolicy`. Every action explicitly checks `visit.lead.company_id === user.companyId`. `canList` enforces an unconditional `AND: [{ lead: { company_id: user.companyId } }]`.

## 7. Current Assignment Filtering
`canList` allows non-management to see visits where they are the `telecaller_id`, `assigned_agent_id`, or `project_manager_id`.

## 8. Current Ownership Rules
Only the explicitly `assigned_agent` (or an MD/Admin) can `COMPLETE` the visit.

## 9. Current Lead Relationship
A Site Visit strictly belongs to one Lead (`lead_id`). On completion, the Lead's status is automatically bumped (`QUALIFIED`, `NEGOTIATION`, or `CONTACTED`) depending on the visit rating.

## 10. Current Property Relationship
A Site Visit belongs to a Property. If set, the Property's `assigned_pm` is automatically assigned to the visit as `project_manager_id`. Must be same company.

## 11. Current Employee Relationships
`telecaller_id`, `project_manager_id`, `assigned_agent_id`. All are verified to be within the same company.

## 12. Current Workflow/Audit Logging
Fully utilizes the `LeadActivity` table. Book, Verify, Assign, and Complete actions all insert an activity log to the corresponding Lead with details (notes, ratings, agent names).

## 13. Existing tests
Tests currently exist in `tests/api/siteVisits.test.ts` and `tests/api/workflowEngine.test.ts`.

## 14. Existing frontend behavior
Implemented via `SiteVisitManagement.tsx`. (Currently has a TS property error on line 310 from prior phases).
