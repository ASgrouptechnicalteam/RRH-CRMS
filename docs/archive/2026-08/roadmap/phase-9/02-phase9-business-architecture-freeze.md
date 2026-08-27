# Phase 9 Business Architecture Freeze - Booking & Transaction Domain

## 1. Final Phase 9 domain boundary
- **Lead:** Acquisition and lifecycle record.
- **Sales Opportunity:** Specific commercial sales pursuit (pipeline). Handoffs at `BOOKING_INITIATED`.
- **Booking:** The transaction source of truth and formal inventory claim.
- **Customer:** The legal/transactional buyer identity.
- **Property:** The real estate inventory unit.
- **Payment/Collection:** Operational ledger tracking collected installments.
- **Channel Partner:** Source relationship and commission (isolated for later packet).

## 2. Booking lifecycle
The business workflow for a formal transaction:
1. **INITIATED:** Draft transaction. Property is temporarily locked.
2. **TOKEN_RECEIVED:** Operational collection of initial commitment.
3. **CONFIRMED:** Final business approval by the **Managing Director (MD)** (requires KYC).
4. **REGISTERED:** Legal handover and completion.
5. **CANCELLED:** Transaction aborted (Requires MD approval for normal workflow).

*Crucial rule: Operational collection of a token/payment does NOT automatically trigger `CONFIRMED`. MD approval is a distinct required step.*

## 3. Property lifecycle
1. **LIVE:** Available for inventory booking.
2. **LOCKED:** Temporarily held while a Booking is `INITIATED` (e.g. 24 hours lock).
3. **BOOKED:** Permanently claimed by a `CONFIRMED` Booking.
4. **SOLD:** Finalized via legal registration.

## 4. Opportunity → Booking handoff
- **1:1 Relationship:** Schema will be updated to include `booking_id` on the `Opportunity` model. 
- **Handoff:** `Opportunity` reaches `BOOKING_INITIATED`. A Booking is created, taking ownership of the transaction.
- **Completion:** Upon Booking `CONFIRMED`, Opportunity synchronizes to `BOOKED`.

## 5. Customer conversion
- Existing customers must be reused safely based on `origin_lead_id` and unique identifiers (e.g., Phone).
- Duplicate creation is strictly forbidden.
- Concurrent conversions must be guarded via unique database constraints (upsert).

## 6. Operational payment architecture
- **Payment Gateway excluded.** No Stripe, Razorpay, or automated bank processing.
- The portal acts purely as an **Operational Payment & Installment Tracking Layer**.
- Authorized personnel manually record the operational collection state (Method, Amount, Ref Number, Date, Remarks).

## 7. Installment architecture
- The flat ledger assumption is **INVALIDATED**. The system **MUST** support installments.
- Tracking fields required: Installment number, Expected amount, Received amount, Due date, Received date, Status, Recorded by, Remarks.
- *Implementation Strategy:* Augment the existing `Payment` model or introduce a lightweight `Installment` table linked to `Booking`. It remains an operational tracker, not a complex ERP accounting module.

## 8. KYC boundary
- **INITIATED:** Basic customer identity only. KYC is optional.
- **CONFIRMED:** Mandatory KYC (PAN/Aadhaar details). MD cannot provide final business approval without complete KYC.

## 9. MD authority model
- The Managing Director holds **Final Business Authority**.
- Requires dedicated policy paths allowing MD to execute:
  - Final Booking Confirmation.
  - Final Cancellation Approval.
  - Exceptional Commercial Overrides.

## 10. Admin operational/emergency role
- **Admin is NOT a business approver.** 
- Admins handle site visits, coordination, and emergency technical overrides. Normal operational workflows must not depend on Admin approval to proceed.

## 11. Authorized payment updater role
- Designated employees (e.g., Finance/Operations) have authority to update "Payment Received/Collection" status.
- Their action updates the financial collection state but **DOES NOT** transition the Booking to `CONFIRMED`.

## 12. Cancellation authority
- Sales Executives may only **Request Cancellation**.
- Admins may assist operationally but do not approve normal cancellations.
- **Managing Director** holds final cancellation approval authority.

## 13. Petty cash boundary
- Explicitly separated. Petty cash operations will not interfere with, merge into, or pollute property sale transaction ledgers.

## 14. Financial-information restrictions
- No broad financial dashboards (Company revenue, profit margins, bank balances).
- Operational personnel only see the transaction data relevant to their authorized bookings. 

## 15. Concurrency requirements
- **Highest Priority Risk:** The identified double-booking race condition.
- **Fix:** Property lock and Booking creation MUST occur in a single atomic database instruction (e.g., pessimistic locking or conditional state transition on the `Property` row) to strictly prevent concurrent bookings of the same unit.

## 16. Audit requirements
- Any mutation of financial/installment data or booking status must be immutably recorded. We will leverage existing AuditLog/ChangeEvent infrastructure to track authorized roles, timestamps, old/new values, and reasons.

## 17. Backward compatibility
- Historical `Lead.WON` statuses remain intact and untouched.
- Phase 8 pipelines continue functioning.
- No destructive Prisma migrations (no dropping tables/columns).

## 18. Proposed Packet 1–7 implementation sequence
- **Packet 1:** Booking, Inventory & Installment Schema Augmentation (Atomic Lock fields, Opportunity FK, KYC fields, Installment tracking).
- **Packet 2:** Transactional Safety & Concurrency Engine (Atomic Locking, Booking Service refactor).
- **Packet 3:** Opportunity → Customer → Booking Integration Pipeline.
- **Packet 4:** Operational Installment & Collection Upgrades.
- **Packet 5:** Managing Director Approvals (Confirmation & Cancellation).
- **Packet 6:** Channel Partner Commission Integration (Operational boundaries).
- **Packet 7:** API & Security Validation Rollout.

## 19. Explicit NON-GOALS
- NO payment gateway / processor integration.
- NO automatic bank reconciliations.
- NO profit/loss or accounting ERP features.
- NO automated booking confirmation merely upon receiving payment.
- NO frontend implementation during backend architecture phase.

## 20. Risks and unresolved questions
- **Data Migration:** How to map existing Phase 5 Bookings (if any exist in prod) to the new Installment schema safely? (Mitigation: ensure schema changes are fully additive/nullable).
- **Lock Expiration:** Currently defaulting to 24 hours. Needs chron-job or lazy evaluation upon next read to unlock effectively without race conditions.

---

### Reconciliation Summary (What Changed)
- **Invalidated:** The previous recommendation for a "flat payment ledger" is overridden; Installments are strictly required.
- **Invalidated:** The assumption that Admin shares normal business approval parity with MD. MD is the sole final business authority.
- **Invalidated:** The assumption that payment fulfillment equals booking confirmation. They are explicitly decoupled.
- **Valid:** The need for atomic concurrency locking. The 1:1 Opportunity-Booking relationship.
- **Final Packet 1 Scope:** Extending the Prisma Schema (additively) to support Atomic Locks, Opportunity FK, Customer KYC, and the lightweight Installment structure, followed by Prisma Client generation.
