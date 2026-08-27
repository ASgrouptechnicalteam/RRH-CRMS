# Project-Level Authorization & Data Scope

## 1. Project Manager
- **Exact Data Scope:**
  The Project Manager (PM) has full visibility over the `Project` they are assigned to, and all `Property` units belonging to that project.
  They can view Site Visits, Bookings, and Payments associated with their `Project`.
  They CANNOT view properties or bookings for projects they are not explicitly assigned to, nor standalone properties outside their scope.

## 2. Marketing Director
- **Exact Data Scope:**
  The Marketing Director can view all `Projects` and `Properties` across the entire `company_id`.
  They need project-level visibility to tie marketing campaigns to project inventory and assess ROI. They do not have edit rights on individual property pricing or booking financial transactions, but have read-only visibility for analytics.

## 3. Managing Director (MD)
- **Exact Data Scope:**
  The MD has absolute visibility and control over all `Projects`, `Properties`, `Bookings`, and `Payments` within the `company_id`.
  They approve Project launches, major pricing changes, and view aggregated organizational reporting.

## 4. Sales Roles (Telecaller / Agent)
- **Exact Data Scope:**
  Sales roles can view all `LIVE` projects and properties within their `company_id` for pitching purposes.
  They only have detailed read/write scope over `Leads` and `Customers` explicitly assigned to them.
  They cannot edit Project or Property details.

## 5. Security & Isolation
- **Backend Authorization Remains Authoritative:**
  Every `Project` record will be strictly bound to a `company_id`.
  The existing Phase 2 tenant isolation architecture (`DataScope` and `AuthzMiddleware`) will be extended to ensure:
  1. No user can view a `Project` outside their `company_id`.
  2. A `Property` cannot be linked to a `Project` belonging to a different `company_id`.
  3. `ProjectManager` policies explicitly check `project.assigned_pm_id == user.employeeId`.
