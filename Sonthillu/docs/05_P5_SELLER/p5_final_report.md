# P5 SELLER / SELL PROPERTY FINAL REPORT

## Overview

Phase P5 establishes the official Sonthillu Seller pipeline, enabling customers to express intent to sell properties, complete an onboarding agreement, and safely submit property drafts up to the CRM boundary.

## Completed Work

1. **Access Control**: Enforced server-side checks via `requireSeller()` for states `NONE`, `PENDING_VERIFICATION`, `VERIFIED`, and `SUSPENDED`.
2. **Seller Onboarding**: Built the onboarding process connecting `NONE` to `PENDING_VERIFICATION` through a server action, preserving the Sonthillu DB's authority over the intermediate status.
3. **Seller Landing & Status Pages**: Implemented rich informative pages, explaining to sellers that verification and CRM review are required and no property is auto-published.
4. **Form & Validation**: Created `<PropertySubmissionForm>` with client-side HTML validations and server-side strict Zod schema validation ensuring fields accurately represent missing/N/A values. Added robust, leak-free image preview (`URL.createObjectURL()`) isolated from upload.
5. **Idempotency & Isolation**: Used the existing Idempotency logic to prevent double submissions. Keys are namespaced by Customer ID to prevent spoofing.
6. **CRM Adapter & Boundary**: Created `src/lib/seller/crm-adapter.ts` which safely throws a `CrmDependentError`. The application explicitly intercepts this, logs it, and returns a controlled `crm_dependent` status to the frontend. Form data is preserved securely on the client.
7. **Testing**: Achieved comprehensive test coverage for seller rules via `seller.test.ts`.

## Open Blockers

- **CRM Intake Endpoint**: Awaiting response to `p5_crm_dependency_report.md` for the official property submission endpoint, authentication rules, and image handling contracts.
