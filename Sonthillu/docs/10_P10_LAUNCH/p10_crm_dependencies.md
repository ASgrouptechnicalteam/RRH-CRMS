# CRM Dependencies for Production Launch

The Sonthillu Web application heavily depends on the backend CRM for property and project data, as well as lead submissions. The following items must be resolved with the CRM team before a production go-live is possible.

## 1. Production API Credentials

- **Status:** ✅ **RESOLVED**
- **Action Completed:** Production `CRM_API_KEY` created and authorized for the Sonthillu public brand endpoint.
- **Key details:**
  - CRM Base URL: `https://rs-crms.onrender.com/api/v1`
  - API Key: `sk_pro_llu_0d78fcb987f772be80338ddc0649b69e` (Sonthillu company, ID: 17)
  - Brand scope: `sonthillu`
- **Verification:** Key tested successfully against all public endpoints:
  - Health: `200 OK`
  - Property list: `200` (empty — no published properties yet)
  - Property detail: `404` for non-existent ID (correct behavior)
  - Projects list: `200` (empty — no projects yet)
  - Lead submission: `201` — 13 leads created (IDs 15-28) with `source: WEBSITE`, `status: NEW`

## 2. Production API URL

- **Status:** ✅ **VERIFIED**
- **Value:** `https://rs-crms.onrender.com/api/v1`
- **Hosting:** Render.com (RRH-CRMS public API)
- **Verification:** All public endpoints reachable and responding correctly.

## 3. Sonthillu Company Setup

- **Status:** ✅ **COMPLETED**
- **Details:**
  - Company record created: `code='SONTHILLU'`, `property_type_group='SONTHILLU'`, `id=17`
  - Active `PublicApiKey` created and linked to Sonthillu company
  - Brand mapping confirmed: `sonthillu` → `SONTHILLU` in CRM `BRAND_TYPE_MAP`
- **Note:** Sonthillu company was NOT auto-seeded (by design). Manual creation was required per CRM deployment documentation.

## 4. Seller Submission Endpoint

- **Status:** `CRM-DEPENDENT`
- **Action Required:** Verify if the endpoint for property submission from verified sellers is available. If not, the application is designed to gracefully block this feature, but the CRM team must provide a timeline or contract.

## 5. Lead Lifecycle Contract

- **Status:** ✅ **VERIFIED**
- **Verification:** Test lead submitted successfully:
  - Endpoint: `POST /api/v1/public/sonthillu/leads`
  - Response: `{ "message": "Lead captured successfully", "leadId": 9 }`
  - Lead source auto-set to `WEBSITE` by CRM
  - Lead status: `NEW`
- **Lead ID:** 9 (test lead — can be deleted after verification)

## 6. Media & Storage Contract

- **Status:** ✅ **RESOLVED** (code config fixed, data still pending)
- **What's fixed:**
  - **next.config.ts remotePatterns:** Added `{ protocol: 'https', hostname: '**.onrender.com' }` to allowlist. CRM image URLs from `rs-crms.onrender.com` will now pass `next/image` validation.
  - **Existing allowlist:** `unsplash.com` and `cloudinary.com` remain configured.
- **What's still blocked:**
  - **No published Sonthillu properties with images in CRM** — 0 properties returned from `GET /public/sonthillu/properties`. Cannot verify actual image URL format, domain, or public accessibility until CRM team publishes at least one property with images.
- **Risk if deployed now:** Property pages show placeholder images (no broken links). Acceptable for V1.
- **Action required:** CRM team publishes at least one Sonthillu property with images → verify image URLs are public (no auth) → verify images render on property detail page.

## 7. Authentication Strategy

- **Status:** ✅ **DECIDED — DB Auth (V1)**
- **Selected:** `AUTH_PROVIDER=db` (default — no env var change needed)
- **Rationale:**
  - **CRM has no customer auth endpoints.** The RRH-CRMS `auth.ts` routes are for internal employee login only (`employee_code` + password for staff roles: MD, PM, Telecaller, etc.). There is no `register`, `/me`, `/sessions`, `/email-verifications`, or `/password-resets` endpoint for customers.
  - **Customer portal is a separate app in development.** `customerPortal.service.ts` explicitly notes: "The customer portal is a SEPARATE application currently in development."
  - **Sonthillu DB auth is production-ready.** `DbCustomerAuthProvider` (`src/lib/auth/db-provider.ts`) implements: registration with email verification, login with bcrypt, session management (create/validate/revoke), email verification, password reset with secure tokens.
  - **CRM auth provider kept as stub.** `crm-provider.ts` all methods throw `CRM_AUTH_NOT_AVAILABLE` — ready for future use if CRM team ever provides customer auth endpoints.
- **Customer identity linkage:** CRM leads (`POST /public/sonthillu/leads`) and Sonthillu DB customers are separate. CRM leads get `source: WEBSITE` but are not linked to Sonthillu customer accounts — by design.

## 8. CRM Auth Endpoint Audit (Phase 3)

- **Status:** ✅ **COMPLETED — No customer auth endpoints exist (N/A)**
- **CRM auth routes audited:** `apps/api/src/routes/auth.ts` (employee login/logout/refresh/change-password/me), `apps/api/src/routes/customers.ts` (employee-only CRUD for customer records), `apps/api/src/routes/integration.routes.ts` (portal callback endpoints only).
- **Finding:** Zero customer-facing authentication endpoints in the CRM. All auth routes are for internal employee use (`employee_code` + password) or portal-to-CRM callbacks (service token auth). Customer portal auth is a separate application still in development.
- **Implication:** Path A (CRM auth for Sonthillu customers) is not viable. Path B (DB auth) is correct.
- **Sonthillu test verification:** `src/lib/auth/crm-provider.test.ts` — 13 tests pass (10 verifying all stub methods throw `CRM_AUTH_NOT_AVAILABLE`, 3 documenting mock fetch contract). `src/lib/auth/auth.test.ts` — 23 tests pass. `src/lib/auth/mock-provider.test.ts` — 10 tests pass.

## 9. Customer Activity Tracking (Phase 4)

- **Status:** ✅ **COMPLETE — Wired to backend DB**
- **CustomerActivityProvider:** Now detects auth state via `getAuthStateAction()` on init. Switches from `'guest'` to `'customer'` mode when a session cookie is present. Previously `mode` was hardcoded to `'guest'` — the `'customer'` branches were dead code.
- **Guest→customer merge:** When mode switches to `'customer'`, the provider calls `mergeGuestActivityAction(guestShortlist, guestCompare)` — a server action in `src/app/actions/customer.ts` that merges guest localStorage shortlist/compare IDs into the authenticated customer's DB records, then clears the guest localStorage.
- **Activity events:** `trackCustomerActivityEvent()` already called `trackActivityEventAction` (server action in `analytics.ts`) via dynamic import. This persists events to the Prisma `activityEvent` table with `customerId` (auth) or `anonymousId` (guest).
- **Login flow:** `loginAction` already merged `activityEvent.anonymousId → customerId` on successful login. Now returns `customerId` so the client can trigger the shortlist/compare merge.
- **CRM activity endpoints:** None exist — confirmed in CRM auth audit (Section 8). CRM has no customer-facing auth, so no CRM-side activity tracking endpoints either. All activity data stays in Sonthillu's Prisma DB.

## 10. Lead Lifecycle Verification (Phase 5)

- **Status:** ✅ **VERIFIED — All 6 enquiry types confirmed**
- **Verification:** Submitted test leads for all 6 enquiry types via `POST /api/v1/public/sonthillu/leads`:
  - `property` (PROPERTY_ENQUIRY) → CRM `enquiry_type: property` ✅
  - `call` (CALLBACK_REQUEST) → CRM `enquiry_type: call` ✅
  - `other` (GENERAL_ENQUIRY) → CRM `enquiry_type: other` ✅
  - `appraisal` (SELLER_ENQUIRY) → CRM `enquiry_type: appraisal` ✅
  - `project` (PROJECT_ENQUIRY) → CRM `enquiry_type: project` ✅
  - `consultation` → CRM `enquiry_type: consultation` ✅
- **Funnel placement:** All leads land in `status: NEW` with `source: WEBSITE` and auto-generated lead codes (`RRH-LD-YYYY-NNNN`). ✅
- **CRM lead schema fields accepted:** `customer_name`, `phone`, `email`, `property_type_preference`, `preferred_location`, `budget_max`, `enquiry_type`, `preferred_contact_time`, `property_ids`, `project_id`, `notes`. ✅
- **CRM lead schema fields NOT accepted via public API:** `utm_source`, `utm_medium`, `utm_campaign` — these fields exist on the `Lead` model (Phase 4 additions) but are NOT in `PublicLeadCreateSchema`. The public API only accepts the fields listed above. UTM attribution is not available through the public lead intake endpoint.
- **CRM route handler stores:** `source: 'WEBSITE'` (forced server-side), `status: 'NEW'` (forced server-side), `lead_code` (auto-generated `RRH-LD-YYYY-NNNN`). All other fields pass through from request body.
- **Lead code format:** `RRH-LD-{year}-{sequential 4-digit number}` — auto-generated by CRM, returned in response as `leadId` (DB ID). Lead code not returned in response body but visible in CRM DB.
- **Test leads created:** 6 leads (IDs 16-21, codes RRH-LD-2026-0003 through RRH-LD-2026-0008). Can be deleted by CRM team after verification.

## 11. Build Readiness

- **Status:** ✅ **RESOLVED — Build passes**
- **Verification:** `npm run build` exits 0. `npm run test:run` passes 245/245 tests. `npx tsc --noEmit` exits 0.
- **Code status:** All code changes for Phases 1-6 are correct. No build-blocking code changes remain.
- **Note:** Docs previously noted MySQL not running — MySQL is running locally (XAMPP) and the build succeeds.

---

**Warning:** Do not deploy to production with an expired, inactive, or development-only CRM API key.

**Current production credentials (for reference):**

```
CRM_API_BASE_URL=https://rs-crms.onrender.com/api/v1
CRM_API_KEY=sk_pro_llu_0d78fcb987f772be80338ddc0649b69e
```

## 12. Lead Lifecycle Verification (Phase 5)

- **Status:** ✅ **COMPLETE**
- **Verification date:** 2026-02
- **Leads verified:** 13 leads in CRM (IDs 15-28), all Sonthillu (company ID 17)
- **Enquiry type mapping:**
  - Website `PROPERTY_ENQUIRY` → CRM `property` → funnel `NEW`
  - Website `PROJECT_ENQUIRY` → CRM `project` → funnel `NEW`
  - Website `CALLBACK_REQUEST` → CRM `call` → funnel `NEW`
  - Website `GENERAL_ENQUIRY` → CRM `other` → funnel `NEW`
  - Website `SELLER_ENQUIRY` → CRM `appraisal` → funnel `NEW`
  - Website `CONSULTATION_REQUEST` → CRM `consultation` → funnel `NEW`
- **Source:** All website leads get `source: WEBSITE` (forced server-side by CRM public endpoint)
- **Status:** All leads land in `status: NEW` (default)
- **Lead codes:** Auto-generated `RRH-LD-YYYY-NNNN` format, globally sequential
- **UTM fields:** NOT captured — CRM public `LeadCreateSchema` excludes `utm_source/medium/campaign`. Sonthillu sends them but CRM stores null. Known limitation — belongs to CRM public API design, not a Sonthillu bug.
- **Scripts used:** `scripts/crm-verify-leads.ts` (6-enquiry-type submission), `scripts/check-leads.js` (CRM-side verification)
