# UI/UX & RBAC Status Audit - VERIFIED REPORT

## Part 1: Confirmation of Missing SALES Screens
Searched the entire codebase, including unused imports and partial components.

*   **Site Visit Acceptance Queue**: ⚠️ **Partially started**. A placeholder empty array `pendingResponses` and a rendering `ListWidget` exist inside `apps/web/src/components/dashboards/PMDashboard.tsx` (lines 50, 95-99). However, the actual queue component/screen itself does not exist anywhere.
*   **Reassignment History Panel**: ❌ **Fully absent from zero**. No trace of this panel in `LeadDetailModal.tsx`, `ReassignModal.tsx`, or anywhere else in the frontend.
*   **Site Visit Outcome Form**: ❌ **Fully absent from zero**. No trace of this post-visit submission form anywhere in the frontend.

## Part 2 & 3: Full RBAC Matrix & Granularity
**Roles Defined** (`packages/shared/src/index.ts` lines 13-26):
`MD`, `ADMIN`, `MARKETING_DIRECTOR`, `PROJECT_MANAGER`, `DIGITAL_LEAD_OPERATOR`, `TELECALLER`, `DIGITAL_MARKETING_HEAD`, `HR_MANAGER`, `FINANCE`, `AGENT`, `DIGITAL_MARKETING_EXECUTIVE`, `SALES_MANAGER`.

| Page / Route | Role Access | Access Level (Read/Write/None) | UI Enforcement | API Authorization Enforcement | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/dashboard` | All Roles | Partial Write (own view) | `App.tsx` (L198-214) | Dashboard-specific endpoints (e.g., `md.ts` L122) | Handled by dedicated role components |
| `/leads` | All Roles | Partial Write (assigned only) | `AppLayout.tsx` (L159) | `leads.ts` (L14: `LEADS_READ`), `lead.policy.ts` | Non-management constrained by policy |
| `/customers` | All Roles | Partial Write (assigned only) | `AppLayout.tsx` (L160) | `customers.ts` (L14: `CUSTOMERS_READ`) | |
| `/projects` | All Roles | Read-Only | `AppLayout.tsx` (L167) | `projects.ts` (L14: `PROJECTS_READ`) | Write restricted to ADMIN/MD |
| `/properties` | All Roles | Read-Only | `AppLayout.tsx` (L166) | `properties.ts` (L16: `PROPERTIES_READ`) | Write restricted to ADMIN/MD |
| `/site-visits` | All Roles | Partial Write (assigned only) | `AppLayout.tsx` (L161) | `siteVisit.policy.ts` (L41-50) | Non-management limited to their visits |
| `/tasks` | All Roles | Partial Write (assigned only) | `App.tsx` (L223) | **🚨 SECURITY GAP**: `tasks.ts` (L161) `GET /my-tasks` has no `requireAuthz` | Any authenticated user can access their tasks without specific permissions check. |
| `/bookings` | All Roles | Read-Only | `App.tsx` (L224) | `bookings.routes.ts` | Write restricted to management |
| `/finance` | `MD`, `ADMIN`, `FINANCE` | Full Write | `App.tsx` (L238-242) | `payment.routes.ts` (L23: `PAYMENTS_READ`) | None for other roles |
| `/hr-hub` | `MD`, `ADMIN`, `HR_MANAGER` | Full Write | `App.tsx` (L230) | `employees.ts` (L18: `EMPLOYEES_READ`) | None for other roles |
| `/analytics` | `MD`, `ADMIN`, `MARKETING_DIRECTOR`, `HR_MANAGER`, `PROJECT_MANAGER`, `DIGITAL_MARKETING_HEAD`, `FINANCE`, `SALES_MANAGER` | Read-Only | `App.tsx` (L232-234) | `analytics.routes.ts` | None for `AGENT`, `TELECALLER`, `DIGITAL_LEAD_OPERATOR` |
| `/system-control` | `MD`, `ADMIN` | Full Write | `App.tsx` (L236) | `md.ts` / `integration.routes.ts` | None for other roles |
| `/kiosk` | Kiosk Token | Full Write | `App.tsx` (L170-175) | `kiosk-auth.ts` (L37) | Independent authentication system |

*Note: Roles not listed for a page explicitly receive "None" access.*

### Reassignment Granularity Check
*   **Reassignment Reason**: `siteVisit.policy.ts` (lines 25-29) explicitly restricts viewing the reassignment reason to `MD`, `ADMIN`, and `MARKETING_DIRECTOR`. All other roles receive masked results.

## Part 4: Dashboard Routing Mechanism
The seven dashboard components all render at `/dashboard`. The exact conditional logic determining which one renders is located in `apps/web/src/App.tsx` (lines 198-214):
```tsx
<Route path="/dashboard" element={
  isMD ? (
    <MDExecutiveDashboard />
  ) : isTechAdmin ? (
    <AdminCommandCenter />
  ) : isHRManager ? (
    <HRDashboard />
  ) : isProjectManager ? (
    <PMDashboard />
  ) : isSalesManager ? (
    <SalesManagerDashboard />
  ) : isTelecaller ? (
    <TelecallerDashboard />
  ) : (
    <StaffDashboard />
  )
} />
```

## Part 5: Kiosk Credential Management Location
❌ **Neither**. 
The backend routes to create and manage kiosk credentials exist at `POST /api/v1/kiosk-credentials` (`apps/api/src/routes/kiosk-auth.ts` line 103, restricted to `[Roles.MD, Roles.ADMIN]`).
However, there is **no frontend UI** built to interface with this. 
1. `/system-control` (`apps/web/src/components/system/SystemControlHub.tsx`) contains tabs for Roles, Webhooks, Integrations, and Advanced, but zero code referencing kiosk credential management.
2. The `/kiosk` route (`apps/web/src/components/attendance/Kiosk.tsx`) is solely the physical Kiosk Terminal Login screen, not the management portal.
