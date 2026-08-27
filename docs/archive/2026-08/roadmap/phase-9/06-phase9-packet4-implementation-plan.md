# Phase 9 Packet 4: Operational Installment & Collection Management
## Step 1 - Read-Only Reconciliation & Implementation Plan

### 1. Findings
- The `Payment` model acts as an operational collection record, not a financial gateway record.
- The `Installment` model acts as an operational schedule for a Booking.
- The `AuditEvent` infrastructure exists to track actions and data changes.
- Creating a Payment or updating an Installment must NOT automatically trigger a state change for Booking, Property, or Opportunity.
- No existing idempotency mechanism handles duplicate collection submissions globally, but unique identifiers and transaction isolation are necessary.

### 2. Existing Payment Behavior
- Model tracks: `amount`, `payment_method`, `reference_number`, `status` (`PENDING`, `SUCCESS`, etc.), and `booking_id`.
- Current API allows creating a payment (marked `PENDING`). An authorized user then verifies it (`SUCCESS`), which directly decrements `Booking.balance_amount`.
- Payment Service uses `PaymentPolicy` which delegates full permissions to `MD`, `ADMIN`, `FINANCE`, etc., and limits other users.

### 3. Existing Installment Behavior
- Tracks `installment_number`, `expected_amount`, `received_amount`, `due_date`, `status` (`PENDING`, `PARTIALLY_RECEIVED`, `RECEIVED`, `OVERDUE`, `CANCELLED`).
- Currently completely disconnected from `Payment`.

### 4. Existing Authorization Behavior
- `PaymentPolicy.isManagement` includes `ADMIN`.
  > [!WARNING]
  > Admin is currently treated as management in `PaymentPolicy`. To respect the "Admin is not a normal business approver" rule, Admin will be explicitly blocked from verifying payments in the updated logic, enforcing that only MD/Finance/Operations can verify.

### 5. Legacy Compatibility Risks
- The existing `PaymentService.verifyPayment()` directly reduces `Booking.balance_amount`. 
- **AMENDMENT:** For installment-linked collections, we will NOT modify `Booking.balance_amount` yet. It will be treated as legacy-only until its exact business meaning is reconciled in future packets. Legacy payments without an `installment_id` will continue to update `Booking.balance_amount` as before.

### 6. Required Schema Changes
A non-destructive migration will be created to:
1. Add `installment_id Int?` to the `Payment` model.
2. Add a database constraint to `Installment`: `@@unique([booking_id, installment_number])` to prevent duplicate installments for the same booking.

### 7. Required Service Changes
#### `InstallmentService` (New)
- `createInstallment`: Validates booking, prevents duplicate numbers, creates Installment.
- `getInstallments`: Retrieves installments by Booking ID. Evaluates `PENDING` installments lazily: if `due_date < now()`, maps status to `OVERDUE` in response.

#### `PaymentService` (Modified)
- `recordPayment`: Accept `installment_id`.
  - Validate `installment_id` belongs to the `Booking`.
  - Validate `amount <= (expected_amount - received_amount)`.
  - Create `Payment` (status = `PENDING`). 
  - (No Installment mutation happens during record creation, to preserve existing two-step verification semantics).
- `verifyPayment`: 
  - Update `Payment.status` to `SUCCESS`.
  - If `payment.installment_id` exists:
    - Use `prisma.$transaction`.
    - Optimistically lock Installment using `where: { id: installment.id, received_amount: installment.received_amount }`.
    - Calculate new balance. Throw `400` if overpayment detected during verification.
    - Atomically update `Installment.received_amount` and `status` (`PARTIALLY_RECEIVED` or `RECEIVED`).
    - Create `AuditEvent`.
    - DO NOT update `Booking.balance_amount`.
  - If `payment.installment_id` does NOT exist (legacy):
    - Reduce `Booking.balance_amount` as before.

### 8. Required API Changes
- `POST /api/v1/installments` - Create Installment.
- `GET /api/v1/installments?booking_id=1` - List Installments.
- `POST /api/v1/payments` - Existing route will accept `installment_id` in request body.

### 9. Concurrency Strategy
We will use row-level optimistic locking when verifying a collection:
- `const installment = await tx.installment.findUniqueOrThrow({ where: { id: payment.installment_id } })`
- If overpayment detected, `throw new AppError(400, 'Overpayment detected')`.
- Ensure another request doesn't overlap by adding an atomic update condition: 
  `update({ where: { id: installment.id, received_amount: installment.received_amount }, data: { received_amount: newAmount } })`.
- If the `update` returns 0 records, it means another transaction modified it, so we throw a `409 Conflict`.

### 10. Test Plan
A new test suite `tests/api/packet4-installments.test.ts` with cases:
- [A-B] Create installment / Duplicate number rejected
- [C] Retrieve with lazy OVERDUE evaluation
- [D-H] Partial/Full collections via two-step verify, Overpayment blocked at record and verify stages.
- [I] Concurrency with `Promise.all` ensures overpayment is impossible during verification.
- [J] Payment creation/verification DOES NOT confirm Booking, Opportunity, or Property.
- [K] Admin explicitly blocked from verifying payments.
- [L] Legacy payment behavior preserved.
- [M] Audit event created.