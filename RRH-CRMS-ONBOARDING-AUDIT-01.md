# RRH-CRMS-ONBOARDING-AUDIT-01

## 1. Executive Summary
This read-only forensic audit investigates the missing `WelcomeGuide` functionality. The investigation confirmed that the onboarding component was added to the repository in commit `2fe35469a9` on August 20, 2026, but it was **never imported or rendered** in the application tree. It was an orphaned file from the moment of its creation, which is why it was safely caught and deleted in `CODE-HYGIENE-02`. The core security flow (`FirstLoginSetup`) remains fully functional and intact.

## 2. Current Onboarding Architecture
Currently, the onboarding flow consists solely of a strict security gate:
- When a new user logs in, the backend sends `first_login_done = false`.
- `App.tsx` mounts `<FirstLoginSetup />`, a full-screen blocker.
- The user is forced to change their default password.
- Upon success, the backend updates `first_login_done = true`, the AuthContext updates, and the user drops directly into their role's dashboard.

## 3. Historical WelcomeGuide Evidence
- **Proven by Code & Git**: Commit `2fe35469a9` introduced `apps/web/src/components/onboarding/WelcomeGuide.tsx`. The file contained an `EmptyState` component with a title "Welcome to Sonthillu CRM" and buttons "Get Started" and "Maybe Later".
- **Tracking Mechanism**: The guide used `localStorage.getItem('onboardingDismissed')` to track if the user had seen it.
- **Orphan Status**: `git log -S "WelcomeGuide" -p -- apps/web/src/App.tsx` confirms the file was never imported into any routing or layout shell.

## 4. Current FirstLoginSetup Flow
The `FirstLoginSetup` is a critical security component. It uses `AuthContext` (`firstLoginDone`) to unconditionally block access to the CRM until the default password is changed. This flow is working perfectly and is decoupled from the missing `WelcomeGuide`.

## 5. Why WelcomeGuide Is Not Working
It is not working because it was never mounted. The original author created the component but forgot to inject the `<FirstTimeOnboarding />` wrapper into `App.tsx` or `AppLayout.tsx`. It existed merely as disconnected source code.

## 6. Git/Change History
- **Introduced**: `2fe35469a90e7c4e00009fea9e529fb1bfa95456` (`Thu Aug 20 10:57:29 2026 +0530`)
- **Removed**: Safely deleted during `CODE-HYGIENE-02` because static analysis correctly identified 0 references across the entire repository.
- **Replaced?**: No, it was never intentionally replaced. It was simply forgotten.

## 7. Intended Product Behavior
Based on the code structure recovered from git, the intended behavior was:
1. User logs in.
2. User completes `FirstLoginSetup` (password change).
3. User lands on the Dashboard.
4. User sees the `WelcomeGuide` overlay/empty state.
5. User clicks "Get Started" or "Maybe Later".
6. `localStorage.setItem('onboardingDismissed', 'true')` is fired, preventing the guide from showing on subsequent logins (on the same device).

## 8. Role-by-Role Onboarding Requirements
The original `WelcomeGuide` was generic ("Get started by adding your first property listing"). This text is irrelevant to HR or Telecallers. A restored guide must be **Role-Aware**.
- **MD / ADMIN**: Welcome to the Command Center. View cross-department analytics and system health.
- **PROJECT_MANAGER**: Welcome to Property Inventory. Start by listing new properties or verifying pending assets.
- **SALES_MANAGER / MARKETING_DIRECTOR**: Welcome to the Sales Hub. Distribute leads and track campaign attributions.
- **TELECALLER**: Welcome to the Calling Queue. Review your pending follow-ups and log fresh interactions.
- **HR_MANAGER**: Welcome to the HR Dashboard. Review attendance anomalies and leave proposals.

## 9. Technical Root Cause
Developer omission during the layout restructure phase (Commit `2fe354`). The component was written but never linked.

## 10. Security/RBAC Impact
None. UI onboarding is purely visual. The actual security gate (`FirstLoginSetup`) uses a database-backed boolean (`first_login_done`) and cannot be bypassed. The Welcome Guide's reliance on `localStorage` is safe because it only controls a UI banner/modal, not backend authorization.

## 11. UX Issues
- **Context Mismatch**: The original generic copy assumed every user was a real estate agent listing properties.
- **Device Sync**: Using `localStorage` means if a user logs in on their phone, they will see the Welcome Guide again even if they dismissed it on desktop. This is acceptable for a non-blocking UI modal.

## 12. Edge Cases
- **Mobile View**: The modal must not overflow on small screens.
- **Simultaneous Modals**: Ensure `WelcomeGuide` does not render simultaneously with the `FirstLoginSetup` or the `DailyReportModal` (Logout gate).

## 13. Recommended Architecture
- **Component**: Create a unified `WelcomeGuideModal.tsx` that reads `user.roles` from `AuthContext` to determine the dynamic copy (Title & Description).
- **Mount Point**: Mount it inside `AppLayout.tsx` (the global shell) so it triggers regardless of which specific dashboard the user lands on.
- **State Management**: Use `localStorage` for dismissal tracking. Do not add database migrations for UI state.

## 14. Files Requiring Changes
- `apps/web/src/components/common/AppLayout.tsx` (To import and mount the modal)
- `apps/web/src/components/onboarding/WelcomeGuide.tsx` (To be recreated with Role-Aware logic)

## 15. Files That Must Not Change
- `apps/web/src/context/AuthContext.tsx`
- `apps/web/src/components/auth/FirstLoginSetup.tsx`
- `apps/api/src/routes/auth.routes.ts`
- `packages/shared/src/index.ts`
- `prisma/schema.prisma`

## 16. Implementation Plan
1. Re-create `WelcomeGuide.tsx` as a floating, dismissible modal (not an `EmptyState` blocking the whole screen).
2. Implement a simple role-matching switch statement to provide context-aware welcome text.
3. Hook up `localStorage` check.
4. Mount `<WelcomeGuide />` inside `AppLayout.tsx` children wrapper.

## 17. Test Plan
| Role | First Login | Welcome Guide | FirstLoginSetup | Dismiss | Re-login | Mobile | Expected Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| ADMIN | Yes | No | **YES** | N/A | N/A | Pass | Must clear FirstLoginSetup before seeing WelcomeGuide. |
| MD | No | **YES** | No | Yes | **NO** | Pass | Sees specific MD text. Dismisses. Does not see on reload. |
| TELECALLER | No | **YES** | No | Yes | **NO** | Pass | Sees Caller-specific text. |
| HR_MANAGER | No | **YES** | No | Yes | **NO** | Pass | Sees HR-specific text. |
| *All Roles* | No | No | No | N/A | N/A | Pass | If `localStorage` has dismissed=true, no modal appears. |

## 18. Rollback Plan
If issues arise, simply revert the import from `AppLayout.tsx`. The rest of the application is isolated from this component.

## 19. Final Recommendation

🟢 **SAFE TO IMPLEMENT (WITH CHANGES)**

**Why**: 
1. The old implementation was never active, so restoring it "as-is" would just introduce a generic, unhelpful empty state that ignores RBAC.
2. Implementing it as a Role-Aware dismissible modal mounted in `AppLayout` is trivial, safe, and heavily improves the UX for newly onboarded staff.
3. It requires zero backend, database, or security changes.
