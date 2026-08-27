# Phase 5: Payment Workflow

## Lifecycle of a Payment
The internal payment tracking system represents manual or confirmed transfers (e.g. wire transfer, cheque, cash receipts). We are not integrating external payment gateways like Stripe/Razorpay in this phase.

### States
- **PENDING**: The payment is recorded by an agent but hasn't been verified by Finance.
- **SUCCESS**: Finance has verified the payment (cleared cheque/bank transfer).
- **FAILED**: The cheque bounced or transfer was rejected.
- **REFUNDED**: The payment was returned to the Customer.

### Valid Transitions
- `PENDING` -> `SUCCESS`: Finance confirms receipt of funds.
- `PENDING` -> `FAILED`: Finance confirms payment failure.
- `SUCCESS` -> `REFUNDED`: Finance refunds the payment after Booking cancellation.

### Immutability Rule
Payments in `SUCCESS` or `REFUNDED` states cannot have their `amount` or `payment_method` modified. Any mistakes discovered after `SUCCESS` require Finance intervention (typically a cancellation/refund and recording a new payment).

### Interaction with Booking
- The sum of all `SUCCESS` payments against a Booking determines the amount paid.
- When sufficient `SUCCESS` payments are recorded to meet the `booking_amount` threshold, the `Booking` can transition from `PENDING` to `CONFIRMED`.
