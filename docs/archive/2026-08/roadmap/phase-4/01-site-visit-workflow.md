# 01 Site Visit Workflow

Based on the actual implementation in `apps/api/src/workflows/siteVisit.workflow.ts` and `apps/api/src/services/siteVisit.service.ts`:

## Transition Matrix

| Current State          | Action       | Next State          | Allowed |
|------------------------|--------------|---------------------|---------|
| `PENDING_VERIFICATION` | `VERIFY`     | `CONFIRMED`         | YES (if confirmed) |
| `PENDING_VERIFICATION` | `VERIFY`     | `CANCELLED`         | YES (if not confirmed) |
| `CONFIRMED`            | `ASSIGN_AGENT` | `ASSIGNED_TO_AGENT` | YES |
| `ASSIGNED_TO_AGENT`    | `COMPLETE`   | `COMPLETED`         | YES |
| `COMPLETED`            | *Any*        | *Any*               | NO (Terminal) |
| `CANCELLED`            | *Any*        | *Any*               | NO (Terminal) |

## Required Conditions
- **Verify**: Requires verification notes. Converts to `CONFIRMED` or `CANCELLED`.
- **Assign Agent**: Requires a valid Field Agent ID. Updates `assigned_agent_id`.
- **Complete**: Requires a rating (e.g., `HOT_INTERESTED`), feedback notes, and optionally a proof photo URL. Updates the Lead's status automatically.

## Ownership & Tenant Requirements
- All actions verify that the Lead and Property associated with the Site Visit belong to the user's `companyId`.
- **Complete** enforces ownership IDOR: Only the assigned agent (`assigned_agent_id`) or management (`MD`/`ADMIN`) can transition the status to `COMPLETED`.

## Audit Requirements
Every successful transition writes an entry to the `LeadActivity` log belonging to the associated Lead, establishing a robust audit trail.
