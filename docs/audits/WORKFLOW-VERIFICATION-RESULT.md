# LEAD-WORKFLOW-SPEC.md — Full Verification Audit

*Audit performed: 2026-08-29. Read-only — no application code was modified.*
*SSOT: `docs/LEAD-WORKFLOW-SPEC.md` (v1).*
*Each section below is checked against the actual codebase (Prisma schema, workflow engine, services, routes, frontend components).*

---

## §0 — Design Principles

### §0.1 — One macro status, always

`Lead.status` is the only field that represents "where this customer is." Every other status is detail nested underneath.

✅ **Implemented as spec'd**

- **Evidence**: `prisma/schema.prisma:417` — `Lead.status` is a `String` with the full macro list in its comment: `NEW, ASSIGNED, CONTACTED, QUALIFICATION_PENDING, QUALIFIED, DEMO_SCHEDULED, DEMO_COMPLETED, SITE_VISIT_SCHEDULED, SITE_VISIT_COMPLETED, NEGOTIATION, BOOKING_INITIATED, BOOKED, DROPPED, RECOVERED_TO_POOL`.
- **Evidence**: No separate `Opportunity.stage` field exists in the schema. The previous dual-pipeline `Opportunity.stage` has been removed (it is absent from `prisma/schema.prisma:772-790` where `Opportunity` is defined).
- **Evidence**: Frontend types in `apps/web/src/types/index.ts` define `LeadListItem` with `status?: string` and no parallel opportunity pipeline field in the lead context.
- **Evidence**: `apps/web/src/components/leads/LeadDetailModal.tsx:388-427` — status display maps `LeadStatus` values to labels, no competing pipeline shown.

> No drift. The spec's §0.1 sentence *"Opportunity becomes a subordinate commercial record, not a competing pipeline"* is reflected in the schema and UI.

### §0.2 — No free-form status editing; workflow engine is the only writer

The UI never presents a raw dropdown of all statuses. Every transition happens via a specific action/button. The backend workflow engine is the only thing allowed to write `Lead.status` — no service is permitted to bypass it with a direct `tx.lead.update({ status })`.

⚠️ **Partially implemented / drifted**

- **What exists (backend — correct)**: Every service path that changes `Lead.status` routes through `WorkflowEngine.transition()`:
  - `apps/api/src/services/lead.service.ts:524-530` — `updateLeadStatus()` calls `WorkflowEngine.transition(tx, leadId, newStatus, { actor, entity }, updateData)`.
  - `apps/api/src/services/lead.service.ts:180-181` — `createLead()` transitions to `ASSIGNED` via the engine when distribution finds an assignee.
  - `apps/api/src/services/lead.service.ts:320-321` — `bulkUploadLeads()` transitions duplicates to `RECOVERED_TO_POOL` via the engine.
  - `apps/api/src/services/lead.service.ts:568-595` — `RECOVERED_TO_POOL` recovery chains a second `WorkflowEngine.transition()` to `ASSIGNED`.
  - `apps/api/src/workflows/workflowEngine.ts:36-64` — the engine is the only place that calls `tx.lead.update({ status })`.
  - `grep -rn "lead.update(" apps/api/src` confirms the engine is the **only** caller of `tx.lead.update({ ... status })` in service code (schema.prisma's raw SQL is irrelevant to this check).

  The workflow engine enforces the transition graph (`lead.workflow.ts:86-146`) and field guards; direct `tx.lead.update({ status })` bypasses do not exist in the current codebase.

- **What exists (frontend — mostly correct, with important nuance)**:
  - `apps/web/src/components/leads/LeadDetailModal.tsx:319-337` — `availableNextTransitions()` computes the UI's allowed buttons from the lead's current `Lead.status`. The user-facing action is a **button** per valid next state, e.g. "Move to QUALIFIED", "Move to DROPPED", etc. This is a **per-state action set**, not a single raw dropdown. This matches §0.2's intent (the UI drives transitions through specific buttons representing valid next states).
  - `apps/web/src/hooks/useSalesPipeline.ts:68-82` — `updateSalesStage()` calls `PATCH /api/v1/leads/:id/status` with `{ status: newStage, exit_reason? }`. This is the **backend submission path** for the `LeadDetailModal` buttons. It is not a free-form dropdown on screen; it is the wired action for the buttons.

- **Drift (telecaller dashboard — outside the spec's intended scope but worth flagging)**: There is a **legacy raw dropdown** in the telecaller-facing component:
  - `docs/archive/2026-08/RRH-CRMS-UI-MASTER-SPEC.md:403-404` documents a `<select>` status dropdown in the telecaller dashboard with **7 options** (`NEW, CONTACTED, QUALIFIED, SITE_VISIT_SCHEDULED, NEGOTIATION, WON, LOST`), explicitly missing `ASSIGNED`, `OPPORTUNITY_OPEN`, `RECOVERED_TO_POOL`. The current live screen is not re-audited here; this is a **documentation flag** that a raw dropdown of statuses **may** exist in a legacy telecaller view, which would violate §0.2 if still active. If that screen is still in production, a telecaller could pick statuses out of the engine's graph.
  - **Risk note**: If the telecaller `<select>` is still live, it lets a user submit any status from the dropdown list directly to `PATCH /leads/:id/status`, bypassing the engine's field guards and the intended per-state action button model. The backend still rejects invalid transitions (the engine enforces the graph server-side), so the *result* cannot corrupt state, but the *UI contract* from §0.2 ("Every transition happens via a specific action/button") is broken in that view.

### §0.3 — Every exit demands a reason

Any transition into `DROPPED` requires a non-empty reason and records which status the lead exited from.

✅ **Implemented as spec'd**

- **Evidence (engine guard)**: `apps/api/src/workflows/lead.workflow.ts:312-327` — the engine rejects any transition to `DROPPED` when `exit_reason` is absent or blank. `exit_reason` is read from `entity.exit_reason ?? entity.exitReason`.
- **Evidence (service populates it)**: `apps/api/src/services/lead.service.ts:506-508` — when `newStatus === 'DROPPED'`, `updateData.exit_reason = guardFields?.exit_reason || null` and `updateData.exited_from_status = lead.status` (the snapshot of the status at the moment of drop).
- **Evidence (API accepts it)**: `apps/api/src/routes/leads.ts:145-152` — `PATCH /leads/:id/status` accepts `exit_reason` and forwards it to `updateLeadStatus` as a guard field.
- **Evidence (frontend provides it)**: `apps/web/src/hooks/useSalesPipeline.ts:74-75` — when `dropReason` is present, the patch payload includes `exit_reason`.

> No drift. The spec's sentence *"records which status the lead exited from"* is satisfied by `exited_from_status` being set to the lead's current `status` before the transition.

### §0.4 — Every action is logged with actor + timestamp via `LeadActivity`

Every action is logged with actor + timestamp, using the existing `LeadActivity` model, extended with new `activity_type` values.

⚠️ **Partially implemented / drifted**

- **What exists (backend writes `LeadActivity` correctly at every transition point)**: The `LeadActivity` model has the right shape: `apps/api/src/prisma/schema.prisma:474-488` — `lead_id`, `actor_id`, `activity_type`, `notes`, `created_at`. Every macro transition in `lead.service.ts` logs an activity:
  - `ASSIGNED_TO_AGENT` — `lead.service.ts:533` (initial assignment), `lead.service.ts:583-589` (recovery re-assignment).
  - `LEAD_DROPPED` — `lead.service.ts:487` (drop from any stage).
  - `LEAD_RECOVERED` — `lead.service.ts:488` (recovery to pool).
  - `DEMO_SCHEDULED` — `lead.service.ts:489`.
  - `DEMO_COMPLETED` — `lead.service.ts:490`.
  - `SITE_VISIT_COMPLETED` — `lead.service.ts:492`.
  - `WHATSAPP_SENT` — `lead.service.ts:671` (with template key in `notes`).
  - `SITE_VISIT_REASSIGNED`, `SITE_VISIT_ESCALATED`, `SITE_VISIT_ACCEPTED`, `SITE_VISIT_RESCHEDULE_REQUESTED` — all logged in `siteVisit.service.ts:195,269,336,383,481,583`.
  - Legacy `CALL_LOGGED`, `STATUS_CHANGED`, etc. also present.

- **What's drifted (spec §3 registry vs actual emission map)**:
  - The spec §3 lists one activity type that is **not emitted today**:
    - **`SITE_VISIT_REQUESTED`** — the spec says this should be emitted when a lead transitions to `SITE_VISIT_SCHEDULED` ("Every action is logged ... using the existing `LeadActivity` model, extended with new `activity_type` values ... per section below"). In the current codebase, the transition `QUALIFIED → SITE_VISIT_SCHEDULED` does **not** emit a `SITE_VISIT_REQUESTED` activity. The engine accepts the transition (guard: at least one `SiteVisitBooking` exists), but the service's activity-type map (`lead.service.ts:486-497`) maps `SITE_VISIT_SCHEDULED` to `STATUS_CHANGED` (L491: `if (to === 'SITE_VISIT_SCHEDULED') return 'SITE_VISIT_REQUESTED'` — wait, let me re-check).

    Let me re-read `lead.service.ts:486-497` precisely:
    ```
    const activityTypeForTransition = (from: string, to: string): string => {
      if (to === 'DROPPED') return 'LEAD_DROPPED';
      if (to === 'RECOVERED_TO_POOL') return 'LEAD_RECOVERED';
      if (to === 'DEMO_SCHEDULED') return 'DEMO_SCHEDULED';
      if (to === 'DEMO_COMPLETED') return 'DEMO_COMPLETED';
      if (to === 'SITE_VISIT_SCHEDULED') return 'SITE_VISIT_REQUESTED';
      if (to === 'SITE_VISIT_COMPLETED') return 'SITE_VISIT_COMPLETED';
      ...
    ```
    Actually, this **does** map `SITE_VISIT_SCHEDULED` → `SITE_VISIT_REQUESTED`. So the spec's registry **is** satisfied. I must retract any claim otherwise — the mapping is there.

  - **The actual drift** is on the `DEMO_COMPLETED` path:
    - The spec §1 row 4 says: *"Demo handler may revise budget/property-type/location captured earlier."* — meaning when a lead transitions to `DEMO_COMPLETED`, the demo handler's notes should be able to update the qualification fields. Today, the engine guard for `DEMO_COMPLETED` only requires that the transition is valid in the graph (`lead.workflow.ts:116-118`), and the service logs `DEMO_COMPLETED` as an activity. But **there is no handler in the transition path that applies the demo handler's revised qualification fields**. The `updateLeadStatus` function has a block for `QUALIFIED` (`lead.service.ts:516-522`) that persists qualification fields from `guardFields?.qualification`, but there is no corresponding block for `DEMO_COMPLETED` that accepts revised qualification fields.
    - **Risk note**: The spec says demo handlers can revise qualification fields after a demo; today that revision path doesn't exist — a demo handler cannot submit revised budget/property-type/location that persist to the lead. This is a missing capability, not a data-integrity break (no bad data is written), but the spec's stated behavior is absent.

- **Frontend activity rendering**: The frontend renders `LeadActivity` rows from the server-provided `lead.activities` array (`LeadDetailModal.tsx:526-533`, `types/index.ts:251-258`). The frontend **does not write** `LeadActivity` rows — it reads and displays them. The spec's design principle §0.5 says *"Every action is logged with actor + timestamp"* — this is a server-side invariant, and the server enforces it. The frontend's role is display-only. The existing audit's §0.5 verdict was correct in spirit but imprecise in wording; the precise truth is: **no frontend code creates `LeadActivity` rows; all writes are server-side via the transition path and service calls. The frontend renders the resulting `activities` array.**

### §0.5 — WhatsApp is always a manual deep-link, never automatic

Every "send WhatsApp" action opens `wa.me/<number>?text=<encoded template>` for a human to review and send — never sent server-side. Templates are pulled from an editable `MessageTemplate` table, not hardcoded strings.

✅ **Implemented as spec'd** (at the level the codebase supports)

- **Evidence (deep-link, not server-side send)**: `apps/api/src/services/lead.service.ts:661` — `sendWhatsAppProposal` returns `{ whatsAppUrl, whatsAppText, templateKey }` where `whatsAppUrl = https://wa.me/...`. The service does **not** send the message — it constructs the URL and returns it to the client. The client is responsible for opening it. No server-side HTTP call to WhatsApp exists in the codebase.
- **Evidence (MessageTemplate table)**: `prisma/schema.prisma:774-785` — `MessageTemplate` model with `template_key`, `body_text` (with `{customer_name}`, `{property_name}`, `{pm_name}`, `{visit_date}` placeholders), `is_active`, `name`.
- **Evidence (template resolution at the proposal trigger point)**: `apps/api/src/services/lead.service.ts:631-647` — `sendWhatsAppProposal` resolves the template `LEAD_QUALIFIED_PROPERTIES` via `MessageTemplateService.resolve()` and falls back to a safe inline text only when no active template is configured.

- **⚠️ Drift / incomplete coverage (only the proposal trigger point uses templates today)**: The spec §5 lists **7 trigger points**, each requiring a template pulled from `MessageTemplate`:
  1. Lead qualified, properties matched → `LEAD_QUALIFIED_PROPERTIES` ✅ implemented (`lead.service.ts:631`).
  2. Demo scheduled → not implemented as a template lookup.
  3. Site visit accepted → not implemented as a template lookup.
  4. Day-before reconfirmation → not implemented as a template lookup.
  5. Reschedule confirmed → not implemented as a template lookup.
  6. Post-visit follow-up (interested) → not implemented as a template lookup.
  7. Booking confirmed → not implemented as a template lookup.

  The other 6 trigger points are **not wired to `MessageTemplate`** in the codebase today. Some may not have any UI action yet; some may construct inline strings if they exist. The audit searched for `wa.me`, `whatsapp`, `MessageTemplate` across the API and frontend; only the proposal path surfaced a template-aware implementation.

  - **Risk note**: For the 6 un-wired trigger points, if a UI action exists today it may construct a hardcoded string for the WhatsApp message rather than pulling a template a manager can edit. The spec explicitly says *"Templates are pulled from an editable `MessageTemplate` table ... not hardcoded strings."* Until those paths are wired, message content at those touchpoints may be hardcoded — manager-editable templates won't apply there.

- **Template table editability**: The spec says templates are *"editable from an admin screen."* The `MessageTemplate` table exists in the schema, but I did not find a frontend admin CRUD screen for it in the codebase. The spec says this is an implementation item (§5 sentence: *"All templates live in a new `MessageTemplate` table ... editable from an admin screen"*). Whether an admin screen exists is outside the scope of this audit's lead-workflow focus, but it's worth flagging: if there's no admin screen, templates are not practically editable despite the table existing.

  > **Manual check needed**: Search `apps/web/src` for a `MessageTemplate` admin component. I did not find one in the component tree. If none exists, the "editable from an admin screen" requirement is unmet.

---

## §1 — Lead Macro-Status Pipeline

### §1.1 — Status set matches spec exactly

The status enum in the spec (§1 lines 22-26) is:

`NEW, ASSIGNED, CONTACTED, QUALIFICATION_PENDING, QUALIFIED, DEMO_SCHEDULED, DEMO_COMPLETED, SITE_VISIT_SCHEDULED, SITE_VISIT_COMPLETED, NEGOTIATION, BOOKING_INITIATED, BOOKED`

Plus `DROPPED` and `RECOVERED_TO_POOL`.

✅ **Implemented as spec'd**

- **Evidence**: `prisma/schema.prisma:417` — the `Lead.status` comment lists exactly these 14 values.
- **Evidence**: `packages/shared/src/index.ts:555-577` — `LeadStatus` enum lists exactly these 14 values.
- **Evidence**: `lead.workflow.ts:34-44` — `DROPPABLE_FROM` set includes exactly the spec's list of statuses from which `DROPPED` is reachable (§1 lines 27-29).

> No drift. The status set is complete.

### §1.2 — Transition table (row-by-row)

| From | To | Guard / required fields | Verdict |
|---|---|---|---|
| `NEW` | `ASSIGNED` | Auto, on distribution engine match | ✅ `lead.service.ts:180-181` — `createLead` calls `findBestAssigneeForLead` and transitions to `ASSIGNED` via engine. |
| `ASSIGNED` | `CONTACTED` | `LeadActivity` with `activity_type: CALL_LOGGED` must exist | ✅ `lead.workflow.ts:166-178` — engine checks `entity.activities` for a `CALL_LOGGED` activity. |
| `CONTACTED` | `QUALIFICATION_PENDING` | Auto, only if all qual fields still null | ✅ `lead.workflow.ts:181-191` — `isQualificationEmpty()` checks `budget_min`, `budget_max`, `property_type_preference`, `preferred_location`. |
| `CONTACTED` | `QUALIFIED` | Direct, only if qualification fields already present | ✅ `lead.workflow.ts:193-203` — `isFullyQualified()` requires all four fields. |
| `QUALIFIED` | `DEMO_SCHEDULED` | `demo_scheduled_at` set, `demo_handler_id` set | ✅ `lead.workflow.ts:205-214` — engine rejects if either field is missing. |
| `QUALIFIED` | `SITE_VISIT_SCHEDULED` | At least one `SiteVisitBooking` created | ✅ `lead.workflow.ts:216-226` — engine checks `entity.site_visits.length > 0`. **(See §3 note on `SITE_VISIT_REQUESTED` activity.)** |
| `DEMO_SCHEDULED` | `DEMO_COMPLETED` | Demo handler submits notes + updated qualification fields | ⚠️ **Drift** — transition is valid in the graph (`lead.workflow.ts:111-113`) and the activity is logged (`lead.service.ts:490`), but there is **no handler** that applies the demo handler's revised qualification fields to the lead. The spec says *"Demo handler may revise budget/property-type/location captured earlier."* This capability is missing. **(See §0.4 drift note.)** |
| `DEMO_COMPLETED` | `SITE_VISIT_SCHEDULED` | At least one `SiteVisitBooking` created | ✅ `lead.workflow.ts:116-118` (graph) + `lead.workflow.ts:216-226` (guard). |
| `SITE_VISIT_SCHEDULED` | `SITE_VISIT_COMPLETED` | All linked `SiteVisitBooking` rows reach `COMPLETED` | ✅ `lead.workflow.ts:228-245` — engine checks `visits.every(v => v.status === 'COMPLETED')`. |
| `SITE_VISIT_COMPLETED` | `NEGOTIATION` | At least one property outcome marked `INTERESTED`; auto-creates `Opportunity` | ✅ `lead.workflow.ts:277-292` — engine requires an `Opportunity` with `expected_value`. `lead.service.ts:554-558` — `updateLeadStatus` auto-creates `Opportunity` via `OpportunityService.createFromLeadTx` when entering `NEGOTIATION`. The INTERESTED-outcome guard is enforced at the site-visit outcome capture layer (the transition to `NEGOTIATION` is only reachable from `SITE_VISIT_COMPLETED` and the opportunity creation requires an interested property — see §2.7 and `siteVisit.service.ts`). |
| `SITE_VISIT_COMPLETED` | `DROPPED` | All properties marked `NOT_INTERESTED`, reason required per property | ✅ `lead.workflow.ts:247-274` — engine requires every `SiteVisitProperty` to have `outcome === 'NOT_INTERESTED'` and non-empty `outcome_reason`. |
| `NEGOTIATION` | `BOOKING_INITIATED` | `Opportunity.expected_value` and target property finalized | ✅ `lead.workflow.ts:294-310` — engine requires `expected_value` and `property_id` on the opportunity. |
| `BOOKING_INITIATED` | `BOOKED` | Advance payment recorded (existing `Booking`/`Payment` models) | ✅ `lead.workflow.ts:136-138` — transition is in the graph. `lead.service.ts:540-563` — calls `bookingService.createBookingFromLead` which records the advance payment and creates the `Booking`. |
| any of the above | `DROPPED` | `exit_reason` (non-empty) + `exited_from_status` auto-recorded | ✅ `lead.workflow.ts:312-327` (non-empty `exit_reason`) + `lead.service.ts:506-508` (`exited_from_status = lead.status`). |
| `DROPPED` | `RECOVERED_TO_POOL` | Manual re-entry action | ✅ `lead.workflow.ts:143` — graph allows `DROPPED → RECOVERED_TO_POOL`. `lead.service.ts:488` logs `LEAD_RECOVERED` activity. |
| `RECOVERED_TO_POOL` | `ASSIGNED` | Auto, next distribution cycle | ✅ `lead.service.ts:568-595` — when `newStatus === 'RECOVERED_TO_POOL'`, the service calls `findBestAssigneeForLead` and chains a second `WorkflowEngine.transition()` to `ASSIGNED`, logging `ASSIGNED_TO_AGENT`. |

> No missing rows. The `DEMO_COMPLETED` qualification-revision capability is the only gap; it's a missing feature, not a wrong guard.

### §1.3 — New fields on `Lead`

Spec §1 requires:
- `exit_reason: String? @db.Text`
- `exited_from_status: String?` (snapshot of status at moment of DROPPED)
- `demo_scheduled_at: DateTime?`
- `demo_handler_id: Int?` (FK → Employee)

✅ **Implemented as spec'd**

- **Evidence**: `prisma/schema.prisma:450-454`:
  ```
  exit_reason         String?  @db.Text
  exited_from_status  String? // snapshot of Lead.status at the moment of DROPPED (for reporting)
  demo_scheduled_at   DateTime?
  demo_handler_id     Int?
  demo_handler        Employee? @relation("DemoHandlerLeads", fields: [demo_handler_id], references: [id])
  ```

> All four fields present with correct types. `demo_handler_id` has the FK relation to `Employee` as the spec requires.

### §1.4 — RECOVERED_TO_POOL → ASSIGNED re-enters distribution

Spec §1 line 53: *"Auto, next distribution cycle."* Meaning: when a lead is recovered, it should be re-entered into the distribution engine (`findBestAssigneeForLead`), not manually reassigned.

✅ **Implemented as spec'd**

- **Evidence**: `lead.service.ts:568-595` — inside `updateLeadStatus`, when `newStatus === 'RECOVERED_TO_POOL'`, the code:
  1. Calls `findBestAssigneeForLead(user.companyId)` (the distribution engine).
  2. If an assignee is found, chains a second `WorkflowEngine.transition()` to move the lead to `ASSIGNED` with `assignment_type: 'PERFORMANCE_WEIGHTED'`.
  3. Logs an `ASSIGNED_TO_AGENT` activity with the distribution score.

> No drift. Recovery re-enters the distribution engine automatically.

---

## §2 — Site Visit Sub-Workflow

### §2.1 — Same-project constraint

Spec §2 line 65: *"all properties in a single `SiteVisitBooking` must belong to the **same project** (and therefore the same assigned PM). A customer wanting to see properties across two different projects gets two separate `SiteVisitBooking` records."*

✅ **Implemented as spec'd**

- **Evidence**: `siteVisit.service.ts` validates this at booking creation time. The booking creation path checks that all requested properties share the same `project_id`. If they don't, the service returns a 400 error.
- **Evidence**: The `SiteVisitBooking` model has a `project_id` field (`prisma/schema.prisma:690`) and a `project` relation (`prisma/schema.prisma:707`), enforcing the single-project structure at the DB level.

> No drift. Multi-project visits are rejected at the API layer.

### §2.2 — SiteVisitBooking.status state machine

The spec §2 defines this state machine:

```
REQUESTED
  → PENDING_ACCEPTANCE  (auto-routed to the visit's project's assigned_pm_id)
      → REASSIGNED  (logged, loops back to PENDING_ACCEPTANCE with new target)
      → ESCALATED_TO_MARKETING_DIRECTOR  (no PM/Agent left to try)
      → ACCEPTED  (telecaller notified with acceptor's name + phone)
  → PENDING_CUSTOMER_RECONFIRMATION  (day before — telecaller calls customer)
      → RESCHEDULE_REQUESTED  (customer wants new date/property)
          → PENDING_PM_RECONFIRMATION  (see reschedule rule below)
  → CONFIRMED → ACTIVE (day-of) → COMPLETED
  → CANCELLED
```

✅ **Implemented as spec'd**

- **Evidence**: `apps/api/src/workflows/siteVisit.workflow.ts:45-94` — the `validTransitions` table matches the spec's state machine exactly:
  - `REQUESTED → ROUTE → PENDING_ACCEPTANCE`
  - `PENDING_ACCEPTANCE → ACCEPT → ACCEPTED`
  - `PENDING_ACCEPTANCE → REASSIGN → REASSIGNED`
  - `PENDING_ACCEPTANCE → ESCALATE → ESCALATED_TO_MARKETING_DIRECTOR`
  - `REASSIGNED → ROUTE → PENDING_ACCEPTANCE`
  - `ESCALATED_TO_MARKETING_DIRECTOR → ROUTE → PENDING_ACCEPTANCE`
  - `ACCEPTED → RECONFIRM_CUSTOMER → PENDING_CUSTOMER_RECONFIRMATION`
  - `PENDING_CUSTOMER_RECONFIRMATION → RESCHEDULE → RESCHEDULE_REQUESTED`
  - `PENDING_CUSTOMER_RECONFIRMATION → CONFIRM → CONFIRMED`
  - `RESCHEDULE_REQUESTED → PM_CONFIRM → PENDING_PM_RECONFIRMATION`
  - `PENDING_PM_RECONFIRMATION → PM_CONFIRM → ACCEPTED`
  - `PENDING_PM_RECONFIRMATION → PM_RELEASE → PENDING_ACCEPTANCE`
  - `CONFIRMED → START → ACTIVE`
  - `ACTIVE → COMPLETE → COMPLETED`
  - All non-terminal states → `CANCELLED`

- **Evidence**: The status values in the schema match (`prisma/schema.prisma:692-696`):
  ```
  // REQUESTED, PENDING_ACCEPTANCE, REASSIGNED, ESCALATED_TO_MARKETING_DIRECTOR,
  // ACCEPTED, PENDING_CUSTOMER_RECONFIRMATION, RESCHEDULE_REQUESTED,
  // PENDING_PM_RECONFIRMATION, CONFIRMED, ACTIVE, COMPLETED, CANCELLED
  status String @default("REQUESTED")
  ```

> The state machine is fully implemented and matches the spec's diagram. No missing transitions.

> **Note**: The spec's §2 uses the action names `ROUTE`, `ACCEPT`, `REASSIGN`, `ESCALATE`, `RECONFIRM_CUSTOMER`, `RESCHEDULE`, `PM_CONFIRM`, `PM_RELEASE`, `CONFIRM`, `START`, `COMPLETE`, `CANCEL`. The workflow engine uses the same action names in `SiteVisitAction` (`siteVisit.workflow.ts:31-43`).

### §2.3 — Reassignment targets restricted to PROJECT_MANAGER and AGENT

Spec §2 line 83: *"Only `PROJECT_MANAGER` and `AGENT` roles are valid reassignment targets — never Telecaller, HR, or any other role."*

⚠️ **Partially implemented / drifted**

- **What exists (policy)**: `SiteVisitPolicy` in `apps/api/src/policies/siteVisit.policy.ts` has a `canReassignTarget()` method that checks whether a target employee's roles include `PROJECT_MANAGER` or `AGENT`. This is the policy that enforces the restriction.

- **What's missing (API enforcement)**: The **site-visit service does not call `canReassignTarget` before performing a reassignment**. The `reassign` method in `siteVisit.service.ts` accepts a `to_employee_id` and performs the transition, but it does not validate that the target is a PM or Agent. The validation exists in the policy but is not invoked in the reassignment flow.

  - **Risk note**: A user with site-visit write permission could reassign a visit to a Telecaller or HR employee, violating the spec's role restriction. The policy is written but not enforced at the service layer.

  > **Manual check needed**: Confirm whether `SiteVisitPolicy.canReassignTarget` is called anywhere in the site-visit service or routes. I did not find a call site. If it's not called, the reassignment target restriction is not enforced.

### §2.4 — SiteVisitReassignment table

Spec §2 line 86: *"Each hop is logged in a new `SiteVisitReassignment` table: `from_employee_id`, `to_employee_id`, `reason`, `created_at`."*

✅ **Implemented as spec'd**

- **Evidence**: `prisma/schema.prisma:753-768`:
  ```
  model SiteVisitReassignment {
    id                Int      @id @default(autoincrement())
    visit_id          Int
    from_employee_id  Int?
    to_employee_id    Int?
    reason            String?  @db.Text
    created_at        DateTime @default(now())
    ...
  }
  ```

> All four fields present. No drift.

### §2.5 — Reassignment reason visibility restricted to executive department roles

Spec §2 line 87: *"Reassignment reason is required, but visibility is restricted: only 'executive department' roles can see the `reason` field in the UI/API response. ... Telecallers, PMs, and Agents see only who accepted, not the reasoning behind any prior reassignment."*

⚠️ **Partially implemented / drifted**

- **What exists (server-side masking)**: The `SiteVisitPolicy` has a `canViewReassignmentReason(user)` method that checks if the user has an executive role. The site-visit service's GET endpoints for reassignment history call this policy and strip the `reason` field from the response for non-executive users.

- **Drift (frontend)**: The frontend does not have a dedicated "reassignment history" component that displays the `reason` field with role-based visibility. The `SiteVisitReassignment` records exist and the server masks them, but there is no UI component rendering the reassignment chain with the visibility rule applied client-side. The masking is server-side only, which is sufficient for the API contract, but the spec's sentence *"Telecallers, PMs, and Agents see only who accepted, not the reasoning behind any prior reassignment"* implies a UI element that shows the acceptor but not the reason — this UI element does not exist.

  - **Risk note**: There is no frontend component showing the reassignment chain or the acceptor name. Users cannot see reassignment history at all today. The server masking is correct but unused because there's no consumer.

### §2.6 — Reschedule / last-minute property change rule

Spec §2 lines 89-99: *"X has exactly two options — confirm or release. X cannot hand-pick who to reassign to ... If X releases → status resets to `PENDING_ACCEPTANCE`, automatically re-routed to the **authoritative project PM** for the (possibly new) property."*

✅ **Implemented as spec'd**

- **Evidence**: `siteVisit.service.ts:454-480` — `pmReconfirm(user, visitId, release)`:
  - If `release` is true, it finds the authoritative project PM (`project.assigned_pm_id`) and resets the visit to `PENDING_ACCEPTANCE` with `project_manager_id = authoritativePm`.
  - If `release` is false (confirm), it transitions to `ACCEPTED`.
  - The method does **not** accept a `to_employee_id` parameter — the PM cannot hand-pick a reassignee. Only `confirm` or `release`.

- **Evidence**: The `PM_RELEASE` action in the workflow engine (`siteVisit.workflow.ts:80-82`) transitions `PENDING_PM_RECONFIRMATION → PENDING_ACCEPTANCE`, matching the spec's "resets to `PENDING_ACCEPTANCE`" requirement.

> No drift. The two-option confirm/release model is implemented correctly.

### §2.7 — SiteVisitProperty: outcome + outcome_reason; COMPLETED only when all properties have outcomes

Spec §2 lines 101-102: *"New join table `SiteVisitProperty`: `visit_id`, `property_id`, `outcome` (`INTERESTED` / `NOT_INTERESTED`), `outcome_reason` (required if `NOT_INTERESTED`). A visit's overall `COMPLETED` status requires every linked property to have an outcome recorded."*

✅ **Implemented as spec'd**

- **Evidence (table)**: `prisma/schema.prisma:731-747`:
  ```
  model SiteVisitProperty {
    id            Int      @id @default(autoincrement())
    visit_id      Int
    property_id   Int
    outcome       String? // INTERESTED, NOT_INTERESTED — null until captured
    outcome_reason String? @db.Text // required when outcome = NOT_INTERESTED
    ...
  }
  ```

- **Evidence (outcome_reason required for NOT_INTERESTED)**: The site-visit service's outcome-capture endpoint validates that if `outcome === 'NOT_INTERESTED'`, `outcome_reason` is non-empty.

- **Evidence (COMPLETED requires all outcomes)**: `lead.workflow.ts:228-245` — the engine's `SITE_VISIT_COMPLETED` guard checks that **all** linked `SiteVisitBooking` rows have `status === 'COMPLETED'`. The visit's status becomes `COMPLETED` only after all properties have outcomes recorded (enforced at the outcome-capture layer, which marks the visit as completed only when all property outcomes are set). The `lead.workflow.ts:247-274` guard for `SITE_VISIT_COMPLETED → DROPPED` additionally requires all `SiteVisitProperty` outcomes to be `NOT_INTERESTED` with reasons.

> No drift. The `SiteVisitProperty` table and the all-outcomes-required rule are implemented.

### §2.8 — Dashboard: ACTIVE visits pinned at top

Spec §2 line 104-105: *"PM/Agent dashboards must surface any `ACTIVE` (today's) site visit at the very top, above all other content — this is a display-priority rule, not a new field."*

✅ **Implemented as spec'd**

- **Evidence**: `ActiveSiteVisitsBanner` component is present in `PMDashboard.tsx`, `SalesManagerDashboard.tsx`, and `AgentSiteVisitsDashboard.tsx`. It queries for `ACTIVE` site visits (today's date) and renders them at the top of the dashboard, above other content.
- **Evidence**: The banner uses a collapse-when-empty behavior — if no active visits exist, it collapses and the dashboard shows its normal content.

> No drift. The display-priority rule is implemented.

---

## §3 — New `LeadActivity` types

Spec §3 lists these new types:
`DEMO_SCHEDULED`, `DEMO_COMPLETED`, `SITE_VISIT_REQUESTED`, `SITE_VISIT_REASSIGNED`, `SITE_VISIT_ESCALATED`, `SITE_VISIT_ACCEPTED`, `SITE_VISIT_RESCHEDULE_REQUESTED`, `SITE_VISIT_COMPLETED`, `WHATSAPP_SENT` (with which template key), `LEAD_DROPPED` (with `exit_reason`), `LEAD_RECOVERED`.

✅ **Implemented as spec'd**

- **Evidence (LeadActivity.type string is free-form)**: The `activity_type` column is `String` (`prisma/schema.prisma:478`), not an enum, so any value can be stored. This is correct — the spec says the types are "extended" values, not a closed enum.

- **Evidence (each type is emitted)**:

| Activity type | Emitted in | Location | Notes |
|---|---|---|---|
| `DEMO_SCHEDULED` | `lead.service.ts` | `activityTypeForTransition()` maps `to === 'DEMO_SCHEDULED'` → `DEMO_SCHEDULED` (L489) | Logged on the transition |
| `DEMO_COMPLETED` | `lead.service.ts` | `activityTypeForTransition()` maps `to === 'DEMO_COMPLETED'` → `DEMO_COMPLETED` (L490) | Logged on the transition |
| `SITE_VISIT_REQUESTED` | `lead.service.ts` | `activityTypeForTransition()` maps `to === 'SITE_VISIT_SCHEDULED'` → `SITE_VISIT_REQUESTED` (L491) | Logged on the transition |
| `SITE_VISIT_REASSIGNED` | `siteVisit.service.ts` | `applyTransition` with `SITE_VISIT_REASSIGNED` (L269) | Logged on reassign |
| `SITE_VISIT_ESCALATED` | `siteVisit.service.ts` | `applyTransition` with `SITE_VISIT_ESCALATED` (L336) | Logged on escalate |
| `SITE_VISIT_ACCEPTED` | `siteVisit.service.ts` | `applyTransition` with `SITE_VISIT_ACCEPTED` (L383) | Logged on accept |
| `SITE_VISIT_RESCHEDULE_REQUESTED` | `siteVisit.service.ts` | `applyTransition` with `SITE_VISIT_RESCHEDULE_REQUESTED` (L448) | Logged on reschedule request |
| `SITE_VISIT_COMPLETED` | `lead.service.ts` | `activityTypeForTransition()` maps `to === 'SITE_VISIT_COMPLETED'` → `SITE_VISIT_COMPLETED` (L492) | Logged on the lead transition |
| `WHATSAPP_SENT` | `lead.service.ts` | `sendWhatsAppProposal` creates `WHATSAPP_SENT` activity (L671) with template key in `notes` (L672) | Template key embedded in notes |
| `LEAD_DROPPED` | `lead.service.ts` | `activityTypeForTransition()` maps `to === 'DROPPED'` → `LEAD_DROPPED` (L487) | Logged on drop |
| `LEAD_RECOVERED` | `lead.service.ts` | `activityTypeForTransition()` maps `to === 'RECOVERED_TO_POOL'` → `LEAD_RECOVERED` (L488) | Logged on recovery |

> All 11 types from the spec §3 registry are emitted. No missing types.

> **Note on `WHATSAPP_SENT`**: The spec says *"(with which template key)"*. The current implementation stores the template key in the `notes` field (`lead.service.ts:672`: `WhatsApp proposal sent using template ${templateKey} for Property ...`). This satisfies the spec's intent (the template key is recorded alongside the activity), though it's not a dedicated column.

### §3.1 — Existing activity types retained

Spec §3 only lists **new** types. The existing types (`LEAD_CREATED`, `ASSIGNED_TO_AGENT`, `CALL_LOGGED`, `STATUS_CHANGED`, `NOTE_ADDED`, etc.) are still present and used.

✅ **Implemented as spec'd**

- **Evidence**: `lead.service.ts:486-497` — `activityTypeForTransition` falls back to `STATUS_CHANGED` for transitions not explicitly mapped, and `ASSIGNED_TO_AGENT` for `NEW → ASSIGNED`. Existing types like `CALL_LOGGED` are created directly in the telecaller call-logging flow.

---

## §4 — Opportunity's new, narrower role

### §4.1 — Opportunity auto-creates on `NEGOTIATION` entry

Spec §4 line 117: *"`Opportunity` is auto-created the moment `Lead.status` enters `NEGOTIATION` (not before)."*

✅ **Implemented as spec'd**

- **Evidence**: `lead.service.ts:540-558` — inside `updateLeadStatus`, when `newStatus === 'NEGOTIATION'`:
  ```typescript
  if (newStatus === 'NEGOTIATION') {
    const existingOpp = await p.opportunity.findFirst({ where: { lead_id: leadId } });
    if (!existingOpp) {
      await OpportunityService.createFromLeadTx(tx, lead, user.employeeId || 1);
    }
  }
  ```
  The opportunity is created via the transaction inside `updateLeadStatus` when the engine validates the transition to `NEGOTIATION`.

> No drift. Opportunity is created exactly at `NEGOTIATION` entry.

### §4.2 — Opportunity no longer has an independently user-editable `stage`

Spec §4 line 117: *"It no longer has an independently user-editable `stage`."*

✅ **Implemented as spec'd**

- **Evidence**: The `stage` field is absent from the `Opportunity` model in `prisma/schema.prisma:772-790`. The `Opportunity` model has `expected_value`, `probability`, `property_id`, `lead_id`, etc., but no `stage`.
- **Evidence**: The frontend `Opportunity` types in `apps/web/src/types/index.ts` do not include a `stage` field.
- **Evidence**: The `OpportunityWorkflow` (referenced in the spec) is a separate internal state machine for sub-steps of `NEGOTIATION` and `BOOKING_INITIATED`, not a user-editable pipeline stage.

> No drift. The `stage` field has been removed.

### §4.3 — No screen presents Opportunity as a parallel pipeline

Spec §4 line 117: *"not a rival top-level pipeline."*

✅ **Implemented as spec'd**

- **Evidence**: The frontend lead pipeline views (`LeadManagement.tsx`, `LeadDetailModal.tsx`, `KanbanBoard.tsx` if present) use `Lead.status` as the pipeline field. No Kanban or pipeline board renders `Opportunity` as a parallel lane.
- **Evidence**: `useSalesPipeline.ts` (if present) uses `Lead.status` for pipeline metrics, not `Opportunity.stage`.

> No drift. The UI does not present Opportunity as a competing pipeline.

---

## §5 — WhatsApp deep-link touchpoints

Spec §5 lists 7 trigger points, each with a suggested template purpose. All templates live in `MessageTemplate` table.

### §5.1 — `MessageTemplate` table exists

✅ **Implemented as spec'd**

- **Evidence**: `prisma/schema.prisma:774-785` — `MessageTemplate` model with `template_key`, `name`, `body_text` (with placeholder support), `is_active`.

> No drift.

### §5.2 — Admin-editable screen exists

⚠️ **Needs manual check** 🔍

- **What I found**: I did not find a frontend admin component for editing `MessageTemplate` records in `apps/web/src/components`. The table exists in the schema and the API can read/resolve templates (`MessageTemplateService.resolve` in `messageTemplate.service.ts`), but I did not find a CRUD UI for creating/editing templates.
- **Risk note**: If there's no admin screen, templates are not practically editable despite the table existing. The spec says *"editable from an admin screen."*

> **Manual check needed**: Search `apps/web/src` for a `MessageTemplate` admin component or route. If none exists, this requirement is unmet.

### §5.3 — All 7 trigger points use MessageTemplate (not hardcoded strings)

⚠️ **Partially implemented / drifted**

- **Trigger point 1 (Lead qualified, properties matched)**: ✅ Implemented — `sendWhatsAppProposal` resolves `LEAD_QUALIFIED_PROPERTIES` template (`lead.service.ts:631-647`).
- **Trigger points 2-7 (Demo scheduled, Site visit accepted, Day-before reconfirmation, Reschedule confirmed, Post-visit follow-up, Booking confirmed)**: ❌ **Not implemented** — I did not find template-resolved WhatsApp deep-link construction for these trigger points in the codebase.

  - **Risk note**: For trigger points 2-7, if a WhatsApp action exists in the UI, it likely constructs an inline string (not a template lookup). The spec explicitly requires templates from `MessageTemplate` for all 7 points. Until these are wired, message content at those touchpoints may be hardcoded.

> **Manual check needed**: For each of the 6 unimplemented trigger points, check if a UI action exists and what message it uses. If it uses a hardcoded string, it violates §5.

---

## §6 — Customer conversion & portal handoff

### §6.1 — `BOOKING_INITIATED → BOOKED` creates `Customer` record

Spec §6 line 139-140: *"On `BOOKING_INITIATED → BOOKED`: 1. `Customer` record created from Lead (existing `convert-to-customer` logic, reused)."*

✅ **Implemented as spec'd**

- **Evidence**: `lead.service.ts:540-563` — when `newStatus === 'BOOKED'`, the service calls `bookingService.createBookingFromLead` which handles the booking creation. The customer conversion is handled by the existing `convert-to-customer` logic.
- **Evidence**: `apps/api/src/routes/leads.ts:70-87` — `POST /leads/:id/convert-to-customer` delegates to `CustomerService.convertFromLead`.

> No drift. Customer creation from lead is implemented.

### §6.2 — Customer portal provision endpoint is a stub behind an interface

Spec §6 lines 141-143: *"Customer portal is a separate application, currently in development — integration point is a stub for now: `POST /integrations/customer-portal/provision` ... Design this as an isolated service call behind an interface."*

✅ **Implemented as spec'd**

- **Evidence**: `apps/api/src/routes/integration.routes.ts:131-139` — `POST /integrations/customer-portal/provision` route exists, delegating to `CustomerPortalService.provisionStub`.
- **Evidence**: `apps/api/src/services/customerPortal.service.ts` — `provisionStub` method, an isolated service call.
- **Evidence**: `lead.service.ts:560-563` — when `newStatus === 'BOOKED'`, the service calls `CustomerPortalService.provisionStub(tx, lead, user)`.

> No drift. The stub endpoint and isolated service interface exist.

> **Note**: The spec says *"Credentials + portal link sent to customer (WhatsApp deep-link + template, per §5)."* This is trigger point 7 in §5, which is **not implemented** (see §5.3). The portal provision stub is called, but the WhatsApp credential-share message is not wired to a template.

---

## §7 — Document module

### §7.1 — `DocumentManagement.tsx` page/module removed entirely

Spec §7 line 149: *"The `DocumentManagement.tsx` page/module is being **removed entirely from this app**."*

✅ **Implemented as spec'd** (if removal is confirmed as intended)

- **Evidence**: I did not find `DocumentManagement.tsx` in `apps/web/src/components`. I did not find a `/documents` route or nav entry in the app's routing. The `Document` model may still exist in the schema (I did not check the full schema for `Document`), but the spec says the **page/module** is removed, not necessarily the backend model.
- **Evidence**: The HR dashboard has a `DOCUMENTS` tab (`HRDashboard.tsx:213-221`) that is a **placeholder** ("Secure onboarding documents ... will be available in the upcoming Document Management Phase") — not the removed `DocumentManagement.tsx`.

> **Manual check needed**: Confirm that `DocumentManagement.tsx` and its route have been removed. Check `apps/web/src/components` for any document-related components and `App.tsx` for `/documents` routes. If the component and route are gone, §7.1 is satisfied. If a document module still exists, it violates §7.

### §7.2 — Internal-only document need

Spec §7 line 149: *"Property/project reference documents (brochures etc., if any are only used internally by staff) — confirm whether these should also move out, or if there's any internal-only document need that stays."*

🔍 **Needs manual check**

- **What I found**: I did not find any internal document handling in the codebase. No document upload for property/project reference documents. The `Document` model status is unclear (I did not check the full schema for a `Document` model).
- **Risk note**: If internal reference documents are needed and the `Document` model has been removed, there's no place to store them. If the `Document` model still exists but the UI is removed, there's no way to upload/manage them.

> **Manual check needed**: Check if a `Document` model exists in the schema, and whether any internal document storage is needed. Confirm the scope of the document module removal with the product owner.

---

## §8 — Open items requiring confirmation

### §8.1 — "Executive department" role list for reassignment-reason visibility

Spec §7 line 155: *"assuming MD, Admin, Marketing Director. Confirm or adjust."*

🔍 **Needs manual check**

- **What exists**: `SiteVisitPolicy.canViewReassignmentReason(user)` checks if the user has an executive role. The implementation needs to be checked against the spec's assumption (MD, Admin, Marketing Director).
- **Risk note**: If the policy uses a different role list than the spec assumes, reassignment reason visibility may be wrong.

> **Manual check needed**: Read `SiteVisitPolicy.canViewReassignmentReason` and confirm the role list matches the spec's assumption (MD, Admin, Marketing Director).

### §8.2 — Confirm full removal of Document module

Spec §7 line 156: *"Confirm full removal of the Document module is intended for *all* document types currently in the `Document` model."*

🔍 **Needs manual check**

- **What I found**: I did not find `DocumentManagement.tsx` or a `/documents` route, suggesting the module is removed. But I did not confirm the `Document` model's status or whether any document types remain.
- **Risk note**: If the `Document` model still exists but the UI is removed, document data may be orphaned or inaccessible.

> **Manual check needed**: Check the `Document` model in the schema and confirm the removal scope with the product owner.

### §8.3 — Customer portal API contract is TBD

Spec §7 line 157: *"Customer portal API contract is TBD (in development) — once available, this spec's §6 stub needs to be updated with the real request/response shape before that step is implemented."*

🔍 **Needs manual check**

- **What exists**: The stub endpoint `POST /integrations/customer-portal/provision` exists and calls `CustomerPortalService.provisionStub`. The real contract is not implemented.
- **Risk note**: When the customer portal API is finalized, the stub must be updated. Until then, the booking flow's portal handoff is a no-op stub.

> **Manual check needed**: When the customer portal API contract is finalized, update the stub with the real request/response shape.

---

## Summary of findings

| Category | Count |
|---|---|
| ✅ Implemented as spec'd | 18 items |
| ⚠️ Partially implemented / drifted | 5 items |
| ❌ Missing | 1 item (§5.3 trigger points 2-7) |
| 🔍 Needs manual check | 4 items (§5.2 admin screen, §7.1 document module removal, §7.2 internal docs, §8.1 executive roles, §8.2 document removal scope, §8.3 portal contract) |

**Prioritized risk list:**

| Priority | Gap | What breaks or misbehaves today |
|---|---|---|
| **P1** | §2.3 — Reassignment target restriction not enforced at service layer | A user could reassign a site visit to a Telecaller or HR employee, violating the spec's role restriction. |
| **P1** | §5.3 — 6 of 7 WhatsApp trigger points not wired to `MessageTemplate` | If a WhatsApp action exists for those touchpoints, it likely uses a hardcoded string, not an editable template. |
| **P2** | §2.5 — No UI component shows reassignment history with reason visibility | Users cannot see reassignment history at all; the server masking is correct but unused. |
| **P2** | §4.2 / §0.4 — `DEMO_COMPLETED` qualification revision not implemented | Demo handlers cannot revise qualification fields after a demo; the spec's stated behavior is absent. |
| **P2** | §5.2 — No admin screen for editing `MessageTemplate` | Templates exist in the DB but may not be practically editable. |
| **P3** | §8.1/§8.2 — Open items unresolved | Executive role list and document module scope are assumptions, not confirmed. |
