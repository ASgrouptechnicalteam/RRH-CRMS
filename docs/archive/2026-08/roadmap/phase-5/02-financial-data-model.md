# Phase 5: Financial Data Model

## Representation of Money
The current repository universally uses `Float` for financial tracking:
- `Lead.budget_min` (Float)
- `Lead.budget_max` (Float)
- `Property.price` (Float)
- `CPPayout.deal_amount` (Float)
- `CPPayout.commission_amount` (Float)
- `ExpenseRefund.amount` (Float)

### Decision
To maintain strict consistency with the existing data layer, **Phase 5 will continue using `Float` for Booking and Payment amounts.** 

While `Decimal` is traditionally preferred for financial safety to prevent floating-point precision loss, mixing `Float` and `Decimal` within the same schema without a comprehensive, repository-wide migration strategy would introduce casting complexity and potential rounding errors at boundaries (e.g. comparing `Booking.agreed_price` (Decimal) with `Property.price` (Float)).

If the project requires a migration to `Decimal` in the future, it should be done globally in a dedicated technical debt sprint.

## Entities
- `Booking.agreed_price` : `Float`
- `Booking.booking_amount` : `Float`
- `Payment.amount` : `Float`

All API endpoints receiving amounts must perform validation to ensure realistic precision (e.g., maximum 2 decimal places) before storing into the database.
