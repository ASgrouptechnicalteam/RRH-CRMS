# Phase 5: Payment Authorization

## Missing Payment Permissions
Payment data is sensitive. Modification and deletion must be strictly locked down. 

We will introduce the following permissions:
- `PAYMENTS_CREATE`: Can record a new payment receipt against an active Booking.
- `PAYMENTS_READ`: Can read payment details (scoped to company/booking visibility).
- `PAYMENTS_UPDATE`: Can modify a *PENDING* payment (e.g. correct reference number).
- `PAYMENTS_CANCEL`: Can cancel or void a payment (restricted action, likely Finance/MD only).

## Security Rules
1. **No Silent Overwrites:** Once a Payment reaches `SUCCESS` status, its amount CANNOT be modified by any normal employee. It must be cancelled/refunded via an offsetting record or privileged status change.
2. **Strict Relationship Constraint:** A Payment can only be created against a valid, non-cancelled `Booking`.
3. **Tenant Boundary:** The user attempting to read or create a payment must belong to the same `company_id` as the underlying `Booking`.

## Role Assignments
- **MD / Admin**: All payment permissions.
- **Finance**: All payment permissions (Finance verifies payments).
- **Sales / Digital Lead Operator**: `PAYMENTS_CREATE`, `PAYMENTS_READ`.
- **Other Agents**: `PAYMENTS_READ` (only if they are assigned to the Customer/Booking).
