# Phase 5: Current Commercial Audit

## 1. Existing Commercial Entities
None. The system tracks `Lead`, `Customer`, `SiteVisitBooking` (which is a physical site visit, not a financial booking), and `Property` inventory, but it lacks direct commercial commitment entities like `Opportunity`, `Booking`, or `Payment`.

## 2. Existing Booking Entities
None. `SiteVisitBooking` is solely for scheduling property visits, not for holding inventory or receiving payments. No financial booking model exists.

## 3. Existing Payment Entities
None. Aside from `ExpenseRefund` (internal employee petty cash tracking), there is no entity representing incoming commercial payments from Customers.

## 4. Existing Opportunity Entities
None. The sales intent is currently represented by a `Lead` continuing through the pipeline (`NEGOTIATION`, `WON`). Once `WON`, there's no explicitly modeled `Opportunity` object that holds the commercial intent, except as implicit in the Lead's status.

## 5. Existing Property/Unit Relationships
The system has a `Property` model that represents inventory. It currently supports statuses: `PENDING_VERIFICATION`, `PENDING_DM_POLISH`, `PENDING_MD_APPROVAL`, `LIVE`, `REJECTED`. There is no `BOOKED` or `SOLD` status modeled in the enum comment, nor is there a dedicated `Unit` model (it uses `Property` for units like VILLA, APARTMENT, PLOT).

## 6. Existing Customer Relationships
`Customer` exists (Phase 3). It relates back to the `origin_lead_id` and has an `assigned_to` Employee.

## 7. Existing Financial Fields
- `Lead.budget_min`, `Lead.budget_max` (Float)
- `Property.price` (Float)
- `CPPayout.deal_amount`, `CPPayout.commission_amount` (Float)
- `ExpenseRefund.amount` (Float)
All existing financial representations use `Float`.

## 8. Existing APIs
No APIs for Booking, Payment, or Opportunity.

## 9. Existing Services
No Services for Booking, Payment, or Opportunity.

## 10. Existing Policies
No Policies for Booking, Payment, or Opportunity.

## 11. Existing Frontend
No Frontend for Bookings or Payments.

## 12. Existing Workflows
Workflow Engine exists (`apps/api/src/workflows/workflowEngine.ts` assumed based on Phase 4), which currently handles Lead, Property, and SiteVisitBooking transitions. 

## 13. Existing Tests
No tests for Booking, Payment, or Opportunity.

## 14. Missing Functionality
- `Booking` entity to represent a reserved property by a customer.
- `Payment` entity to represent a financial transaction against a booking.
- Workflow definition for Bookings (e.g. `RESERVED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).
- Workflow definition for Payments (e.g. `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`).
- API, Service, Policy, and Authorization layers for Bookings and Payments.
- Updating `Property` status to reflect availability (`BOOKED`, `SOLD`).

## 15. Architecture Conflicts
- Opportunity may be redundant if `Lead` already covers `NEGOTIATION` and directly converts to a `Customer` who then makes a `Booking`. Creating an `Opportunity` might just duplicate state unless the pipeline demands multi-opportunity per customer tracking.
- All current money representations are `Float`. Introducing `Decimal` would be safer but breaks consistency with `Property.price`, `Lead.budget_min`, and `CPPayout.deal_amount`. We should stick with `Float` to match existing conventions unless there's a directive to migrate all fields.

## 16. Data Migration Risks
- Updating `Property` status enum constraints in code. Since there are existing properties, we must ensure any status transition additions don't break existing `LIVE` properties.
- None for Booking or Payment as they are net-new tables.
