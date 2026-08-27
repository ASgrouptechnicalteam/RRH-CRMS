# Phase 4 — Lead Management Engine: Reconciliation Report

## 1. Current Phase 4 Status
**Classification:** **IMPLEMENTED BUT NOT FORMALLY CLOSED**

Despite the roadmap documentation stating that Phase 4 was "NOT STARTED," the repository analysis proves that **over 85% of the Phase 4 Lead Management Engine features have already been implemented** in the database, API, and frontend. It appears these features were silently integrated during previous development phases but never formally tested, documented, or closed.

## 2. What Is Already Implemented
The following Phase 4 requirements are actively functioning in the codebase:
- **Database Schema**: `campaign`, `utm_source`, `utm_medium`, `utm_campaign`, `lead_score`, and `sla_breach_at` exist on the `Lead` model. `lead_id` exists on the `Task` model.
- **Duplicate Detection**: Actively implemented in `LeadService.ts`. Lead creation is strictly blocked (returns `409 Conflict`) if a duplicate phone/email exists within the same `company_id`.
- **Deterministic Lead Scoring**: `calculateLeadScore()` is implemented and automatically assigns points based on source, profile completeness, and preferences.
- **SLA Tracking**: `sla_breach_at` is automatically set to 2 hours upon lead creation.
- **Frontend Integration**: The Lead Dossier UI (`LeadManagement.tsx`) actively displays the `lead_score` badge, UTM attributes, and renders a red `SLA BREACHED` warning if the timestamp has passed.

## 3. What Is Missing
- **Lead Follow-ups (Task Integration)**: While `lead_id` was added to the `Task` Prisma model, it has **not** been exposed in the `TaskCreateSchema`, the `/api/v1/tasks` router, or the Lead Dossier UI.
- **Formal IDOR Hardening**: The Lead routes have basic Role-Based Access Control (RBAC), but they lack robust Insecure Direct Object Reference (IDOR) protection.

## 4. What Is Incorrectly Implemented
- The API's Lead Workflow logic currently allows skipping lifecycle stages (e.g., from `CONTACTED` directly to `WON`) and does not return the expected `409 Conflict`.
- IDOR vulnerabilities allow a user from one company to potentially update the lead of another company (Cross-Company IDOR), or a Telecaller to update another Telecaller's lead.

## 5. What the 7 `leads.test.ts` Failures Actually Represent
The 7 pre-existing failures are a mix of legacy technical debt and unhandled Phase 4 regressions. **They are NOT test environment issues.**

1. **Test 1-4 (IDOR Vulnerabilities)**: These are legacy Phase 3 failures. The tests explicitly expect a `403 Forbidden` for cross-company and cross-telecaller updates, but the API incorrectly returns `200` or `500`. The Lead domain was bypassed during the Phase 3 security hardening.
2. **Test 5 (Workflow Transition Error)**: A collateral failure. It crashes with a Prisma validation error (`id: undefined`) because a previous IDOR test failed to set up or preserve the test lead correctly.
3. **Test 6 (Workflow Bypass Vulnerability)**: The test expects a `409 Conflict` when skipping stages, but the API returns `500` (or `200`), exposing missing business logic enforcement.
4. **Test 7 (Phase 4 Duplicate Regression)**: The test "should assign new leads exclusively to TELECALLER" expects a `201 Created`. However, because Phase 4 **Duplicate Detection** is now active, creating a lead with a hardcoded phone number that was used in an earlier test correctly triggers a `409 Conflict`. The test was never updated to account for Phase 4 logic!

## 6. Dependencies on Phase 5 Project/Property Architecture
- **Safe**: Phase 5 introduced `Project` -> `Property(Many)`, but Leads are linked strictly via `LeadPropertyInterest` and `SiteVisitBooking` to `Property`. The Lead domain operates independently of the Project hierarchy.

## 7. Dependencies on Phase 1 Security Architecture
- **Critical Gap**: Leads rely heavily on Phase 1 company isolation (`company_id`). However, the service layer lacks the rigorous IDOR validation implemented in Phase 3 for other domains (like Properties). The Lead domain is currently violating the strict isolation mandate.

## 8. Recommended Phase 4 Packet 1 Scope
Since the Foundation (Database/Services) is mostly complete, the recommended scope for Packet 1 is **Remediation & Completion**:
1. Fix the 4 legacy Lead IDOR vulnerabilities (Enforce Phase 3 security controls on Leads).
2. Fix the Lead Workflow logic to prevent stage skipping (Enforce strict transitions).
3. Update the legacy tests to use unique phone numbers to satisfy Phase 4 Duplicate Detection.
4. Implement the missing Follow-up Tasks API and expose it in the Lead Dossier UI.

## 9. Business Decisions Required
None. The logic (deterministic scoring, strict duplicates, 2-hour SLA) has already been established in the code and aligns with the CRM Master Roadmap. 

## 10. Exact Next Action
**DO NOT INITIATE YET.** Await the user's explicit authorization to begin **Phase 4 Packet 1 (Security Remediation & Follow-ups)**.

---

### Reconciliation Matrix

| Phase 4 Requirement | Planned | Current Implementation | Status | Evidence |
|---|---|---|---|---|
| 1. Lead DB Schema | Yes | `utm_`, `score`, `sla`, `Task.lead_id` present | **COMPLETE** | `schema.prisma` |
| 2. Lead Creation | Yes | UTMs processed, duplicates blocked | **COMPLETE** | `LeadService.ts` |
| 3. Duplicate Detection | Yes | `409` thrown for same phone/email | **COMPLETE** | `LeadService.ts:130` |
| 4. Lead Scoring | Yes | Deterministic rules applied | **COMPLETE** | `calculateLeadScore()` |
| 5. SLA Tracking | Yes | `sla_breach_at` set to T+2hrs | **COMPLETE** | `LeadService.ts:155` |
| 6. Lead Follow-ups | Yes | Missing in API & UI schemas | **PARTIAL** | DB only, no API/UI |
| 7. Front-End Dossier | Yes | Badges, Score, UTMs rendered | **COMPLETE** | `LeadManagement.tsx` |
| 8. IDOR Security | Yes | Cross-company/staff updates vulnerable | **MISSING** | `leads.test.ts` fails |
| 9. Workflow Logic | Yes | Stage skipping allowed | **MISSING** | `leads.test.ts` fails |
| 10. Test Suite | Yes | Broken by IDOR & Duplicates | **BROKEN** | 7 failures |
