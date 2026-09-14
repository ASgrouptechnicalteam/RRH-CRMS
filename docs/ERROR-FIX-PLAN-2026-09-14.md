# Error Fix Plan — 2026-09-14

Source: `docs/errors till now.pdf` (11 pages, 24 items) + the "every project is a property" requirement.

**Working rule:** one item at a time. Each item = investigate → fix → verify in the running app → tick it off → commit. Nothing else is touched while an item is open. After the whole list is done we re-QA the app end to end and write a new report.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done + verified

---

## Phase 0 — Root-cause bugs that block QA (do first, small, low risk)

These are tiny fixes, but they block testing the lead and employee workflows, so they go first.

### 0.1 `[x]` Empty-string vs optional validation (fixes 2 reported errors at once)

- **Reported as:** "Drop lead shows error `exit_reason_detail: String must contain at least 1 character(s)`" and "Employee create shows `bank_ifsc: Invalid IFSC format` even though bank details are optional".
- **Root cause:** forms send `""` for untouched optional fields; zod `.optional()` accepts only `undefined`, so `""` hits `.min(1)` / the IFSC regex.
  - `apps/api/src/shared/lead.ts:158` — `exit_reason_detail`
  - `apps/api/src/shared/employee.ts:29` and `:64` — `bank_ifsc` (and likely `bank_account_number`, PAN, Aadhaar in the same file)
- **Fix:** add one shared helper `emptyToUndefined` (preprocess `""`/whitespace → `undefined`) and apply it to every optional string that carries a regex or `min()`. Grep all `apps/api/src/shared/*.ts` for `.optional()` preceded by `.regex(`/`.min(` and treat each.
- **Verify:** drop a lead with the reason box empty; create an employee with all bank fields blank; create one with a _valid_ IFSC (must still pass); create one with an _invalid_ IFSC (must still fail).
- **Done 2026-09-14:** helper `apps/api/src/shared/zodHelpers.ts` (`blankAsAbsent`). Applied to employee PAN/Aadhaar/IFSC/email/initial_password, lead `exit_reason_detail`/`demo_scheduled_at`, customer email, KYC PAN/Aadhaar, price-override reason, site-visit reschedule date. Identity fields (name, phone) deliberately still reject blanks. Verified via 22 schema tests + 6 live API calls on local DB (blank → stored as NULL, invalid IFSC still 400, `OTHER` still requires a detail). Pre-existing unrelated failures in `leads.test.ts`/`phase4-*` (IDOR/duplicate tests) confirmed failing on baseline too — not caused by this change.

### 0.2 `[x]` Bulk upload produces garbage rows

- **Reported as:** "Bulk upload works but the data is like a hashed password" (screenshot shows `xl/styles.xml` inside a lead name).
- **Root cause:** `apps/web/src/components/leads/LeadManagement.tsx:264` reads the file with `FileReader.readAsText()`. When the user picks an `.xlsx` (a zip), the zip bytes become "leads". `accept=".csv,.txt"` doesn't stop this on Windows.
- **Fix (pick one, recommend A):**
  - A. Parse `.xlsx`/`.csv` properly in the browser with the `xlsx` (SheetJS) package → same row shape the API already accepts. Reject unknown extensions with a clear message.
  - B. Keep CSV-only, but detect non-text (zip signature `PK`) and refuse with "Please upload CSV, not Excel".
- **Also:** add a "Download sample CSV/XLSX" link next to the upload button so the column names are never guessed.
- **Verify:** upload a real `.xlsx`, a `.csv`, and a `.txt`; confirm names/phones land in the right columns; confirm the garbage leads from the screenshot are deleted (they're real rows in the DB now).
- **Done 2026-09-14:** option A. New `apps/web/src/utils/leadImportParser.ts` (SheetJS 0.20.3) parses .xlsx/.xls/.csv through one path: header-name matching with synonyms (falls back to the legacy positional order), phone normalisation (`+91`, `0`, Excel `.0`), per-row skip reasons with Excel row numbers, in-file duplicate detection. Leads page: accept list widened, **Template** button (downloads `lead-import-template.xlsx`), preview modal lists skipped rows, result toast now reports `Imported X of Y (N already existed, M failed)` instead of a blanket success. Silent `Miyapur` / `RESIDENTIAL_VILLA` defaults removed — blank cells stay blank. Server: `bulkUploadLeads` now sanitises every row (readable name, 10-digit phone, valid email) so garbage is rejected regardless of client. Verified: 19 parser tests, live API call with garbage/invalid/duplicate rows, and the real UI in the browser against the local API (xlsx → 2 imported/3 skipped; CSV with quoted commas intact; re-upload → "0 of 2 (2 already existed)"). **Still to do by you:** delete the garbage leads already in production (`RRH-LD-2026-0005` … `0013` in the screenshot).

### 0.3 `[ ]` Duplicate employees with same phone / email

- **Root cause:** `Employee.phone` and `Employee.email` only have `@@index`, no uniqueness.
- **Fix:** (1) service-level check in employee create/update returning a friendly 409 ("An employee with this phone already exists: RRH-EX-xxxx"); (2) DB migration adding `@@unique([company_id, phone])` and `@@unique([company_id, email])`. Run a duplicate scan on production data **before** the migration; the migration will fail if duplicates exist.
- **Verify:** try to create a second employee with an existing phone → blocked with clear message; existing employees untouched.

---

## Phase 1 — Every project is a property (the headline feature)

**Principle:** anywhere the app shows, picks, matches, or books a _property_, it must show _project units_ too. The database already supports this — `Booking`, `LeadPropertyInterest`, `PriceLine`, `InventoryFeature`, `WebsiteShortlistItem` all have `property_id | project_unit_id`. Only the UI and the matching engine are property-only. **No schema migration is needed for this phase.**

We introduce one concept in the frontend: an **Inventory Item** = `{ kind: 'PROPERTY', property } | { kind: 'UNIT', unit, project }`. Every picker and card renders an Inventory Item, not a Property.

### 1.1 `[ ]` One API endpoint that returns both

- New `GET /api/v1/inventory?status=LIVE&q=&location=&min_price=&max_price=&type=` returning a unified list: `{ kind, id, code, title, location, price, area, bedrooms, project_name?, unit_number?, tower?, floor?, image_url }`.
  - Properties: `status = LIVE`.
  - Units: parent project `verification_status = VERIFIED` (and `is_published` if that's the rule) and unit `sales_status = AVAILABLE`.
- Reuse the existing property and project-unit list services; do not duplicate query logic.
- **Verify:** hit the endpoint in the browser; count matches properties + available units.

### 1.2 `[ ]` Matches tab shows project units

- `apps/api/src/utils/matchingEngine.ts:53` — extend `findMatchingPropertiesForLead` to also score available `ProjectUnit`s. Same 40/40/20 scoring; for location use the **project's** structured location (`city`, `locality`, `mandal`, `village`, `location`), for price use the unit's computed price, for category map `UnitType` → the lead's `property_type_preference`.
- Result shape gains `kind` and, for units, `projectName`, `unitNumber`. WhatsApp template `{property_name}` becomes "Project — Unit 204" for units.
- `apps/web/src/components/leads/LeadDetailModal.tsx` Matches tab: render both kinds with a small "Project unit" badge.
- Also `matchDroppedLeadsToProperty` (`:232`) needs a unit twin so that publishing a project re-surfaces dropped leads.
- **Verify:** a lead whose preferred location = a project's city sees that project's units in Matches.

### 1.3 `[ ]` Booking flow can book a project unit

- `apps/web/src/components/commercial/BookingInitiationWizard.tsx:342` and `CreateBookingModal.tsx:37` — replace `/properties?status=LIVE` with `/inventory`. The picker shows a grouped list: **Projects → units** and **Individual properties**.
- On submit send `project_unit_id` instead of `property_id` when a unit is chosen. The API (`booking.service.ts`) already enforces the XOR — confirm the request body field names match.
- Booking list / detail / cost sheet (`shared/CostSheet.tsx`) must display "Project – Unit" for unit bookings.
- **Verify:** initiate a booking on a unit; unit `sales_status` flips to BLOCKED/BOOKED; the lead moves to BOOKING_INITIATED.

### 1.4 `[ ]` Site visits, demos, interests, opportunities

- Site-visit booking, demo "interested properties", lead "Interests" tab, and opportunity creation each have a property picker. Switch each to `/inventory` one at a time (one commit each). `SiteVisitBooking` already has `project_id`.
- **Verify:** each flow once with a property and once with a unit.

### 1.5 `[ ]` Dashboards and widgets

- `PMDashboard.tsx`, `DigitalMarketing*Dashboard.tsx`, `md/UnassignedPropertiesWidget.tsx`, `ProjectDossier.tsx` still fetch `/properties`. Where the widget means "inventory" (counts, unassigned, live listings), switch to `/inventory`; where it genuinely means individual properties, leave it and rename the label so it isn't misleading.

### 1.6 `[ ]` Project types list

- **Reported as:** "Add all types of project types."
- Current `ProjectType` enum: PLOTTED, APARTMENT, VILLA, MIXED, COMMERCIAL, OTHER.
- **Needs your list.** Proposed, mirroring the property categories already in the schema (Plot, Apartment, Villa, House, Commercial Shop, Commercial Office, Farm Land): `PLOTTED`, `APARTMENT`, `VILLA`, `INDEPENDENT_HOUSE`, `ROW_HOUSE`, `FARM_LAND`, `FARM_HOUSE`, `COMMERCIAL_SHOPS`, `COMMERCIAL_OFFICE`, `MIXED_RESIDENTIAL`, `MIXED_USE (Residential + Commercial)`, `TOWNSHIP`, `GATED_COMMUNITY`, `OTHER`.
- Enum change = one migration + update the `<select>` in `ProjectWizard.tsx` + the unit-type defaults per project type.

### 1.7 `[ ]` Project creation "is not following the workflow"

- **Needs clarification** — which workflow? Likely candidates: (a) the DRAFT → PENDING_VERIFICATION → VERIFIED approval by MD/Admin isn't triggered/shown after the wizard; (b) the PM assignment / PM Approvals step; (c) the project doesn't appear in listings until verified and that looks like "nothing happened". Will confirm with you before touching it.

---

## Phase 2 — Employee & profile bugs

### 2.1 `[ ]` Profile page shows "Not provided" for data that exists

- Admin's employee-detail modal shows phone/email/address/bank; the employee's own `/profile` shows "Not provided" for the same person (RRH-EX-5471).
- Likely: `/profile` reads a different endpoint or different field names (`personal_email` vs `email`, `current_address` vs `address`). Compare the two responses, unify on the employee record.
- **Verify:** log in as that employee; every field entered in onboarding is visible.

### 2.2 `[ ]` Employee detail modal — top cut off

- The modal header (name, ID, role) scrolls out of view / is clipped under the top bar. Make the header sticky inside the modal and give the modal `max-height` with internal scroll.

### 2.3 `[ ]` Admin should not appear as an employee

- Leaderboard shows "Unknown — RRH-ADMIN-001". MD account sees admin details. Exclude the system-admin account (no employee record / role ADMIN) from leaderboards, employee lists, task assignee lists, team performance.
- **Verify:** Achievements page no longer lists RRH-ADMIN-001.

### 2.4 `[ ]` Task assignee — remove "Assign to Myself", show only subordinates

- `apps/web/src/components/tasks/TaskManager.tsx:551`. Populate the dropdown from the reporting hierarchy (people who report to the current user, recursively). If the API doesn't expose that, add `GET /employees/subordinates`. Managers with no reports see "No team members to assign".

### 2.5 `[ ]` Show/hide password toggle everywhere

- Login, Security Setup (first-login password change), Change Password, employee onboarding password field, kiosk. One shared `<PasswordInput>` component with an eye icon; replace every `type="password"` input.

### 2.6 `[ ]` Send login credentials via WhatsApp after onboarding

- On the "Employee created" success screen add **Send credentials on WhatsApp** → opens `wa.me/91<phone>?text=…` with a `MessageTemplate` (`EMPLOYEE_WELCOME_CREDENTIALS`) containing login URL, employee code, temporary password, and the "change on first login" note. No auto-sending; the admin presses send in WhatsApp.

### 2.7 `[ ]` Half-day leave option

- Attendance Proposals → Leave Request: add **Leave type**: Full day / First half / Second half. Needs a `leave_type` column on `AttendanceProposal` (migration) and HR approval view shows it. **Confirm:** does half-day count as 0.5 in attendance reports?

---

## Phase 3 — Lead workflow behaviour

### 3.1 `[ ]` "Convert to Customer" everywhere + "already converted" error

- Rule you gave: a lead becomes a customer **only when they book a property/unit**. So the button should not be a free action at all — conversion happens automatically inside the booking flow (`customer.service.ts:144` guard already assumes this).
- Fix: remove the button from the lead detail "Next Actions" and from every list row; keep the automatic conversion on booking; show a read-only "Customer: RRH-CU-xxxx" chip on converted leads. The 409 error disappears with the button.

### 3.2 `[ ]` "Why is there a Sales Pipeline?" (answer, not a bug)

- Sales Pipeline is the deal-value view: leads _after_ qualification, grouped by stage (Qualified → Site visit → Negotiation → Booking initiated), with expected ₹ per stage, drag-and-drop between stages. Leads page = per-person follow-ups; Pipeline = revenue forecast for MD/managers. If you don't want it, we hide it from the menu (keep the code) — say the word.

---

## Phase 4 — Navigation & layout (UI polish, no logic)

### 4.1 `[ ]` Sidebar dropdowns — clear open/closed state, accordion

- Rotate chevron (▼ open / ▶ closed), highlight open group header, indent children with a left border, and **opening one group closes the others**. Persist the open group so a reload doesn't collapse it.

### 4.2 `[ ]` Sidebar items missing icons

- `Customers`, `Sales Pipeline`, `Analytics & Goals` render without an icon so they misalign (screenshot p4). Add icons (`Users`, `Kanban`/`GitBranch`, `Target`) and make the icon slot fixed-width so text always aligns even if an icon is missing.

### 4.3 `[ ]` Permissions toggle switch looks bad

- Super Admin → Permissions matrix. Replace the current toggle with a clear three-state cell: filled check (granted), empty (denied), amber dot (modified-unsaved) — matching the legend that's already at the bottom. Bigger hit area, keyboard accessible.

### 4.4 `[ ]` Mobile notifications panel cut off

- At 375px the dropdown is positioned off-screen to the left (screenshot p11). Make it a full-width bottom sheet on `< md` breakpoints.

### 4.5 `[ ]` Clicking a notification should open the related item

- Each `Notification` needs `entity_type` + `entity_id` (check if already there); the panel navigates to `/leads/:id`, `/bookings/:id`, `/approvals`, etc., and marks it read. For notifications that have no target, open a detail sheet with the full message.

### 4.6 `[ ]` Global search — make it work

- `common/AppLayout.tsx:96` `GlobalSearchInput`. Wire it to a `GET /search?q=` that returns leads (name/phone/code), customers, properties, projects/units, employees — respecting the caller's permissions — and show a grouped dropdown with keyboard navigation. Removing it is the fallback if we decide it isn't worth it.

### 4.7 `[ ]` Pincode auto-fill flaky

- External pincode API sometimes times out / rate-limits. Add: loading spinner on the button, 8s timeout, one automatic retry, and a friendly "Couldn't look up pincode, please fill manually" instead of a red error. Consider caching by pincode in the API so the second lookup never leaves our server.

---

## Order of work (proposal)

```
0.1 → 0.2 → 0.3        (half a day; unblocks QA of leads & employees)
1.1 → 1.2 → 1.3        (the core "projects everywhere"; 1.3 is the riskiest, done last of the three)
1.6 (needs your list) → 1.4 → 1.5 → 1.7 (needs clarification)
3.1 → 2.4 → 2.3 → 2.1 → 2.2      (workflow correctness)
2.5 → 2.6 → 2.7
4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7
→ full app re-QA, new error report
```

## Open questions (answer whenever; nothing in Phase 0 depends on them)

1. **Project types:** is the proposed list in 1.6 right? Anything to add/remove?
2. **1.7** "Adding a project is not following the workflow" — which step did you expect to happen that didn't?
3. **Half-day leave:** count as 0.5 day in attendance/salary reports, or just a label for HR?
4. **Sales Pipeline:** keep it, or hide it from the menu?
5. **Global search:** wire it up (my recommendation) or remove it?
