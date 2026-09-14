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

### 0.3 `[x]` Duplicate employees with same phone / email

- **Root cause:** `Employee.phone` and `Employee.email` only have `@@index`, no uniqueness.
- **Fix:** (1) service-level check in employee create/update returning a friendly 409 ("An employee with this phone already exists: RRH-EX-xxxx"); (2) DB migration adding `@@unique([company_id, phone])` and `@@unique([company_id, email])`. Run a duplicate scan on production data **before** the migration; the migration will fail if duplicates exist.
- **Verify:** try to create a second employee with an existing phone → blocked with clear message; existing employees untouched.
- **Done 2026-09-14 (app-layer part):** new `apps/api/src/services/employeeContact.service.ts` — `findEmployeeContactConflict` normalises phone (digits only, `91`/`0` prefix stripped) and email (trimmed, lower-cased) before comparing, so "+919876543210", "919876543210" and "9876543210" are correctly recognised as the same number even though existing rows hold a mix of spellings. Wired into all three write paths that were unguarded: `POST /employees` (create), `PATCH /employees/:id` (admin update), `PATCH /employees/me` (self-update) — each returns 409 naming the exact employee code/name already holding that phone or email, plus a hint (reactivate vs. pick a different number) based on the holder's status. Web: 409s with this message get their own "Duplicate employee" toast instead of the generic Conflict one. **Verified**: 12 live API tests against the local DB (raw/+91/legacy-format collisions all caught, per-company scoping preserved, self-conflicts excluded, valid creates still succeed) plus a full browser walkthrough of the onboarding wizard reproducing the exact reported scenario.
- **Root cause found while testing:** the local test DB had 200+ real duplicate-phone rows — not production data, but pollution from `tests/api/phase_c_role_uat.test.ts` hard-coding `+919000000001` / `+919000000006` and never cleaning up across repeated runs. That test now generates a unique phone per run (same pattern the file already used for leads) and was re-verified green (22/22).
- **Done 2026-09-14 (DB-level constraint):** ran the normalisation report (read-only) against `DATABASE_URL_PRODUCTION` — 12 employees total, 0 phone duplicates, but a real finding: **6 employees had `email` stored as `""` rather than `NULL`**, which the first version of the script's change-detection silently missed (it only flagged truthy values — fixed, re-verified, see `5708d64`). MySQL exempts multiple `NULL`s from a unique index but not multiple `''`, so this would have made the eventual constraint fail to apply without ever looking like "a duplicate" in the report. Also found 4 employees sharing the placeholder `example@gmail.com` (`RRH-OP-3514`, `RRH-MK-5052`, `RRH-SL-4126`, `RRH-SL-4770`) — your call was to clear it to blank for all 4; wrote `clearDuplicatePlaceholderEmails.ts` for that (guarded — aborts if a record no longer holds exactly that placeholder).
- **Both writes to `DATABASE_URL_PRODUCTION` were blocked by the harness's own permission classifier** ("Modify Shared Resources", then a read attempt got "Production Reads") — separate from your in-chat approval. Did not attempt to work around either block. **The two remediation scripts are committed and ready for you to run against production yourself** (`normalizeEmployeeContacts.ts --apply` then `clearDuplicatePlaceholderEmails.ts`, both in `apps/api/src/scripts/`) — see the commands in my message. Once you confirm a clean report, the `@@unique` migration below is a straight `prisma migrate deploy`.
- **You then clarified the actual ask was `test_db`, not production** — found the real equivalent problem there: **202 duplicate-phone rows**, pure pollution from `phase_c_role_uat.test.ts` running repeatedly against the shared local DB before its bugfix above (all named "MD New Emp"/"HR New Emp", phone `9000000001` or `9000000006`). Checked dependencies first (12 leads had `assigned_to_id` pointing at them, `EmployeeRole` cascades on delete per schema, `AuditEvent.actor_id` has no DB-level FK) — unassigned those 12 leads, then deleted all 202 rows inside one transaction. `test_db`'s duplicate report is now clean (0/0).
- **Migration written and fully verified end-to-end against `test_db`** (`prisma/migrations/20260914160000_employee_contact_uniqueness/`, replacing the plain `@@index([phone])`/`@@index([email])` with `@@unique([company_id, phone])`/`@@unique([company_id, email])`). Applied the raw SQL directly rather than via `prisma migrate deploy`, since `test_db` has an unrelated pending migration from someone else's concurrent work that `migrate deploy` would also have applied. Confirmed with real inserts: two employees with `NULL` phone/email both succeed (MySQL exempts NULL from uniqueness — matches the "email is optional" behaviour from item 0.1), a duplicate phone in the same company is rejected at the DB level (Prisma `P2002`), and the same phone in a _different_ company is allowed (constraint is correctly per-company). Full employee test suites (`phase_c_role_uat`, `md-employees-isolation`, `employee-permission-overrides`, `phase3-customer` — 41 tests) still pass with the constraint live. Checked the other test files that seed employees directly via Prisma (bypassing the app-layer check) for constraint collisions — none found; the 2 unrelated failures I did hit while checking (`analytics-routes` KPI number, `opportunities-integration` 403s, `performance-metrics` importing from `vitest` instead of `jest`) are pre-existing/caused by another session's concurrent, uncommitted work in this same repo (permissions/authz refactor, `schema.prisma`'s new `RolePermissionHistory` model) — confirmed by reverting to baseline and by grepping those tests for zero references to anything in this item.
- **Still to do by you:** run the two scripts against production (commands given separately), confirm a clean report, then `prisma migrate deploy` to apply `20260914160000_employee_contact_uniqueness` for real. Everything up to that point is done and proven safe on a clean copy of the schema/constraint.

---

## Phase 1 — Every project is a property (the headline feature)

**Principle:** anywhere the app shows, picks, matches, or books a _property_, it must show _project units_ too. The database already supports this — `Booking`, `LeadPropertyInterest`, `PriceLine`, `InventoryFeature`, `WebsiteShortlistItem` all have `property_id | project_unit_id`. Only the UI and the matching engine are property-only. **No schema migration is needed for this phase.**

We introduce one concept in the frontend: an **Inventory Item** = `{ kind: 'PROPERTY', property } | { kind: 'UNIT', unit, project }`. Every picker and card renders an Inventory Item, not a Property.

### 1.1 `[x]` One API endpoint that returns both

- New `GET /api/v1/inventory?status=LIVE&q=&location=&min_price=&max_price=&type=` returning a unified list: `{ kind, id, code, title, location, price, area, bedrooms, project_name?, unit_number?, tower?, floor?, image_url }`.
  - Properties: `status = LIVE`.
  - Units: parent project `verification_status = VERIFIED` (and `is_published` if that's the rule) and unit `sales_status = AVAILABLE`.
- Reuse the existing property and project-unit list services; do not duplicate query logic.
- **Verify:** hit the endpoint in the browser; count matches properties + available units.
- **Done 2026-09-14:** `GET /api/v1/inventory` (`apps/api/src/services/inventory.service.ts` + `routes/inventory.ts`). Turned out the domain has a wrinkle the plan didn't account for: `Property` can also carry a `project_id` directly (an older, pre-`ProjectUnit` way of representing a unit inside a project -- `ProjectUnit.migrated_from_property_id` documents the migration path) -- found 5 real rows like this in `test_db`, in projects with zero overlap with the 10 `ProjectUnit` rows. Both are included, same `kind: 'PROPERTY'` either way; the genuinely new addition is `kind: 'UNIT'` for `ProjectUnit` rows. Reused `buildPropertyScope`/`buildProjectScope` (the same authorization scoping every other property/project read already uses) rather than writing new visibility rules. Response items are one shared shape (`kind, id, code, title, category, location, city, price, area_sqft, bedrooms, facing, image_url, sales_status, project_id, project_name, unit_number, tower, floor`). Filters: `q`, `location`, `min_price`/`max_price`, `type`, `status` (`AVAILABLE` default = LIVE properties + AVAILABLE units in visible projects; `ALL` lifts that but keeps permission scope).
- **Verified**, not just typechecked: seeded a real VERIFIED project + AVAILABLE unit + a SOLD unit + a DRAFT project's unit in `test_db`, then hit the live endpoint -- merged property+unit results, `q`/`location`/`type`/`min_price` filters all correct (caught and fixed a real bug of my own along the way: unit location was populated from the project's `city` instead of its `location` field, so a location search silently returned nothing), `AVAILABLE` vs `ALL` gating correct, pagination correct. Logged in as an `Agent`-role user specifically to confirm the DRAFT project's unit is invisible to a non-privileged role while the VERIFIED one isn't -- permission scoping carries through correctly.
- **Caught my own mistake while testing:** an earlier Phase 0.3 cleanup step had reset my local QA test account's phone to a value that collided with the very pollution rows I later bulk-deleted -- deleted my own test account along with them. Recreated it with a fresh phone; no user-visible impact, but noting it because it's the kind of self-inflicted collision worth watching for when reusing "known" test values across a long session.
- **Pre-existing, unrelated test failures found while regression-checking** (`project-units-pricing`, `project-layout`, `project-amenities`, `project-unit-features-activity`, part of `projects.test.ts`, part of `marketing-director-properties-read.test.ts`): all "Forbidden: Missing X permission" or a role-matrix assertion mismatch, all in files with zero uncommitted changes (confirmed via `git status`) and zero references to anything in this item. Traced the likely cause: `packages/shared/src/index.ts` (what tests import as `@rrh-ems/shared`) has drifted from `apps/api/src/shared/auth.ts` (what the real server runs) -- missing several permissions (`demos.*`, `bookings.md_approve`, `projects.verify`, `attendance.manage`, and more). Did not fix -- out of scope for this item and touching a constants file that wide needs its own pass, not a drive-by.

### 1.2 `[x]` Matches tab shows project units

- `apps/api/src/utils/matchingEngine.ts:53` — extend `findMatchingPropertiesForLead` to also score available `ProjectUnit`s. Same 40/40/20 scoring; for location use the **project's** structured location (`city`, `locality`, `mandal`, `village`, `location`), for price use the unit's computed price, for category map `UnitType` → the lead's `property_type_preference`.
- Result shape gains `kind` and, for units, `projectName`, `unitNumber`. WhatsApp template `{property_name}` becomes "Project — Unit 204" for units.
- `apps/web/src/components/leads/LeadDetailModal.tsx` Matches tab: render both kinds with a small "Project unit" badge.
- Also `matchDroppedLeadsToProperty` (`:232`) needs a unit twin so that publishing a project re-surfaces dropped leads.
- **Verify:** a lead whose preferred location = a project's city sees that project's units in Matches.
- **Done 2026-09-14:** `matchingEngine.ts` extracted the shared 40/40/20 scoring (`scoreItem`/`scoreLocation`) so Property and ProjectUnit scoring can never drift apart, then scores AVAILABLE units in VERIFIED projects the same way -- unit location is the parent project's `location` field (units don't carry their own address, same as the plan said). Result items gain `kind: 'PROPERTY' | 'UNIT'` plus `projectId`/`projectName`/`unitNumber` for units; WhatsApp text title becomes "ProjectName -- Unit 204".
- **Turned out to be a bigger unit than planned** -- the Matches tab's Save/WhatsApp buttons call `POST /leads/:id/properties` and `POST /leads/:id/whatsapp-proposal/:id`, both property-only. Shipping units in Matches without extending those would have looked done but silently broken the moment someone clicked Save on a unit result. So this item also now covers: `AddPropertyInterestSchema` accepts `property_id` OR `project_unit_id` (XOR, schema-enforced); `addPropertyInterest`/`removePropertyInterest`/`sendWhatsAppProposal` rewritten around a shared `loadInterestTarget` helper so property/unit text generation can't diverge; the two routes take a `?kind=UNIT` query flag (path shape unchanged, so nothing existing breaks); `getPropertyInterests` now includes `project_unit` (with its project) alongside `property`, and `LeadDetailModal.tsx`'s Interests tab renders whichever is present with the same "Project Unit" badge as Matches -- it would otherwise have crashed reading `interest.property.title` off a null property.
- **`matchDroppedLeadsToProperty` unit twin, done:** `matchDroppedLeadsToUnit` + `triggerLeadRecoveryForUnit` (refactored `recovery.ts` around one shared `recoverMatchedDroppedLeads` helper so the notification/activity-log logic isn't duplicated). Wired into both places a property's LIVE transition already does this: `ProjectUnitService.changeStatus` (unit -> AVAILABLE) and the project verification-approve endpoint (PENDING_VERIFICATION -> VERIFIED sweeps every AVAILABLE unit in that project, since approval is what makes them visible for the first time). Also extended the nightly `leadRecoveryJob` sweep to cover units, and fixed a small pre-existing inefficiency while touching that loop (`triggerLeadRecoveryForProperty` was being called once per matched lead, redundantly re-running the same match query each time, instead of once per property).
- **Verified against a live seeded scenario**, not just typechecked: qualified a lead (Kokapet, budget 90L, FLAT) against a matching AVAILABLE unit in a VERIFIED project and a non-matching LIVE villa -- unit scored 100%, mismatched villa scored 40%, exactly as the 40/40/20 weights predict. Saved both a property and a unit interest via the real API, fetched them back with the correct nested shape, removed the unit interest via `?kind=UNIT` and confirmed only it was removed. Fired a WhatsApp proposal for the unit and read back the generated text (project name + unit number, correct price/location). For dropped-lead recovery: created two more dropped `NO_MATCHING_INVENTORY` leads, matched one by toggling a unit's status to AVAILABLE and the other by approving its (previously PENDING_VERIFICATION) project -- both leads flipped back to ASSIGNED automatically, no errors in the server log. Then did the same Save/WhatsApp flow again through the real browser UI against the local API: Matches tab correctly renders both kinds side by side with the "Project Unit" badge, clicking Save on a unit match persists correctly (`201 Created`) and immediately shows up in Interests with the same badge, clicking WhatsApp fires `?kind=UNIT` and returns 200. Regression-checked the broader lead test suites -- `leads.test.ts`, `phase4-lead-engine.test.ts`, `lead-negotiation-guard.test.ts` still show the same "Forbidden"/IDOR failures already traced in item 1.1 to the `packages/shared` permission-constant drift (confirmed again: zero uncommitted changes on any of those three files); `site-visit-complete-lead-cascade`, `site-visit-complete-no-property`, `convert-to-customer-gating` all still pass.

### 1.3 `[x]` Booking flow can book a project unit

- `apps/web/src/components/commercial/BookingInitiationWizard.tsx:342` and `CreateBookingModal.tsx:37` — replace `/properties?status=LIVE` with `/inventory`. The picker shows a grouped list: **Projects → units** and **Individual properties**.
- On submit send `project_unit_id` instead of `property_id` when a unit is chosen. The API (`booking.service.ts`) already enforces the XOR — confirm the request body field names match.
- Booking list / detail / cost sheet (`shared/CostSheet.tsx`) must display "Project – Unit" for unit bookings.
- **Verify:** initiate a booking on a unit; unit `sales_status` flips to BLOCKED/BOOKED; the lead moves to BOOKING_INITIATED.
- **Done 2026-09-14 -- turned out to be mostly already built:** `services/inventory/reference.ts` already had a complete, well-tested Property/ProjectUnit abstraction (`resolveInventoryRef`, row locking via `SELECT ... FOR UPDATE`, `assertClaimable`, `claimInventoryLock`) and `BookingService.initiateBooking` (the wizard's real endpoint, `/bookings/initiate`) was already fully wired to it -- `InitiateBookingSchema` already accepted `project_unit_id`. The gap was narrower than planned: only the _legacy_ `POST /bookings` route's `CreateBookingSchema` required `property_id` with no unit option (fixed: now XOR, same pattern as everywhere else), and the frontend never gave the user a unit to pick.
- **Frontend:** both `CreateBookingModal.tsx` and `BookingInitiationWizard.tsx` now fetch `/inventory` (replacing `/properties?status=LIVE`) and render a grouped `<select>` (`optgroup` "Individual Properties" / "Project Units"), submitting `project_unit_id` or `property_id` based on which group was picked.
- **Found and fixed a real, separate bug while wiring the list/detail display:** `BookingService.getBookings`/`getBookingById` had **zero `include`** on the Prisma query -- not even `customer`. Every booking list/detail screen (`BookingManagement.tsx`, `BookingDossier.tsx`) has been silently rendering blank customer/property/payment fields for every booking, since before this session touched anything. Added `BOOKING_DISPLAY_INCLUDE` (customer, property, project_unit with its project, assigned_employee) shared between both methods, plus payments on the detail fetch. `BookingManagement.tsx`'s "Property Details" column and `BookingDossier.tsx`'s detail section now render a "Project Unit" badge + project/unit info when `project_unit` is set, property info otherwise.
- **`CostSheet.tsx` needed no changes** -- on inspection it's a pure `PriceComputation` renderer with no property/unit-specific logic at all (already shared across the Add Unit wizard, Unit Detail page, and eventually the property pricing tab); it isn't even used in the booking flow today.
- **Verified against live data, not just typechecked:** seeded a VERIFIED project + AVAILABLE unit, initiated a booking against it via the real `/bookings/initiate` endpoint -- unit `sales_status` correctly flipped to `RESERVED` with `locked_until`/`locked_by_booking_id` set (the actual states this codebase uses -- **not** "BLOCKED/BOOKED" as the plan assumed; BOOKED only happens on confirmation, matching Property's own LIVE -> LOCKED -> BOOKED lifecycle). Also verified: the legacy `/bookings` POST path with a unit (201), with both `property_id` and `project_unit_id` (400, clear message), with neither (400); a regression property booking via the same legacy path still works; `GET /bookings` and `GET /bookings/:id` now return fully populated `customer`, `property`/`project_unit` (mutually exclusive, exactly as expected), and `payments`. In the real browser against the local API: booking list correctly shows 2 property bookings without a badge and 2 unit bookings with a "PROJECT UNIT" badge and "ProjectName -- Unit NNN" title; clicking into a unit booking's detail page correctly shows a "Project Unit Details" section (project, unit number, RESERVED status) instead of "Property Details"; the wizard's Step 2 picker correctly lists both properties and units grouped, advanced through steps 1-3 with a unit selected. Hit one flaky stale-token 403 on the final submit click late in a long browser session -- reproduced the identical payload via curl with the same token and it succeeded (201), confirming the 403 was a session-timing artifact (401-then-refresh cycles were happening on every request throughout this browser session, a pre-existing pattern unrelated to this change) and not a defect in this work; the curl-created booking (against the exact unit shown in the wizard's picker) is visible in the booking list with the correct badge.
- **Note on the plan's original verify text:** "the lead moves to BOOKING_INITIATED" doesn't apply to this flow -- `BOOKING_INITIATED` is a Lead status reached via a separate manual lead-status transition, a precondition for converting an _Opportunity_ to a booking (`opportunity.service.ts`), not something `createBooking`/`initiateBooking` themselves set. Those two direct-booking paths never touch `Lead.status` at all -- confirmed by reading the code, not assumed.

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
