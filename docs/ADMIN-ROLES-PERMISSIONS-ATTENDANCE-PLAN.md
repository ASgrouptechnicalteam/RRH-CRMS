# Build: Roles, Permissions & Attendance Management Plan

## Problem Statement

The user needs:

1. **Dynamic role management** — change employee roles without going to a dashboard; no way to change roles currently
2. **Dynamic permissions** — permissions defined in DB so they can be changed without code changes; currently hardcoded in `shared/index.ts` (RolePermissionsMatrix)
3. **Attendance correction** — ADMIN has full control; ADMIN & MD can change attendance status/status for employees who took long breaks or forgot to scan out; currently only QR-scan check-in/out exists

## Current State (Audit)

### Roles & Permissions

- `packages/shared/src/index.ts` — defines `Roles`, `Permissions`, `RolePermissionsMatrix` (hardcoded)
- `AuthContext` — user gets `roles` array + `permissions` array from token (pre-baked at login)
- `AdminSuperHub.tsx` — existing `/super-admin` page with 3 tabs: Role Assignment, Audit Reviews, Security
- `RoleChangePage.tsx` — embedded in AdminSuperHub; supports single-role change via `PUT /employees/:id/roles`, fetches roles from `/roles` endpoint (DB-backed), but only sets ONE role, overwrites all existing
- `AppLayout.tsx` sidebar — `/super-admin` visible to `requiredAnyRole: [Roles.ADMIN]`
- `apps/api/src/shared/auth.ts` — `requirePermission` middleware checks `user.permissions` (token-based, static after login)
- No DB table for per-employee permission overrides
- No DB table for custom/dynamic roles beyond the hardcoded enum

### Attendance

- Prisma: `AttendanceLog` model (id, employee_id, check_in_at, check_out_at, working_duration_minutes, status, source, branch_id, notes)
- Prisma: `AttendanceProposal` model (late proposals, leave proposals, early logout)
- API routes:
  - `apps/api/src/routes/attendance/qr.ts` — kiosk scan check-in/out, attendance proposals, proposal queues (for HR/MD/Admin)
  - `apps/api/src/routes/attendance/reports.ts` — `/live` (today's feed), `/history` (paginated, filterable)
- Frontend:
  - `MyAttendancePage.tsx` — employee's own attendance view
  - `HRAttendanceDashboard.tsx` — HR live attendance feed + history
- **GAP**: No page where Admin/MD can directly edit an employee's attendance status (e.g., mark ABSENT, change LATE → PRESENT, mark half-day, add checkout time, add notes) from the list.

### What EXISTS that can be reused

- `ListWidget`, `ListItem` UI components
- `useAuth()` context with `fetchWithAuth`
- `Roles`, `AttendanceStatus` enums from `@rrh-ems/shared`
- `API_BASE_URL` config
- Notification system (`notifyEmployee`)
- Audit logging pattern (`p.auditEvent.create`)
- Tailwind UI classes / project design tokens

---

## Phase 1: Dynamic Role Management

### Current Gap

- `RoleChangePage` overwrites ALL roles with a single selected role
- No multi-role support (an employee can have multiple roles simultaneously)
- No UI to view current roles per employee in one table

### Implementation

1. **Enhance `RoleChangePage.tsx`** — change from single-role to multi-role:
   - Replace the single-select `<select>` with a multi-select (checkbox grid) of ALL defined roles
   - "Save" button → `PUT /employees/:id/roles` with `{ role_names: [...] }` (array of ALL selected roles)
   - Show currently assigned roles pre-checked
   - Keep existing DB role fetch (`/roles` endpoint) with enum fallback
   - Keep Admin-only guard on Admin role

2. **Enhance `AdminSuperHub.tsx`** — add a 4th tab:
   - New tab: "Role Matrix" — shows all employees with their current roles in a table
   - Click an employee row to edit their roles inline (or navigate to that employee in RoleChangePage with the ID pre-selected)

### Files to change

- `apps/web/src/components/admin/RoleChangePage.tsx` (modify)
- `apps/web/src/components/admin/AdminSuperHub.tsx` (modify — add tab + wire up)

### API impact

- `PUT /employees/:id/roles` already exists (accepts `{ role_names: string[] }`) — no API changes needed

### Permissions required

- User must be MD or Admin (route guarded)

---

## Phase 2: DB-Backed Dynamic Permissions

### Current Gap

- `RolePermissionsMatrix` in `shared/index.ts` is hardcoded
- `permissions` array is baked into JWT token at login time — changes to the matrix don't take effect until user re-logs in
- No UI to view or modify what permissions a role has
- Adding a new permission requires: code change → redeploy API → all users re-login

### Solution: Permissions DB + Admin Management Page

Add a new DB-backed permission system for roles. The existing hardcoded matrix stays as the **fallback/default**, but DB overrides take precedence.

### Implementation

#### 2a. Database Schema (Migration)

```sql
-- Custom roles table (optional custom role names)
CREATE TABLE role_permission_overrides (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(100) NOT NULL,    -- matches Roles.* enum values
  permission_key VARCHAR(200) NOT NULL, -- matches Permissions.* enum values
  granted BOOLEAN NOT NULL DEFAULT true,
  created_by INT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(role_name, permission_key)
);
```

**Note**: We don't need a `custom_roles` table at this point — role NAMES come from the `Roles` enum (Roles.MD, Roles.ADMIN, etc.), but which permission KEYS each role has can be overridden in the DB. This satisfies "we need permissions for anything we need to change without code changes."

#### 2b. API Endpoints

New route `apps/api/src/routes/admin/permissions.ts` (mounted at `/admin/permissions`):

- `GET /admin/permissions` — returns all roles with their effective permissions (DB overrides applied on top of the hardcoded matrix)
- `GET /admin/permissions/all-keys` — returns all available permission keys (from the Permissions enum) for the UI dropdowns
- `GET /admin/permissions/:role` — get permissions for a specific role
- `PATCH /admin/permissions/:role` — update permissions for a role: `{ granted: string[], denied: string[] }`
- `DELETE /admin/permissions/:role` — reset a role's overrides back to the hardcoded matrix defaults

All endpoints require `requireRole([Roles.MD, Roles.ADMIN])` and are audited via `p.auditEvent.create`.

#### 2c. Auth Middleware Update

- Modify `requirePermission` middleware in `auth.ts`:
  - First check the user's token permissions (fast path)
  - Then check DB overrides: query `role_permission_overrides` for the user's roles
  - If a role has an explicit override for this permission, use the DB value (granted/denied)
  - If no DB override, fall back to the token's baked-in permission
- Cache the DB overrides per-request (or use an in-memory cache with short TTL)

#### 2d. Frontend: Permissions Management Page

New page: `apps/web/src/components/admin/PermissionsPage.tsx` — a tab in AdminSuperHub

- Shows a table: rows = roles, columns = permission categories grouped, checkboxes
- Each checkbox reflects the effective permission (DB override or default)
- Toggle writes to `PATCH /admin/permissions/:role`
- Changes take effect immediately for ALL users (no re-login needed, because the middleware checks the DB)
- Reset button per role to revert to defaults

### Files to create/modify

- **DB Migration**: `apps/api/prisma/manual-migrations/YYYY-MM-DD_dynamic_permissions.sql`
- **API**: `apps/api/src/routes/admin/permissions.ts` (new)
- **API**: `apps/api/src/middleware/auth.ts` — add DB override check to `requirePermission`
- **API**: `apps/api/src/server.ts` — mount new route
- **Web**: `apps/web/src/components/admin/PermissionsPage.tsx` (new)
- **Web**: `apps/web/src/components/admin/AdminSuperHub.tsx` — add "Permissions" tab

### Permissions required

- MD or Admin only

---

## Phase 3: Attendance Correction Page (Admin Full Control)

### Current Gap

- Employees can scan in/out via kiosk (QR scan)
- HR can view attendance (live feed, history) but cannot EDIT
- No way to correct attendance entries: e.g., employee forgot to scan out, employee took a long unplanned break (status should be ABSENT), wrong status (LATE when they had an approved late proposal), need to add notes

### Solution: Admin Attendance Management Page

A page where Admin (and MD) can:

1. Search/filter attendance logs by employee, date, status
2. Edit any attendance log's status (PRESENT, LATE, APPROVED_LATE, HALF_DAY, APPROVED_HALF_DAY, ABSENT, LEAVE)
3. Edit check_out_at (add a missing checkout)
4. Recalculate `working_duration_minutes` automatically when checkout changes
5. Add/edit notes on the log
6. All edits are audited via `p.auditEvent.create`

#### API Endpoints

New route `apps/api/src/routes/admin/attendance.ts` (mounted at `/admin/attendance`):

- `GET /admin/attendance` — filterable list (employee, date range, status) — mirrors `/history` endpoint
- `PATCH /admin/attendance/:logId` — update `status`, `check_out_at`, `working_duration_minutes`, `notes`
- `POST /admin/attendance/:logId/check-out` — convenience endpoint for adding a checkout time

All require `requireRole([Roles.MD, Roles.ADMIN])`.

#### Frontend

New page: `apps/web/src/components/admin/AttendancePage.tsx`

- Tab 1: "Correction" — search/filter table, inline edit status dropdown + checkout time + notes
- Tab 2: (optional, future) "Audit Trail" — view all attendance edits
- Table shows: employee name, employee code, check-in time, check-out time, working duration, status badge, source, notes, edit controls

#### Audit trail

Each edit writes to `auditEvent`:

```ts
{
  actor_id: req.user.employeeId,
  action: 'ADMIN_ATTENDANCE_UPDATE',
  entity_type: 'ATTENDANCE_LOG',
  entity_id: logId,
  old_value: JSON.stringify({ status, check_out_at, notes }),
  new_value: JSON.stringify({ status, check_out_at, notes }),
}
```

### Files to create/modify

- **API**: `apps/api/src/routes/admin/attendance.ts` (new)
- **API**: `apps/api/src/server.ts` — mount new route
- **Web**: `apps/web/src/components/admin/AttendancePage.tsx` (new)
- **Web**: `apps/web/src/components/admin/AdminSuperHub.tsx` — add "Attendance" tab
- **Web**: `apps/web/src/components/common/AppLayout.tsx` — add sidebar entry

### Permissions required

- MD or Admin only

---

## Phase 4: Route Registration + Sidebar + Build

### App.tsx / Server.ts

- Register new admin routes in the API
- Add lazy-loaded import for `PermissionsPage` and `AttendancePage` in `App.tsx`
- Add route entries:
  - `/admin/permissions` → guarded to MD/Admin
  - `/admin/attendance` → guarded to MD/Admin

### Sidebar (AppLayout.tsx)

- Add under ADMINISTRATION group:
  - `{ id: 'admin-permissions', label: 'Permissions', icon: ShieldCheck, path: '/admin/permissions', requiredAnyRole: [Roles.MD, Roles.ADMIN] }`
  - `{ id: 'admin-attendance', label: 'Attendance', icon: Clock, path: '/admin/attendance', requiredAnyRole: [Roles.MD, Roles.ADMIN] }`

---

## Phase 5: Verification

- `npx tsc --noEmit` passes (both `apps/api` and `apps/web`)
- Pages render: `/super-admin` (AdminSuperHub with 5 tabs), `/admin/permissions`, `/admin/attendance`
- Role Change page: multi-role selection, save overwrites
- Permissions page: toggle a permission, verify it takes effect for a user on next request (no re-login)
- Attendance page: edit a status, verify DB + audit log
