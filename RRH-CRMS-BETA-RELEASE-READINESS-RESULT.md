# RRH-CRMS — MASTER FORENSIC RE-AUDIT RESULT
# FINAL BETA RELEASE GATE

**Auditor:** Principal Security Engineer & Senior Backend Architect
**Date:** 2026-08-22
**Objective:** Independent verification of previous audit claims and beta release readiness.

## 1. Executive Verdict
The previous audit concluded that RRH-CRMS was "APPROVED FOR CONTROLLED BETA." **This conclusion was premature and is hereby overturned.** While the previous fixes correctly restored intended business workflows (P0), they failed to address fundamental multi-tenant architectural flaws (P1 IDOR existence leaks) and did not identify major gaps in the default authorization engine behavior.

## 2. Previous Findings Verification Table

| Previous Finding | Claimed Status | Actual Verification | Re-Audit Verdict |
|---|---|---|---|
| P0-001 (TELECALLER LEADS_CREATE) | Fixed | Confirmed fixed in `shared/src/index.ts`. TELECALLER has `LEADS_CREATE`. | ✅ Validated |
| P0-002 (SALES_MANAGER LeadPolicy) | Fixed | Confirmed fixed. `SALES_MANAGER` is in `isManagement()`. | ✅ Validated |
| P0-003 (POST /tasks requireAuthz) | Fixed | Confirmed fixed. Middleware applied in `routes/tasks.ts`. | ✅ Validated |
| P1-001 (/finance frontend guard) | Fixed | Confirmed fixed in `App.tsx`. | ✅ Validated (UX only) |
| P1-002 (analytics companyId ?? 1) | Fixed | Confirmed fixed. Fallback removed, returns 400. | ✅ Validated |
| P2-008 (lead reassignment boundary) | Fixed | Confirmed fixed in `lead.service.ts` using `findFirst` with `company_id`. | ✅ Validated |

## 3. Newly Discovered Vulnerabilities

**1. IDOR Existence Enumeration (P1)**
Nearly every service endpoint (e.g., `lead.service.ts` line 313, 359, 401; `opportunity.service.ts`, `document.service.ts`) fetches the resource blindly using `findUnique(id)` before passing it to the `can()` authorization engine. If the resource does not exist, the API returns `404 Not Found`. If it exists in *another* company, `can()` rejects it and returns `403 Forbidden`. This allows an attacker to enumerate valid resource IDs across all tenants globally.

**2. `can()` Default Fallback Exploitability (P1)**
In `authz/authorization.ts` (line 122), unmapped permissions default to `true` as long as `resource.company_id === user.companyId`. If an attacker discovers an endpoint that checks a permission not handled in the `switch` block, and the resource lacks a `company_id` field (e.g., it is named `companyId` or doesn't have one), the engine silently grants access.

## 4. RBAC Matrix Findings
- `Roles` enum mappings to permission string arrays in `shared/src/index.ts` are structurally sound.
- However, `CUSTOMERS_KYC_WRITE` and `EMPLOYEES_VIEW_SENSITIVE` rely heavily on the aforementioned default fallback logic or very minimal custom policy wrappers. 

## 5. Tenant Isolation Findings
- **CREATE operations:** `company_id` is successfully derived from the authenticated JWT (`user.companyId`) and forced into the payload (e.g., `LeadService.createLead`). This is cryptographically safe.
- **READ/UPDATE operations:** Vulnerable to cross-tenant existence enumeration as detailed above.

| Entity | Operation | Query Pattern | Tenant Enforced? | Attack Possibility | Severity |
|---|---|---|---|---|---|
| Lead | Update Status | `findUnique(id)` → `can()` | Post-fetch | Enumerate IDs | High |
| Opportunity | Fetch | `findUnique(id)` → `can()` | Post-fetch | Enumerate IDs | High |
| Document | Verify | `findUnique(id)` → `can()` | Post-fetch | Enumerate IDs | High |

## 6. IDOR Findings
- **Can attacker select arbitrary ID?** Yes.
- **Is resource fetched before authorization?** Yes, across almost all mutation services.
- **Is company boundary in the initial query?** No. `findUnique` does not allow composite filtering without a unique constraint, forcing the use of `findFirst` if scoping is desired. The current codebase heavily relies on `findUnique(id)`.
- **Can attacker infer existence?** Yes (404 vs 403 timing/response leak).

## 7. Authentication Findings
- `authenticateToken` correctly verifies the JWT signature and extracts `TokenPayload`.
- There is no observed logic for checking JWT revocation (e.g., if a user is fired, their token remains valid until expiration).

## 8. Client/Server Authorization Gaps
- The frontend hides `/finance` using `isFinance || isMD || isTechAdmin`. The backend endpoints must enforce equivalent rules, but without a dedicated `FinancePolicy` mapped in the `can()` switch statement, they rely on the default fallback.

## 9. Data Exposure Findings
- `getLeads` includes `created_by` and `assigned_to` object relations. Sensitive employee details (like `password_hash` or `pan_number`) are properly excluded via strict `select` clauses in Prisma.
- `req.user` injection prevents client-side spoofing of `company_id` and `created_by_id`.

## 10. Required Fixes Before Beta (P0/P1 Blockers)
1. **Refactor Resource Fetching (P1):** All unscoped `findUnique(id)` calls in mutative services must be replaced with `findFirst({ where: { id, company_id: user.companyId } })` to safely return `404` for cross-tenant attempts, closing the enumeration vulnerability.
2. **Explicit Authorization Fallback (P1):** The `can()` engine MUST fail closed. The `default:` case in `authorization.ts` must return `false` or throw an exception for unknown permissions.

## 11. Recommended Fixes After Beta (P2/P3)
1. **JWT Revocation/Blacklist:** Implement a mechanism to invalidate sessions immediately when an employee's `status` changes to `INACTIVE` or `SUSPENDED`.
2. **Automated Testing:** The total lack of automated testing (`jest` exists in `package.json` but no suites are written) means every deployment carries immense regression risk.

## 12. Evidence / Exact Files and Code Paths
- `apps/api/src/authz/authorization.ts:122` — Default fallback vulnerability.
- `apps/api/src/services/lead.service.ts:313, 359, 401` — `findUnique` IDOR existence leak.
- `apps/api/src/services/opportunity.service.ts:122, 186` — `findUnique` IDOR existence leak.

---
## FINAL RELEASE DECISION
🚫 **BLOCKED**

**Reasoning:** The application exhibits a systematic IDOR existence enumeration vulnerability across its core APIs. Any authenticated user can enumerate valid resource IDs belonging to other companies by probing endpoints and observing `403` vs `404` responses. Furthermore, the authorization engine defaults to granting access for unmapped permissions, failing open instead of failing closed. These are unacceptable risks for a multi-tenant SaaS application, even in a controlled beta.