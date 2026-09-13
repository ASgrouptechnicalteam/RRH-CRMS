## **Part 1: Final Lead Engine Workflow Specification**

### **1\. Intake & Ownership**

- **Add to Pool** (any employee can trigger) — lead enters distribution, no owner assigned yet
- **Add as My Lead** (telecaller-only action) — immediate, direct ownership, bypasses distribution entirely
- `introduced_by` — set once at creation, permanent, attribution-only, **never affects performance scoring**
- Duplicate check by phone number required before creating any new lead record

### **2\. Distribution → Contacted → Qualified**

- Pool leads distributed to available telecallers (algorithm TBD by your team — round robin or performance-weighted)
- Qualification fields can be saved partially, any time — the lead advances to `QUALIFIED` only once all required fields are complete. No separate "pending" state.
- Non-blocking property sharing (WhatsApp, prefilled text \+ images \+ a live-status property link) available any time after qualification. Logged as "shared" — intent only, not delivery confirmation, since there's no WhatsApp API.

### **3\. Demo (optional branch)**

- PM allocated by project/area (same logic as site visits)
- Demo page shows full property detail (large images, professional layout, matching your public website's property pages)
- Customer can mark properties "interested" during the demo
- PM logs, in one combined action: a required summary, optional "interested" markings, and optionally creates a site visit request — these are not competing/exclusive options

### **4\. Site Visit Requested (blind to PM)**

- PM sees only: project, location, unique reference ID — **no customer PII** until approved
- Allocated by project/area-assigned PM
- **If no PM covers the project/area at all**: immediate fallback notification to Marketing Director (proposed default — confirm before build)

**Escalation ladder** (fixed thresholds relative to actual visit time, not a rolling timer):

- At **12 hours before** the visit, if still unresolved → notify **Marketing Director**
- At **10 hours before** the visit, if still unresolved → notify **Managing Director**
- If the request is created with **under 12 hours' notice** → notify Marketing Director immediately
- If created with **under 10 hours' notice** → notify **both** Marketing Director and Managing Director together

**Reassignment**: PM selects a specific named colleague from the eligible pool. Cannot reassign back to someone who already declined this exact request (no ping-pong).

### **5\. PM Approval → Reconfirmation**

- **Approve** → telecaller notified to relay PM's contact details to the customer; system auto-creates a reconfirmation reminder task for 1 day before the visit
- **Reassign** → returns to Site Visit Requested for a new PM, same escalation ladder applies
- **Reschedule** (customer-initiated) → notifies the _already-approved_ PM directly (lighter flow, not a fresh blind submission) — approve/reassign, same escalation ladder applies

### **6\. Reconfirmation Failure → Hold → Cancel Sequence**

1. Reconfirmation attempts fail → status \= **ON\_HOLD**, PM notified
2. Telecaller retries **1 hour before** the visit
3. Still no answer → telecaller cross-checks with PM: _"Has the customer responded to you?"_ — no fixed timer at this step; judgment-based, telecaller keeps attempting through multiple channels/approaches
4. Cancellation only finalizes when **both telecaller and PM agree**. Required fields on the cancellation record: **reason** \+ **which PM confirmed it** (audit trail, no automated escalation trigger at this specific step — deliberately manual given how loose real estate scheduling is)
5. Once cancelled, telecaller sends a WhatsApp reschedule request to the customer

### **7\. Site Visit Completed**

- PM logs: visit status (completed / no-show / cancelled), customer response, summary, and a per-property outcome (interested / not interested \+ a **structured** reason category)
- **No-show cap**: proposed default of 2 no-shows → auto-flag to the telecaller's manager (**proposed, not yet confirmed** — validate before build)

### **8\. Post-Visit Branch**

- Any property marked Interested → creates/updates Opportunity → **Negotiation** → **Booking Initiated**
- All properties Not Interested:
  - Reason \= **"no matching inventory"** specifically → Dropped, eligible for automatic recovery (Mechanism 1 below)
  - Any other structured reason (chose competitor, budget mismatch, not ready, etc.) → Dropped, **not** eligible for automatic recovery

### **9\. Recovery — Two Distinct Mechanisms (do not merge these)**

**Mechanism 1 — Automatic, inventory-triggered**

- Triggered whenever a property is added/updated, checked against all leads dropped specifically for "no matching inventory"
- Runs on every property change, plus a nightly sweep as backup
- Routes back to the **original owning telecaller**, always
- Qualification data preserved and editable

**Mechanism 2 — Manual, customer-initiated re-engagement**

- Customer calls back on their own; telecaller looks them up by phone number
- System must surface: drop/cancellation reason, saved qualification details, who previously handled them, which property (if any) they were scheduled to visit, and that property's **current** availability
- Ownership goes to **whoever handles this new contact** — fresh ownership applies here, same as the original intake rule (not forced back to the original telecaller)

### **10\. Booking Initiated → Customer**

- Conversion happens immediately at `BOOKING_INITIATED`, deliberately, for tracking purposes — not waiting for full booking finalization
- Customer Portal account auto-provisioned, credentials generated
- PM sends credentials via the same manual WhatsApp prefilled-template flow
- Temp password: short expiry, forced reset on first login, never logged in plaintext anywhere in the system

### **11\. Performance Tracking**

- Per telecaller: contact rate, qualification rate, demos booked, site visits completed, bookings closed, reconfirmation completion rate
- Per PM: requests approved/reassigned, average response time, visits completed
- `introduced_by` shown as attribution credit only — confirmed separate from any scoring

### **Still-open defaults — confirm these before the related build phase starts**

| Item                                           | Proposed default                                       | Status                         |
| ---------------------------------------------- | ------------------------------------------------------ | ------------------------------ |
| No PM covers project/area at all               | Immediate notify to Marketing Director                 | Needs confirmation             |
| No-show cap                                    | 2 no-shows → flag to telecaller's manager              | Needs confirmation             |
| Unreachable lead at first contact — retry cap  | Not yet numbered                                       | Needs a number from you        |
| Customer never responds to reschedule WhatsApp | Reuse same retry-cap/escalate pattern as first contact | Depends on the above being set |

---

## **Part 2: Implementation Plan**

Given your codebase already has a working `LeadWorkflow` engine, `SiteVisitBooking` model, Opportunity auto-creation, and the Tier 1/2 validation, singleton Prisma, and cron infrastructure already built — this is an extension of the existing system, not a rebuild. Sequence it to respect that.

#### **Phase A — Schema changes (do this first, everything else depends on it)**

- `Lead`: add `ownership_type` (enum: POOL / DIRECT), confirm `introduced_by` exists as a separate field from `assigned_to`/owner
- Replace free-text `exit_reason` with a **structured enum** for drop reasons (must include a distinct `NO_MATCHING_INVENTORY` value — this is what makes Mechanism 1 possible)
- `SiteVisitBooking`: add status values `ON_HOLD`, `CANCELLATION_PENDING_PM_CONFIRMATION`, `CANCELLED`; add `cancellation_reason` and `cancellation_confirmed_by_pm_id`
- New table: PM reassignment history (who reassigned to whom, timestamp) — needed to enforce the no-ping-pong rule
- New table or fields: escalation tracking per site visit request (timestamps for when Marketing Director / Managing Director were notified, to prevent duplicate notifications)
- New table: `Demo` (scheduled\_at, handler\_id/PM, summary, linked interested properties)
- `Customer`: fields for temp password expiry and forced-reset flag

#### **Phase B — Core state machine updates**

- Extend the existing `LeadWorkflow` engine with the new/refined states and guard conditions from Part 1
- Implement the ownership-assignment logic (pool vs direct) at intake

#### **Phase C — Escalation & notification cron jobs**

- New scheduled job checking site visit requests against the 12h/10h thresholds
- New scheduled job checking the (to-be-numbered) first-contact retry cap
- Reuse your existing cron infrastructure pattern (in-process scheduler, failure alerting, emergency-halt env vars) — don't build a second parallel system

#### **Phase D — Site visit hold/cancel/reschedule flow**

- Implement the multi-step hold → 1-hour retry → PM cross-check → mutual cancellation sequence
- WhatsApp prefilled-link generator utility for the reschedule message (reusable — you'll need this same pattern in several places)

#### **Phase E — Recovery mechanisms (build as two clearly separate code paths)**

- Mechanism 1: property-change listener \+ nightly sweep job matching against `NO_MATCHING_INVENTORY` drops
- Mechanism 2: phone-number lookup on new contact, surfacing full historical context

#### **Phase F — Customer portal provisioning**

- Trigger at `BOOKING_INITIATED`
- Secure temp password generation, forced reset, WhatsApp send (reuse the link-generator utility from Phase D)

#### **Phase G — Performance tracking**

- Aggregation queries/views per telecaller and PM, per the metrics list in Part 1
