# P5 Acceptance Matrix

| Requirement        | Status  | Evidence                                            | CRM Dependency   | Remaining |
| ------------------ | ------- | --------------------------------------------------- | ---------------- | --------- |
| Seller navigation  | DONE    | `sell-property/page.tsx` routes                     | None             | None      |
| Seller onboarding  | DONE    | `onboardSellerAction()` transitions NONE -> PENDING | None             | None      |
| Seller status      | DONE    | `seller/status/page.tsx` renders states             | None             | None      |
| Authorization      | DONE    | `requireSeller()` explicitly routes sellerStatus    | None             | None      |
| Submission UI      | DONE    | `PropertySubmissionForm.tsx` rendered               | None             | None      |
| Validation         | DONE    | HTML5 forms + Zod `PropertySubmissionSchema`        | None             | None      |
| Media UX           | DONE    | Local object URLs + strict type/size checking       | None             | None      |
| Idempotency        | DONE    | `seller_sub_{id}_{key}` stored locally              | Yes (End-to-End) | None      |
| Customer isolation | DONE    | Prefixing ID on keys + backend extraction           | None             | None      |
| CRM adapter        | DONE    | `submitSellerPropertyDraft` created                 | Yes              | Implement |
| CRM endpoint       | PENDING | Returns `CrmDependentError` safely                  | Yes              | Implement |
| No auto-publish    | DONE    | No active publication routes available              | None             | None      |
| Error handling     | DONE    | Graceful UI recovery on CRM dependency              | None             | None      |
