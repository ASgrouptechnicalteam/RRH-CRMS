# RRH EMS / RSCRM — CRM-Readiness, Workflow & Edge-Case Audit

**Date:** September 6, 2026
**Follow-up to:** RRH-EMS-Audit-Report-2026-09-06.md (config/security/hygiene pass)
**Scope of this pass:** (1) how CRM-complete the system actually is, (2) whether the "engines" and workflow state machines behave correctly, (3) edge cases and security risks beyond the first pass, (4) a deep, code-level read of the Lead, Property, and Project workflows specifically, since you named these as the three pillars of the CRM.

This pass reads the actual state-machine code (`workflows/*.ts`), the services that call it (`lead.service.ts`, `property.service.ts`, `project.service.ts`), and the policies that gate it — not the planning docs in `docs/`, which describe intent rather than current behavior. Several places where the code has drifted from its own documented rules are called out below.

---

## 1. How complete is the CRM, really?

**Short answer: roughly 70–75% complete as a CRM**, with the EMS (HR/attendance/performance) side further along than the CRM core. This is a qualitative estimate from reading the code, not a metric the codebase tracks anywhere — nothing in the repo computes "% complete," so treat this as an informed read, not a number to quote externally.

**What's genuinely there and working:**

- Full Lead lifecycle from `NEW` through `BOOKED`/`DROPPED`/`RECOVERED_TO_POOL`, with a real state machine, field-level guards, auto-distribution to telecallers, WhatsApp proposal generation, and automatic lead recovery when new matching inventory appears.
- A three-stage Property listing pipeline (PM on-site verification → Digital Marketing polish → MD final approval) with photo/location pre-conditions before approval.
- Booking and payment flows that move a Property through `LIVE → LOCKED → BOOKED` with expiring locks.
- Opportunity auto-creation when a lead enters `NEGOTIATION`.
- Broad role-based dashboards — the frontend has 26 separate feature areas (leads, properties, projects, commercial, finance, attendance, performance, hr, etc.), suggesting most planned screens exist in some form.

**What's incomplete, stubbed, or structurally missing** (this is what should move the CRM from "mostly working" to "done"):

- **Customer Portal provisioning is a stub.** `lead.service.ts` calls `CustomerPortalService.provisionStub(tx, lead, user)` when a lead enters `BOOKING_INITIATED` — the code comment literally calls it "§6: customer-portal provisioning stub." The customer-facing portal integration is not real yet.
- **Property FAQs are unimplemented.** `property.service.ts` line ~209: `// TODO: Schema migration required to add PropertyFAQ model` — FAQ data submitted by the client is silently discarded ("Skipping FAQ creation to prevent runtime crash on missing model").
- **Projects have no workflow engine at all** (see §2 below) — every other core entity (Lead, Property, Site Visit) has one.
- **`ProjectService.reassignProject` is dead code.** There is no route in `routes/projects.ts` that calls it, and even if it were wired up it would always fail (see §2.3) — so "reassign a project to a different PM" is a feature that does not currently work end-to-end, despite the backend method existing.
- **Rejected properties have no way back into the pipeline** (see §4.2) — once MD or the PM rejects a listing, it's stuck.
- A large amount of the "phase" documentation in `docs/transformation/` and `docs/archive/` describes work as done that the running code only partially reflects (e.g., the multi-company data isolation gap from the first audit, which several of those docs assume is already solved).

If "CRM-centric, with EMS as a part of it" is the target framing, the CRM core (Lead → Opportunity → Booking) is the most mature part of the system already; the gaps are concentrated in the edges of that pipeline (portal handoff, rejection recovery, project-level governance) rather than in the center.

---

## 2. Are the engines and workflows working correctly?

This is the most important finding of this pass: **the "workflow engine" is not applied consistently even within a single entity**, and in a few places the code actively contradicts its own documented rules.

### 2.1 `WorkflowEngine.transition()` is hardcoded to Leads only, despite looking generic

`workflows/workflowEngine.ts` registers three domains — `LEAD`, `PROPERTY`, `SITE_VISIT` — in `canTransition()`, which genuinely dispatches by domain. But the _write_ method, `transition()`, is hardcoded:

```ts
static async transition(tx, leadId, toStatus, context, extraUpdateData = {}) {
  const transitionRes = this.canTransition({ domain: WorkflowDomain.LEAD, ... });
  ...
  return await tx.lead.update({ where: { id: leadId }, ... });
}
```

It always validates against `WorkflowDomain.LEAD` and always writes to `tx.lead`. Property and Site Visit code paths call `WorkflowEngine.canTransition(...)` directly and then perform their own `tx.property.update(...)` — which happens to work today, but only because nobody has called `.transition()` expecting it to work generically for a property or a site visit. A future developer reading the class name "WorkflowEngine" and its `transition()` method would reasonably assume it's domain-agnostic; if someone plugs a Property update through it, it will silently attempt to update the `lead` table with the property's ID. This should either be made genuinely generic (parameterized by domain and Prisma delegate) or renamed/documented as `LeadWorkflowEngine`.

### 2.2 A documented guard for Leads is missing from the code

The header comment in `lead.workflow.ts` explicitly lists, as an enforced rule: _"CALL_LOGGED activity required before ASSIGNED → CONTACTED (§1 row 2)."_ `updateLeadStatus` in `lead.service.ts` even fetches the lead's activities specifically because, per its own comment, _"the CALL_LOGGED guard (§1 row 2) needs them."_ But reading `LeadWorkflow.canTransition()` end-to-end, **there is no check anywhere that requires a CALL_LOGGED activity before allowing ASSIGNED → CONTACTED.** The guard is documented, the data is fetched for it, but the actual `if` statement that would enforce it doesn't exist. Net effect: a telecaller can mark a lead CONTACTED without ever having logged a call.

### 2.3 Direct database writes to `Lead.status` bypass the engine in three places — one of which produces a status the spec forbids

The workflow file's own header rule states: _"Lead.status must only be written via engine.transition() — do not call tx.lead.update({status}) directly anywhere else in the codebase."_ Yet `lead.service.ts` does exactly that three times:

- `distributeUnassignedPoolLeads()` — writes `status: 'ASSIGNED'` directly. Harmless in practice since `NEW → ASSIGNED` is a legal transition anyway, but it means this path gets none of the engine's guards if one is ever added to that transition.
- `triggerLeadRecoveryForProperty()` — writes `status: 'ASSIGNED'` directly on a lead that was `DROPPED`. **The transition matrix does not allow `DROPPED → ASSIGNED` at all** — the only legal move out of `DROPPED` is `RECOVERED_TO_POOL`, and only from there back to `ASSIGNED`. This automatic recovery (triggered when new matching inventory appears) skips the `RECOVERED_TO_POOL` step entirely and produces a lead history that the documented state machine says is impossible.
- `recoverManualLead()` — writes `status: 'CONTACTED'` directly on a lead that was `DROPPED` or `CANCELLED`. Neither `DROPPED → CONTACTED` nor anything from `CANCELLED` (which isn't even a key in the transition matrix) is a legal move per the engine. This is the "Manually recover a dropped lead" button's entire implementation, and it's fully outside the state machine.

Practically: the state machine is real and enforced for the "happy path" UI actions (`PATCH /leads/:id/status`), but every "recovery" code path — arguably the trickiest, most error-prone part of the lead lifecycle — bypasses it completely. If the spec is right that these transitions should be illegal, real leads are ending up in states the business rules say can't happen. If the spec is wrong (these recovery jumps are intentional shortcuts), the spec/comments need to be updated to say so, because right now the code and its own documentation directly disagree.

### 2.4 The lead-transition table exists twice, independently

`workflows/lead.workflow.ts` (`LeadWorkflow.transitionMatrix`) and `policies/lead.policy.ts` (`LeadPolicy.getValidTransitions`) both hardcode the full lead status graph, separately. Today they agree. The service layer correctly uses `LeadPolicy` only for ownership checks (`canView`/`canMutate`) and routes actual transitions through `WorkflowEngine`/`LeadWorkflow`, so `LeadPolicy.validateTransition` looks unused in the live code path — but it exists, is exported, and the next person to add a new lead status only has to remember to update one of the two copies to introduce a silent bug.

### 2.5 Projects have no workflow engine at all

Lead, Property, and Site Visit each have a `*.workflow.ts` registered in `WorkflowEngine`. **Projects do not.** `ProjectService.updateProject` accepts a `status` field validated only by a Zod enum (`PLANNING | UNDER_CONSTRUCTION | COMPLETED | CANCELLED`) with no ordering or guard logic — a Project can move from `COMPLETED` back to `PLANNING`, or from any state to any other, in a single `PUT`, with no business-rule check and no audit trail beyond the generic "project updated" response. Given Projects sit above Properties in your hierarchy (a Project going backwards can be confusing for every Property and lead pointed at it), this is worth the same treatment Lead and Property already got.

### 2.6 Rejected properties have no way back into the pipeline

`PropertyWorkflow.validTransitions` only defines actions out of `PENDING_VERIFICATION`, `PENDING_DM_POLISH`, and `PENDING_MD_APPROVAL`. There is no entry for `REJECTED` — and no separate "resubmit" method exists anywhere in `property.service.ts`. Once a property is rejected (at PM verification or at MD approval), the only way to get it back into the pipeline is a direct database edit; there is no workflow-supported path for a PM to fix the issue and resubmit.

### 2.7 The Property workflow only covers half of the Property lifecycle

`PropertyWorkflow` governs the _listing approval_ pipeline (`PENDING_VERIFICATION → ... → LIVE`). The _commercial_ lifecycle — `LIVE → LOCKED` (when a booking is initiated), `LOCKED → BOOKED` (on payment confirmation), and `BOOKED → LIVE` (on booking cancellation) — is implemented entirely inside `booking.service.ts` via raw `tx.property.update({ status })` calls, with zero involvement from `WorkflowEngine`. That's not necessarily wrong (a booking flow may reasonably own that part of the lifecycle), but it means "the workflow engine enforces Property state" is only true for the front half of the property's life; the commercial half has no shared guard logic at all, and any invariant you want enforced there (e.g., "can't lock a property that's already booked") lives only in whatever `if` checks happen to be in `booking.service.ts`.

**Bottom line on this section:** the workflow _design_ (a central engine, explicit transition matrices, field-level guards) is sound and clearly deliberate. The _execution_ has drifted — bypass paths for edge cases (recovery, rejection) were added ad hoc without updating the engine, and Projects were never brought into the pattern at all. This is exactly the kind of gap that produces data in states nobody expects, which then breaks reports, dashboards, and anything downstream that assumes the documented state graph is the only reality.

---

## 3. Edge Cases & Security Risks (beyond the first audit)

1. **Fragile, string-matching business rule for the "5-day unreachable" cap.** In `updateLeadStatus`, a telecaller can only drop a lead as "unreachable" after 5 distinct days of logged calls — but the check for whether a drop _is_ an "unreachable" drop is keyword-matching on free text: `exitReason === 'OTHER' && (lowerNotes.includes('unreachable') || lowerNotes.includes('not answering') || lowerNotes.includes('no response'))`. Anyone can bypass the 5-day requirement simply by phrasing the note differently ("customer never picks up," "couldn't get through," any language other than English), or conversely get incorrectly blocked by using one of those phrases for an unrelated reason. This should be a structured field (a checkbox/enum reason, not a free-text keyword scan), not string matching on `notes`.

2. **Cancelling a Project doesn't check for live Properties or Bookings underneath it.** `ProjectService.deleteProject` sets `status: 'CANCELLED'` on the project with no check for whether it has `LIVE`/`LOCKED`/`BOOKED` properties attached. A management user could cancel a project that has active customer bookings under it, with nothing in the code stopping them or warning them.

3. **`reassignProject` is unreachable and would always 403 even if called.** As noted in §2.5/§1, `can(user, Permissions.PROJECTS_UPDATE)` is called with no resource argument; `authorization.ts`'s `can()` for `PROJECTS_UPDATE` explicitly does `if (!resource) return false;`. So this method can never succeed for any user, from any code path, as written. If project reassignment is actually needed, it needs a route, and it needs to fetch the project and pass it as the `resource` argument.

4. **The `can()` function's "no resource" default is inconsistent across permissions**, which makes the codebase harder to reason about and easy to get wrong: `PROJECTS_UPDATE`/`PROJECTS_DELETE` fail closed with no resource; `PROPERTIES_UPDATE`/`PROPERTIES_DELETE`/`PROPERTIES_VERIFY` explicitly comment "Defer to service layer" and return `true`; `EMPLOYEES_*` returns `true` when no resource is given. A developer copying the `PROPERTIES_UPDATE` pattern (call `can()` with no resource, rely on the service to re-check scope afterward — which `property.service.ts` correctly does) onto a new permission that happens to fail-closed instead, or vice versa, will get a confusing, hard-to-debug authorization bug. Worth standardizing on one convention and commenting it once, centrally.

5. **Bulk lead upload (`POST /leads/bulk-upload`) has no visible cap on array size** in the route handler itself (only checks it's a non-empty array) — a large `leads` array in one request could cause a long-running synchronous import inside a single HTTP request/transaction, which is both a performance risk and a potential denial-of-service vector (one request pinning a DB connection and worker thread for a long time). Confirm `LeadService.bulkUploadLeads` enforces a row-count ceiling; if not, add one.

6. **Auto-recovery races the manual actions.** `triggerLeadRecoveryForProperty` runs automatically (property becomes `LIVE` → recovers matching dropped leads) and reassigns them to a "best assignee." If a telecaller is looking at a `DROPPED` lead in the UI at the same moment this job fires, the lead can be silently reassigned and reactivated underneath them with no locking/version check — the UI has no way to know the record just moved unless it re-fetches.

7. **Notes exposed in error paths.** Several catch blocks in `properties.ts`/`projects.ts` log `error.message` from Prisma directly (`logger.error('Prisma validation error payload:', e.message)`), which is fine for server logs, but confirm none of these ever leak into an HTTP response body — a quick search shows the generic `{ error: 'Failed to ...' }` message is what's returned to the client in most cases, which is correct; just worth a final pass to make sure no route accidentally does `res.json({ error: error.message })` on a raw Prisma error (which can include table/column names).

---

## 4. Deep-Focus Review: Lead, Property, and Project Workflows

### 4.1 Lead workflow (`leads.ts` → `lead.service.ts` → `lead.workflow.ts`)

- **Strength:** the transition matrix and most field-level guards (qualification completeness, demo scheduling requiring a handler, site-visit completion requiring all visits done, drop reasons required) are implemented and actually enforced on the primary `PATCH /leads/:id/status` path.
- **Strength:** demo-handler auto-assignment has a sensible fallback chain (PM by territory → Sales Manager → Marketing Director → MD → Admin), and it notifies admins when it has to fall back — good defensive design.
- **Gap:** as detailed in §2.2 and §2.3, the CALL_LOGGED guard is documented but not implemented, and the two recovery paths bypass the engine and can produce spec-illegal states.
- **Gap:** `PATCH /leads/:id` (the "generic update" route, separate from `/status`) writes `budget_min`/`budget_max`/`property_type_preference`/`preferred_location`/`notes` directly via `prisma.lead.update` with no ownership check beyond an initial `getLeadById` read — worth confirming `getLeadById` itself enforces `LeadPolicy.canMutate` before this write proceeds (a read-permission check is not the same as a write-permission check).

### 4.2 Property workflow (`properties.ts` → `property.service.ts` → `property.workflow.ts`)

- **Strength:** the three-stage approval pipeline (PM verify → DM polish → MD approve) has real pre-conditions — a PM literally cannot approve a listing without their own uploaded photos and an explicit "I confirmed the location on-site" flag. That's a genuinely good anti-fraud control (stops a PM from rubber-stamping a listing without visiting it).
- **Strength:** `updateProperty` explicitly whitelists the fields a general edit can touch (`safeKeys`) and excludes `status` — so the generic edit endpoint cannot be used to sneak a status change past the workflow. This is the correct pattern, and it's the one Project's `updateProject` should be copied to.
- **Gap:** as in §2.6, `REJECTED` is a dead end with no resubmission path.
- **Gap:** as in §2.7, the commercial half of the lifecycle (`LIVE/LOCKED/BOOKED/SOLD`) isn't covered by the workflow engine at all — it's ad hoc in `booking.service.ts`.
- **Edge case:** PM assignment at creation time has a three-tier fallback (explicit PM → inherit from project → territory-based lookup with a load-balancing tiebreaker) — solid design — but if zero PMs are configured for a city/territory, the property is created with `assigned_pm_id: null` and just notifies MDs; there's no forced re-check later, so a property can sit unassigned indefinitely if the MD notification is missed.

### 4.3 Project workflow (`projects.ts` → `project.service.ts`)

- **Gap (most significant of the three):** no dedicated workflow file, no transition guard, no audit log entry specifically for status changes (contrast with `reassignProject`, which — despite being unreachable — at least writes an `auditEvent`). A Project's status can move in any direction through the generic `PUT` endpoint by anyone with update rights on it.
- **Gap:** `reassignProject` (§1, §3.3) is fully dead — no route, and would 403 even if wired up.
- **Reasonable:** `createProject` has solid concurrency handling for its human-readable code generation (retries on a unique-constraint collision up to 3 times) — a small but real detail many CRMs get wrong.
- **Reasonable:** slug generation checks per-company uniqueness, consistent with the rest of the multi-tenancy model (which, per the first audit, is otherwise not enforced for Projects' _read_ scope — worth revisiting together).

---

## 5. Summary Table

| #   | Finding                                                                                                                          | Severity    | Area                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------- |
| 2.3 | Two lead-recovery paths bypass the workflow engine and produce spec-illegal `DROPPED→ASSIGNED` / `DROPPED→CONTACTED` transitions | High        | Workflow correctness            |
| 2.5 | Projects have no workflow engine — status can move in any direction with no guard                                                | High        | Workflow correctness            |
| 1   | Customer Portal provisioning on `BOOKING_INITIATED` is a stub, not real                                                          | High        | Completeness                    |
| 2.6 | Rejected properties have no resubmission path — permanent dead end                                                               | Medium-High | Workflow completeness           |
| 2.2 | Documented CALL_LOGGED guard (ASSIGNED→CONTACTED) is not actually implemented                                                    | Medium      | Workflow correctness            |
| 3.3 | `ProjectService.reassignProject` is dead code and would always 403 if called                                                     | Medium      | Bug / dead code                 |
| 2.1 | `WorkflowEngine.transition()` is hardcoded to Leads despite looking generic                                                      | Medium      | Architecture                    |
| 3.2 | Cancelling a Project doesn't check for live Properties/Bookings underneath it                                                    | Medium      | Business logic                  |
| 3.1 | "5-day unreachable" drop rule enforced via fragile keyword matching on free text                                                 | Medium      | Business logic                  |
| 3.4 | `can()`'s "no resource" default behavior is inconsistent across permissions                                                      | Medium      | Authorization / maintainability |
| 2.4 | Lead transition matrix duplicated in `LeadWorkflow` and `LeadPolicy`                                                             | Low-Medium  | Maintainability                 |
| 2.7 | Property's commercial lifecycle (LIVE/LOCKED/BOOKED) bypasses the workflow engine entirely                                       | Low-Medium  | Architecture                    |
| 3.5 | No visible row-count cap on bulk lead upload                                                                                     | Low-Medium  | Performance / DoS               |
| 3.6 | Auto lead-recovery can reassign a lead a telecaller is actively viewing, with no conflict signal                                 | Low         | UX / data integrity             |
| 1   | `PropertyFAQ` feature accepts input and silently discards it (schema not migrated)                                               | Low         | Completeness                    |

---

## 6. Suggested Priority Order

1. Decide the intended behavior for the two lead-recovery bypasses (§2.3) — either make them go through the engine with a documented exception, or add the missing transitions to the matrix. Right now the code and its own comments disagree, which is the riskiest kind of inconsistency to leave in place.
2. Give Projects a real workflow file, mirroring `PropertyWorkflow`'s structure, before more Project-status-dependent features (financial reporting, handoffs) are built on top of an unguarded field.
3. Add the missing CALL_LOGGED guard, or remove the comments claiming it exists, so the code and its documentation agree.
4. Add a REJECTED → PENDING_VERIFICATION resubmission path for properties.
5. Either wire up `reassignProject` properly (route + resource-aware `can()` call) or remove it if project reassignment isn't actually needed.
6. Replace the keyword-matching "unreachable" check with a structured field.
7. Decide whether Customer Portal provisioning and Property FAQs are near-term roadmap items or should be removed from the UI until built, so the product doesn't silently accept input it can't act on.

---

_This pass focused on Lead, Property, and Project end-to-end, plus the shared workflow engine and job/matching utilities that feed them. It did not re-verify Site Visit, Expense Refund, or Task workflows in the same depth — `siteVisit.workflow.ts` and `expenseRefund.workflow.ts` exist and are registered/used, but weren't read line-by-line this pass. A follow-up in that direction would complete the picture across every entity that currently has a workflow file._
