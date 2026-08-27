# Phase 5: Commercial Audit

## Reusing Existing Mechanisms
We will integrate with the existing `AuditEvent` model in `schema.prisma` to track commercial events, maintaining consistency with previous phases.

### Commercial Events to Track
- `BOOKING_CREATED`: A new booking was initiated.
- `BOOKING_CONFIRMED`: A booking was confirmed by Finance/Management.
- `BOOKING_CANCELLED`: A booking was voided.
- `BOOKING_COMPLETED`: A booking reached final settlement and the unit was sold.
- `PAYMENT_RECORDED`: A payment was logged against a booking.
- `PAYMENT_STATUS_CHANGED`: A payment transitioned (e.g. `PENDING` -> `SUCCESS` or `FAILED`).

### Payload
The `AuditEvent` model accepts `entity_type`, `entity_id`, `old_value`, and `new_value`.
- **Entity Type**: Will be `Booking` or `Payment`.
- **New Value / Old Value**: Will capture the status changes or payment amounts to provide a clear history.
