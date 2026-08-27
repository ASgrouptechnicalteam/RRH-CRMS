# Phase 9 Architecture Reconciliation - Booking & Transaction Domain

## A. Current architecture
The current Phase 5 architecture contains disconnected scaffold models for `Booking`, `Payment`, and `Customer`. `Booking` is linked to `Property` and `Customer`, but `Opportunity` and `Lead` have no formal transactional links to `Booking`. Operations happen directly on `Booking` endpoints, bypassing the Phase 8 `Opportunity` pipeline logic entirely.

## B. Verified existing models
- `Booking`: Contains core financial details and connects `Customer` to `Property`. Lacks `Opportunity` link.
- `Payment`: Financial transaction ledger linked to `Booking`.
- `Customer`: Connected to `origin_lead_id` and `Booking`.
- `Property`: Represents the real estate unit. Contains `status` which tracks inventory.
- `Opportunity`: Represents sales pursuits, tracked by `stage`.

## C. Verified existing enums
- **Booking Status:** `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`
- **Payment Status:** `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`
- **Property Status:** `PENDING_VERIFICATION`, `PENDING_DM_POLISH`, `PENDING_MD_APPROVAL`, `LIVE`, `REJECTED`, `BOOKED`, `SOLD` (Note: `BOOKED` and `SOLD` are used in code, though absent in schema comments).
- **Opportunity Stage:** `PROSPECT_QUALIFIED`, `REQUIREMENT_CAPTURED`, `PROPERTY_SHORTLISTED`, `SITE_VISIT_PLANNED`, `SITE_VISIT_COMPLETED`, `PROPERTY_INTEREST_CONFIRMED`, `NEGOTIATION`, `BOOKING_INITIATED`, `BOOKED`, `DROPPED`
- **Lead Status:** `NEW`, `CONTACTED`, ..., `WON`

## D. Existing Booking flow
Client -> Provide details -> `BookingService.createBooking` -> validates property `LIVE` -> creates Booking, updates property to `BOOKED`.

## E. Existing Payment flow
Client -> pays -> `PaymentService.recordPayment` -> creates `PENDING` payment -> admin verifies -> updates to `SUCCESS` and decreases `booking.balance_amount`.

## F. Existing Customer flow
Client -> `CustomerService.createCustomer` -> soft duplicate check via phone -> creates `Customer` linked to `origin_lead_id`.

## G. Existing Property/inventory flow
Properties are managed, approved, set to `LIVE`. When booked, they become `BOOKED` or `SOLD`. 

## H. Existing Opportunity flow
Moves linearly to `BOOKING_INITIATED` and then `BOOKED`. Currently, no backend trigger formally creates the transaction downstream.

## I. Existing Lead flow
Leads are processed, marked `WON` historically for dashboard closure rate metrics, but this action does not spawn a Booking.

## J. Concurrency vulnerability analysis
**Critical Risk:** In `booking.service.ts`, `property.findFirst` executes completely outside the `$transaction` block. If two executives fire parallel requests, they both read `LIVE` simultaneously, and both pass the check. Both enter the `$transaction` sequentially, causing double booking (two `Booking` records created, property overwritten to `BOOKED` twice).

## K. Recommended transaction boundaries
1. **Lead -> Customer Conversion:** Should be its own safe, idempotent step or wrapped inside the booking initiation if strictly synchronous. 
2. **Booking & Inventory Claim:** The `Property` lock and `Booking` creation MUST happen in a single strictly-isolated transaction using conditional atomic updates (`update { where: { id: ID, status: 'LIVE' }, data: { status: 'LOCKED' } }`). 
3. **Payment Collection & Confirmation:** Handled distinctly. Success triggers Booking -> `CONFIRMED` and Property -> `BOOKED`.

## L. Recommended inventory locking architecture
Introduce `LOCKED` status to `Property`.
Add `locked_until` (DateTime) and `locked_by_booking_id` (Int) directly to `Property`. 
*Reasoning:* A separate reservation table introduces unnecessary join complexity for what is essentially a 1:1 state constraint on an inventory unit. 

## M. Recommended Opportunity → Booking relationship
Schema addition: `Opportunity` should have a `booking_id?` foreign key linking to `Booking`. 
*Reasoning:* While 1 Opportunity might spawn multiple attempts, only 1 *active/successful* Booking represents the successful closure of the pursuit. If a booking fails/cancels, we can clear `booking_id` and revert the stage, or close it as `DROPPED` and spawn a new Opportunity. A 1:1 direct FK is clearest.

## N. Customer conversion architecture
`CustomerService` should receive a structured `convertFromLead` method. It should check if a `Customer` with `origin_lead_id` already exists. If yes, reuse it. If no, create it safely. Concurrency here can be solved with `upsert` or unique constraint on `origin_lead_id`.

## O. Payment architecture
**Recommendation:** Flat payment ledger (Option A).
*Reasoning:* The existing `balance_amount` tracked in `Booking` and the append-only `Payment` table is sufficient for an MVP. Formal installment/payment schedules introduce massive scope creep and require their own dedicated feature phase later if needed.

## P. Cancellation architecture
Cancellation must require explicit PM/Admin approval. A `BookingCancellation` request table or explicit state workflow should be introduced to handle refund audits, penalty amounts, and atomic inventory release.

## Q. KYC architecture
Introduce `pan_number` and `aadhaar_number` to `Customer`.
*Requirement Timing:* Minimal identity at `INITIATED`. Mandatory KYC documentation to transition Booking to `CONFIRMED`.

## R. Channel Partner boundary
Commissions (`CPPayout`) currently map to `Lead` and `Property`. They should be triggered/calculated when Booking becomes `CONFIRMED` or Payment reaches a certain threshold. For now, we will leave CP logic strictly isolated to a later packet.

## S. Backward compatibility strategy
Do not delete `Lead.WON`. Do not touch historical records. New transactions will properly sync back to `Opportunity.BOOKED` and `Lead.WON` dynamically via workflows.

## T. Security / authorization
Retain and extend `BookingPolicy` and `PaymentPolicy`. Ensure any mutation of financial data requires elevated roles (e.g., `Roles.FINANCE`, `Roles.ADMIN`).

## U. Migration strategy
Purely additive Prisma migration:
- Add `booking_id` to `Opportunity`
- Add `locked_until`, `locked_by_booking_id` to `Property`
- Add `pan_number`, `aadhaar_number` to `Customer`

## V. Testing strategy
Targeted isolated test execution only (`npm run test:api -- tests/api/...`). Concurrency will be tested via `Promise.all` racing in Jest.

## W. Proposed Phase 9 packet breakdown
- **Packet 1:** Booking & Inventory Schema Augmentation (Concurrency Locks, Opportunity FK, KYC fields).
- **Packet 2:** Transactional Safety & Concurrency Engine (Atomic Locking, Booking Service refactor).
- **Packet 3:** Opportunity → Booking Integration Pipeline (Lead-to-Customer conversion, Stage sync).
- **Packet 4:** Payment & Financial Ledger Upgrades (Immutability rules, Receipts).
- **Packet 5:** Cancellation, Refund & Penalty Workflow.
- **Packet 6:** Channel Partner Commission Integration.
- **Packet 7:** Final Validation & Rollout.
*(Frontend packets delayed as per instruction)*

## X. Blocking business decisions
1. Property lock duration.
2. Cancellation authority.
3. Opportunity → Booking cardinality.
4. Payment schedule vs flat ledger.
5. KYC requirement timing.
6. Booking confirmation authority.
7. Refund approval authority.
8. Whether token payment is mandatory for `TOKEN_RECEIVED`.
9. Failed token payment behavior.
10. Cancelled booking impact on Opportunity.

## Y. Recommended defaults for each decision
1. **Property lock duration:** 24 hours (PROVISIONAL BUSINESS DEFAULT). Ensures inventory isn't stuck forever.
2. **Cancellation authority:** PM/Admin. Executive can only "Request Cancellation".
3. **Opportunity → Booking cardinality:** 1:1 direct mapping (`booking_id` on Opportunity).
4. **Payment schedule:** Flat ledger (Option A) for MVP simplicity.
5. **KYC requirement:** Mandatory at `CONFIRMED`.
6. **Booking confirmation authority:** Admin/Finance.
7. **Refund approval authority:** Finance.
8. **Token payment mandatory:** Yes, to move to `TOKEN_RECEIVED`.
9. **Failed token payment:** Reverts to `INITIATED` but lock expires naturally after 24h regardless.
10. **Cancelled booking:** Reverts Opportunity back to `NEGOTIATION` or sets to `DROPPED` based on user input. Default: `DROPPED` (creates a clean break; require new pursuit).
