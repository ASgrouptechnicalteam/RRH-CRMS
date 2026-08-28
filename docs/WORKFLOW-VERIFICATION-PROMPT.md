# RRH-CRMS — Lead Workflow Verification Audit (Prompt Pack)

**Purpose:** You said the real problem isn't "add more features" — it's that a month of continuous re-planning may have left the architecture drifted from `LEAD-WORKFLOW-SPEC.md`, and you can't tell where. This is not a fix prompt. It's a **read-only audit** that produces a gap report you review before authorizing any change. Fixing before you can see the full gap list is exactly the pattern that got the codebase here.

**Agent:** Hermes. This needs rule-following correctness against a spec, not speed — a false "✅ implemented" is worse than a slow honest answer.

**Run this in its own branch, with zero write access mentality:** `agent/hermes/audit-workflow-v1`. The agent should not edit any application code during this session — only produce the report file.

---

## Master Prompt

Paste this into Hermes as one session:

> You are auditing this codebase against `docs/LEAD-WORKFLOW-SPEC.md`, which is the single source of truth for the lead pipeline. **Do not modify any application code in this session.** Your only output is a new file: `docs/audits/WORKFLOW-VERIFICATION-RESULT.md`.
>
> Work through the checklist below section by section. For every item, search the actual codebase (Prisma schema, workflow engine, services, routes, frontend components) and report one of three verdicts:
> - ✅ **Implemented as spec'd** — cite the file(s) and line range(s) that prove it.
> - ⚠️ **Partially implemented / drifted** — cite what exists, and explain precisely how it differs from the spec (wrong field name, missing guard, logic in the wrong layer, etc.). Do not guess — if you're not sure, say so and mark it 🔍 **needs manual check** instead of guessing either way.
> - ❌ **Missing** — confirm you searched for it (mention where you looked) and found nothing.
>
> For every ⚠️ or ❌, add a one-line **risk note**: what breaks or misbehaves in production today because of this gap. This is what turns the report into a prioritized list instead of a wall of checkmarks.
>
> Do not silently "fix while you look" — even a one-line typo fix. Flag it in the report instead. This audit's only job is to tell the truth about current state.

---

## Checklist (mirrors `LEAD-WORKFLOW-SPEC.md` sections 1:1)

### §0 — Design Principles (cross-cutting — check these last, they inform everything above)
- [ ] Is there exactly **one** macro pipeline field (`Lead.status`), or does `Opportunity.stage` (or anything else) still act as a second competing status anywhere in the UI or API?
- [ ] Search every service file for direct `tx.lead.update({ status: ... })` or `prisma.lead.update({ status })` calls **outside** the workflow engine. Any hit is a spec violation — status may only change through the engine.
- [ ] Does the frontend anywhere render a raw dropdown of all lead statuses (old pattern), instead of action buttons for valid next transitions only?
- [ ] Every `DROPPED` transition — is a non-empty reason enforced server-side (not just in the UI form)?
- [ ] Is every transition logged to `LeadActivity` with actor + timestamp, using the activity types listed in §3?
- [ ] Every "send WhatsApp" action — confirm it opens a `wa.me/...` deep link client-side and nothing sends WhatsApp messages server-side.

### §1 — Lead Macro-Status Pipeline
- [ ] Does the `Lead.status` enum (Prisma schema) contain exactly the statuses in the pipeline diagram — no extra legacy statuses left over, none missing?
- [ ] Check each row of the transition table individually — does the workflow engine enforce the **guard** listed (e.g. `CONTACTED → QUALIFICATION_PENDING` auto-triggers only when qualification fields are null)? List each transition with its verdict, not just "transitions exist."
- [ ] Confirm the four new `Lead` fields exist with correct types: `exit_reason`, `exited_from_status`, `demo_scheduled_at`, `demo_handler_id`.
- [ ] `RECOVERED_TO_POOL → ASSIGNED` — confirm this re-enters the existing distribution engine (`findBestAssigneeForLead`) rather than a separate/duplicated assignment path.

### §2 — Site Visit Sub-Workflow
- [ ] Confirm the constraint: all properties in one `SiteVisitBooking` belong to the same project. Is this enforced at the API layer (reject on create) or only assumed by the UI?
- [ ] Walk the full `SiteVisitBooking.status` state machine — does every state in the diagram exist, and does every listed transition exist in code?
- [ ] Reassignment chain: confirm only `PROJECT_MANAGER` and `AGENT` are valid reassignment targets at the API/authorization layer, not just filtered out in a dropdown.
- [ ] Confirm `SiteVisitReassignment` table exists with `from_employee_id`, `to_employee_id`, `reason`, `created_at`.
- [ ] **Reassignment reason visibility** — confirm the `reason` field is actually stripped/masked server-side for non-executive roles in the API response, not just hidden in the UI (hiding in UI only is a data leak). Flag if the "executive roles" list isn't finalized yet (see spec §8 open item #1) and confirm what's currently implemented.
- [ ] **Reschedule rule — this is the nuance most likely to have drifted.** Confirm: when a customer requests a change on an `ACCEPTED` visit, the assigned PM/Agent gets exactly two options (confirm / release) and **cannot** hand-pick a new assignee. Confirm "release" always resets to `PENDING_ACCEPTANCE` routed to the authoritative project PM — not to whoever released it choosing the next person. This is functionally different from the open reassignment chain in initial acceptance; confirm the code actually treats them as two different code paths and doesn't collapse them into one generic "reassign" function.
- [ ] `SiteVisitProperty` join table — confirm `outcome` and `outcome_reason` (required when `NOT_INTERESTED`) exist, and that a visit can only reach `COMPLETED` once every linked property has an outcome.
- [ ] Dashboard priority rule — confirm `ACTIVE` (today's) visits are actually pinned above other content in `PMDashboard` / `AgentSiteVisitsDashboard`, not just present somewhere on the page.

### §3 — LeadActivity Types
- [ ] List every `activity_type` currently in the enum/table vs. the full list required by the spec (`DEMO_SCHEDULED`, `DEMO_COMPLETED`, `SITE_VISIT_REQUESTED`, `SITE_VISIT_REASSIGNED`, `SITE_VISIT_ESCALATED`, `SITE_VISIT_ACCEPTED`, `SITE_VISIT_RESCHEDULE_REQUESTED`, `SITE_VISIT_COMPLETED`, `WHATSAPP_SENT`, `LEAD_DROPPED`, `LEAD_RECOVERED`). Flag any missing ones and any that exist but are never actually written by the code that should trigger them.

### §4 — Opportunity's Narrower Role
- [ ] Confirm `Opportunity` auto-creates exactly on `Lead.status` entering `NEGOTIATION` — not earlier, not on manual creation elsewhere.
- [ ] Confirm `Opportunity.stage` (if the field still exists in the schema) is no longer independently user-editable from the UI.
- [ ] Confirm no screen presents `Opportunity` as a parallel/competing pipeline to the Lead detail view.

### §5 — WhatsApp Templates
- [ ] Confirm `MessageTemplate` table exists with `template_key`, `body_text`, and placeholder support (`{customer_name}`, `{property_name}`, `{pm_name}`, `{visit_date}`).
- [ ] Cross-check each of the 7 trigger points in the spec's table — does a deep-link button actually exist at each point, pulling from `MessageTemplate` (not a hardcoded string in the component)?

### §6 — Customer Conversion & Portal Handoff
- [ ] Confirm `BOOKING_INITIATED → BOOKED` triggers `Customer` record creation via the existing `convert-to-customer` logic.
- [ ] Confirm the `POST /integrations/customer-portal/provision` stub exists behind an isolated service interface (not inline in the booking transaction) — this matters because the real contract isn't final yet, and inline coupling here is exactly the kind of thing that becomes a breaking change later.

### §7 — Document Module Removal
- [ ] Confirm `DocumentManagement.tsx` and its nav entry are fully removed, per the assumption in the spec.
- [ ] Flag any remaining internal-only document usage (property/project reference docs) that may have been swept out unintentionally — the spec noted this as an open question, not a settled removal of everything.

### §8 — Open Items (report current state even if unresolved)
- [ ] What is currently implemented for "executive department" role visibility, if anything, pending your confirmation of the exact role list?
- [ ] Is the Document module removal scoped to customer-facing docs only, or literally everything in the `Document` model? Report what the code actually does today, regardless of what was intended.
- [ ] Confirm the customer-portal provisioning call is stubbed/mocked cleanly and doesn't silently fail or silently succeed in a way that would hide integration bugs later.

---

## After you get the report back

Do **not** hand the raw report straight back to an agent as a "now fix all of this" prompt — a wall of ⚠️/❌ items is exactly the kind of long, dense instruction set that caused drift the first time. Instead:

1. Read the report yourself first. Sort the ❌ and ⚠️ items by the risk note, not by spec order.
2. Group fixes into small, single-scope sessions (same discipline as `TASK-ASSIGNMENTS.md`) — one gap area per branch, one commit per fix, verify build after each.
3. Anything marked 🔍 needs manual check — resolve that yourself (or with me) before it becomes an agent prompt, since it means even Hermes wasn't confident.
