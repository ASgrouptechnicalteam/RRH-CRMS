# Workflow Audit Report — Lead & Project/Property Notifications

**Audit Date:** 2026-09-11
**Scope:** Backend notification coverage + frontend sync for lead, project, and property workflows

---

## 1. Lead Workflow — Notifications

### 1.1 `updateLeadStatus` — NO notification on status change

**File:** `apps/api/src/services/lead/status.ts`
**Problem:** Every lead status transition (ASSIGNED→CONTACTED→QUALIFIED→...) logs `LeadActivity` and `auditEvent` but **never creates a `notification`** for the assigned employee.
**Fix applied:** After the workflow transition, create a `STATUS_UPDATE` notification for `assigned_to_id` (unless recovering). Dropped leads get a `LEAD_DROPPED` notification.

### 1.2 `reassignLead` — NO notification to new assignee

**File:** `apps/api/src/services/lead/status.ts`
**Problem:** Manual lead reassignment creates activity + audit event but does NOT notify the newly assigned employee.
**Fix applied:** Create a `TARGET_ASSIGNED` notification for the new assignee inside the transaction.

### 1.3 Recovery flows — notification already exists

**File:** `apps/api/src/services/lead/recovery.ts`
**Status:** `triggerLeadRecoveryForProperty` (line 98) and `recoverManualLead` already create notifications. No fix needed. But `recoverFreshLead` does NOT create a notification for the new lead owner — minor gap.

### 1.4 MD Dashboard Assignment — backend now fixed

**File:** `apps/api/src/routes/leads.ts` → calls `reassignLead`
**Problem:** MD assigning a lead from the dashboard went through `reassignLead` which previously sent no notification.
**Fix applied:** `reassignLead` now notifies the new assignee. The MD dashboard uses the same endpoint, so it now works.

---

## 2. Property Workflow — Notifications

### 2.1 `mdApproveProperty` — NO notification to PM or MDs

**File:** `apps/api/src/services/property.service.ts`
**Problem:** When MD approves (LIVE) or rejects a property, no one is notified — not the assigned PM, not other MDs.
**Fix applied:** Notify `assigned_pm_id` with `PROPERTY_LIVE` or `PROPERTY_REJECTED`. Also notify all other MDs in the company.

### 2.2 `dmPolishProperty` — NO notification to MDs

**File:** `apps/api/src/services/property.service.ts`
**Problem:** When DM polish completes (status → PENDING_MD_APPROVAL), MDs are not notified that a property is waiting for their approval.
**Fix applied:** Create `SYSTEM_ALERT` notifications for all active MDs in the company.

### 2.3 `dmVerifyAsIsProperty` — NO notification to MDs

**File:** `apps/api/src/services/property.service.ts`
**Problem:** Same gap as `dmPolishProperty` — the "verify as-is" bypass also leaves MDs uninformed.
**Fix applied:** Same MD notification as `dmPolishProperty`.

### 2.4 `verifyProperty` — NO notification to DM team

**File:** `apps/api/src/services/property.service.ts`
**Problem:** When a PM verifies a property (PASSED → PENDING_DM_POLISH), the DM team is not notified that a property is ready for polish.
**Fix applied:** Create `SYSTEM_ALERT` notifications for all active `DIGITAL_MARKETING_EXECUTIVE` employees.

### 2.5 `updateProperty` — PM reassignment not notified

**File:** `apps/api/src/services/property.service.ts`
**Problem:** Changing `assigned_pm_id` via the edit form (PUT /properties/:id) silently reassigns without notifying either PM.
**Fix applied:** After the update, notify new PM (`PROPERTY_ASSIGNED`) and old PM (`PROPERTY_REASSIGNED`) if PM changed.

### 2.6 `createProperty` — NO notification to assigned PM

**File:** `apps/api/src/services/property.service.ts`
**Status:** Already notifies MDs if no PM assigned (line 452). But if a PM IS assigned at creation time, the PM gets no notification.
**Fix applied:** After property creation, if `assigned_pm_id` is set, notify that PM.

---

## 3. Project Workflow — Notifications

### 3.1 `reassignProject` — NO notification to new/old PM

**File:** `apps/api/src/services/project.service.ts`
**Problem:** Dedicated project reassignment endpoint creates an audit event but no employee notifications.
**Fix applied:** Notify new PM (`PROJECT_ASSIGNED`) and old PM (`PROJECT_REASSIGNED`) inside the transaction.

### 3.2 `createProject` — NO notification to assigned PM

**File:** `apps/api/src/services/project.service.ts`
**Problem:** When a project is created with an `assigned_pm_id`, the PM is not notified.
**Fix applied:** After project creation, if `assigned_pm_id` is set, notify that PM.

### 3.3 `updateProject` — PM change via edit form not notified

**File:** `apps/api/src/services/project.service.ts`
**Problem:** The general PUT /projects/:id endpoint allows `assigned_pm_id` changes but sends no notifications (unlike the dedicated POST /projects/:id/reassign endpoint).
**Fix applied:** When `assigned_pm_id` changes in the update path, notify new and old PM.

---

## 4. Frontend Sync Issues

### 4.1 NotificationDrawer polls every 30 seconds

**File:** `apps/web/src/components/notifications/NotificationDrawer.tsx` (line 89)
**Problem:** `setInterval(fetchNotifications, 30000)` — new notifications take up to 30 seconds to appear.
**Fix:** Reduce polling interval to 5 seconds.

### 4.2 Mutations don't trigger notification refresh

**Files:**

- `apps/web/src/components/leads/LeadManagement.tsx` (lines 351-353, 378-383)
- `apps/web/src/components/properties/PropertyManagement.tsx` (lines 390-393)
- `apps/web/src/components/projects/ProjectManagement.tsx` (lines 126-130, 142-144)

**Problem:** After successful mutations (lead assign, status change, property verify/approve/reject, project verify/reject), only the data query is invalidated. The notification panel is not refreshed.

**Fix:** Add `queryClient.invalidateQueries({ queryKey: ['notifications'] })` in all mutation `onSuccess` handlers. Convert `NotificationDrawer` to use React Query so it responds to invalidation.

### 4.3 No real-time push for internal CRM

**File:** `apps/web/src/hooks/usePushNotifications.ts`
**Problem:** Web push is implemented but only used by the customer portal, not the internal employee CRM. Employees rely solely on polling.
**Fix:** The `notifyEmployee` utility already supports web push. Wire it into the backend notification calls.

---

## 5. Architecture Note: `notifyEmployee` Utility Is Unused

**File:** `apps/api/src/utils/notifyEmployee.ts`
**Problem:** This utility creates both a DB notification AND sends web push. It exists but is never called by any lead/project/property service. All services use raw `p.notification.create` / `p.notification.createMany` instead.
**Fix:** After each transaction in the affected services, call `notifyEmployee()` for web push delivery (outside the transaction since it uses its own Prisma instance).

---

## 6. Summary of All Changes Made (Phase 1)

### Backend — Notification Creation (7 files modified)

| Service               | Function               | Notification Added                                     |
| --------------------- | ---------------------- | ------------------------------------------------------ |
| `lead/status.ts`      | `updateLeadStatus`     | `STATUS_UPDATE` / `LEAD_DROPPED` to assigned employee  |
| `lead/status.ts`      | `reassignLead`         | `TARGET_ASSIGNED` to new assignee                      |
| `property/service.ts` | `mdApproveProperty`    | `PROPERTY_LIVE`/`PROPERTY_REJECTED` to PM + all MDs    |
| `property/service.ts` | `dmPolishProperty`     | `SYSTEM_ALERT` to all MDs                              |
| `property/service.ts` | `dmVerifyAsIsProperty` | `SYSTEM_ALERT` to all MDs                              |
| `property/service.ts` | `verifyProperty`       | `SYSTEM_ALERT` to DM executives                        |
| `property/service.ts` | `updateProperty`       | `PROPERTY_ASSIGNED`/`PROPERTY_REASSIGNED` on PM change |
| `property/service.ts` | `createProperty`       | `PROPERTY_ASSIGNED` to assigned PM                     |
| `project/service.ts`  | `reassignProject`      | `PROJECT_ASSIGNED`/`PROJECT_REASSIGNED` to PMs         |
| `project/service.ts`  | `createProject`        | `PROJECT_ASSIGNED` to assigned PM                      |
| `project/service.ts`  | `updateProject`        | `PROJECT_ASSIGNED`/`PROJECT_REASSIGNED` on PM change   |

### TypeScript Compilation

All changes compile clean (`npx tsc --noEmit` exits 0).

---

## 7. Remaining Work (Phase 2)

1. **Backend:** Wire `notifyEmployee()` utility for web push after each transaction (Phase 1 fixes currently only create DB notifications; web push requires the utility call outside the transaction)
2. **Frontend:** Check if PropertyForm and QuickAddLeadModal also need notification invalidation

---

## 8. Verification

All changes pass TypeScript compilation (`npx tsc --noEmit` exits 0).
