# RRH-CRMS AUTHORIZATION FIX REPORT

## 1. Files Changed
- `apps/api/src/authz/authorization.ts`

## 2. Exact Security Behavior Before/After

### BEFORE (Fail-Open Vulnerability):
- If `action` was an unknown/unmapped permission in the `switch` statement, the engine fell through to the `default` case.
- In the `default` case, if the user passed the base permission check, and either `resource.company_id` matched `user.companyId` or `resource` had no `company_id` property, it returned `true`.
- Furthermore, if `resource` was omitted entirely (e.g., standard `CREATE` or `READ` lists), the engine bypassed the `switch` statement completely and returned `true`.
- **Result:** Critical privilege escalation and tenant data leakage for any route that lacked explicit policies.

### AFTER (Fail-Closed Enforcement):
- The `switch (action)` block is now evaluated for **all** actions, regardless of whether a `resource` is provided.
- If an action requires a resource (e.g., `LEADS_UPDATE`) and the caller omits it, it immediately returns `false`.
- The `default` case now strictly returns `false`.
- **Result:** Any permission that is not explicitly mapped in `authorization.ts` will return `false`, blocking access. The engine is now secure by default.

## 3. Unmapped Permissions Discovered (Unresolved Security Gaps)
The following permissions are defined in `@rrh-ems/shared` but lack explicit policies in `authorization.ts`. 

### Used in Existing API Routes (Now Blocked/Failing Closed)
These endpoints are currently down because they rely on the fail-open fallback. They require immediate policy implementation in the next phase.

| Permission | Used In | Requires Resource? | Relies on Fallback? |
|---|---|---|---|
| `LEADS_CREATE` | `routes/leads.ts` | No | Yes |
| `LEADS_DISTRIBUTION_MONITOR` | `routes/leads.ts` | No | Yes |
| `LEADS_BULK_UPLOAD` | `routes/leads.ts` | No | Yes |
| `CUSTOMERS_CONVERT` | `routes/leads.ts` | No | Yes |
| `CUSTOMERS_READ` | `routes/customers.ts` | No | Yes |
| `CUSTOMERS_CREATE` | `routes/customers.ts` | No | Yes |
| `CUSTOMERS_UPDATE` | `routes/customers.ts` | No (in route definition) | Yes |
| `PROPERTIES_READ` | `routes/properties.ts` | No | Yes |
| `PROPERTIES_CREATE` | `routes/properties.ts` | No | Yes |
| `PROJECTS_CREATE` | `routes/projects.ts` | No | Yes |
| `BOOKINGS_READ` | `routes/installment.routes.ts` | No | Yes |
| `BOOKINGS_UPDATE` | `routes/booking.routes.ts` | No | Yes |
| `BOOKINGS_CANCEL` | `routes/booking.routes.ts` | No | Yes |
| `BOOKINGS_CONFIRM` | `routes/booking.routes.ts` | No | Yes |
| `PAYMENTS_CREATE` | `routes/payment.routes.ts` | No | Yes |
| `PAYMENTS_READ` | `routes/payment.routes.ts` | No | Yes |
| `PAYMENTS_UPDATE` | `routes/payment.routes.ts` | No | Yes |
| `COMPLAINTS_READ` | `routes/complaint.routes.ts` | No | Yes |
| `COMPLAINTS_CREATE` | `routes/complaint.routes.ts` | No | Yes |
| `COMPLAINTS_UPDATE` | `routes/complaint.routes.ts` | No | Yes |
| `COMPLAINTS_ASSIGN` | `routes/complaint.routes.ts` | No | Yes |
| `COMPLAINTS_RESOLVE` | `routes/complaint.routes.ts` | No | Yes |
| `COMPLAINTS_CLOSE` | `routes/complaint.routes.ts` | No | Yes |
| `EMPLOYEES_READ` | `routes/employees.ts`, `md.ts` | No | Yes |
| `EMPLOYEES_CREATE` | `routes/employees.ts` | No | Yes |
| `EMPLOYEES_UPDATE` | `routes/employees.ts`, `md.ts` | No | Yes |
| `EMPLOYEES_RESET_PASSWORD` | `routes/employees.ts` | No | Yes |
| `EXPENSES_READ_OWN` | `routes/expenseRefunds.ts` | No | Yes |
| `TASKS_CREATE` | `routes/tasks.ts` | No | Yes |
| `REPORTS_READ_TEAM` | `routes/tasks.ts` | No | Yes |
| `REPORTS_TARGETS_CONFIGURE`| `routes/targets.ts` | No | Yes |
| `PERFORMANCE_READ_TEAM` | `routes/performance.ts` | No | Yes |
| `ADMIN_SYSTEM_METRICS` | `routes/integration.routes.ts` | No | Yes |

### Unmapped and Not Found in Routes (Potential Dead Code / Frontend Only)
The following permissions exist in the shared constants but were not found in `requireAuthz` middleware across the API routes. They also rely on the fallback if used.
- `EMPLOYEES_DELETE`, `EMPLOYEES_MANAGE_DEFAULT_ALL`
- `LEADS_DELETE`, `LEADS_WHATSAPP_PROPOSAL`
- `CUSTOMERS_DELETE`
- `SITE_VISITS_CREATE`, `SITE_VISITS_READ`
- `BOOKINGS_CREATE`
- `PAYMENTS_CANCEL`
- `TASKS_READ`, `TASKS_ASSIGN`
- `ATTENDANCE_READ_OWN`, `ATTENDANCE_SCAN`, `ATTENDANCE_LATE_PROPOSAL`, `ATTENDANCE_LEAVE_PROPOSAL`, `ATTENDANCE_PROPOSALS_QUEUE`, `ATTENDANCE_LIVE_MONITOR`
- `REPORTS_CREATE`, `REPORTS_READ_OWN`
- `EXPENSES_CREATE`
- `PERFORMANCE_READ_OWN`, `PERFORMANCE_HISTORY`
- `ADMIN_AUDIT_LOGS`, `ADMIN_SECURITY_ALERTS`, `ADMIN_EMERGENCY_LOCKDOWN`
- `PUBLIC_PROPERTIES_READ`, `PUBLIC_LEADS_CREATE`
- `AI_SEARCH`
- `DOCUMENTS_CREATE`

## 4. Build/Test Results
- **TypeScript Compilation:** PASS
- **Vite Build:** PASS
- **Linting:** (No explicit lint script executed, but TypeScript strict mode passes)
- **Tests:** No automated test suite exists for this component.

## 5. Recommended Git Commit Message
```text
fix(authz): secure authorization engine by failing closed

- Removed the catastrophic fail-open fallback in `authorization.ts`.
- The `can()` engine now strictly returns `false` for any unmapped permission (default case).
- The `can()` engine now strictly evaluates the `switch` block even when a `resource` is omitted, explicitly returning `false` for operations that demand a resource but did not receive one.
- Unmapped legacy routes are now correctly blocked pending explicit policy implementation.
- Closes P0 beta blocker.
```