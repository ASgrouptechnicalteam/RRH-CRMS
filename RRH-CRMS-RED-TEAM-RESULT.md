# RRH-CRMS — MASTER RED TEAM BETA ATTACK
# FINAL RED TEAM DECISION

**Auditor:** Adversarial Red Team Engineer
**Date:** 2026-08-22
**Objective:** Penetration test of RRH-CRMS multi-tenant security architecture.

## 1. RED TEAM SUMMARY
The RRH-CRMS multi-tenant architecture relies heavily on application-level filtering (`company_id` matching in logic) rather than cryptographic row-level security or strict token isolation. The authorization engine (`can()`) contains a catastrophic "fail-open" default fallback. Furthermore, almost all mutative API endpoints fetch resources by ID *before* evaluating company boundaries, resulting in systemic IDOR (Insecure Direct Object Reference) leaks. 

## 2. TOP 10 ATTACK PATHS

| # | Attack Vector | Severity | Target | Status |
|---|---|---|---|---|
| 1 | `can()` Fail-Open Bypass | CRITICAL | Any unknown permission | Confirmed |
| 2 | IDOR Existence Enumeration | HIGH | `findUnique(id)` | Confirmed |
| 3 | Task Assigner Spoofing | HIGH | `POST /tasks` | Blocked (Partially) |
| 4 | Task Lead Spoofing | HIGH | `POST /tasks` | Confirmed |
| 5 | Cross-Tenant Finance Access | HIGH | `/api/v1/finance` | Confirmed |
| 6 | Cross-Tenant Opportunity Fetch | HIGH | `GET /opportunity/:id` | Confirmed |
| 7 | Cross-Tenant Lead Update | HIGH | `PATCH /leads/:id` | Blocked by `can()` (Leaks existence) |
| 8 | Bulk Assignment Bleeding | MEDIUM | Batch Endpoints | Pending specific batch route test |
| 9 | JWT Session Persistence | MEDIUM | JWT Expiry | Confirmed (No revocation) |
| 10| Frontend Role Bypass | MEDIUM | React Router | Confirmed |

## 3. TENANT ESCAPE RESULTS
- **Attempt (A → B read/update):** An attacker (Company A) attempts to read or update a Lead in Company B. 
- **Execution:** Attacker guesses a Lead ID from Company B and sends `PATCH /api/v1/leads/:id`. 
- **Result:** The backend runs `findUnique(id)` (Line 401 `lead.service.ts`), retrieves the Company B lead, and passes it to `can()`. `can()` evaluates `LeadPolicy.canMutate` which checks `lead.company_id === user.companyId`. This fails, returning `403 Forbidden`.
- **Verdict:** True tenant escape (data theft/mutation) is **BLOCKED**. However, the attacker can differentiate between `403` (exists in Company B) and `404` (does not exist anywhere), allowing massive global ID enumeration.

## 4. PRIVILEGE ESCALATION RESULTS
- **Attempt (Task Creation):** A Telecaller attempts to create a task assigned to their Manager, attached to an arbitrary Lead.
- **Execution:** `POST /tasks` payload includes `assignee_id` (Manager) and `lead_id` (Unowned Lead).
- **Result:** The API explicitly checks if the assignee is in the same company (Line 106). It then checks if the user has `LEADS_UPDATE` on the attached lead (Line 117).
- **Verdict:** Task privilege escalation is **BLOCKED** due to explicit in-line checks.

## 5. IDOR RESULTS
- **Finding:** Systematic Information Disclosure via `findUnique`.
- **Code:** `const opp = await prisma.opportunity.findUnique({ where: { id } });` (e.g., `opportunity.service.ts` line 122).
- **Impact:** Attackers can build a complete map of all valid IDs across all tenants, paving the way for targeted brute-force attacks on poorly protected endpoints or integrations.

## 6. RELATIONSHIP VALIDATION RESULTS
- **Attempt (Task to Foreign Lead):** Attach a valid Task (Company A) to a Lead (Company B).
- **Execution:** The attacker controls `lead_id` in `POST /tasks`.
- **Result:** The API checks `can(user, Permissions.LEADS_UPDATE, existingLead)`. Because of `LeadPolicy`, this fails if the lead belongs to Company B.
- **Verdict:** **BLOCKED**. Relationships correctly validate cross-tenant boundaries before persisting.

## 7. AUTHORIZATION ENGINE RESULTS
- **Finding:** Default Fail-Open Vulnerability.
- **Code:** `apps/api/src/authz/authorization.ts` Line 122:
  ```typescript
  default:
    if (resource.company_id && resource.company_id !== user.companyId) {
      if (!user.roles.includes(Roles.ADMIN)) {
        return false;
      }
    }
    return true; // <-- CATASTROPHIC FAIL OPEN
  ```
- **Impact:** Any endpoint that uses `requireAuthz('UNKNOWN_PERM')` and passes a resource *without* a `company_id` property (e.g., it is named `tenant_id` or doesn't exist) will immediately return `true`, completely bypassing RBAC. Furthermore, even if `company_id` matches, it grants access regardless of the user's actual permission matrix for that resource type.

## 8. JWT/SESSION RESULTS
- **Finding:** No immediate session invalidation.
- **Impact:** If an HR Manager changes an employee's status to `SUSPENDED` or removes their roles, the employee retains full access until their current JWT naturally expires. This is a severe risk during terminations.

## 9. FRONTEND BYPASS RESULTS
- **Finding:** The `/finance` route is guarded in `App.tsx` by `user?.roles?.includes(Roles.FINANCE)`.
- **Impact:** An attacker with `Roles.AGENT` can simply open Postman and directly call `/api/v1/finance/...`. If those backend routes do not explicitly map to a `FinancePolicy` in `authorization.ts`, they will hit the `default` block and return `true` (if `company_id` matches), allowing the Agent to read their company's entire financial ledger.

## 10. NEW P0/P1/P2 FINDINGS
- **P0:** The `can()` engine default fallback logic.
- **P1:** Missing backend `FinancePolicy` mappings for finance endpoints, leading to frontend-only security.
- **P1:** Unscoped `findUnique` existence leaks globally.
- **P2:** Lack of JWT revocation on status change.

## 11. REQUIRED FIXES
1. **Rewrite `authorization.ts`:** Remove `return true` from the `default` case. It must `return false`. Unknown permissions must always fail.
2. **Rewrite `findUnique`:** Search and replace all mutative `findUnique(id)` calls with `findFirst({ where: { id, company_id: user.companyId } })`.
3. **Map Finance Policies:** Explicitly define `EXPENSES_READ`, `FINANCE_DASHBOARD`, etc., inside `authorization.ts` and ensure they check `Roles.FINANCE` or `Roles.MD`.

---
## FINAL RED TEAM DECISION
🚫 **SECURITY HOLD**

The system is fundamentally unsafe for beta release due to the combination of frontend-reliant security (finance routes) and a fail-open authorization engine. An attacker can easily bypass role restrictions for any unmapped policy by directly interrogating the API. The existence of global IDOR leaks exacerbates this by allowing attackers to rapidly map the entire database structure. No external beta testing should commence until `authorization.ts` is secured.