# RRH-CRMS FINAL SECURITY RE-AUDIT 

## 🛡️ Objective
Perform an adversarial, un-trusted forensic re-audit of the live `RRH-CRMS` codebase to determine whether the system is truly ready for a controlled BETA release.

**Constraint:** Do not modify code during this audit. Simply report.

---

## 🔍 Audit Execution & Findings

### 1. Authorization Fails Closed
✅ **VERIFIED SECURE**: The central authorization engine (`apps/api/src/authz/authorization.ts`) correctly fails closed. The `default:` case explicitly checks if a resource was provided. If an unmapped permission is checked against a resource, it actively returns `false`. 

### 2. Unknown Permissions
✅ **VERIFIED SECURE**: `authorization.ts` uses `hasBasePermission` checking against the user's JWT payload first. An attacker cannot forge an unknown permission to bypass the engine.

### 3. Frontend-Only Authorization & Sensitive Endpoints
✅ **VERIFIED SECURE**: All Finance, HR, and KYC endpoints are correctly bound to backend server-side validations (`requireRole` or `requireAuthz`), enforcing strict boundaries independently of frontend route guards.

### 4. Client-Controlled Tenant Spoofing (`company_id`, `created_by_id`, `owner`)
✅ **VERIFIED SECURE**: Across `POST` operations (e.g. `lead.service.ts`), `company_id` and `created_by_id` are strictly forced using `req.user!.companyId` and `req.user!.employeeId`. A malicious client payload cannot spoof attribution.

### 5. Foreign Relationship IDs (Cross-Tenant Association)
✅ **VERIFIED SECURE (Functionally)**: A tenant cannot attach a foreign relationship. Operations like `assignAgent`, `bookVisit`, and `tasks.ts` actively lookup relationship IDs and verify `company_id === user.companyId` before establishing the relationship.

---

## 🚨 VULNERABILITY FINDINGS (Cross-Tenant IDOR Leakage)

While the system successfully *prevents* cross-tenant data modification and association, it **actively leaks the existence of foreign tenant data** via differential HTTP responses (403 vs 404).

When an attacker attempts to fetch or mutate a specific resource ID:
- If the ID does NOT exist, the system returns `404 Not Found`.
- If the ID DOES exist but belongs to another company, the system returns `403 Forbidden`.

This allows an attacker to script an enumeration attack and map out the exact primary keys (`lead_id`, `property_id`, `visit_id`, etc.) of competitor tenants, violating strict multi-tenant isolation.

### Finding 1: Site Visit Cross-Tenant Existence Leak
- **ID:** SEC-IDOR-001
- **Severity:** P1 (Medium/High)
- **File:** `apps/api/src/services/siteVisit.service.ts`
- **Function:** `verifyVisit`, `assignAgent`, `completeVisit`, `bookVisit`
- **Attack Scenario:** Attacker calls `PATCH /api/v1/site-visits/9999/verify`. 
- **Current Behavior:** Service executes `findUnique`. If it exists but is cross-tenant, `SiteVisitPolicy.canVerify` fails and throws `403 Forbidden`. If it doesn't exist, it throws `404 Not Found`.
- **Expected Behavior:** If the `company_id` does not match, the system must throw `404 Not Found`.
- **Exploitability:** High. Simple iteration over integers.
- **Fix Recommendation:** Pre-filter `company_id` in the `where` clause of `findUnique`, or explicitly throw a generic 404 if `visit.lead.company_id !== user.companyId`.

### Finding 2: Property Operations Cross-Tenant Existence Leak
- **ID:** SEC-IDOR-002
- **Severity:** P1 (Medium/High)
- **File:** `apps/api/src/services/property.service.ts`
- **Function:** `verifyProperty`, `dmPolishProperty`, `mdApproveProperty`
- **Attack Scenario:** Attacker attempts to approve property ID `50`.
- **Current Behavior:** Returns 404 if property doesn't exist, but 403 if the property belongs to another company.
- **Expected Behavior:** Return 404 for any cross-tenant lookup.

### Finding 3: Expense Refund Cross-Tenant Existence Leak
- **ID:** SEC-IDOR-003
- **Severity:** P1 (Medium/High)
- **File:** `apps/api/src/services/expenseRefund.service.ts`
- **Function:** `accountantReview`, `mdReview`, `markRefunded`, `getProof`
- **Attack Scenario:** Attacker attempts to review a foreign refund ID.
- **Current Behavior:** Returns 404 if refund doesn't exist, but 403 if it belongs to another company.
- **Expected Behavior:** Return 404 for any cross-tenant lookup.

### Finding 4: Lead Service Cross-Tenant Existence Leak
- **ID:** SEC-IDOR-004
- **Severity:** P1 (Medium/High)
- **File:** `apps/api/src/services/lead.service.ts`
- **Function:** `updateLeadStatus`, `reassignLead`, `getMatches`, `proposeProperty`, `logCommunication`
- **Attack Scenario:** Attacker attempts to mutate a foreign lead ID.
- **Current Behavior:** `LeadService` methods perform `findUnique` and then rely on `can(user, Permissions.LEADS_UPDATE, lead)` which fails closed and throws a 403. 
- **Expected Behavior:** Return 404 for any cross-tenant lookup.

### Finding 5: Task Relationships Cross-Tenant Existence Leak
- **ID:** SEC-IDOR-005
- **Severity:** P1 (Medium/High)
- **File:** `apps/api/src/routes/tasks.ts`
- **Function:** `POST /api/v1/tasks` (Opportunity & Lead validation block)
- **Attack Scenario:** Attacker attempts to create a task and attaches a foreign `opportunity_id` or `lead_id`.
- **Current Behavior:** Route manually returns `404` if not found, but explicitly returns `403 Forbidden: Opportunity belongs to another company.` if cross-tenant.
- **Expected Behavior:** Return a generic error that obscures existence (e.g., `400 Bad Request: Invalid opportunity_id or you do not have access`).

---

## 🏁 FINAL DECISION

**Decision: CONDITIONAL GO**

**Reasoning:**
The platform is functionally secure against data tampering, privilege escalation, and direct foreign data access. No tenant can view or mutate another tenant's data. 

However, the widespread **Differential Response IDOR (404 vs 403)** technically breaks strict multi-tenant obscurity. 

**Condition for BETA Release:**
Since this is a closed, controlled BETA (meaning we control the users testing it), the system is safe enough for non-malicious user validation. However, before a public GA (General Availability) release, all identified `findUnique` resource lookups MUST be refactored to throw `404 Not Found` upon detecting a cross-tenant boundary, completely obscuring the existence of foreign IDs.
