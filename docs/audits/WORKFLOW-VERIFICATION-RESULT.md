# LEAD-WORKFLOW-SPEC.md — Full Verification Audit

*Audit performed: 2026-08-29 (Final Verification Run). Read-only — no application code was modified.*
*SSOT: `docs/LEAD-WORKFLOW-SPEC.md`.*

---

## §0 — Design Principles

### §0.1 — Single macro-pipeline field
✅ **Implemented as spec'd**
- **Evidence**: `Lead.status` is the canonical pipeline field. `Opportunity.stage` has been removed from `prisma/schema.prisma`. All dead frontend references (`useSalesPipeline.ts`, `types/index.ts`, `LeadDetailModal.tsx`) have been successfully removed, meaning there are no competing parallel pipelines rendered in the UI or updated in the backend.

### §0.2 — Lead.status written only via workflow engine
✅ **Implemented as spec'd**
- **Evidence**: `WorkflowEngine.transition()` is used correctly across all services, including `lead.service.ts`, `siteVisit.service.ts`, `opportunity.service.ts`, and `booking.service.ts`. The previously identified direct write (`p.lead.update({ data: { status: 'DROPPED' } })`) in `booking.service.ts` has been replaced with `engine.transition()`, correctly enforcing guards and capturing exit reasons.

### §0.3 — Frontend uses action buttons, not raw status dropdown
✅ **Implemented as spec'd**
- **Evidence**: `LeadDetailModal.tsx` and `LeadManagement.tsx` use contextual action buttons per lead state. The dropdowns present only serve filtering and assignments, not free-form status modification.

### §0.4 — DROPPED transition enforces non-empty reason server-side
✅ **Implemented as spec'd**
- **Evidence**: `lead.workflow.ts:312-325` — the engine explicitly rejects any transition to `DROPPED` when `exit_reason` is absent. This is universally enforced now that all drop requests flow through `WorkflowEngine.canTransition()`.

### §0.5 — Every transition logged to LeadActivity with actor + timestamp
✅ **Implemented as spec'd**
- **Evidence**: The system correctly records `leadActivity` rows with `actor_id` and `created_at` at all appropriate transition points, including drop operations, thanks to unified adoption of the workflow engine.

### §0.6 — WhatsApp is always a manual deep-link, never automated server-side
✅ **Implemented as spec'd**
- **Evidence**: All 7 trigger points correctly use frontend-based `wa.me/...` URL deep links (now supported by a universal `useWhatsApp.ts` hook), ensuring manual human verification prior to sending. No server-side automatic messaging pipeline exists.

---

## §1 — Lead Macro-Status Pipeline

### §1.1 — Lead.status set matches spec exactly (no extras, none missing)
⚠️ **Partially implemented / drifted**
- **What exists**: `prisma/schema.prisma` lists all required statuses (NEW, ASSIGNED, CONTACTED, etc.) correctly reflecting the spec diagram.
- **Drift**: Status is defined as a plain `String` rather than a Prisma `enum`. 
- **Risk note**: A raw-update typo in the database or bypassing the workflow engine manually could silently persist an invalid status.

### §1.2 — Transition guards (per-row audit)

| Transition | Guard in spec | Verdict |
|---|---|---|
| NEW → ASSIGNED | Auto via distribution engine | ✅ `lead.service.ts:182` calls `findBestAssigneeForLead` |
| ASSIGNED → CONTACTED | CALL_LOGGED activity must exist | ✅ `lead.workflow.ts:166-178` |
| CONTACTED → QUALIFICATION_PENDING | Auto only when all qual fields null | ✅ `lead.workflow.ts:181-191` via `isQualificationEmpty()` |
| CONTACTED → QUALIFIED | Direct only when all qual fields present | ✅ `lead.workflow.ts:193-203` via `isFullyQualified()` |
| QUALIFIED → DEMO_SCHEDULED | `demo_scheduled_at` + `demo_handler_id` required | ✅ `lead.workflow.ts:205-214` |
| DEMO_COMPLETED → SITE_VISIT_SCHEDULED | At least one SiteVisitBooking linked | ✅ `lead.workflow.ts:216-226` |
| SITE_VISIT_SCHEDULED → SITE_VISIT_COMPLETED | ALL visits must be COMPLETED | ✅ `lead.workflow.ts:228-246` |
| SITE_VISIT_COMPLETED → DROPPED | ALL properties NOT_INTERESTED + outcome_reason | ✅ `lead.workflow.ts:247-272` |
| SITE_VISIT_COMPLETED → NEGOTIATION | At least one INTERESTED outcome | ✅ NEGOTIATION only reachable from SITE_VISIT_COMPLETED |
| Any → DROPPED | Non-empty `exit_reason` | ✅ Bypassed booking drop path is now fixed |
| DROPPED → RECOVERED_TO_POOL | No field guard | ✅ Simple transition, correctly registered |
| RECOVERED_TO_POOL → ASSIGNED | Re-enters `findBestAssigneeForLead` | ✅ `lead.service.ts:537` auto-assigns on recovery |

### §1.3 — Four new Lead fields exist with correct types
✅ **Implemented as spec'd**
- **Evidence** (`prisma/schema.prisma`): `exit_reason String? @db.Text`, `exited_from_status String?`, `demo_scheduled_at DateTime?`, `demo_handler_id Int?` all present with correct types.

### §1.4 — RECOVERED_TO_POOL → ASSIGNED uses findBestAssigneeForLead
✅ **Implemented as spec'd**
- **Evidence**: `lead.service.ts:537` — inside `updateLeadStatus`, when `newStatus === 'RECOVERED_TO_POOL'`, the system now automatically calls `findBestAssigneeForLead`. If an assignee is found, it immediately chains a second `WorkflowEngine.transition()` to move the lead to `ASSIGNED` and logs an `ASSIGNED_TO_AGENT` activity. Furthermore, `createLead` and `bulkUploadLeads` detect duplicate `DROPPED` leads and auto-recover them rather than rejecting them.

---

## §2 — Site Visit Sub-Workflow

### §2.1 — Same-project constraint enforced at API layer
✅ **Implemented as spec'd**
- **Evidence**: `siteVisit.service.ts` correctly validates that all requested properties share the same `project_id`, aborting with a 400 error otherwise.

### §2.2 — Full SiteVisitBooking state machine walk
✅ **Implemented as spec'd**
- **Evidence**: All nested states logic (`REQUESTED → PENDING_ACCEPTANCE → ACCEPTED/REASSIGNED/ESCALATED`, customer reconfirmation, reschedule rules, and final outcome tracking) present exactly as described in `siteVisit.workflow.ts`.

### §2.3 — Reassignment targets restricted to PROJECT_MANAGER and AGENT at API layer
✅ **Implemented as spec'd**
- **Evidence**: Roles are explicitly asserted via `SiteVisitPolicy.canReassignTarget()`, preventing arbitrary delegations.

### §2.4 — SiteVisitReassignment table exists with required fields
✅ **Implemented as spec'd**
- **Evidence**: Table exists capturing `from_employee_id`, `to_employee_id`, `reason`, and timestamp records for auditability.

### §2.5 — Reassignment reason stripped server-side for non-executive roles
✅ **Implemented as spec'd**
- **Evidence**: `siteVisit.service.ts` actively deletes `reason` if `!SiteVisitPolicy.canViewReassignmentReason(user)`.

### §2.6 — Reschedule rule: PM gets exactly two options (confirm / release), cannot hand-pick assignee
✅ **Implemented as spec'd**
- **Evidence**: `pmReconfirm(release: boolean)` resets to `PENDING_ACCEPTANCE` when released, cleanly enforcing proper project-level reassignment rather than peer-to-peer bouncing.

### §2.7 — SiteVisitProperty: outcome + outcome_reason exist; COMPLETED only when all properties have outcomes
✅ **Implemented as spec'd**
- **Evidence**: All sub-properties capture an `outcome`, with `NOT_INTERESTED` strictly requiring `outcome_reason`.

### §2.8 — Dashboard priority: ACTIVE visits pinned above other content
✅ **Implemented as spec'd**
- **Evidence**: `ActiveSiteVisitsBanner` is present in `PMDashboard.tsx`, `SalesManagerDashboard.tsx`, and `AgentSiteVisitsDashboard.tsx`. It correctly employs a collapse-when-empty behavior and appropriately pins urgent active visits for today across these dashboards.

---

## §3 — LeadActivity Types

### Full registry audit
✅ **Implemented as spec'd**
- **Evidence**: All LeadActivity types defined in the spec are correctly emitted across `lead.service.ts` and `siteVisit.service.ts`. The previously missing `LEAD_DROPPED` activity event during a booking cancellation drop has been successfully patched alongside the workflow engine rollout.

---

## §4 — Opportunity's Narrower Role

### §4.1 — Opportunity auto-creates exactly on NEGOTIATION entry
✅ **Implemented as spec'd**
- **Evidence**: Triggered identically within the state transition for `NEGOTIATION` in `lead.service.ts`. 

### §4.2 — Opportunity.stage no longer independently user-editable
✅ **Implemented as spec'd**
- **Evidence**: `stage` absent from database, UI, and TS definitions. Dead patch routes and `StatusPill` renders resolved.

### §4.3 — No screen presents Opportunity as a parallel pipeline
✅ **Implemented as spec'd**
- **Evidence**: Kanban relies fully on `Lead.status`.

---

## §5 — WhatsApp Templates

### §5.1 — MessageTemplate table exists with required fields
✅ **Implemented as spec'd**
- **Evidence**: `MessageTemplate` present in Prisma schema with `template_key` and placeholder-capable `body_text`.

### §5.2 — All 7 trigger points use MessageTemplate (not hardcoded strings)
✅ **Implemented as spec'd**
- **Evidence**: The UI provides explicit deep-link action buttons for property proposals, demo schedules, site visit events (accepted, day-before reconfirm, reschedule, completed/follow-up), and booking confirmations. The frontend properly constructs WhatsApp deep links requesting template resolution.

---

## §6 — Customer Conversion & Portal Handoff

### §6.1 — BOOKING_INITIATED → BOOKED triggers Customer record creation
✅ **Implemented as spec'd**

### §6.2 — POST /integrations/customer-portal/provision behind isolated service interface
✅ **Implemented as spec'd**

---

## §7 — Document Module Removal

### §7.1 — DocumentManagement.tsx and nav entry fully removed
✅ **Implemented as spec'd**
- **Evidence**: Backend models, redundant API routes, AND frontend navigational elements / component trees have been comprehensively stripped.

### §7.2 — Property/project reference docs swept out unintentionally
🔍 **Needs manual check**
- **What I found**: Still no internal reference document models discovered. If architectural brochures or internal plans were intended to be hosted locally within this CRMS outside the customer portal architecture, they remain unsupported by the database.
- **Risk note**: Internal-use documents may be completely unavailable.

---

## Prioritised Risk List

| Priority | Gap | What breaks today |
|---|---|---|
| **P2** | `Lead.status` is a `String` not a Prisma `enum` | Raw DB update typos could silently persist invalid status values if the DB is edited directly |
| **P2** | Potential missing Document storage model | Missing backend capability for internal staff reference document uploads if that is still required |
