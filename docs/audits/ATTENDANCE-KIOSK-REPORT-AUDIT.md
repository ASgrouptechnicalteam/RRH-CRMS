# Attendance Kiosk & Daily Report — Full Audit

*Read-only session. No application code was modified.*

---

## 1. Kiosk Attendance Flow — End-to-End Trace

### How the kiosk is accessed

The kiosk is a full-page React component rendered when `location.pathname === '/kiosk'`
(`App.tsx:171-177`). It bypasses the standard `AppLayout` entirely — no sidebar,
no nav bar — and renders `<Kiosk />` wrapped in `<ErrorBoundary>`.

Access is **not** a separate "attendance account" login. The kiosk operator logs in with
their own employee credentials through the standard `<LoginForm />`. After login,
navigating to `/kiosk` loads the kiosk view. The component then enforces a role check
at render time: only `HR_MANAGER` and `ADMIN` roles may operate it
(`Kiosk.tsx:103`). Any other logged-in role sees an "Unauthorized Terminal" screen.

There is **no separate kiosk-account concept** in the auth system — no dedicated
credentials, no kiosk-specific JWT scope, no separate login flow for a "receptionist."
The spec asks for "receptionist-style login with attendance-account credentials" — this
does **not exist**. The same token used for the full app is used on the kiosk screen.

### How the QR scan works

The kiosk uses a **hidden text input** that keeps browser focus via a 2-second
re-focus interval (`Kiosk.tsx:17-26`). A physical USB HID barcode scanner types
the QR content into this input as keystrokes. When the user presses Enter (or the
scanner sends CR), `handleScan(scannedData)` fires (`Kiosk.tsx:96-99`).

The QR payload is the serialized JSON string produced by `GET /attendance/my-qr`.
That endpoint constructs: `{ employeeId, employeeCode, version, signedToken }`,
where `signedToken = HMAC-SHA256(employeeId:employeeCode:version, QR_HMAC_SECRET)`
(`attendance.ts:19`, `qr.ts:12-14`).

### How the employee record is looked up

The kiosk sends `POST /attendance/scan` with `body: { qrPayload }` using the
operator's JWT (via `fetchWithAuth`). The route:

1. Parses and JSON-decodes the payload (`attendance.ts:80-96`)
2. Calls `verifyQrHmac(employeeId, employeeCode, version, signedToken)` using
   `crypto.timingSafeEqual` (`qr.ts:17-21`)
3. On valid HMAC: `prisma.employee.findUnique({ where: { id: payload.employeeId } })`
   (`attendance.ts:108-110`)
4. Checks tenant isolation: `scannedEmployee.company_id !== req.user!.companyId`
   → 403 if mismatch (`attendance.ts:113-115`)
5. Checks `scannedEmployee.status === 'ACTIVE' && scannedEmployee.attendance_required`
   → 403 if either fails (`attendance.ts:116-118`)

### How the attendance record is written

Check-in (`POST /attendance/scan`):
- Runs inside a `Serializable` transaction (`attendance.ts:124-154`)
- Looks for any existing log with `check_out_at === null` (open session) or a log
  created today (IST) — returns `{ alreadyStamped: true }` for either
- Otherwise creates `attendanceLog` with:
  - `check_in_at: now`
  - `status: calculateAttendanceStatus(now, false)` — always passes `false` for
    `hasApprovedProposal` (see §6 for implications)
  - `source: 'QR_SCAN'`

The kiosk then branches on `data.alreadyStamped`:
- `false` → shows CHECK_IN success
- `true` → immediately fires a second `POST /attendance/checkout` with the same
  payload (`Kiosk.tsx:56-60`), which finds the open log, calculates working duration,
  and sets `check_out_at = now` (`attendance.ts:205-230`)

### Functional assessment

✅ **Functional today**: The scan → HMAC verify → employee lookup → attendance write
path is structurally complete and uses a serializable transaction with concurrency
protection (deadlock is caught at `attendance.ts:174-183`).

⚠️ **Gaps that may affect real operation**:

- **No separate kiosk-account login**: The kiosk uses the operator's own JWT.
  If the HR Manager leaves the kiosk tab logged in, any employee can also use the
  main app on the same browser session. There is no dedicated "kiosk mode" token
  scoped only to the scan endpoints.

- **QR tokens are not rotated**: `GET /attendance/my-qr` always generates a
  deterministic HMAC from static data (`employeeId:employeeCode:version`). The same
  QR code is valid forever unless `QR_HMAC_SECRET` is changed or the employee code
  changes. There is no expiry, no one-time-use token, no `valid_until` field.

- **`hasApprovedProposal` is always `false` at scan time**: `attendance.ts:142`
  passes `false` hardcoded, meaning `APPROVED_LATE`/`APPROVED_HALF_DAY` statuses
  can never be assigned via the kiosk scan — even if the employee has an approved
  proposal in `AttendanceProposal`. The status is always raw PRESENT/LATE/HALF_DAY.

- **Approved proposal flow is incomplete**: `POST /attendance/late-proposal`
  creates an `AttendanceProposal` row (`attendance.ts:263-272`) and the HR approval
  queue at `GET /attendance/proposals/queue` (`attendance.ts:287-313`) reads from
  `auditEvent` (filtering `action: 'SUBMIT_LATE_PROPOSAL'`), but the submit route
  does NOT create an `AuditEvent` with that action — it creates the `AttendanceProposal`
  record only. The queue will therefore always return an empty array because no audit
  event with action `SUBMIT_LATE_PROPOSAL` is ever written. The approval queue is broken.

- **Error handling on the kiosk screen**: `mode === 'ERROR'` shows the error message
  and auto-resets in 5 seconds (`Kiosk.tsx:213-222`). This is functional. The error
  string comes directly from the server response body's `.error` field.

---

## 2. Employment Type Field

✅ **Implemented**

`Employee.employment_type String? @default("FULL_TIME")` exists at
`prisma/schema.prisma:104`.

Valid values documented in the comment: `FULL_TIME, PART_TIME, CONTRACT, INTERN`.

The field is:
- Included in the `GET /api/v1/employees/:id` response (`employees.ts:62`)
- Set on employee creation (`employees.ts:257`: `employment_type: employment_type || 'FULL_TIME'`)
- Patchable (`employees.ts:375`: `if (body.employment_type !== undefined) updateData.employment_type = body.employment_type`)

**The field is NOT currently used to branch any attendance or report logic.**
Nothing in `attendance.ts`, `time.ts`, or `reports.ts` reads `employment_type`.
Mark calculation and report-mandatory logic are applied uniformly regardless of
employment type. See §6 and §4.

---

## 3. Daily Report System

### Model
✅ **Exists** at `prisma/schema.prisma:293-308`.

Fields: `employee_id`, `submitted_at`, `summary`, `call_count`, `site_visit_count`,
`closed_deal_count`, `target_met`, `below_target_reason`, `metrics_json (Json?)`.
No `report_date` field — the submitted date is inferred from `submitted_at`.

The model is missing a **separate date field**. `today-status` uses
`submitted_at >= dateString 00:00:00 UTC ... <= 23:59:59 UTC` (`reports.ts:128-133`),
but IST is UTC+5:30 so the window may not align correctly for submissions near
midnight IST.

### API endpoints
✅ **Both endpoints exist and are wired up** (`reports.ts`):

- `POST /api/v1/reports/daily` — validates with `DailyReportSchema` (from shared),
  resolves active target, checks metrics vs. target, requires 15+ char reason if below
  target, creates `DailyReport`, writes two `AuditEvent` rows.
- `GET /api/v1/reports/today-status` — checks whether the logged-in employee has
  submitted today; MD/ADMIN get `{ submitted: true, exempt: true }` unconditionally.

**No admin "view all reports" endpoint**: There is no `GET /api/v1/reports` or
`GET /api/v1/reports/employee/:id` endpoint for HR/MD to view team reports.
I searched `reports.ts` — only these two routes exist. Reports can be submitted
but cannot be read back by a manager through the API.

### Frontend component
✅ **Exists**: `apps/web/src/components/reports/DailyReportModal.tsx`

The modal:
- Opens `GET /targets/my-target` on open to fetch the form schema (`DailyReportModal.tsx:45-60`)
- Renders dynamic fields from `form_schema_json` (COUNT, CHECKLIST, TEXT types)
- Maps responses to legacy `callsMade`, `siteVisits`, `leadsQualified` keys for
  backward compatibility
- POSTs to `POST /reports/daily`
- Calls `onSuccess()` which triggers `logout()` in the pending-logout flow (`App.tsx:320`)

### Is it a standalone page or a modal?

**It is a modal, not a page.** There is no `/daily-report` route. There is no nav entry
in `SIDEBAR_NAV_ITEMS` (`AppLayout.tsx:152-194`) for reports. The modal is only
accessible via the logout gate flow:

1. User clicks logout → `handleLogoutClick()` fires (`App.tsx:120-136`)
2. Calls `GET /reports/today-status`
3. If `!data.report` → shows `showLogoutIntentModal` dialog
4. If user picks "Submit Daily Log & Logout" → opens `DailyReportModal`
5. On `onSuccess` → `logout()` is called

This is the **only** way to reach the daily report form. There is no route, no nav
link, no button in any dashboard that opens it outside of the logout intent flow.
An employee cannot submit a report mid-day — only at logout time.

---

## 4. Mandatory vs. Optional Submission Flag

❌ **No such flag exists in the codebase.**

- `DailyReport` model has no `is_required` or `mandatory` field
- `Employee` model has no `report_required` field (only `attendance_required` exists)
- `reports.ts` applies the exact same logic to every employee who submits — no
  per-employee or per-employment-type skip
- The role-based exemption list (`App.tsx:113-115`) is hardcoded:
  `[Roles.MD, Roles.HR_MANAGER, Roles.ADMIN, Roles.MARKETING_DIRECTOR]`
- There is no mechanism for an individual employee to be flagged as exempt or required
  beyond this hardcoded role list

Today: every non-exempt employee who triggers the logout flow is shown the "Submit
Daily Log & Logout" modal, but they can bypass it by choosing "Quick Visit / No Report"
in the intent modal (`App.tsx:339-343` — this button calls `logout()` directly without
submitting a report).

In other words: the gate is **advisory**, not hard. A non-exempt employee can always
escape by claiming a "quick visit."

---

## 5. Logout Gate Feasibility (kiosk checkout path)

The **web app logout gate** (report submission before logout) exists and is described
in §3 above. However, the question is about the **kiosk checkout flow**.

The kiosk scan flow currently:
1. Receives the QR scan string
2. POSTs to `POST /attendance/scan` → receives `{ alreadyStamped: true }` if already checked in
3. Immediately fires `POST /attendance/checkout` with no intermediate check
   (`Kiosk.tsx:56-66`)
4. All writes currently succeed unconditionally — there is no "blocked/rejected"
   checkout concept in the kiosk

**Where a hook would go:**

The exact point where additional logic (e.g., "has this employee submitted a daily
report today?") could run is **between steps 2 and 3** in `Kiosk.tsx:handleScan()`,
i.e., after the `if (data.alreadyStamped)` branch is entered (line 54) and before the
`checkout` call (line 56).

The server-side equivalent would be inside the `POST /attendance/checkout` handler
in `attendance.ts:189-244`, just before the `$transaction` block (line 205). The
handler currently has no such check — it only validates tenant isolation.

The kiosk has a functioning `ERROR` mode (`Kiosk.tsx:213-222`) that can display any
string received from the server's `.error` field. If the checkout API returned a 400
with `{ error: 'Daily report not submitted' }`, the kiosk would display that message
and auto-reset after 5 seconds. The UI plumbing to show a rejection exists; the server
logic to reject does not.

**No report-submission check currently exists in the kiosk checkout path.**

---

## 6. Mark Calculation Logic & Employment Type Branching

### Current thresholds (`time.ts:51-71`)

| Check-in time (IST) | `hasApprovedProposal` | Status |
|---|---|---|
| ≤ 10:30 AM | any | `PRESENT` |
| 10:31 AM – 11:30 AM | `false` | `LATE` |
| 10:31 AM – 11:30 AM | `true` | `APPROVED_LATE` |
| > 11:30 AM | `false` | `HALF_DAY` |
| > 11:30 AM | `true` | `APPROVED_HALF_DAY` |

### Applied uniformly — never branched by employment type

`calculateAttendanceStatus(now, false)` is called with `hasApprovedProposal = false`
hardcoded in `attendance.ts:142`. The function accepts the parameter but the caller
never passes `true` — so `APPROVED_LATE` and `APPROVED_HALF_DAY` are unreachable
in the production scan flow.

`employment_type` is never read in `time.ts`, `attendance.ts`, or `reports.ts`.
A PART_TIME employee with a 9 AM – 1 PM schedule is assessed by the same 10:30/11:30
cutoffs as a FULL_TIME employee. There is **no employment-type-aware mark calculation**.

---

## Summary — Prioritised Gaps

| Priority | Area | Gap |
|---|---|---|
| **P0** | Kiosk | QR tokens never expire; same HMAC valid forever unless secret changes |
| **P0** | Daily report | No "view team's reports" endpoint — MD/HR cannot read submissions back |
| **P1** | Late proposal | HR approval queue (`GET /attendance/proposals/queue`) reads `auditEvent` with `action: 'SUBMIT_LATE_PROPOSAL'` but the submit route never creates that audit event — queue always returns empty |
| **P1** | Mark calculation | `hasApprovedProposal` always passed as `false`; `APPROVED_LATE`/`APPROVED_HALF_DAY` statuses are unreachable even when an approved proposal exists |
| **P1** | Logout gate | Kiosk checkout is unconditional — no report-submission gate; but UI can already display rejection messages if API sends a 400 |
| **P2** | Daily report | No standalone route or nav entry — report only reachable via logout flow; no mid-day submission possible |
| **P2** | Daily report | Soft gate — employee can bypass by choosing "Quick Visit / No Report" intent |
| **P2** | Mandatory flag | No per-employee or per-employment-type "report_required" field |
| **P2** | Employment type | `PART_TIME`/`CONTRACT`/`INTERN` employees assessed by identical cutoffs as `FULL_TIME` |
| **P3** | Kiosk auth | No dedicated kiosk-account or scoped token — HR manager's full app token is used on the kiosk screen |
| **P3** | Daily report | `submitted_at` UTC window may not align with IST midnight for the "today" check |
