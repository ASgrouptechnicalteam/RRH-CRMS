# 03 Site Visit Ownership

Based on the actual implementation in `SiteVisitPolicy` and `SiteVisitService`.

## Ownership Identification
A Site Visit is associated with multiple employees:
- `telecaller_id`: The employee who booked the visit.
- `project_manager_id`: The PM assigned to oversee the visit (auto-assigned from Property).
- `assigned_agent_id`: The Field Agent designated to conduct the physical visit.

## Data Scope Restrictions
For non-management employees, the listing (`GET /api/v1/site-visits`) is strictly filtered. An employee can only see the Site Visit if their `employeeId` matches one of the three IDs above.

## Mutation Restrictions
- **Verification**: Any user with `SITE_VISITS_VERIFY` in the company can perform this.
- **Assignment**: Any user with `SITE_VISITS_ASSIGN_AGENT` in the company can assign an agent.
- **Completion**: Explicit IDOR protection exists. Only the employee matching `assigned_agent_id` can complete the visit, unless the actor has the `MD` or `ADMIN` role.
