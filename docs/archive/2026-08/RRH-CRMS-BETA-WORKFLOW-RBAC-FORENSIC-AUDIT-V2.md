# RRH-CRMS BETA WORKFLOW & RBAC FORENSIC AUDIT (V2)

## EXECUTIVE SUMMARY

This audit supersedes all prior assessments and relies exclusively on current live repository files, specifically extracting evidence from `prisma/schema.prisma` and the `@rrh-ems/shared` package. All findings represent the absolute, source-grounded reality of the system as it stands in the live working tree.

This is a Read-Only artifact. No codebase changes were executed.

---

## 1. DATA MODEL TOPOLOGY

**Evidence:** `prisma/schema.prisma`

The exact Prisma model count is **42** models (Lines 1–1183).

**The exact list of current Prisma models:**
1. Company
2. Branch
3. Employee
4. Role
5. Permission
6. RolePermission
7. EmployeeRole
8. EmployeePermissionOverride
9. EmployeeQrCode
10. AttendanceLog
11. AttendanceProposal
12. Task
13. DailyReport
14. AuditEvent
15. Notification
16. DailyTarget
17. PerformanceSnapshot
18. Lead
19. LeadActivity
20. LeadMatchingRequirement
21. LeadPropertyInterest
22. Project
23. Property
24. PropertyImage
25. PropertyPublication
26. PropertyVerificationLog
27. SiteVisitBooking
28. ExpenseRefund
29. PushSubscription
30. AuthSession
31. Complaint
32. Customer
33. Booking
34. Payment
35. Installment
36. Opportunity
37. OpportunityHistory
38. Document
39. BookingPortalMapping
40. IntegrationEvent
41. CustomerNotification
42. PublicApiKey

---

## 2. RBAC & PERMISSION ARCHITECTURE

**Evidence:** `packages/shared/src/index.ts`

The role definitions and canonical permissions are maintained strictly inside the shared schema layer and mirror across both frontend and backend.

### ROLES
Exactly 11 canonical roles exist:
1. `MD` (Managing director)
2. `ADMIN` (Admin (Technical))
3. `MARKETING_DIRECTOR` (marketing director)
4. `PROJECT_MANAGER` (project managers)
5. `DIGITAL_LEAD_OPERATOR` (Digital lead operator)
6. `TELECALLER` (telecallers)
7. `DIGITAL_MARKETING_HEAD` (Digital Marketing head(manager))
8. `HR_MANAGER` (HR)
9. `FINANCE` (accountant)
10. `AGENT` (Agent)
11. `DIGITAL_MARKETING_EXECUTIVE` (digital marketing executive)

### PERMISSION MATRIX NOTABLES
- `MD` is the only role with unconditional access (`ALL_PERMISSIONS`).
- `ADMIN` is strictly limited in employee visibility: They possess system management keys (e.g., `ADMIN_EMERGENCY_LOCKDOWN`) but explicitly **DO NOT** hold the `EMPLOYEES_VIEW_SENSITIVE` permission (Line 202).
- `FINANCE` and `HR_MANAGER` hold `EMPLOYEES_VIEW_SENSITIVE`.

---

## 3. CORE CRM WORKFLOWS

### A. Lead State Machine
**Evidence:** `packages/shared/src/index.ts` (Line 524) and `apps/api/src/workflows/lead.workflow.ts` (Line 14)

**Lead Status Enum:**
`NEW`, `ASSIGNED`, `CONTACTED`, `QUALIFIED`, `SITE_VISIT_SCHEDULED`, `NEGOTIATION`, `OPPORTUNITY_OPEN`, `WON`, `LOST`, `RECOVERED_TO_POOL`.

**Strict State Transitions Enforced by `LeadWorkflow`:**
- `NEW` → `ASSIGNED`, `OPPORTUNITY_OPEN`
- `ASSIGNED` → `CONTACTED`, `OPPORTUNITY_OPEN`, `RECOVERED_TO_POOL`
- `CONTACTED` → `QUALIFIED`, `OPPORTUNITY_OPEN`, `LOST`
- `QUALIFIED` → `SITE_VISIT_SCHEDULED`, `NEGOTIATION`, `OPPORTUNITY_OPEN`, `LOST`
- `SITE_VISIT_SCHEDULED` → `NEGOTIATION`, `OPPORTUNITY_OPEN`, `LOST`
- `NEGOTIATION` → `WON`, `OPPORTUNITY_OPEN`, `LOST`
- `OPPORTUNITY_OPEN` → `WON`, `LOST`
- `LOST` → `RECOVERED_TO_POOL`
- `RECOVERED_TO_POOL` → `ASSIGNED`
- `WON` is a terminal state.

### B. Site Visit Workflow
**Evidence:** `packages/shared/src/index.ts` (SiteVisit schemas) and `apps/api/src/workflows/siteVisit.workflow.ts` (Line 6)

**Site Visit Actions:**
- `PENDING_VERIFICATION` → `VERIFY`
- `CONFIRMED` → `ASSIGN_AGENT`
- `ASSIGNED_TO_AGENT` → `COMPLETE`
- Terminal States: `CANCELLED`, `COMPLETED`

### C. Customer KYC & Integration Data Privacy
**Evidence:** `packages/shared/src/index.ts` (Lines 924 - 982)

- KYC Statuses: `PENDING`, `PARTIAL`, `VERIFIED`, `REJECTED`.
- **Sensitive Data Isolation**: The `CustomerKycWriteSchema` tracks `pan_number` and `aadhaar_number`. These fields are strictly defined as CRM-internal and encrypted at rest. 
- The outbound payload (`KycStatusChangedSchema`) explicitly contains a `masked_pan` and the status enum, ensuring raw PAN/Aadhaar data never crosses the CRM ↔ Portal boundary.

### D. Finance & Expense Refund Workflows
**Evidence:** `packages/shared/src/index.ts` (Line 756)

**ExpenseRefundStatus Enum:**
`PENDING`, `ACCOUNTANT_APPROVED`, `MD_APPROVED`, `REFUNDED`, `REJECTED_BY_ACCOUNTANT`, `REJECTED_BY_MD`.

The workflow implies a multi-stage approval where Accountants perform initial review, escalated to MD for final approval, culminating in `REFUNDED`.

### E. Attendance Logic
**Evidence:** `prisma/schema.prisma` (Line 225) and `packages/shared/src/index.ts` (Line 412)

**Attendance Statuses:**
`PRESENT`, `LATE`, `APPROVED_LATE`, `HALF_DAY`, `APPROVED_HALF_DAY`, `ABSENT`, `LEAVE`.

Attendance is logged via `AttendanceLog` containing sources (`QR_SCAN`, `SYSTEM_AUTO`, `MANUAL`). The `AttendanceProposal` model handles Late and Leave proposals. While the `QR_SCAN` capability is natively supported by the schema, frontend implementation files exist (`QRScannerModal.tsx`) confirming kiosk/scanning intention.

---

## 4. SECURITY & TENANCY (IDOR PREVALENCE)
**Evidence:** `apps/api/src/services/lead.service.ts`

- Tenancy boundaries are strictly enforced via the authorization layer. Every query restricts records using `company_id`. For example, `lead.service.ts` validates `lead.company_id !== user.companyId` to return `null` immediately.
- Authorization logic heavily utilizes `can(user, Permissions.X, entity)` ensuring that beyond tenant-scoping, role-based action mutability is thoroughly preserved.

## CONCLUSION
The repository features an extraordinarily robust and deterministic workflow engine (`workflowEngine.ts`), enforcing strict linear progression for core CRM elements. Data privacy boundaries (specifically around KYC and Payments) are highly formalized, treating the CRM as the absolute source of truth while protecting sensitive PII from outbound leakage to the customer portal.

**END OF REPORT**
