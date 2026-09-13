# P5 Seller / Sell Property Audit

**Date:** 2026-08-21
**Phase:** P5

## Scope of Audit

1. Evaluate the existing schema for seller integration capability.
2. Review the session architecture (`src/lib/auth/session.ts`) for enforcing P5 seller status rules.
3. Review `src/lib/crm.ts` for any existing, false "success" property submission workflows.

## Findings

1. **Schema Check:** `prisma/schema.prisma` already includes `sellerStatus` enum (`NONE`, `PENDING_VERIFICATION`, `VERIFIED`, `SUSPENDED`) as added during P4.
2. **Access Control:** The P4 implementation had a rudimentary `requireSeller()` check but it did not properly distinguish between `PENDING_VERIFICATION` and `VERIFIED`, nor did it enforce redirection to a proper status page.
3. **UI Infrastructure:** The `/seller/onboard` page had only mocked interactions without persistence. `/sell-property/submission` existed but needed connection to a genuine service layer and client-side validation logic for images/types.
4. **CRM Boundary:** There is no existing CRM API for Seller Intake. We must explicitly halt property submission at the Sonthillu boundary, returning a `CRM_DEPENDENT` error until the CRM contract is known.

## Resolution

- P5 execution will replace the mocked UI with genuine server actions and enforce strict Customer DB isolation.
- Idempotency will be adopted from the `leads` module.
