# Master Phase 4 — Lead Management Engine
## Implementation Plan

### A. Current-State Findings
The current `Lead` model is solid but acts as a basic CRM record rather than a full "Engine". It lacks marketing attribution (UTM, Campaigns), duplicate detection, automated SLA tracking, and scheduled follow-ups. The existing architecture (Role-based access, data scoping by `company_id`, `LeadActivity` history, `Customer` conversion, and `SiteVisit` linkage) is fully functional and must be preserved.

### B. Exact Schema Changes (`prisma/schema.prisma`)
1. **Lead Model Enhancements**:
   - `campaign`: `String?`
   - `utm_source`: `String?`
   - `utm_medium`: `String?`
   - `utm_campaign`: `String?`
   - `lead_score`: `Int @default(0)`
   - `sla_breach_at`: `DateTime?`
2. **Task Model Enhancement (Follow-ups)**:
   - `lead_id`: `Int?` (Link follow-up tasks directly to Leads)
   - Add relation: `lead Lead? @relation(fields: [lead_id], references: [id], onDelete: Cascade)`

### C. API Changes
1. **POST `/api/v1/leads`**:
   - Add `campaign`, `utm_source`, `utm_medium`, `utm_campaign` to DTO.
   - Enforce duplicate detection logic before creation.
2. **GET `/api/v1/leads`**:
   - Include `lead_score`, `sla_breach_at`, `campaign`, and UTM fields in responses.
3. **POST `/api/v1/tasks`** (or Follow-ups):
   - Allow passing `lead_id` when creating a follow-up task.

### D. Authorization Changes
- No new roles required. Existing `LeadPolicy` and `TaskPolicy` already scope by `company_id` and assigned resources. Duplicate detection will strictly run within the context of the user's `company_id` to prevent cross-company data leakage.

### E. Service/Policy Changes
1. **Duplicate Detection (`LeadService.createLead`)**:
   - Query existing leads in the same `company_id` by `phone` (or `email` if provided).
   - If found, throw a `409 Conflict` (AppError) with the duplicate `lead_code`.
2. **Lead Scoring (`LeadService`)**:
   - Implement deterministic scoring. E.g., Profile completeness (+10 for email, +10 for budget), Engagement (+5 per call logged, +20 for site visit booked).
   - Recalculate score during creation and when relevant activities are added.
3. **SLA (`LeadService` or new `SlaService`)**:
   - On lead creation, set `sla_breach_at` (e.g., 2 hours from creation if unassigned, or 24 hours from assignment to contact).
   - Implement a simple evaluation function to check for breaches.

### F. Workflow Changes
- No changes to `LeadWorkflow` transition matrix. 

### G. Frontend Changes
- **LeadList/LeadManagement**: Display `lead_score` as a visual indicator. Display SLA breach warnings (e.g., a red tag).
- **AddLeadWizard**: Add fields for `campaign`. Add robust error handling for `409 Conflict` to show duplicate warnings.
- **Lead Dossier**: Add a "Next Follow-up" section pulling from the `Task` model. Display UTM attribution data.

### H. Test Strategy
Update and create targeted tests in `tests/api/phase4-lead-engine.test.ts`:
1. **Duplicates**: Assert `409 Conflict` on matching phone in same company.
2. **Attribution**: Assert campaign/UTM saves correctly.
3. **Scoring**: Assert score calculates accurately upon creation/activity.
4. **Follow-ups**: Assert Task creation linked to a Lead works and is scoped.
5. **Regression**: Run existing tests (`siteVisits`, `customer`, `rbac`, etc).

### I. Migration Strategy
Safe additive migration (`npx prisma migrate dev --name phase4_lead_engine`). No data deletion. Existing leads get `null` for campaigns and `0` for scores.

### J. Backward Compatibility Strategy
Existing Lead creation APIs will gracefully accept payloads without UTM/Campaign fields.

### K. Risks
- **Duplicates**: Overly aggressive phone normalization might block valid distinct leads if not careful. We will strictly match the raw (or stripped) phone number within the same company only.

### L. Acceptance Criteria
- [ ] Duplicate leads within a company are blocked.
- [ ] Marketing attribution fields are saved and retrieved.
- [ ] Deterministic lead score is calculated.
- [ ] SLA breach timestamp is set.
- [ ] Follow-ups can be scheduled using the Task system.
- [ ] All previous regression tests pass.

---

## 🔒 PLAN LOCK QUESTIONNAIRE ANSWERS

1. **How will campaigns be represented?** String fields directly on `Lead`.
2. **Which UTM fields are required?** `utm_source`, `utm_medium`, `utm_campaign`.
3. **Is campaign a string, relation, or another structure?** String.
4. **Where will lead_score live?** `Lead` model field (`lead_score`).
5. **How will score be calculated?** Deterministically via `LeadService` rules (e.g., presence of email, budget, source).
6. **Can score be manually overridden?** No, it is deterministic.
7. **How are duplicates detected?** Exact match on `phone` or `email` within the same `company_id`.
8. **Which fields identify a probable duplicate?** `phone`, `email`.
9. **What happens when a duplicate is found?** Reject with `409 Conflict` specifying the existing lead code.
10. **Should duplicate creation be blocked, merged, linked, or flagged?** Blocked.
11. **How will next follow-up be represented?** Using the existing `Task` model linked via `lead_id`.
12. **Should follow-up use Lead fields or the existing Task system?** Existing Task system.
13. **How will SLA work?** Timestamp field `sla_breach_at` set upon creation/assignment.
14. **Where will SLA rules be configured?** Code constants until a business settings UI exists.
15. **How will escalation work?** For now, flagged visually in the frontend when `now() > sla_breach_at`.
16. **How will all of this remain tenant-isolated?** Strict `company_id` enforcement on all queries.
17. **How will existing Lead → Customer conversion remain intact?** Untouched.
18. **How will existing Site Visit and Booking flows remain intact?** Untouched.

PHASE 4 PLAN EXECUTED
IMPLEMENTATION: COMPLETE
PHASE 4 FORMALLY CLOSED

---

## 🚀 PACKET CLOSURE RECORD

**Packet 1: Security Remediation & Completion**
- **Status**: COMPLETE
- **Summary**: Legacy Lead IDOR vulnerabilities resolved. Lead workflow strictly enforced preventing state-skipping. Lead follow-up Task integration (API & UI) implemented successfully.

**Packet 2: Validation & Formal Closure**
- **Status**: COMPLETE
- **Summary**: Validation confirmed 100% test pass rate (147/147 tests) across the API suite, including duplicate detection constraints and Phase 1 security bindings.

**Manual QA**: DEFERRED to the consolidated final QA stage after all roadmap phases.
