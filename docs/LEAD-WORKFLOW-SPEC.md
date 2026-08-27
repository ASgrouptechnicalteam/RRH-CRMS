# RRH-CRMS — Lead-to-Customer Workflow Specification (v1)

**Status:** Draft for implementation. This document is the single source of truth for the lead pipeline — every future coding-agent prompt for this feature area should reference this file directly instead of re-explaining the flow from chat history.

**Replaces:** the current dual `Lead.status` + `Opportunity.stage` model. From this spec onward there is exactly **one** macro pipeline (`Lead.status`); `Opportunity` becomes a subordinate commercial record, not a competing pipeline.

---

## 0. Design Principles (apply to every section below)

1. **One macro status, always.** `Lead.status` is the only field that represents "where this customer is" at a glance. Every other status (site visit sub-states, opportunity fields) is a detail nested *underneath* the current macro status — never displayed as if it were an alternative primary status.
2. **No free-form status editing.** The UI never presents a raw dropdown of all statuses. Every transition happens via a specific action/button, and the backend workflow engine is the only thing allowed to write `Lead.status` — no service is permitted to bypass it with a direct `tx.lead.update({ status })`.
3. **Every exit demands a reason.** Any transition into `DROPPED` requires a non-empty reason and records which status the lead exited from.
4. **Every action is logged with actor + timestamp**, using the existing `LeadActivity` model, extended with new `activity_type` values (listed per section below) — this is what gives you "Telecaller Priya called at 3:40 PM" style history.
5. **WhatsApp is always a manual deep-link, never automatic.** Every "send WhatsApp" action opens `wa.me/<number>?text=<encoded template>` for a human to review and send — never sent server-side. Templates are pulled from an editable `MessageTemplate` table, not hardcoded strings.

---

## 1. Lead Macro-Status Pipeline

```
NEW → ASSIGNED → CONTACTED → QUALIFICATION_PENDING → QUALIFIED
    → [optional] DEMO_SCHEDULED → DEMO_COMPLETED
    → SITE_VISIT_SCHEDULED → SITE_VISIT_COMPLETED
    → NEGOTIATION → BOOKING_INITIATED → BOOKED

DROPPED reachable from: ASSIGNED, CONTACTED, QUALIFICATION_PENDING, QUALIFIED,
                      DEMO_SCHEDULED, DEMO_COMPLETED, SITE_VISIT_SCHEDULED,
                      SITE_VISIT_COMPLETED, NEGOTIATION, BOOKING_INITIATED
DROPPED → RECOVERED_TO_POOL → ASSIGNED
```

### Transition table

| From | To | Guard / required fields | Notes |
|---|---|---|---|
| `NEW` | `ASSIGNED` | Auto, on distribution engine match | Existing `findBestAssigneeForLead` logic reused |
| `ASSIGNED` | `CONTACTED` | `LeadActivity` with `activity_type: CALL_LOGGED` must exist | Telecaller logs a call first |
| `CONTACTED` | `QUALIFICATION_PENDING` | Auto, if `budget_min`/`budget_max`/`property_type_preference`/`preferred_location` are all still null (true for bulk-upload leads) | |
| `CONTACTED` | `QUALIFIED` | Direct, only if qualification fields already present | Skips `QUALIFICATION_PENDING` when data already exists |
| `QUALIFICATION_PENDING` | `QUALIFIED` | UI **forces** a form capturing budget range, property type, preferred location before allowing this transition | This is the "ask for details" gate you described |
| `QUALIFIED` | `DEMO_SCHEDULED` | `demo_scheduled_at` set, `demo_handler_id` set | Optional branch |
| `QUALIFIED` | `SITE_VISIT_SCHEDULED` | At least one `SiteVisitBooking` created (see §2) | Direct path, demo skipped |
| `DEMO_SCHEDULED` | `DEMO_COMPLETED` | Demo handler submits notes + updated qualification fields | Demo handler may revise budget/property-type/location captured earlier |
| `DEMO_COMPLETED` | `SITE_VISIT_SCHEDULED` | At least one `SiteVisitBooking` created | |
| `SITE_VISIT_SCHEDULED` | `SITE_VISIT_COMPLETED` | All linked `SiteVisitBooking` rows reach `COMPLETED` (see §2) | |
| `SITE_VISIT_COMPLETED` | `NEGOTIATION` | At least one property outcome marked `INTERESTED` | Auto-creates `Opportunity` record (see §4) |
| `SITE_VISIT_COMPLETED` | `DROPPED` | All properties marked `NOT_INTERESTED`, reason required per property | |
| `NEGOTIATION` | `BOOKING_INITIATED` | `Opportunity.expected_value` and target property finalized | |
| `BOOKING_INITIATED` | `BOOKED` | Advance payment recorded (existing `Booking`/`Payment` models) | Triggers customer account provisioning (§6) |
| any of the above | `DROPPED` | `exit_reason` (non-empty text) + `exited_from_status` auto-recorded | |
| `DROPPED` | `RECOVERED_TO_POOL` | Manual re-entry action | Re-enters distribution pool |
| `RECOVERED_TO_POOL` | `ASSIGNED` | Auto, next distribution cycle | |

### New fields on `Lead`
- `exit_reason: String? @db.Text`
- `exited_from_status: String?` (snapshot of status at moment of DROPPED, for reporting — e.g. "dropped from QUALIFIED" vs "dropped from NEGOTIATION" tell very different stories)
- `demo_scheduled_at: DateTime?`
- `demo_handler_id: Int?` (FK → Employee; the PM/manager assigned to the demo — can differ from the eventual site-visit PM per your confirmation)

---

## 2. Site Visit Sub-Workflow (nested under `SITE_VISIT_SCHEDULED`)

**Constraint confirmed:** all properties in a single `SiteVisitBooking` must belong to the **same project** (and therefore the same assigned PM). A customer wanting to see properties across two different projects gets two separate `SiteVisitBooking` records.

### `SiteVisitBooking.status` state machine

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

### Reassignment chain rules (initial acceptance)
- Only `PROJECT_MANAGER` and `AGENT` roles are valid reassignment targets — never Telecaller, HR, or any other role.
- A PM/Agent who cannot take the visit **must** reassign to another PM/Agent — there is no bare "decline" action.
- If no PM/Agent is available, the request escalates to `MARKETING_DIRECTOR` for manual resolution.
- Each hop is logged in a new `SiteVisitReassignment` table: `from_employee_id`, `to_employee_id`, `reason`, `created_at`.
- **Reassignment reason is required, but visibility is restricted**: only "executive department" roles can see the `reason` field in the UI/API response. *(Open item — see §7, need your confirmation on exactly which roles count as "executive": MD, Admin, and Marketing Director are my assumption.)* Telecallers, PMs, and Agents see only who accepted, not the reasoning behind any prior reassignment — same masking pattern already used for employee PII in `EmployeeManagement.tsx`.

### Reschedule / last-minute property change rule (this is the important nuance you flagged)
This is **different** from the initial open reassignment chain:

1. Visit is `ACCEPTED` by PM/Agent X.
2. Customer requests a change (new date, and/or a different property).
3. Status → `PENDING_PM_RECONFIRMATION`. X is notified: *"Customer changed the visit — confirm you can still attend, or release it."*
4. **X has exactly two options — confirm or release. X cannot hand-pick who to reassign to** (unlike the open chain in initial acceptance).
5. If X confirms → back to `ACCEPTED` with the updated date/property, continue as normal (day-before reconfirmation, etc.).
6. If X releases → status resets to `PENDING_ACCEPTANCE`, automatically re-routed to the **authoritative project PM** for the (possibly new) property — i.e., back to square one of the standard open chain in the section above, which can reassign/escalate normally from there.

This prevents PM-to-PM ping-ponging after a change — any release always resets to the one authoritative starting point rather than X picking the next person themselves.

### Multi-property outcome capture
New join table `SiteVisitProperty`: `visit_id`, `property_id`, `outcome` (`INTERESTED` / `NOT_INTERESTED`), `outcome_reason` (required if `NOT_INTERESTED`). A visit's overall `COMPLETED` status requires every linked property to have an outcome recorded.

### Dashboard requirement (flagged for the frontend implementation pass, not a data model change)
PM/Agent dashboards must surface any `ACTIVE` (today's) site visit at the very top, above all other content — this is a display-priority rule, not a new field.

---

## 3. New `LeadActivity` types needed

`DEMO_SCHEDULED`, `DEMO_COMPLETED`, `SITE_VISIT_REQUESTED`, `SITE_VISIT_REASSIGNED`, `SITE_VISIT_ESCALATED`, `SITE_VISIT_ACCEPTED`, `SITE_VISIT_RESCHEDULE_REQUESTED`, `SITE_VISIT_COMPLETED`, `WHATSAPP_SENT` (with which template key), `LEAD_DROPPED` (with `exit_reason`), `LEAD_RECOVERED`.

---

## 4. Opportunity's new, narrower role

`Opportunity` is auto-created the moment `Lead.status` enters `NEGOTIATION` (not before). It no longer has an independently user-editable `stage` — it exists purely to hold the commercial detail: final property, `expected_value`, `probability`, payment plan, and the documents/history tied to closing the deal. Its own `OpportunityWorkflow` state machine (already well-built) can stay, but it now represents *sub-steps of NEGOTIATION and BOOKING_INITIATED*, not a rival top-level pipeline.

---

## 5. WhatsApp deep-link touchpoints (template needed at each)

| Trigger point | Suggested template purpose |
|---|---|
| Lead qualified, properties matched | Share matched property list + invite to discuss |
| Demo scheduled | Confirm demo date/time with customer |
| Site visit accepted | Share attending PM/Agent's name, phone, property, date/time |
| Day-before reconfirmation | "Confirming your visit tomorrow at X" |
| Reschedule confirmed | New date/time confirmation |
| Post-visit follow-up (interested) | Thank-you + next steps toward booking |
| Booking confirmed | Welcome + customer portal credentials (see §6) |

All templates live in a new `MessageTemplate` table (`template_key`, `body_text` with `{customer_name}`, `{property_name}`, `{pm_name}`, `{visit_date}` placeholders) editable from an admin screen — not hardcoded in components.

---

## 6. Customer conversion & portal handoff

On `BOOKING_INITIATED → BOOKED`:
1. `Customer` record created from Lead (existing `convert-to-customer` logic, reused).
2. Default customer ID + password generated.
3. **Customer portal is a separate application, currently in development** — integration point is a stub for now: `POST /integrations/customer-portal/provision` (exact contract to be confirmed once that app's API is finalized). Design this as an isolated service call behind an interface, so swapping in the real contract later doesn't touch the rest of the booking flow.
4. Credentials + portal link sent to customer (WhatsApp deep-link + template, per §5).

---

## 7. Document module

The `DocumentManagement.tsx` page/module is being **removed entirely from this app** — document handling (customer KYC, agreements, receipts) is owned by the customer portal going forward. Property/project reference documents (brochures etc., if any are only used internally by staff) — confirm whether these should also move out, or if there's any internal-only document need that stays. *(Assumption: full removal, per your clarification — flagging only in case there's an internal-use exception you want to carve out.)*

---

## 8. Open items requiring your confirmation before implementation

1. **"Executive department" role list** for reassignment-reason visibility — assuming MD, Admin, Marketing Director. Confirm or adjust.
2. Confirm full removal of the Document module is intended for *all* document types currently in the `Document` model (customer, lead, opportunity, booking, property, project, payment), not just customer-facing ones.
3. Customer portal API contract is TBD (in development) — once available, this spec's §6 stub needs to be updated with the real request/response shape before that step is implemented.
