# Sonthillu CRM Integration & Platform Readiness Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Get Sonthillu fully connected to the RRH (Rs) CRM portal and production-ready as a real estate marketplace platform — properties, projects, leads, seller submissions, and auth all flowing through the CRM.

**Architecture:** The site is already architecturally wired to the CRM (single `crmFetch` client, brand-scoped endpoints, graceful degradation). The work is operational: swap dev credentials for production ones, implement the stubbed CRM auth provider, replace the seller-submission stub with a real CRM call, verify lead lifecycle, and connect the frontend activity tracker to the DB.

**Tech Stack:** Next.js App Router, Prisma + MySQL (XAMPP), CRM HTTP API (API-key auth), vitest.

**Current state:** All 10 phases complete in code. CRM connection is architecturally present but not operationally live.

---

## Phase 1: Production CRM Credentials & Connectivity

### Task 1: Obtain and configure production CRM credentials

**Objective:** Replace localhost/dev CRM env vars with confirmed production values.

**Files:**

- Modify: `.env` (production `CRM_API_BASE_URL` + valid `CRM_API_KEY`)
- Modify: `.env.example` (document the production values as placeholders)

**Step 1: Get production credentials from CRM team**

Ask the CRM/RRH team for:

- Definitive production `CRM_API_BASE_URL` (not localhost)
- A valid `CRM_API_KEY` authorized for the `sonthillu` public brand scope
- Confirmation that the key works against `/public/sonthillu/properties` and `/public/sonthillu/leads`

**Step 2: Update `.env`**

```env
CRM_API_BASE_URL=https://api.rrh-crm.com/api/v1
CRM_API_KEY=production_key_from_crm_team
```

Do NOT commit real keys. Keep `.env` gitignored.

**Step 3: Update `.env.example`**

```env
CRM_API_BASE_URL=https://api.rrh-crm.com/api/v1
CRM_API_KEY=your_production_api_key_here
```

**Step 4: Verify connectivity**

Run a quick server-side test (via a temp route or `npx tsx` script):

```ts
import { healthCheck } from './src/lib/crm';
console.log('CRM healthy:', await healthCheck());
```

Expected: `true`. If `false`, the URL or key is wrong — go back to step 1.

**Step 5: Commit**

```bash
git add .env.example
git commit -m "chore: update CRM env example with production URL"
```

(Real `.env` stays local — do not commit.)

---

### Task 2: End-to-end CRM data verification

**Objective:** Confirm the CRM actually returns real property and project data through the Sonthillu client.

**Files:**

- Read-only verification: `src/lib/crm.ts`, `src/app/sitemap.ts`
- Test script: write a temporary inline script or use `npx tsx`

**Step 1: Fetch published properties**

```ts
import { getPublishedProperties } from './src/lib/crm';
const { data, error } = await getPublishedProperties({ limit: 3 });
console.log('Properties:', data.length, 'error:', error);
```

Expected: `error: false`, `data.length >= 1` with real property objects.

**Step 2: Fetch a property by ID**

```ts
import { getPropertyById } from './src/lib/crm';
const prop = await getPropertyById(1);
console.log('Property:', prop?.code, prop?.title);
```

Expected: a real property or `null` if ID 1 doesn't exist (not an error).

**Step 3: Fetch projects**

```ts
import { getProjects } from './src/lib/crm';
const projects = await getProjects();
console.log('Projects:', projects.length);
```

Expected: `projects.length >= 0` (empty is OK if no projects exist yet).

**Step 4: Submit a test lead**

```ts
import { createLead } from './src/lib/crm';
const result = await createLead({
  customer_name: 'Test User',
  phone: '9876543210',
  email: 'test@example.com',
  enquiry_type: 'property',
  utm_source: 'smoke-test',
});
console.log('Lead ID:', result.leadId);
```

Expected: `{ leadId: <number> }`. Verify in the CRM portal that the lead appears.

**Step 5: Document results**

Update `docs/10_P10_LAUNCH/p10_crm_dependencies.md`:

- Mark credential status as ✅ RESOLVED
- Mark API URL as ✅ VERIFIED
- Mark lead lifecycle as ✅ VERIFIED (with evidence: lead ID from test)
- Mark media/CDN URLs as ✅/⚠️/❌ based on what you observe

**Step 6: Commit**

```bash
git add docs/10_P10_LAUNCH/p10_crm_dependencies.md
git commit -m "docs: update CRM dependency status after production verification"
```

---

## Phase 2: CRM Authentication

### Task 3: Decide and implement CRM auth strategy

**Objective:** Resolve the `CRM_AUTH_NOT_AVAILABLE` stub so customers can authenticate against the RRH CRM.

**Files:**

- Modify: `src/lib/auth/crm-provider.ts` (currently all methods throw)
- Modify: `src/lib/auth/session.ts` (already conditionally loads CRM provider)
- Read: `src/types/auth.ts` (the `CustomerAuthProvider` interface)
- Config: `.env` → `AUTH_PROVIDER` value

**Decision point — two valid paths:**

| Path            | What it means                                                                                            | When to choose                              |
| --------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **A: CRM auth** | `AUTH_PROVIDER=crm`, implement real CRM login/register/session endpoints in `crm-provider.ts`            | CRM team provides auth API                  |
| **B: DB auth**  | Keep `AUTH_PROVIDER=*** (default), auth lives in Sonthillu's Prisma DB, CRM is only for properties/leads | CRM auth API is not available or not wanted |

**If Path A (CRM auth):**

**Step 1: Get auth API details from CRM team**

Ask for:

- Login endpoint path + method
- Registration endpoint path + method
- Session/token format (JWT? opaque token?)
- Session validation endpoint
- Logout/revoke endpoint
- Email verification endpoint
- Password reset endpoints
- Request/response schemas for each

**Step 2: Implement `CrmCustomerAuthProvider`**

Replace the stubs in `src/lib/auth/crm-provider.ts` with real `fetch` calls to the CRM auth endpoints, following the same `x-api-key` header pattern used in `crm.ts`.

Each method should:

- Call the corresponding CRM endpoint
- Parse the response into the shapes defined in `src/types/auth.ts`
- Throw descriptive errors on failure (not the generic `CRM_AUTH_NOT_AVAILABLE`)

**Step 3: Set `AUTH_PROVIDER=crm` in `.env`**

**Step 4: Test login flow end-to-end**

- Register a test user via the CRM
- Log in via the website
- Verify session cookie is set
- Access a protected page
- Log out

**Step 5: Commit**

```bash
git add src/lib/auth/crm-provider.ts .env
git commit -m "feat: implement CRM authentication provider"
```

**If Path B (DB auth — keep current):**

**Step 1: Verify DB auth works in production**

- Confirm `DATABASE_URL` points to the production MySQL instance
- Run `npx prisma db push` or `npx prisma migrate deploy` on production
- Test register → login → session → logout flow on production

**Step 2: Document the decision**

Add to `docs/10_P10_LAUNCH/p10_crm_dependencies.md`:

```
## Authentication Strategy
- **Selected:** DB auth (AUTH_PROVIDER=db)
- **Rationale:** [reason — e.g., CRM auth API not available, DB auth sufficient for V1]
- **CRM auth provider:** Kept as stub for future use if CRM team provides auth API
```

**Step 3: Commit**

```bash
git add docs/10_P10_LAUNCH/p10_crm_dependencies.md
git commit -m "docs: document auth strategy decision"
```

---

## Phase 3: Seller Property Submission

### Task 4: Implement seller property submission to CRM

**Objective:** Replace the `CrmDependentError` stub in `submitSellerPropertyDraft` with a real CRM API call.

**Files:**

- Modify: `src/lib/seller/crm-adapter.ts` (currently throws `CrmDependentError`)
- Modify: `src/lib/seller/service.ts` (calls the adapter)
- Read: `src/lib/seller/schemas.ts` (the `PropertySubmissionInput` shape)
- Read: `docs/05_P5_SELLER/p5_crm_dependency_report.md` (the 7 open questions for CRM team)
- Test: `src/lib/seller/seller.test.ts`

**Step 1: Get seller submission endpoint details from CRM team**

Resolve the 7 open questions from `p5_crm_dependency_report.md`:

1. Endpoint path + method
2. Request JSON schema
3. Customer identity transmission (system API key vs customer JWT)
4. Media upload approach (multipart / presigned URLs / base64)
5. Idempotency contract
6. Success response schema
7. Lifecycle notification (webhook vs poll)

**Step 2: Update `crm-adapter.ts`**

Replace the stub with a real implementation. Pattern should match `crm.ts`'s `crmFetch`:

```ts
import { CRM_CONFIG } from '@/lib/constants';

export async function submitSellerPropertyDraft(
  customerId: number,
  payload: PropertySubmissionInput
): Promise<{ success: true; submissionId: string }> {
  const baseUrl = process.env.CRM_API_BASE_URL;
  const apiKey = process.env.CRM_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new CrmDependentError('CRM credentials not configured.');
  }

  const response = await fetch(`${baseUrl}/public/${CRM_CONFIG.brandParameter}/seller/intake`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      ...payload,
      idempotencyKey: payload.idempotencyKey,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown' }));
    throw new CrmDependentError(error.error || `CRM submission failed: ${response.status}`);
  }

  const data = await response.json();
  return { success: true, submissionId: data.submissionId };
}
```

Adjust the endpoint path, payload shape, and response parsing to match what the CRM team specifies.

**Step 3: Update the test**

In `src/lib/seller/seller.test.ts`, replace the mock that forces `CrmDependentError` with a mock that simulates a successful CRM response. Verify the service layer handles both success and error paths.

**Step 4: Update `CrmDependentError` usage**

If the CRM endpoint is now live, `CrmDependentError` should only be thrown when the CRM is genuinely unreachable or rejects the submission — not as a permanent gate. Rename or repurpose if needed.

**Step 5: Commit**

```bash
git add src/lib/seller/crm-adapter.ts src/lib/seller/seller.test.ts
git commit -m "feat: implement seller property submission to CRM"
```

---

## Phase 4: Customer Activity Tracking

### Task 5: Connect CustomerActivityProvider to backend DB

**Objective:** Stop storing customer activity in localStorage-only and persist it to the Prisma `ActivityEvent` table.

**Files:**

- Modify: `src/components/customer/CustomerActivityProvider.tsx` (currently localStorage-only)
- Modify: `src/lib/customer/prisma-store.ts` (already has customerId-scoped queries)
- Modify: `src/app/actions/analytics.ts` (has `trackActivityEventAction` but no client listener)
- Read: `docs/04_P4_CUSTOMER/p4_customer_audit.md` (audit findings)

**Step 1: Create a server action to record activity**

In `src/app/actions/analytics.ts`, ensure `trackActivityEventAction` is callable from client components. It should:

```ts
'use server';

import { requireCustomer } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function trackActivityEventAction(event: {
  type: string;
  properties?: Record<string, unknown>;
}) {
  const customer = await requireCustomer();
  await prisma.activityEvent.create({
    data: {
      customerId: customer.id,
      type: event.type,
      properties: event.properties ? JSON.stringify(event.properties) : null,
    },
  });
}
```

**Step 2: Wire the client provider to call the server action**

In `CustomerActivityProvider.tsx`, replace the `localStorage`-only path with a call to `trackActivityEventAction` when a customer is logged in. Keep localStorage as a client-side cache/buffer, but flush to the server.

```tsx
const track = useCallback(
  (event: { type: string; properties?: Record<string, unknown> }) => {
    // Always update local cache
    recordLocally(event);

    // Flush to server if logged in
    if (customer) {
      trackActivityEventAction(event).catch(() => {
        // Silently fail — activity tracking is best-effort
        console.warn('Failed to track activity event:', event.type);
      });
    }
  },
  [customer]
);
```

**Step 3: Implement guest→logged-in merge**

In `src/app/actions/analytics.ts`, add `mergeGuestActivityAction`:

```ts
export async function mergeGuestActivityAction(guestStorageKey: string, customerId: number) {
  // Read guest activity from localStorage (passed from client)
  // Insert into ActivityEvent with customerId
  // Clear guest localStorage entry
}
```

Wire this into the login flow so that when a guest logs in, their shortlist/compare/activity from localStorage migrates to their account.

**Step 4: Verify isolation**

Confirm that `prisma-store.ts` correctly scopes queries by `customerId` — a customer should never see another customer's shortlist, compare list, or activity.

**Step 5: Commit**

```bash
git add src/components/customer/CustomerActivityProvider.tsx src/app/actions/analytics.ts src/lib/customer/prisma-store.ts
git commit -m "feat: connect customer activity tracking to backend DB"
```

---

## Phase 5: Lead Lifecycle Verification

### Task 6: Confirm leads land correctly in CRM funnel

**Objective:** Verify that leads submitted from the website appear in the RRH CRM with correct source tagging, property associations, and funnel placement.

**Files:**

- Read: `src/lib/leads/crm-client.ts` (the submission client)
- Read: `src/lib/leads/types.ts` (the `CrmLeadPayload` shape)
- Verify: CRM portal (manual check)

**Step 1: Submit leads through each channel**

Submit test leads via:

- Property enquiry form (single property)
- Multi-property enquiry (shortlist)
- Project enquiry
- Callback request
- General enquiry
- Seller enquiry

**Step 2: Check CRM portal for each lead**

For each submitted lead, verify in the CRM:

- Lead appears in the correct funnel stage
- `source = WEBSITE` (or equivalent CRM tag)
- `utm_source`, `utm_medium`, `utm_campaign` are captured if provided
- Property IDs / project ID are associated correctly
- Contact details are accurate

**Step 3: Document the mapping**

Update `docs/10_P10_LAUNCH/p10_crm_dependencies.md` with a lead mapping table:

| Website enquiry type | CRM lead type | CRM funnel stage | Notes |
| -------------------- | ------------- | ---------------- | ----- |
| Property enquiry     | `property`    | [stage]          |       |
| Project enquiry      | `project`     | [stage]          |       |
| Callback request     | `call`        | [stage]          |       |
| General enquiry      | `other`       | [stage]          |       |
| Seller enquiry       | `appraisal`   | [stage]          |       |

**Step 4: Commit**

```bash
git add docs/10_P10_LAUNCH/p10_crm_dependencies.md
git commit -m "docs: document lead lifecycle mapping to CRM funnel"
```

---

## Phase 6: Media & Storage Verification

### Task 7: Verify CRM media/CDN URLs

**Objective:** Ensure property images served from the CRM are accessible and performant on the public site.

**Files:**

- Read: `src/lib/dto.ts` (how property images are mapped to public view)
- Verify: browser dev tools (network tab)

**Step 1: Load a property page**

Open a property detail page in the browser. Check the network tab for image requests.

**Step 2: Verify image URLs**

For each image URL returned by the CRM:

- Is it publicly accessible (no auth required)?
- Does it load without CORS errors?
- What is the image format and size?
- Are there `srcset` / responsive variants?

**Step 3: If URLs are broken or gated**

Options:

- Ask CRM team to make CDN URLs public
- Proxy images through Sonthillu's own backend (adds load but hides CRM dependency)
- Use `next/image` with a custom loader pointing at the CRM CDN

**Step 4: Document**

Update `p10_crm_dependencies.md` media section with findings.

**Step 5: Commit**

```bash
git add docs/10_P10_LAUNCH/p10_crm_dependencies.md
git commit -m "docs: document media URL verification results"
```

---

## Phase 7: Launch Preflight & Sign-off

### Task 8: Production preflight audit

**Objective:** Run the existing preflight checklist and resolve any remaining items.

**Files:**

- Read: `docs/10_P10_LAUNCH/p10_preflight_audit.md`
- Read: `docs/10_P10_LAUNCH/p10_production_checklist.md`
- Read: `docs/10_P10_LAUNCH/p10_acceptance_matrix.md`

**Step 1: Run the full checklist**

Go through `p10_production_checklist.md` item by item. Mark each as ✅/⚠️/❌.

**Step 2: Resolve blockers**

Any item marked ❌ or ⚠️ that blocks launch — fix it or get a written exception from the stakeholder.

**Step 3: Run the acceptance matrix**

Go through `p10_acceptance_matrix.md`. Every criterion should pass.

**Step 4: Run build + tests**

```bash
npm run build
npm run test
npm run lint
npm run typecheck
```

All four must pass clean.

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: resolve preflight findings before launch"
```

---

### Task 9: Final status document

**Objective:** Produce a single source of truth for the launch-readiness state.

**Files:**

- Modify: `docs/00_MASTER/CURRENT_STATUS.md`
- Modify: `docs/10_P10_LAUNCH/p10_crm_dependencies.md`

**Step 1: Update `CURRENT_STATUS.md`**

Mark P10 Launch as ✅ COMPLETE (or 🚧 with specific remaining items).

**Step 2: Update `p10_crm_dependencies.md`**

All items should be ✅ RESOLVED or have a documented exception.

**Step 3: Commit**

```bash
git add docs/00_MASTER/CURRENT_STATUS.md docs/10_P10_LAUNCH/p10_crm_dependencies.md
git commit -m "docs: finalize launch status and CRM dependency sign-off"
```

---

## Files Likely to Change (Summary)

| File                                                   | Change                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| `.env`                                                 | Production CRM URL + key (local only, not committed)        |
| `.env.example`                                         | Document production placeholder values                      |
| `src/lib/auth/crm-provider.ts`                         | Implement real CRM auth OR document DB-auth decision        |
| `src/lib/seller/crm-adapter.ts`                        | Replace `CrmDependentError` stub with real CRM call         |
| `src/lib/seller/seller.test.ts`                        | Update mocks for real CRM response                          |
| `src/components/customer/CustomerActivityProvider.tsx` | Wire to server action instead of localStorage-only          |
| `src/app/actions/analytics.ts`                         | Add `trackActivityEventAction` + `mergeGuestActivityAction` |
| `docs/10_P10_LAUNCH/p10_crm_dependencies.md`           | Update all statuses after verification                      |
| `docs/00_MASTER/CURRENT_STATUS.md`                     | Mark P10 complete                                           |

## Tests / Validation

| Check             | Command                                    | Expected                                  |
| ----------------- | ------------------------------------------ | ----------------------------------------- |
| Build             | `npm run build`                            | Exit 0, no errors                         |
| Type check        | `npm run typecheck`                        | Exit 0, no TypeScript errors              |
| Tests             | `npm run test`                             | All tests pass                            |
| Lint              | `npm run lint`                             | No errors                                 |
| CRM health        | `healthCheck()` from `crm.ts`              | `true`                                    |
| Property fetch    | `getPublishedProperties({ limit: 1 })`     | Returns real data                         |
| Lead submit       | `createLead(...)`                          | Returns `{ leadId }`                      |
| Auth flow         | Register → login → protected page → logout | Works end-to-end                          |
| Seller submission | `submitSellerPropertyDraft(...)`           | Returns `{ success: true, submissionId }` |

## Risks & Open Questions

1. **CRM auth API may not exist.** If the RRH CRM has no auth endpoints, Path B (DB auth) is the fallback. Document the decision.

2. **Seller submission endpoint may not be ready.** If the CRM team cannot provide it before launch, the seller flow must remain gracefully blocked (current behavior) with a clear "coming soon" message. This is acceptable for V1.

3. **Lead lifecycle mapping is unverified.** Until someone checks the CRM portal after submitting a test lead, we don't know if leads land correctly. This is a manual verification step — not automatable without CRM API access.

4. **Media URLs may be gated.** If the CRM returns non-public image URLs, property pages will show broken images in production. Needs CRM team cooperation or a proxy solution.

5. **Production database.** The `.env` points to a local XAMPP MySQL (`mysql://root:@localhost:3306/sonthillu_web`). For production, this needs to point to a live database. This is separate from CRM but required for auth + activity tracking.

6. **Branding context:** The platform's business model is real estate mediation (connecting sellers and buyers) rather than construction/development. The visible branding ("Sonthillu Constructions", "Building Your Dream Home") stays as-is per stakeholder direction — no code-level text changes needed for this.
