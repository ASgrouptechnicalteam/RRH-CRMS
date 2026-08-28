# LEAD-WORKFLOW-SPEC.md Verification Audit

*Audit performed against `docs/LEAD-WORKFLOW-SPEC.md`.*

## 1. Core Principles

### "One macro status, always"
✅ **Implemented as spec'd**
- **Evidence**: `WorkflowEngine` implements the strict state matrix and field-level guards (`apps/api/src/workflows/lead.workflow.ts`). The `WorkflowEngine.transition()` method now serves as the only authority for mutating `Lead.status` and all direct `tx.lead.update({ status: ... })` calls have been refactored in the service layer (`lead.service.ts`, `opportunity.service.ts`, `customer.service.ts`) to use this engine.

### "Every exit demands a reason"
✅ **Implemented as spec'd**
- **Evidence**: `exit_reason` and `exited_from_status` exist on the `Lead` model (`prisma/schema.prisma:420-421`). The workflow engine explicitly enforces this for `DROPPED` transitions (`apps/api/src/workflows/lead.workflow.ts:316-324`).

### "Every action is logged with actor + timestamp"
✅ **Implemented as spec'd**
- **Evidence**: `LeadActivity` model exists (`prisma/schema.prisma:443`) and captures `activity_type`, `created_by_id`, and `created_at` accurately.

### "WhatsApp is always a manual deep-link, never automatic"
✅ **Implemented as spec'd**
- **Evidence**: The DB holds `MessageTemplate` for templating, but no background cron queues exist in the codebase for automated WhatsApp delivery. 

## 2. Lead Macro-Status Pipeline

### Guard: ASSIGNED → CONTACTED requires CALL_LOGGED
✅ **Implemented as spec'd**
- **Evidence**: `LeadWorkflow.canTransition` enforces that a `CALL_LOGGED` activity exists before allowing the transition (`apps/api/src/workflows/lead.workflow.ts:164-177`).

### Guard: CONTACTED → QUALIFICATION_PENDING (Auto vs Direct)
✅ **Implemented as spec'd**
- **Evidence**: `LeadWorkflow.canTransition` checks if qualification fields are empty for auto-routing (`apps/api/src/workflows/lead.workflow.ts:179-189`) or if they are populated to skip straight to `QUALIFIED` (`apps/api/src/workflows/lead.workflow.ts:191-201`).

### Opportunity's Subordinate Role
⚠️ **Partially implemented / drifted**
- **Evidence**: `Opportunity` is created automatically at `NEGOTIATION` (`opportunity.service.ts:134`).
- **Drift**: The `Opportunity` model still retains its own `stage` field (`prisma/schema.prisma:1048`) and a separate `OpportunityWorkflow`, despite the spec explicitly stating that the Lead is the *only* pipeline and Opportunity is purely a commercial envelope.
- **Risk note**: Having two state machines (Lead macro-status and Opportunity stage) will lead to split-brain reporting where a Lead is in one phase but its Opportunity is in another.

## 3. Site Visit Sub-Workflow

### Reschedule Rule (PENDING_PM_RECONFIRMATION -> PENDING_ACCEPTANCE)
✅ **Implemented as spec'd**
- **Evidence**: `siteVisit.service.ts:464-479` properly handles PM release by resetting the status to `PENDING_ACCEPTANCE` and auto-assigning it to the authoritative Project PM.

### Multi-Property Outcomes
✅ **Implemented as spec'd**
- **Evidence**: `SiteVisitProperty` model exists (`prisma/schema.prisma:695`) to capture property-level outcomes per visit.

### UI Dashboard Prioritization
✅ **Implemented as spec'd**
- **Evidence**: Created `ActiveSiteVisitsBanner.tsx` and injected it at the top of both `PMDashboard.tsx` and `SalesManagerDashboard.tsx`. It actively fetches and highlights today's `ACTIVE` site visits, ensuring agents see them above all other content.

## 4. Un-Spec'd Remnants

### Document Module
✅ **Implemented as spec'd (Removed)**
- **Evidence**: The `Document` model has been completely scrubbed from `prisma/schema.prisma`.
