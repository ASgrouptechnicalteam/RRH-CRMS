# 05 Site Visit Frontend

Based on the actual implementation in `apps/web/src/components/siteVisits/SiteVisitManagement.tsx`.

## Current State
The frontend implements a robust, workflow-aware interface.

### Features
- **Visual Stepper**: `SiteVisitStepper` visually displays the workflow stages (`PENDING_VERIFICATION`, `CONFIRMED`, `ASSIGNED_TO_AGENT`, `COMPLETED`).
- **Permissions**: Enforces UI visibility based on the exact backend permissions (`SITE_VISITS_VERIFY`, `SITE_VISITS_ASSIGN_AGENT`, `SITE_VISITS_COMPLETE`).
- **Verification Flow**: Renders confirm/cancel buttons and a notes input if the visit is `PENDING_VERIFICATION` and the user has permission.
- **Assignment Flow**: If `CONFIRMED`, allows assigning an agent.
- **Completion Flow**: If `ASSIGNED_TO_AGENT`, allows the agent (or admin) to upload proof photos, provide rating (`HOT_INTERESTED`, `WARM`, `COLD`), and complete the visit.
- **Loading/Error States**: Fully utilizes `ToastContext` for error handling and prevents double submission using loading states.

## Conclusion
The frontend correctly mirrors the formalized Phase 4 backend workflow. There is no need to redesign or replace the existing React component.
