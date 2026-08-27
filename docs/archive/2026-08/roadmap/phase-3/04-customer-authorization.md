# Customer Authorization

The Customer domain authorization extends the existing Phase 2 permission framework.

## New Permissions
The following new permissions were added to `packages/shared/src/index.ts`:
- `CUSTOMERS_CREATE`
- `CUSTOMERS_READ`
- `CUSTOMERS_UPDATE`
- `CUSTOMERS_DELETE`
- `CUSTOMERS_CONVERT`

## Role Mappings
- **MD & ADMIN**: Full CRUD & Convert permissions on Customers.
- **MARKETING_DIRECTOR & DIGITAL_LEAD_OPERATOR**: Full CRUD & Convert permissions.
- **PROJECT_MANAGER**: `CUSTOMERS_READ`, `CUSTOMERS_UPDATE`.
- **TELECALLER & AGENT**: `CUSTOMERS_READ`, `CUSTOMERS_UPDATE`, `CUSTOMERS_CONVERT`.

## Invariants
These permissions only grant the *action* capability. 
The actual data access is further constrained by:
1. **Tenant Isolation**: Customers are strictly filtered by `company_id === user.companyId`.
2. **Ownership Enforement**: Where applicable, updates to a Customer enforce `assigned_to_id === user.employeeId` via the Customer Policy (to be implemented next).
