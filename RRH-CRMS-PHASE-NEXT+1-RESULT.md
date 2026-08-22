# RRH-CRMS — PHASE NEXT+1 — IMPLEMENTATION RESULT
# LEAD ATTRIBUTION ENFORCEMENT & HARDENING

---

## 1. Files Changed

| File | Change |
|---|---|
| `apps/api/src/services/lead.service.ts` | Defensive `delete dto.created_by_id` guard + full attribution contract documentation |
| `apps/web/src/components/leads/LeadManagement.tsx` | Attribution block redesigned with distinct "Introduced By" (permanent) and "Assigned To" (mutable) UI |
| `apps/web/src/components/leads/AddLeadWizard.tsx` | Attribution badge added, orphaned `assigneeId` state removed, labels genericized |
| `apps/web/src/components/dashboards/SalesManagerDashboard.tsx` | Pill badges differentiating Attribution Credit vs Operational Assigned |
| `apps/web/src/components/onboarding/tourDefinitions.ts` | New `lead-attribution-block` tour step for Sales Manager role |

---

## 2. Backend Attribution Enforcement

**`lead.service.ts` — `createLead()`**

Added a defensive strip at the very top of the function body:
```ts
delete dto.created_by_id;
```

This guard runs before any Prisma interaction. Even if a malicious client supplies `created_by_id` in the request body and the Zod schema is later changed to pass it through, this explicit deletion guarantees the field cannot propagate.

The function continues to explicitly set:
```ts
created_by_id: user.employeeId
```
from the authenticated server-side token — the only authorized source.

A full contract comment block was added documenting:
- `created_by_id` = IMMUTABLE — permanent attribution, set once at creation
- `assigned_to_id` = MUTABLE — operational assignment, freely changeable via `reassignLead()`

**Immutability proof across all mutation paths:**

| Operation | `created_by_id` mutated? | Evidence |
|---|---|---|
| `createLead()` | Set once from `user.employeeId` | `lead.service.ts:186` |
| `bulkUploadLeads()` | Set once from `user.employeeId` | `lead.service.ts:261` |
| `reassignLead()` | **No** — only `assigned_to_id` | `lead.service.ts:308-313` |
| `updateLeadStatus()` | **No** — only `status`, `last_contacted_at` | `lead.service.ts:363-366` |
| Site visit verify | **No** — only lead `status` | `siteVisit.service.ts:214-217` |
| Site visit complete | **No** — only lead `status` | `siteVisit.service.ts:327-330` |
| Customer conversion | **No** — only lead `status = WON` | `customer.service.ts:146-148` |
| Opportunity creation | **No** — only lead `status` | `opportunity.service.ts:98-101` |

No hidden update path was found. No generic `PATCH /leads/:id` endpoint exists. The only mutation routes are schema-locked via Zod and do not expose `created_by_id`.

---

## 3. Frontend Attribution UX — Lead Dossier

The attribution block in the Lead Dossier modal was completely redesigned.

**Before:** "Introduced By" and "Assigned To" were plain grid cells with identical visual styling — no indication that one was permanent and the other was mutable.

**After:**
- **Introduced By** — indigo background, `ShieldCheck` icon, `"Permanent Attribution"` sub-label. Visually communicates a locked, immutable value.
- **Assigned To** — neutral slate background, `UserCheck` icon, `"Current Owner"` sub-label. Visually communicates an operational value that may change.

Both blocks are grouped inside a container with `data-tour="lead-attribution-block"`.

The data source was not changed:
- `Introduced By` → `selectedLead.created_by` (`created_by_id`)
- `Assigned To` → `selectedLead.assigned_to` (`assigned_to_id`)

---

## 4. AddLeadWizard Changes

- **Orphaned state removed:** `const [assigneeId, setAssigneeId] = useState('')` was removed. Inspection confirmed Step 4 contains only a Notes textarea and a Lead Snapshot summary — no assignment selector UI existed or was rendered.
- **Attribution badge added:** Step 1 now shows a read-only indigo badge: `Introduced By — You — automatically recorded`. Attribution credit is clearly communicated as automatic and non-editable.
- **Labels genericized:** All "Telecaller Script Prompt" labels (3 instances across Steps 1, 2, 3) renamed to "Lead Capture Prompt". Wizard title renamed from "Telecaller Rapid Lead Entry" to "Lead Capture". The system now correctly communicates that any authorized role can introduce a lead.
- **No `created_by_id` is sent from the frontend** — confirmed unchanged in `AddLeadWizard.tsx:75-88`.

---

## 5. Sales Manager Dashboard Changes

Two visual pill badges were added to differentiate attribution from assignment:

- **Team Performance table:** Added pill `"Operational — Based on Assigned Leads"` — makes it clear this table measures who is currently working leads, not who introduced them.
- **Top Lead Introducers table:** Added pill `"Attribution Credit — Original Introduction"` — makes it clear this table measures who first brought leads into the CRM, regardless of subsequent assignment.

No data source or calculation was changed. The Top Introducers table continues to group exclusively by `created_by_id`.

---

## 6. Product Tour Changes

**Sales Manager tour** updated with a new step:
```
target: '[data-tour="lead-attribution-block"]'
title: 'Attribution vs Assignment'
description: '"Introduced By" is permanent attribution credit — whoever originally brought the lead into the CRM. "Assigned To" is who is currently working the lead and may change via reassignment.'
route: '/leads'
```

This step is inserted in the Sales Manager tour sequence between the Leads sidebar step and the Tasks sidebar step.

Existing role tours for MD, Admin, Marketing Director, Telecaller, Agent, Project Manager were not modified.

---

## 7. Test Infrastructure Discovered

**No test runner is configured** in the repository.

`apps/api/package.json` has no `test` script, no Jest, Vitest, Mocha, or any testing dependency. No `__tests__` directory was found in either `apps/api` or `apps/web`.

> Automated attribution tests were not added because no existing test runner is configured in this repository.

---

## 8. Tests Executed

No automated tests — see above.

**Manual verification (derived from code inspection):**

- ✅ `POST /leads` with `{ created_by_id: 999 }` in body → `delete dto.created_by_id` removes the field before any use; backend sets `created_by_id = user.employeeId` from JWT token
- ✅ `POST /leads/:id/assign` → Schema-locked to `{ assigned_to_id, reason }` only; `reassignLead()` in service only writes `assigned_to_id`
- ✅ `PATCH /leads/:id/status` → Schema-locked to `{ status, notes }` only; service only writes `status` and `last_contacted_at`
- ✅ Site visit completion → service only writes lead `status` via explicit field
- ✅ Customer conversion → service only writes lead `status = WON` via explicit field

---

## 9. TypeScript Result

```
npx tsc --noEmit → exit code 0 (no errors)
```

---

## 10. Build Result

```
npm run build → exit code 0

@rrh-ems/api     → tsc ✓
@rrh-ems/web     → tsc && vite build ✓ (built in 8.91s, 2375 modules)
@rrh-ems/shared  → tsc ✓
```

Two pre-existing Vite chunk warnings (TaskManager, PropertyManagement dynamic import conflicts) are unrelated to this phase and existed before this work.

---

## 11. Manual Acceptance Test — Required Scenario

| Step | Expected | Verified |
|---|---|---|
| User A creates Lead A | `Introduced By = User A`, badge shows in Dossier | ✅ By code inspection |
| Sales Manager reassigns to User B | `Introduced By = User A`, `Assigned To = User B` | ✅ `reassignLead()` only writes `assigned_to_id` |
| User B qualifies → site visit → WON | `Introduced By = User A` throughout | ✅ No mutation path touches `created_by_id` |
| Sales Manager dashboard | User A shows in "Top Introducers" table; User B shows in "Team Performance" table | ✅ Attribution groups by `created_by_id`; performance groups by `assigned_to_id` |

---

## 12. Limitations / Unresolved Issues

- **No automated tests** — the repository has no test runner configured. All attribution verification is by code inspection and manual review.
- **Vite chunk warnings** — two pre-existing dynamic import conflicts for `TaskManager.tsx` and `PropertyManagement.tsx`. These are out of scope for this phase.
- **Bulk upload attribution** — bulk upload also correctly sets `created_by_id = user.employeeId`, but there is no bulk upload UI distinction. If a Marketing Director bulk-uploads 500 leads, all 500 are attributed to them. This is the correct business behavior per current design but should be communicated in the bulk upload UI as a future improvement.

---

## Summary

The CRM now makes it technically and visually impossible to confuse **who brought the lead** with **who is currently working the lead**:

1. **Backend** — `created_by_id` is defensively stripped from any client-supplied DTO before it can reach Prisma. Attribution can only be assigned by the authenticated server-side identity.
2. **Lead Dossier** — "Introduced By" and "Assigned To" are presented in visually distinct cards that communicate permanence vs. mutability.
3. **Lead Creation** — The attribution badge shows "Introduced By — You — automatically recorded" at the start of the wizard. No manual attribution input exists.
4. **Sales Manager Dashboard** — Pill badges explicitly label "Attribution Credit" vs "Operational" data.
5. **Product Tour** — The Sales Manager tour now includes a dedicated step explaining the distinction.
