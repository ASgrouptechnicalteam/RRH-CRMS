# 04 Site Visit Audit

Based on the actual implementation in `apps/api/src/services/siteVisit.service.ts`.

## Audit System Used
Site Visits fully integrate with the central `LeadActivity` system established in earlier phases. There is no separate or duplicated audit table for site visits.

## Logged Events
Each major workflow transition is executed within a Prisma `$transaction` that strictly creates a `LeadActivity` record simultaneously:

1. **Booking**: `SITE_VISIT_BOOKED`
   - Logs the scheduled date and the assigned PM.
2. **Verification**: `SITE_VISIT_VERIFIED`
   - Logs the verification outcome (`CONFIRMED` or `CANCELLED`) along with verification notes.
3. **Assignment**: `AGENT_DISPATCHED_FOR_SITE_VISIT`
   - Logs the name of the assigned field agent and any assignment notes.
4. **Completion**: `SITE_VISIT_COMPLETED`
   - Logs the outcome rating, feedback notes, and whether a proof photo was uploaded.

## Conclusion
The existing audit mechanism is robust, fully transactional, and properly associates all actions with the origin Lead and the acting employee. No new audit system needs to be created.
