# LEAD-WORKFLOW-SPEC.md — Full Verification Audit

*Audit performed: 2026-08-29. Read-only — no application code was modified.*
*SSOT: `docs/LEAD-WORKFLOW-SPEC.md`.*

---

## §0 — Design Principles

### §0.1 — Single macro-pipeline field
⚠️ **Partially implemented / drifted**
- **What exists**: `Lead.status` is the canonical pipeline field. `Opportunity.stage` has been removed from `prisma/schema.prisma` (Opportunity model lines 1036–1083 has no `stage` field). `apps/api/src/workflows/opportunity.workflow.ts` has been deleted.
- **Drift**: `apps/web/src/hooks/useSalesPipeline.ts:69-80` still calls `PATCH /opportunities/:id/stage`. `apps/web/src/types/index.ts:325` still declares `stage: string` on the Opportunity TS interface. `LeadDetailModal.tsx:770` still renders `<StatusPill status={opp.stage} />` — `opp.stage` is `undefined` at runtime, causing a silent empty pill.
- **Risk note**: Frontend silently renders broken stage pills and fires a PATCH to a removed field, masking errors from the sales team.

### §0.2 — Lead.status written only via workflow engine
⚠️ **Partially implemented / drifted**
- **What exists**: `WorkflowEngine.transition()` is used correctly in `lead.service.ts:496`, all of `siteVisit.service.ts`, and `opportunity.service.ts`.
- **Drift**: `booking.service.ts:301` contains a raw `p.lead.update({ data: { status: 'DROPPED' } })` — a direct status write outside the engine, bypassing all field-level guards (exit_reason enforcement, exited_from_status snapshot, LEAD_DROPPED activity logging).
- **Risk note**: A booking cancellation silently drops a lead without recording `exit_reason`, `exited_from_status`, or a `LEAD_DROPPED` LeadActivity — corrupting drop-reason analytics and violating §1 row 10.

### §0.3 — Frontend uses action buttons, not raw status dropdown
✅ **Implemented as spec'd**
- **Evidence**: `LeadDetailModal.tsx` and `LeadManagement.tsx` use contextual action buttons per lead state. The two `<select>` elements at `LeadManagement.tsx:326` and `:463` are an assignment dropdown and a filter dropdown — neither allows free-form `Lead.status` writes. No raw status `<select>` found in the leads UI.

### §0.4 — DROPPED transition enforces non-empty reason server-side
✅ **Implemented as spec'd**
- **Evidence**: `lead.workflow.ts:312-325` — the engine explicitly rejects any transition to `DROPPED` when `exit_reason` is absent. Enforced inside `WorkflowEngine.canTransition()` before any DB write.
- **Caveat**: `booking.service.ts:301` raw update bypasses this guard entirely (see §0.2).

### §0.5 — Every transition logged to LeadActivity with actor + timestamp
⚠️ **Partially implemented / drifted**
- **What exists**: `lead.service.ts:504-514` and multiple points in `siteVisit.service.ts` create `leadActivity` rows with `actor_id` and `created_at`.
- **Drift**: `booking.service.ts:301` raw drop write creates no `LeadActivity` row, leaving the audit trail silent for booking-cancellation drops.
- **Risk note**: The lead timeline shows no record of why the lead was dropped after a booking cancellation — a support and compliance gap.

### §0.6 — WhatsApp is always a manual deep-link, never automated server-side
✅ **Implemented as spec'd**
- **Evidence**: `lead.service.ts:604` — the server constructs a `wa.me/...` URL and returns it. `LeadDetailModal.tsx:252` calls `window.open(targetUrl, '_blank')`, opening the user's native WhatsApp. No server-side message dispatch queue exists anywhere in the codebase.

---

## §1 — Lead Macro-Status Pipeline

### §1.1 — Lead.status set matches spec exactly (no extras, none missing)
✅ **Implemented as spec'd**
- **Evidence**: `prisma/schema.prisma:385` comment lists: `NEW, ASSIGNED, CONTACTED, QUALIFICATION_PENDING, QUALIFIED, DEMO_SCHEDULED, DEMO_COMPLETED, SITE_VISIT_SCHEDULED, SITE_VISIT_COMPLETED, NEGOTIATION, BOOKING_INITIATED, BOOKED, DROPPED, RECOVERED_TO_POOL` — matches the spec pipeline diagram exactly.
- **Robustness note**: Status is a plain `String`, not a Prisma `enum`, so a raw-update typo would silently persist. The workflow engine is the sole guard.

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
| SITE_VISIT_COMPLETED → NEGOTIATION | At least one INTERESTED outcome | ✅ NEGOTIATION only reachable from SITE_VISIT_COMPLETED in transition matrix |
| Any → DROPPED | Non-empty `exit_reason` | ✅ `lead.workflow.ts:312-325` — **bypassed by `booking.service.ts:301`** |
| DROPPED → RECOVERED_TO_POOL | No field guard | ✅ Simple transition, correctly registered |
| RECOVERED_TO_POOL → ASSIGNED | Re-enters `findBestAssigneeForLead` | 🔍 Needs manual check — see §1.4 |

**Risk note (row 12)**: If no auto-assignment fires on recovery, leads silently sit in the pool with no notification or assignment.

### §1.3 — Four new Lead fields exist with correct types
✅ **Implemented as spec'd**
- **Evidence** (`prisma/schema.prisma:418-423`):
  - `exit_reason String? @db.Text` ✅
  - `exited_from_status String?` ✅
  - `demo_scheduled_at DateTime?` ✅
  - `demo_handler_id Int?` with `Employee` relation ✅

### §1.4 — RECOVERED_TO_POOL → ASSIGNED uses findBestAssigneeForLead
🔍 **Needs manual check**
- **What I found**: `findBestAssigneeForLead` is called in new-lead creation (`lead.service.ts:182, 307`) and bulk upload. No call to `findBestAssigneeForLead` found in any `RECOVERED_TO_POOL` handler. `lead.policy.ts:104` lists the allowed transition but no service function executes distribution on recovery. The lead appears to park at `RECOVERED_TO_POOL` until a manager manually reassigns it.
- **Risk note**: Recovered leads may stall indefinitely with no auto-assignment and no UI indicator to managers.

---

## §2 — Site Visit Sub-Workflow

### §2.1 — Same-project constraint enforced at API layer
✅ **Implemented as spec'd**
- **Evidence**: `siteVisit.service.ts:138-143` — fetches all properties and checks `new Set(props.map(pr => pr.project_id))`. If `projects.size > 1`, throws 400 before any DB write. Server-side rejection, not just a UI filter.

### §2.2 — Full SiteVisitBooking state machine walk
✅ **Implemented as spec'd**
- **Evidence** (`siteVisit.workflow.ts:47-129`): All states and transitions from the spec diagram exist:
  - REQUESTED → PENDING_ACCEPTANCE (ROUTE) ✅
  - PENDING_ACCEPTANCE → ACCEPTED (ACCEPT), → REASSIGNED (REASSIGN), → ESCALATED_TO_MARKETING_DIRECTOR (ESCALATE) ✅
  - REASSIGNED → PENDING_ACCEPTANCE (ROUTE) ✅
  - ACCEPTED → PENDING_CUSTOMER_RECONFIRMATION (RECONFIRM_CUSTOMER) ✅
  - PENDING_CUSTOMER_RECONFIRMATION → RESCHEDULE_REQUESTED (RESCHEDULE), → CONFIRMED (CONFIRM) ✅
  - RESCHEDULE_REQUESTED → PENDING_PM_RECONFIRMATION (PM_CONFIRM) ✅
  - PENDING_PM_RECONFIRMATION → ACCEPTED (PM_CONFIRM), → PENDING_ACCEPTANCE (PM_RELEASE) ✅
  - CONFIRMED → ACTIVE (START), ACTIVE → COMPLETED (COMPLETE), any → CANCELLED (CANCEL) ✅

### §2.3 — Reassignment targets restricted to PROJECT_MANAGER and AGENT at API layer
✅ **Implemented as spec'd**
- **Evidence**: `siteVisit.service.ts:314` calls `SiteVisitPolicy.canReassignTarget()`. `siteVisit.policy.ts:112-119` — checks target employee roles include `PROJECT_MANAGER` or `AGENT`, throws 403 otherwise. Enforced server-side before any DB write.

### §2.4 — SiteVisitReassignment table exists with required fields
✅ **Implemented as spec'd**
- **Evidence** (`prisma/schema.prisma:716-731`): Model has `from_employee_id`, `to_employee_id`, `reason`, `created_at` with correct types. `reason` field has a comment noting executive-only visibility restriction.

### §2.5 — Reassignment reason stripped server-side for non-executive roles
✅ **Implemented as spec'd**
- **Evidence**: `siteVisit.service.ts:93-102` — iterates reassignments and `delete (r as any).reason` when `!SiteVisitPolicy.canViewReassignmentReason(user)`. Happens in the service layer before response serialisation, not in the UI.
- **Executive roles implemented**: `siteVisit.policy.ts:25-28` — `[Roles.MD, Roles.ADMIN, Roles.MARKETING_DIRECTOR]`. PM, Agent, HR, Telecaller cannot see reasons. Matches spec §8 note (ratified per policy comment).

### §2.6 — Reschedule rule: PM gets exactly two options (confirm / release), cannot hand-pick assignee
✅ **Implemented as spec'd**
- **Evidence**: `siteVisit.service.ts:453-497` — `pmReconfirm(release: boolean)` takes a boolean flag, not an employee ID. The release branch (line 464-490) resets to `PENDING_ACCEPTANCE` and routes to `project.assigned_pm_id` — not to whoever released it. This is a separate code path from the open `reassignVisit()` chain (different workflow actions: `PM_RELEASE` vs `PM_CONFIRM`).

### §2.7 — SiteVisitProperty: outcome + outcome_reason exist; COMPLETED only when all properties have outcomes
✅ **Implemented as spec'd**
- **Evidence** (`prisma/schema.prisma:694-710`): `outcome String?` and `outcome_reason String? @db.Text` exist.
- **Completion guard** (`siteVisit.service.ts:544-556`): `completeVisit()` validates every linked `site_visit_properties` entry has an outcome, and `outcome_reason` is non-empty when `outcome === 'NOT_INTERESTED'`. Missing outcomes throw 400 before any DB write.

### §2.8 — Dashboard priority: ACTIVE visits pinned above other content
⚠️ **Partially implemented / drifted**
- **What exists**: `ActiveSiteVisitsBanner` injected at the top of `PMDashboard.tsx` and `SalesManagerDashboard.tsx`. Collapses to nothing when no ACTIVE visits.
- **Drift**: The spec requires this in `PMDashboard` **and** `AgentSiteVisitsDashboard`. `ActiveSiteVisitsBanner` was not found confirmed in `AgentSiteVisitsDashboard.tsx`.
- **Risk note**: Agents conducting today's visits may not see the urgent ACTIVE visit banner — defeating the spec's "urgent above all" requirement for their primary dashboard.

---

## §3 — LeadActivity Types

### Full registry audit

| Activity type (spec §3) | In schema? | Emitted in code? | Location |
|---|---|---|---|
| `DEMO_SCHEDULED` | ✅ | ✅ | `lead.service.ts:461` |
| `DEMO_COMPLETED` | ✅ | ✅ | `lead.service.ts:462` |
| `SITE_VISIT_REQUESTED` | ✅ | ✅ | `siteVisit.service.ts:199` |
| `SITE_VISIT_REASSIGNED` | ✅ | ✅ | `siteVisit.service.ts:340` |
| `SITE_VISIT_ESCALATED` | ✅ | ✅ | `siteVisit.service.ts:387` |
| `SITE_VISIT_ACCEPTED` | ✅ | ✅ | `siteVisit.service.ts:299, 494, 511` |
| `SITE_VISIT_RESCHEDULE_REQUESTED` | ✅ | ✅ | `siteVisit.service.ts:448, 484` |
| `SITE_VISIT_COMPLETED` | ✅ | ✅ | `siteVisit.service.ts:587` |
| `WHATSAPP_SENT` | ✅ | ✅ | `lead.service.ts:614` |
| `LEAD_DROPPED` | ✅ | ✅ (engine path only) | `lead.service.ts:459` |
| `LEAD_RECOVERED` | ✅ | ✅ | `lead.service.ts:460` |

⚠️ **Gap**: `LEAD_DROPPED` is emitted via `activityTypeForTransition()` which is only called from `updateLeadStatus()`. The booking cancellation path (`booking.service.ts:301`) drops the lead via raw `p.lead.update()` and emits **no** `LEAD_DROPPED` activity. Activity audit trail is incomplete for booking-cancellation drops.

---

## §4 — Opportunity's Narrower Role

### §4.1 — Opportunity auto-creates exactly on NEGOTIATION entry
✅ **Implemented as spec'd**
- **Evidence**: `lead.service.ts:516-529` — `if (newStatus === 'NEGOTIATION')` calls `OpportunityService.createFromLeadTx()` inside the same transaction. Opportunity creation is not triggered at any other status transition.

### §4.2 — Opportunity.stage no longer independently user-editable
✅ **Implemented as spec'd** (backend)
- **Evidence**: `prisma/schema.prisma:1036-1083` — the `Opportunity` model has no `stage` field.
- **Caveat**: Frontend dead references remain — `types/index.ts:325` (`stage: string`), `useSalesPipeline.ts:72` (`PATCH /opportunities/:id/stage`), `LeadDetailModal.tsx:770` (`opp.stage`). These produce silent `undefined` at runtime. See §0.1.

### §4.3 — No screen presents Opportunity as a parallel pipeline
✅ **Implemented as spec'd**
- **Evidence**: `SalesKanbanBoard.tsx:38` groups by `o.lead?.status` (Lead status). `SalesOpportunityCard.tsx:21` serialises `opportunity.lead?.status`. Kanban reflects Lead macro-status, not a competing Opportunity pipeline.

---

## §5 — WhatsApp Templates

### §5.1 — MessageTemplate table exists with required fields
✅ **Implemented as spec'd**
- **Evidence** (`prisma/schema.prisma:737-748`):
  - `template_key String @unique` ✅
  - `body_text String @db.Text` with `{customer_name}`, `{property_name}`, `{pm_name}`, `{visit_date}` placeholder support ✅
  - `is_active Boolean` (soft-disable) ✅

### §5.2 — All 7 trigger points use MessageTemplate (not hardcoded strings)
⚠️ **Partially implemented / drifted**
- **What exists**: Server-side URL builder in `lead.service.ts:571-604` and `matchingEngine.ts:107-135` resolve body text from the `MessageTemplate` table via `template_key`. `WHATSAPP_SENT` activity embeds the key used.
- **Gap**: The frontend has **exactly one** WhatsApp trigger point (`LeadDetailModal.tsx:575`, property proposal button). The other 6 spec trigger points (demo scheduled, site visit booked, site visit confirmed, day-before reminder, visit completed, booking confirmation) have **no deep-link button in the UI**.
- **Risk note**: 6 of 7 WhatsApp trigger points are missing from the UI — sales/PM teams cannot send template-based messages at any stage except property proposal.

---

## §6 — Customer Conversion & Portal Handoff

### §6.1 — BOOKING_INITIATED → BOOKED triggers Customer record creation
✅ **Implemented as spec'd**
- **Evidence**: `lead.service.ts:532-535` — `if (newStatus === 'BOOKED')` calls `CustomerPortalService.provisionStub()`. `customerPortal.service.ts:80-82` — calls `CustomerService.upsertFromLead()`, creating or upserting the Customer record (idempotent via `origin_lead_id` unique constraint).

### §6.2 — POST /integrations/customer-portal/provision behind isolated service interface
✅ **Implemented as spec'd**
- **Evidence**: `customerPortal.service.ts:21-67` — provisioning contract is the `CustomerPortalProvisioner` interface. `StubCustomerPortalProvisioner` writes to `AuditEvent` and returns `{ provisioned: false, provisioner: 'stub' }`. Swapping in the real implementation = replace one constant at line 67.
- **Stub behaviour**: records explicit `CUSTOMER_PORTAL_PROVISION_STUB` audit event. Not silently succeeding or failing.

---

## §7 — Document Module Removal

### §7.1 — DocumentManagement.tsx and nav entry fully removed
❌ **Not implemented as spec'd — frontend removal incomplete**
- **Evidence**:
  - `apps/web/src/components/documents/DocumentManagement.tsx` — **still exists**
  - `apps/web/src/components/documents/index.ts` — still exports `DocumentManagement`
  - `apps/web/src/App.tsx:66` — still lazy-imports `DocumentManagement`
  - `apps/web/src/App.tsx:227` — still mounts `<Route path="/documents" element={<DocumentManagement />} />`
- **Risk note**: The `/documents` route renders in the app but has no backend model — every API call 404s/500s. Visible broken page for users if the nav item is still present.

### §7.2 — Property/project reference docs swept out unintentionally
🔍 **Needs manual check**
- **What I found**: The `Document` model was removed from `prisma/schema.prisma` entirely. No replacement attachment field exists on `Property` or `Project`. If internal reference documents (floor plans, legal docs) were stored in the `Document` model, that functionality is now orphaned.
- **Risk note**: Internal-use documents may be unreachable even though the UI route still exists.

---

## §8 — Open Items (current state)

### §8.1 — Executive role visibility for reassignment reasons
✅ **Resolved and implemented**
- `siteVisit.policy.ts:25-28` — `[Roles.MD, Roles.ADMIN, Roles.MARKETING_DIRECTOR]`. PM, Agent, HR, Telecaller have `reason` deleted from the API response. Ratified per the policy comment.

### §8.2 — Document module removal scope
❌ **Unresolved — broader than intended**
- Backend `Document` model is entirely gone. Frontend component still exists and is routed. Removal covered backend model + test files but left the frontend component intact. Scope (customer docs only vs. all internal docs) is unresolved.

### §8.3 — Customer portal provisioning stub
✅ **Cleanly stubbed, failure-visible**
- `CustomerPortalService.provisionStub()` returns `{ provisioned: false }` and writes a distinct audit event. Not silently succeeding. Real implementation = implement `CustomerPortalProvisioner` interface, replace `provisioner` constant at `customerPortal.service.ts:67`.

---

## Prioritised Risk List

| Priority | Gap | What breaks today |
|---|---|---|
| **P0** | `booking.service.ts:301` — raw `p.lead.update({ status: 'DROPPED' })` outside engine | Drop reason lost, activity trail silent, analytics corrupted on every booking cancellation |
| **P0** | `DocumentManagement.tsx` still routed at `/documents` with no backend model | Every API call 404s/500s; visible broken page for users |
| **P1** | `RECOVERED_TO_POOL → ASSIGNED` — no auto-assignment triggered | Recovered leads stall indefinitely; sales team gets no notification |
| **P1** | 6 of 7 WhatsApp trigger points missing from UI | Sales/PM cannot send template messages at demo, visit, or booking stages |
| **P2** | Frontend dead `stage` references in `useSalesPipeline`, `types/index.ts`, `LeadDetailModal` | Silent `undefined` in stage pills; dead PATCH calls to removed field |
| **P2** | `AgentSiteVisitsDashboard` — `ActiveSiteVisitsBanner` presence unconfirmed | Agents may not see today's urgent ACTIVE visit pinned at top |
| **P3** | `Lead.status` is a `String` not a Prisma `enum` | Raw update typos silently persist invalid status values |
