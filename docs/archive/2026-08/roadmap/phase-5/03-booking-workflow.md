# Phase 5: Booking Workflow and Inventory Availability

## Inventory Availability
The `Property` model currently represents the inventory. It must be extended to support statuses indicating commercial commitment:
- `BOOKED`: A Booking exists and is active. The property cannot be booked again.
- `SOLD`: The Booking is finalized (e.g., fully paid or legally handed over).
- `AVAILABLE`: We will introduce or assume `LIVE` acts as the available state for bookings. The booking operation must verify the property is `LIVE`.

### Double Booking Protection
A Prisma transaction will be required during Booking creation to:
1. Verify the Property status is `LIVE`.
2. Create the Booking.
3. Update the Property status to `BOOKED`.
This ensures atomicity and protects against race conditions where two agents attempt to book the same unit simultaneously.

## Booking Workflow

The `Booking` entity will follow this state machine:

### States
- **PENDING**: The booking is drafted or awaiting initial token amount.
- **CONFIRMED**: The booking is legally acknowledged and the token/initial payment is processed.
- **CANCELLED**: The booking is voided, releasing the property.
- **COMPLETED**: The full transaction is complete, moving the property to SOLD.

### Valid Transitions
- `PENDING` -> `CONFIRMED`: Agent or Finance confirms the booking after payment.
- `PENDING` -> `CANCELLED`: Customer backs out or payment fails.
- `CONFIRMED` -> `CANCELLED`: Customer cancels the booking. Refund processes may apply out-of-band.
- `CONFIRMED` -> `COMPLETED`: Finance/Management finalizes the sale.

### Invalid Transitions
- Cannot transition a `CANCELLED` booking back to `CONFIRMED` or `COMPLETED`.
- Cannot skip from `PENDING` directly to `COMPLETED`.

### Side Effects
- Transition to `CANCELLED` must automatically revert the linked `Property` status back to `LIVE`.
- Transition to `COMPLETED` must automatically update the linked `Property` status to `SOLD`.
