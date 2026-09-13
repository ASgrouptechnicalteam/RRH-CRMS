# Projects & Properties Rebuild — Full Implementation Plan

**Status as of 2026-09-08:** Phase 1 (Backend Foundation) is complete, tested, and verified against the local database. Phases 2–6 are specified below in full, ready to execute in order.

This document is the single source of truth for finishing this rebuild. It assumes no prior context — every file path, endpoint, and step needed to go from here to a finished product is written out explicitly.

---

## 1. Why this rebuild exists

Sandeep's own words, which govern every decision below:

> "change every thing i don't care but i need a perfect project and property adding and displaying pages... first make a plan"

> "we need to make it even more realistic and more accurate" (re: pricing and sizing)

> "instead of adding every unit in project we will add it as a project" — i.e., a Project is a container; its saleable units are managed underneath it, not folded into the Project creation form.

The rebuild is driven by a real-estate product specification (`D:\downloads\projects (1).md`) describing the target architecture: a Project contains many `ProjectUnit`s (plots/flats/villas/houses/commercial), each priced by a transparent, itemized cost sheet; a standalone `Property` is a self-contained listing with no parent project. Two scope decisions were confirmed directly with Sandeep and must be respected in every phase:

1. **Approval pipeline**: Standalone `Property` listings keep the existing PM → DM → MD verification pipeline before going live. `ProjectUnit`s are internally-authored inventory — **no approval gate**. An admin adds a unit and it is immediately part of the live inventory.
2. **Scope**: This entire rebuild is the **internal CRM only**. Public-facing property/project search pages are explicitly out of scope and must keep working unmodified — do not touch `apps/api/src/routes/public.ts` beyond what's strictly necessary to avoid breaking it.

---

## 2. The architectural decisions already made (do not re-litigate these)

### Decision 1 — `ProjectUnit` is a real, separate table from `Property`

Before this rebuild, a "unit" was a `Property` row with `project_id` set — dragging ~20 unused listing columns (SEO fields, DM-polish state, verification logs) into every unit. `ProjectUnit` is now its own table with only the columns a unit needs, and no publication pipeline.

**Both tables coexist.** Every downstream sales-pipeline table (`Booking`, `Opportunity`, `SiteVisitBooking`, `SiteVisitProperty`, `Complaint`, `LeadPropertyInterest`, `DemoInterestedProperty`, `PropertyLayoutRegion`) now carries **both** `property_id` and `project_unit_id` as nullable columns — exactly one is set per row. This XOR is enforced in code, not the database, via `apps/api/src/services/inventory/reference.ts` (see §4.4).

### Decision 2 — Pricing is a server-side engine with a persisted cost sheet

The client never computes an authoritative price. The formula, matching Indian real-estate cost-sheet convention (BSP/PLC/EDC-IDC/IFMS):

```
Base Price   = base_rate × area(price_basis)     ← BSP
+ Premiums   (facing, floor, corner, road, park, view, BHK/type)   ← PLC
+ Charges    (infra, club, parking, IFMS, legal/documentation)
− Discount
= Calculated Price
  [optional] Override Price + reason  → Final Selling Price (both always preserved)
+ Taxes (GST, registration — tracked separately, never folded into Calculated Price)
= All-Inclusive Price
```

Every line of that computation is persisted as a `PriceLine` row at the moment it's computed — never recomputed silently on read. Changing a project's pricing rules never changes an existing unit's price until someone explicitly runs "Recalculate."

### Decision 3 — Status is two independent axes

- **`sales_status`** (`AVAILABLE | HOLD | RESERVED | BOOKED | SOLD | BLOCKED | UNAVAILABLE`) — exists on both `ProjectUnit` and `Property`. `HOLD`/`BLOCKED`/`UNAVAILABLE` are set by hand; `RESERVED`/`BOOKED` are owned exclusively by the booking workflow; `SOLD` is a manual admin action but only reachable from `BOOKED` (i.e., only after a real booking exists).
- **`publication_status`** (the pre-existing `PENDING_VERIFICATION → ... → LIVE` pipeline) — **standalone `Property` only.** `ProjectUnit` has no publication pipeline; it has `is_published: boolean` instead.

### Decision 4 — One measurement vocabulary

`apps/api/src/shared/measurement.ts` is now the **only** place area-unit conversion logic exists, replacing two previously-conflicting implementations in the frontend. Every area value is stored as entered (`area_value` + `area_unit`) plus derived `area_sqft`/`area_sqyd` (both indexed, both always computed server-side).

**`price_basis`** is the concept that was previously missing entirely: a base rate must declare _which_ area it multiplies — `SUPER_BUILT_UP` for flats (the Indian norm), `PLOT_AREA` for plots (priced in Sq.Yd), `BUILT_UP` for some villas, or `LUMPSUM` for a flat price with no area math at all.

---

## 3. Production-database safety (read this before running any Prisma command)

This was discovered and fixed during Phase 1 — it is critical context for every phase that follows.

- **Root `.env`** now points `DATABASE_URL` at local `test_db` (`127.0.0.1:3306`). The **production** database URL is preserved as `DATABASE_URL_PRODUCTION` in the same file — nothing loads it automatically.
- **Never run `prisma migrate deploy` against production.** `apps/api/prisma/migrations/` is stale (this project has been maintained via `prisma db push`, not tracked migrations) — replaying that folder from scratch would **drop 39 tables**, including `Company` and `Employee`. Schema changes are shipped as hand-reviewed SQL files in `apps/api/prisma/manual-migrations/` instead.
- **To apply a schema change locally:**
  ```bash
  npx prisma migrate diff --from-url "mysql://root:@127.0.0.1:3306/test_db" --to-schema-datamodel apps/api/prisma/schema.prisma --script > delta.sql
  # Review delta.sql — confirm zero DROP TABLE, zero unexplained DROP COLUMN.
  npx prisma db execute --url "mysql://root:@127.0.0.1:3306/test_db" --file delta.sql
  # Then save it with a safety header into apps/api/prisma/manual-migrations/
  ```
- **To apply the _already-generated_ Phase 1 migration to production** (only when Sandeep explicitly asks):
  ```bash
  npx prisma db execute --url "$DATABASE_URL_PRODUCTION" --file apps/api/prisma/manual-migrations/2026-09-08_project_units_and_pricing.sql
  ```
  Read that file's header first — it documents exactly what it does and why it's safe (purely additive: 10 `CREATE TABLE`, 0 `DROP TABLE`, 0 `DROP COLUMN`).
- **The test suite is hard-guarded** (`tests/api/setup.ts`) to refuse running against anything but a recognized local database — it checks both the database _name_ and the _host_. Do not weaken this guard.

---

## 4. Phase 1 — Backend Foundation (COMPLETE)

Everything below exists, typechecks clean on both workspaces, and passes its tests. Treat this section as a reference for what you're building on top of, not something to redo.

### 4.1 Schema (`apps/api/prisma/schema.prisma`)

**New enums:** `SalesStatus`, `UnitType`, `ProjectType`, `AreaUnit`, `PriceBasis`, `PricingRuleKind`, `ChargeCalcMethod`, `ChargeCategory`, `AmenityAvailability`, `AmenityApplicability`, `AmenityCategory`, `ProjectMediaKind`, `ProjectDocumentKind`.

**New tables:**

| Table                                                                        | Purpose                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProjectUnit`                                                                | The saleable unit — identity, configuration, area, characteristics, parking, pricing summary fields, status. Full field list in the schema file; every field is named exactly as the spec's field lists (unit_number, plot_number, tower, floor, bhk, carpet_area_sqft, etc.) |
| `ProjectPricingRule`                                                         | A project's facing/floor/corner/charge rules. Conditions are explicit nullable columns (`match_facing`, `match_floor_min/max`, etc.) — `null` means "applies to everything."                                                                                                  |
| `PriceLine`                                                                  | One persisted line of a computed cost sheet. Polymorphic: `project_unit_id` XOR `property_id`.                                                                                                                                                                                |
| `Amenity`                                                                    | Company-wide amenity catalogue.                                                                                                                                                                                                                                               |
| `ProjectAmenity`                                                             | An amenity as offered by one project — `INCLUDED / OPTIONAL / CHARGEABLE`, with a charge rule if chargeable.                                                                                                                                                                  |
| `InventoryFeature`                                                           | A feature belonging to one specific unit or property ("Park Facing", "2 Car Parking") — distinct from project-wide amenities.                                                                                                                                                 |
| `ProjectMedia`, `ProjectDocument`, `ProjectUnitImage`, `ProjectUnitDocument` | Media/document attachments.                                                                                                                                                                                                                                                   |

**`Project` gained:** `project_type`, `developer_name`, structured location (`state/district/city/mandal/village/locality/address/pincode/latitude/longitude/maps_link`), `total_area_value`+`total_area_unit`, `towers_count`/`blocks_count`/`floors_count`, `completion_date`, RERA/approval fields, `default_price_basis`/`default_area_unit`, `cover_image_url`, `is_published`.

**`Property` gained:** `sales_status`, `hold_until`/`held_for_lead_id`, the same area/pricing field set as `ProjectUnit` (`area_value`, `area_unit`, `area_sqyd`, `plot_area_sqyd`, `carpet_area_sqft`, etc.), `price_basis`, `base_rate`/`base_rate_unit`, `calculated_price`/`override_price`/`override_reason`/`final_price`, villa/house fields (`ground_floor_area_sqft`, `first_floor_area_sqft`, `total_floors`, `construction_year`), `view`, `road_width_ft`.

**Sales-pipeline tables wired for both inventory types:** `Booking.project_unit_id`, `Opportunity.project_unit_id`, `SiteVisitBooking.project_unit_id`, `Complaint.project_unit_id`, `LeadPropertyInterest.project_unit_id`, `SiteVisitProperty.project_unit_id`, `DemoInterestedProperty.project_unit_id`, `PropertyLayoutRegion.project_unit_id` — all nullable, alongside the pre-existing `property_id` (also now nullable on `Booking`).

### 4.2 Measurement module — `apps/api/src/shared/measurement.ts`

One conversion table (`SQFT_PER_UNIT`) covering `SQFT/SQYD/SQM/ACRE/GUNTA/CENT/ANKANAM/HECTARE`. Key exports:

- `normalizeArea(value, unit)` → `{area_value, area_unit, area_sqft, area_sqyd}`
- `areaFromDimensions(lengthFt, widthFt)`, `dimensionsDisagree(...)` — plot L×W handling
- `validateFlatAreas({carpet, built_up, super_built_up})` — enforces carpet < built-up < super-built-up
- `loadingFactor(carpet, sbua)` — `(sbua − carpet) / carpet`
- `resolveBasisAreaSqft(basis, areas)` — resolves which area a `price_basis` should multiply
- `formatAreaDual(areaSqft, preferredUnit)` → `"150 Sq.Yds (1,350 Sq.Ft)"`

**Use this module from the frontend too once Phase 2 starts** — do not reintroduce a second area-conversion implementation. If the frontend needs these functions client-side (e.g., a live-typing preview before hitting the API), port the same constants into a new `apps/web/src/utils/measurement.ts` with **identical** factors — do not let them drift again.

### 4.3 Pricing engine — `apps/api/src/services/pricing/engine.ts`

Pure functions, no I/O. `computePrice(unit: PricingUnitInput, rules: PricingRule[]): PriceComputation`. Rule matching (`ruleMatchesUnit`) treats every `null` condition column as a wildcard. Calculation methods: `FIXED`, `PER_SQFT`, `PER_SQYD`, `PERCENT_OF_BASE`, `QTY_X_RATE`.

**Verified against the spec's own worked examples** (see `tests/api/pricing-engine.test.ts`):

- Plot 001 (§10 of the spec): 150 Sq.Yd × ₹20,000 + facing/corner/road premiums → **₹36,75,000**, then + club/documentation/maintenance → **₹38,50,000**. Exact match.
- Flat A-503 (§19): ₹75,00,000 base + floor/facing/park/view premiums + parking/club charges → **₹84,25,000**. Exact match.

**If you ever suspect the pricing engine is wrong, re-run this test file first** — it is the ground truth.

### 4.4 Booking-lifecycle abstraction — `apps/api/src/services/inventory/reference.ts`

The single place that knows a booking can point at either a `Property` or a `ProjectUnit`. Key functions: `resolveInventoryRef`, `inventoryConnect`, `lockInventoryRow` (the `SELECT ... FOR UPDATE`), `assertClaimable`, `claimInventoryLock`, `markInventoryBooked`, `releaseInventoryLock`, `getInventoryTitle`. `apps/api/src/services/booking.service.ts` is already wired through this — **do not add new direct `prisma.property.update({status: 'LOCKED'/...})` calls anywhere; always go through this module** so `ProjectUnit` bookings keep working.

Two real bugs fixed here that are easy to reintroduce if this module is bypassed:

1. `cancelBooking` used to be two independent, non-transactional writes — now one transaction.
2. `cancelBooking` used to force the item back to `LIVE`/`AVAILABLE` unconditionally — now it only releases a lock it actually holds (checked via `locked_by_booking_id`).

### 4.5 Services

| File                                               | Responsibility                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/services/pricing/rules.service.ts`   | CRUD for `ProjectPricingRule`. Delete = deactivate (`is_active: false`), never a hard delete — `PriceLine.rule_id` references rules and a past cost sheet must stay legible.                                                                                                                                        |
| `apps/api/src/services/pricing/pricing.service.ts` | `recalculateUnit`, `recalculateProperty` (compute + persist), `previewForProject` (compute, no persistence — backs the wizard's live preview), `previewRecalculateProject`/`applyRecalculateProject` (project-wide diff-then-commit).                                                                               |
| `apps/api/src/services/projectUnit.service.ts`     | Full `ProjectUnit` CRUD: `createUnit`, `updateUnit`, `listUnits` (filterable), `getUnit`, `changeStatus` (manual states only), `overridePrice`, `deleteUnit` (blocked once booked/sold), `getInventorySummary` (live `groupBy` aggregate — **never a stored count**), `bulkCreateUnits` (the "generate many" path). |

**A real bug was found and fixed here worth knowing about:** `updateUnit` originally rebuilt the entire row through a "create-shaped" defaulter, which silently reset any field omitted from a partial update back to `null` (e.g., `PUT {is_corner: true}` would wipe `facing` to null). Fixed by merging the partial update over the existing row before defaulting. **If you add new updatable fields to `ProjectUnit`, add them to `toCreateData`'s field list, and trust the merge — never call `toCreateData` directly on a raw partial payload.**

### 4.6 Routes

`apps/api/src/routes/projects.ts` is now a thin composer (mirroring the existing `routes/properties.ts` split):

```
routes/projects.ts          — composer, mounts the three below in this order
routes/projects/core.ts     — pre-existing project CRUD + layout-image routes (unchanged behavior)
routes/projects/units.ts    — new ProjectUnit routes
routes/projects/pricing.ts  — new pricing-rule + recalculate routes
```

**Mount order matters**: `core.ts` is mounted first because it registers the literal path `/:id/units/bulk` (deprecated, still creates `Property` rows for the _current_ frontend); `units.ts` registers `/:id/units/:unitId` among others. If `units.ts` were mounted first, a request to `.../units/bulk` could be captured by the `:unitId` param instead. Within `units.ts` itself, the literal routes (`preview-price`, `summary`, `generate`) are registered **before** the `:unitId` catch-all for the same reason.

#### Full new endpoint reference

**Units** (`routes/projects/units.ts`), all under `/api/v1/projects/:id/...`:

| Method | Path                            | Body / Query                                                         | Notes                                                                                                                             |
| ------ | ------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/units/preview-price`          | `PricePreviewSchema`                                                 | No unit needs to exist. Returns `{computation}` — the full `PriceComputation` shape.                                              |
| GET    | `/units/summary`                | —                                                                    | Returns `{summary}`: `total_units`, `by_status`, `by_unit_type`, `total_inventory_value`, `sold_and_booked_value`, `price_range`. |
| POST   | `/units/generate`               | `ProjectUnitBulkCreateSchema` (`{common?, units[]}`)                 | Bulk "generate many." Returns `{created, total, failed[], created_ids[]}`.                                                        |
| GET    | `/units`                        | `?unit_type&sales_status&tower&floor&bhk&facing&search&limit&offset` | Returns `{units, pagination}`.                                                                                                    |
| POST   | `/units`                        | `ProjectUnitCreateSchema`                                            | Create one unit.                                                                                                                  |
| GET    | `/units/:unitId`                | —                                                                    | Includes `price_lines`, `features`, `images`, `documents`, `project`.                                                             |
| PUT    | `/units/:unitId`                | `ProjectUnitUpdateSchema` (partial)                                  | Recomputes price.                                                                                                                 |
| DELETE | `/units/:unitId`                | —                                                                    | Blocked if `RESERVED/BOOKED/SOLD` or has booking/interest history.                                                                |
| POST   | `/units/:unitId/status`         | `ChangeUnitStatusSchema` (`{sales_status, reason?}`)                 | Manual states only — `RESERVED`/`BOOKED` rejected (owned by booking workflow); `SOLD` only from `BOOKED`.                         |
| POST   | `/units/:unitId/override-price` | `OverrideUnitPriceSchema` (`{override_price, override_reason?}`)     | `override_price: null` clears the override.                                                                                       |

**Pricing** (`routes/projects/pricing.ts`):

| Method | Path                           | Body                                       | Notes                                                                                                                                                          |
| ------ | ------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/pricing-rules`               | —                                          | List all rules (active and inactive).                                                                                                                          |
| POST   | `/pricing-rules`               | `ProjectPricingRuleCreateSchema`           | See §4.7 for the shape.                                                                                                                                        |
| PUT    | `/pricing-rules/:ruleId`       | `ProjectPricingRuleUpdateSchema` (partial) |                                                                                                                                                                |
| DELETE | `/pricing-rules/:ruleId`       | —                                          | Deactivates, doesn't delete.                                                                                                                                   |
| GET    | `/pricing/recalculate-preview` | —                                          | Diff preview: `{total_units, changed_count, changes[]}`, each change has `old_final_price`/`new_final_price`/`delta`. Call this **before** the apply endpoint. |
| POST   | `/pricing/recalculate`         | —                                          | Applies to every unit in the project.                                                                                                                          |

All routes require `authenticateToken` + `requireAuthz` gated on `Permissions.PROJECTS_READ` (list/get) or `Permissions.PROJECTS_UPDATE` (create/update/delete/status/recalculate) — the same permissions already used for project management, no new permission plumbing was added.

### 4.7 Request body shapes (Zod schemas — `apps/api/src/shared/projectUnit.ts`)

Import these directly; do not redefine them in the frontend. Key ones to know when building Phase 2–4 forms:

```ts
ProjectUnitCreateSchema = {
  unit_number, unit_type,                        // required
  plot_number?, survey_number?, tower?, block?, floor?, flat_number?, villa_number?, type_code?,
  bhk?, bedrooms?, bathrooms?, balconies?, living_rooms?, kitchens?, utility_rooms?, has_pooja_room?, has_study_room?,
  area_value?, area_unit?,                        // what the user typed
  plot_area_sqyd?, plot_length_ft?, plot_width_ft?,
  carpet_area_sqft?, built_up_area_sqft?, super_built_up_area_sqft?, ground_floor_area_sqft?, first_floor_area_sqft?, total_floors?,
  price_basis?,                                   // CARPET | BUILT_UP | SUPER_BUILT_UP | PLOT_AREA | LUMPSUM
  facing?, is_corner?, is_road_facing?, is_park_facing?, is_main_road_facing?, road_width_ft?, view?,
  parking_included?, parking_type?, parking_count?, parking_slots?,
  base_rate?, base_rate_unit?, base_price_override?, discount_amount?, discount_reason?,
  manual_lines?: [{label, category?, amount}],
  selected_optional_rule_ids?: number[],          // not yet wired to any UI — see Phase 3
  sales_status?, notes?,
}

ProjectPricingRuleCreateSchema = {
  label, kind, category, calc_method, rate,       // required
  area_basis?, applies_to_unit_type?,
  is_mandatory?, is_tax?, is_refundable?, is_active?, sort_order?,
  match_facing?, match_corner?, match_park_facing?, match_road_facing?, match_main_road_facing?,
  match_floor_min?, match_floor_max?, match_bhk?, match_type_code?, match_view?,
}
```

`PricePreviewSchema` = `ProjectUnitCreateSchema.partial().extend({unit_type: required})` — pass whatever fields are known so far; the server fills in defaults from the project's `default_price_basis`.

### 4.8 Background job — `apps/api/src/jobs/tasks.ts` / `scheduler.ts`

`inventoryLockAndHoldExpirySweepJob`, registered as **"Inventory Lock & Hold Expiry Sweep"**, every 15 minutes (`*/15 * * * *`, env-disable key `DISABLE_JOB_INVENTORY_EXPIRY`). Reclaims expired `LOCKED`/`RESERVED` items back to available and cancels any still-`PENDING` booking sitting on that expired lock; clears expired manual `HOLD`s. Use `jobManager.trigger('Inventory Lock & Hold Expiry Sweep')` to fire it manually for testing (see `apps/api/src/jobs/index.ts`).

### 4.9 Tests

- `tests/api/pricing-engine.test.ts` — 34 tests, pure engine logic, includes the two spec worked-examples above.
- `tests/api/project-units-pricing.test.ts` — 18 tests, full integration: rule CRUD → unit creation/pricing → filtering → update → manual-status guards → price override → preview → bulk generate → inventory summary → rule deactivation → recalculate preview/apply → delete guard → **full booking lifecycle against a real `ProjectUnit`** (reserve → confirm → cancel, proving `inventory/reference.ts` end-to-end).
- `tests/api/inventory-expiry-job.test.ts` — 5 tests covering the expiry job.

**Full suite baseline: 17 pre-existing failing suites / 48 failing tests (unrelated to this work — Lead/Task/Booking tenant-isolation edge cases, `LeadExitReason`/`SiteVisitStatus` enum drift, employee sensitive-field masking). Confirm this exact count hasn't grown after every phase**, e.g.:

```bash
npm run test:api 2>&1 | tail -6
```

---

## 5. Phase 2 — Project Wizard + Dashboard

**Goal:** Replace `ProjectFormWizard.tsx` (2-step, missing RERA/phase/units fields) and `ProjectDossier.tsx` (3 tabs) with the full spec-driven experience. This is the phase Sandeep is actually waiting to see.

### 5.1 Files to delete (at the end of this phase, once the new ones work)

- `apps/web/src/components/projects/ProjectFormWizard.tsx`

### 5.2 New shared frontend utilities (build these first — everything else depends on them)

Create `apps/web/src/utils/measurement.ts` — port the constants from `apps/api/src/shared/measurement.ts` verbatim (same `SQFT_PER_UNIT` table, same function names: `normalizeArea`, `areaFromDimensions`, `dimensionsDisagree`, `validateFlatAreas`, `loadingFactor`, `formatAreaDual`). This is for **display and live-typing feedback only** — the server remains authoritative; never let the frontend compute a price.

Create `apps/web/src/api/projectUnits.ts` — thin fetch wrappers for every endpoint in §4.6/§4.7, following the existing `fetchWithAuth` pattern from `apps/web/src/context/AuthContext.tsx`. One function per endpoint, typed against the Zod schemas' inferred types (re-export or mirror the types from `apps/api/src/shared/projectUnit.ts` — check whether `packages/shared` is the right place so both frontend and backend can import the same types without duplicating them; if `apps/web` cannot import from `apps/api/src/shared` directly, move `projectUnit.ts`'s type exports into `packages/shared/src/index.ts` and re-export from `apps/api/src/shared/index.ts` too, so there is exactly one definition).

### 5.3 Project creation/edit wizard — new file `apps/web/src/components/projects/ProjectWizard.tsx`

Eight steps, left rail with named steps + completion ticks (reuse the wizard-chrome pattern from `AddPropertyWizard.tsx` — rail, progress bar, footer Back/Continue). **Draft autosave after step 1**: once the project is created (step 1 submitted), immediately `POST /api/v1/projects` and hold the returned `project.id` in state — every subsequent step becomes a `PUT` against that id, so closing the wizard mid-flow never loses step-1 data.

1. **Identity** — `name`, `project_type` (select: PLOTTED/APARTMENT/VILLA/MIXED/COMMERCIAL), `developer_name`, `status`, `description`. On submit: `POST /api/v1/projects`.
2. **Location** — `state`, `district`, `city`, `mandal`, `village`, `locality`, `address`, `pincode` (+ the existing pincode auto-fill lookup — reuse `lookupPincode` from `apps/web/src/components/properties/propertyWizardShared.tsx`), `latitude`/`longitude` (map pin — a plain lat/lng input pair is acceptable for v1; a map picker widget is a nice-to-have, not a blocker), `maps_link`.
3. **Scale & Configuration** — `total_area_value` + `total_area_unit`, `towers_count`, `blocks_count`, `floors_count`, `total_units` (labeled "Planned Units" — make clear in the UI this is a target, not a live count), `launch_date`, `completion_date`. This step is where the **previously-dropped fields finally get a home**: `project_phase`, `rera_number` were already wired in the old wizard's Step 2 (Phase 1 foundation fix from the prior session) — carry them forward here rather than dropping them again.
4. **Approvals & Compliance** — `rera_status` (NOT_APPLICABLE/APPLIED/APPROVED), `approval_authority` (RERA/DTCP/HMDA/PANCHAYAT), `approval_number`, `lp_number`.
5. **Pricing Rules** — `default_price_basis`, `default_area_unit`, then the rule builder. This step's UI is the single most important new UI in this rebuild — see **Phase 3 §6.1** for its full spec; build it as a reusable `<PricingRuleBuilder projectId={id} />` component from day one so Phase 3's standalone Pricing tab can reuse it verbatim instead of rebuilding it.
6. **Amenities** — catalog grouped by `AmenityCategory`, each toggled `INCLUDED`/`OPTIONAL`/`CHARGEABLE` + amount + `applicability`. See **Phase 3 §6.2**; same reuse principle — build `<ProjectAmenityEditor projectId={id} />` once.
7. **Media & Documents** — cover image, gallery, brochure, master plan, layout plan, floor plans (`ProjectMedia`, kind-tagged), legal docs (`ProjectDocument`). Reuse the deferred-image-upload pattern from `AddPropertyWizard.tsx` lines ~479–491 (object URL preview, `URL.revokeObjectURL` on load, uploaded only after the parent id exists — which it always does here since step 1 already created the project).

   **Backend gap to fill first**: there are currently no upload routes for `ProjectMedia`/`ProjectDocument`. Add `POST /api/v1/projects/:id/media` (multipart, `kind` in body) and `POST /api/v1/projects/:id/documents` to `routes/projects/core.ts`, modeled exactly on the existing `POST /:id/layout-images` handler (same `memoryUpload.single('image')` middleware, same `processImageBuffer`/`getStorageService` pattern from `project.service.ts`'s `uploadLayoutImage`). Add corresponding `ProjectService.uploadMedia`/`uploadDocument`/`listMedia`/`listDocuments`/`deleteMedia`/`deleteDocument` methods.

8. **Team & Review** — assign PM (existing `assigned_pm_id` field/UI, unchanged), a read-only summary of everything entered, final "Create Project" / "Save Changes" button (which by this point is really just navigating away — the project already exists from step 1).

Steps 5–7 must be skippable ("Save & Finish Later") — landing directly on the dashboard afterward.

### 5.4 Project list — `apps/web/src/components/projects/ProjectManagement.tsx`

Move filtering to server-side: `GET /api/v1/projects?status=&limit=&offset=` already supports `status` and pagination — the current frontend fetches everything and filters client-side; change it to pass these as query params and re-fetch on filter change (React Query key: `['projects', {status, limit, offset}]`).

Add filters for `project_type` and `city` — **these require a backend change**: `ProjectService.listProjects` in `apps/api/src/services/project.service.ts` currently only accepts `{status}` in its filters param; extend it to accept `project_type` and `city`, and extend the route in `routes/projects/core.ts` to read them from `req.query`.

Each card gets a **live inventory bar** instead of the stale `total_units` integer: call `GET /api/v1/projects/:id/units/summary` per card (or, better, add a new bulk endpoint `GET /api/v1/projects/inventory-summaries?ids=1,2,3` that returns summaries for many projects in one call, to avoid N+1 requests on the list page — add this to `ProjectUnitService` and `routes/projects/units.ts` if the per-card N+1 becomes a real perf issue; for a v1 with a modest number of projects, per-card calls are acceptable to ship first).

### 5.5 Project dashboard — new file `apps/web/src/components/projects/ProjectDashboard.tsx` (replaces `ProjectDossier.tsx`)

Route: add `<Route path="/projects/:id" element={<ProjectDashboard />} />` to `apps/web/src/App.tsx` (follow the existing `/bookings/:id` → `BookingDossier` precedent — the only existing detail-route pattern in the app). Use `useParams()` for the id.

Convert to React Query (the current `ProjectDossier` bypasses it entirely with manual `useState`/`fetchProjectDetails()` — fix this now): query keys `['project', id]`, `['project', id, 'units']`, `['project', id, 'summary']`, `['project', id, 'pricing-rules']`, `['project', id, 'layout-images']`.

Hero: cover image (`project.cover_image_url`), name, `project_code`, `project_type`, status pill, RERA badge (green check if `rera_status === 'APPROVED'`), location, assigned PM.

Inventory summary tiles: `Total / Available / Hold / Reserved / Booked / Sold / Blocked`, sourced from `GET /:id/units/summary` — **never hand-typed**, per spec §24.

Tabs — build as a small reusable `<Tabs>` component (none exists yet in `apps/web/src/components/ui/`; extract the tab-bar markup from the current `ProjectDossier.tsx` lines ~167–183, which is the best existing version in the codebase):

| Tab       | Contents                                                                             | Phase                           |
| --------- | ------------------------------------------------------------------------------------ | ------------------------------- |
| Overview  | Info table, description, structured location + map, amenities grid                   | 2                               |
| Units     | Status chips → filters → table, "+ Add Unit(s)"                                      | 4                               |
| Pricing   | Rule builder, sample-unit calculator, Recalculate                                    | 3                               |
| Amenities | Amenity matrix                                                                       | 3                               |
| Location  | Structured address + the existing Layout Viewer/Editor (moved here)                  | 2                               |
| Media     | Cover/gallery/brochure/plans                                                         | 2                               |
| Documents | RERA/approval/legal docs                                                             | 2                               |
| Activity  | `AuditEvent` rows for this project + its units (new, simple)                         | 5/6 (defer if time-constrained) |
| Settings  | Edit project (reopens `ProjectWizard` in edit mode), PM reassignment, Archive/Cancel | 2                               |

The existing `ProjectLayoutViewer.tsx`/`ProjectLayoutEditor.tsx` move into the Location tab unchanged in behavior — **do not rewrite their pin-positioning math** (percentage-based, resolution-independent by design, per their own doc comments). The only change needed: `ProjectLayoutViewer`'s `onManageUnit(propertyId)` callback currently just switches to a tab and discards the id — wire it to `navigate(`/projects/${projectId}/units/${unitId}`)` once Phase 4's unit-detail route exists. Also fix the pre-existing bug where both files render `image_url` raw instead of through `resolveImageUrl` (breaks under a non-same-origin `VITE_API_ORIGIN`).

**Known gap to close in this phase**: the layout-region backend (`ProjectService.upsertLayoutRegions` in `project.service.ts`, and the Zod schema `ProjectLayoutRegionsSchema`) still only accepts `property_id`, not `project_unit_id`, even though the schema (`PropertyLayoutRegion`) now supports both. Extend `ProjectLayoutRegionsSchema` to accept either, and `upsertLayoutRegions` to look up the id against `ProjectUnit` when `project_unit_id` is provided instead of `Property`. Without this, the layout map cannot pin the new unit type at all.

---

## 6. Phase 3 — Pricing Rule Builder + Amenities Tab

### 6.1 Pricing Rule Builder — `apps/web/src/components/projects/PricingRuleBuilder.tsx`

This is the UI for `ProjectPricingRule` CRUD (§4.6/4.7). Structure it as grouped cards by `category` (Facing, Floor, Corner, Road, Park, View, BHK, Amenity, Parking, Infra, Maintenance, Legal, Club, Tax, Other), each card listing its rules as rows: label, calc method + rate (e.g., "₹1,500 / Sq.Yd" or "3% of base"), applicability (unit type + any match conditions, rendered as human text: "East facing only", "5th floor and above"), mandatory/optional toggle, active/inactive toggle, edit/delete.

"+ Add Rule" opens a small form: label → kind (Base Rate/Premium/Charge/Tax) → category → calc method → rate → area basis (only shown for PER_SQFT/PER_SQYD) → match conditions (only the ones relevant to the chosen category are shown — e.g., category=FACING shows a facing dropdown, category=FLOOR shows floor-min/max, category=CORNER shows a corner yes/no).

**Live sample-unit calculator**: a small panel where the admin picks a unit type + fills in the same fields a real unit would have (area, facing, floor, etc.) and sees `POST /:id/units/preview-price` render the full cost sheet live as they type. This is the direct payoff of Decision 2 — use the `<CostSheet>` component from §7 to render it.

**Recalculate flow**: a "Recalculate All Units" button calls `GET /:id/pricing/recalculate-preview` first, renders the diff (`changes[]`: unit number, old → new final price, delta) in a confirmation modal, and only calls `POST /:id/pricing/recalculate` after the admin confirms. Never skip the preview step.

### 6.2 Amenities — `apps/web/src/components/projects/ProjectAmenityEditor.tsx`

Two-part UI: (a) a company-wide amenity catalog manager (simple CRUD list — name, icon, category; most companies set this up once and rarely touch it again — a modest admin screen is fine, doesn't need wizard polish), (b) per-project amenity selection: for each catalog amenity, a row with `INCLUDED`/`OPTIONAL`/`CHARGEABLE` radio, and if `CHARGEABLE`: calc method + amount + `applicability` (`ALL_UNITS`/`SELECTED_UNITS`/`BY_UNIT_TYPE`, with the unit-type picker shown only for the last option).

**Backend work needed** — none of the `Amenity`/`ProjectAmenity` CRUD services/routes exist yet (schema only). Build:

- `apps/api/src/services/amenity.service.ts`: `listCatalog(user)`, `createCatalogAmenity`, `updateCatalogAmenity`, `deleteCatalogAmenity` (company-scoped via the existing `company_id` pattern), `listProjectAmenities(user, projectId)`, `setProjectAmenity(user, projectId, amenityId, config)` (upsert), `removeProjectAmenity`.
- Routes in a new `apps/api/src/routes/amenities.ts` (catalog CRUD, mounted at `/api/v1/amenities`) plus `GET/PUT/DELETE /api/v1/projects/:id/amenities/:amenityId` appended to `routes/projects/core.ts` or a new `routes/projects/amenities.ts` (follow the same composer-mount pattern as `units.ts`/`pricing.ts`).
- Zod schemas in `apps/api/src/shared/` (new file `amenity.ts`, exported from the barrel).

**Wire chargeable amenities into the pricing engine** — this is the part of the spec (§5, §29) that closes the loop between "amenity" and "price": when a `ProjectAmenity` is `CHARGEABLE`, it should behave exactly like a `ProjectPricingRule` with `category: AMENITY`. The cleanest implementation: in `PricingRulesService.listRules` (or a new method `getEffectiveRules(projectId)` used by `PricingService` instead of the raw `projectPricingRule.findMany`), also fetch chargeable `ProjectAmenity` rows and map them into the same `PricingRule` shape (translate `applicability` into the existing `applies_to_unit_type`/match-condition columns — `BY_UNIT_TYPE` maps directly to `applies_to_unit_type`; `SELECTED_UNITS` has no equivalent yet and should map to `is_mandatory: false`, requiring the unit to have it in `selected_optional_rule_ids` — which is exactly the mechanism that was deferred from Phase 1, so this is where it finally gets wired up). Update `PricingService.recalculateUnit`, `previewForProject`, and `previewRecalculateProject`/`applyRecalculateProject` to call this new combined-rules function instead of `p.projectPricingRule.findMany` directly.

### 6.3 Verification for Phase 3

- Create a project, add 5+ pricing rules across different categories, create 2 units with different facing/corner combos, confirm the cost sheet on each differs correctly.
- Toggle a rule inactive, confirm new units stop picking it up while existing units' historical `PriceLine` rows are untouched (this is already tested at the service level in `tests/api/project-units-pricing.test.ts` #11 — write the equivalent through the new UI).
- Mark an amenity `CHARGEABLE` + `ALL_UNITS`, confirm it appears as a charge line on a newly-created unit's cost sheet.
- Run "Recalculate All Units" after a rate change, confirm the diff preview numbers match what units actually end up with after applying.

---

## 7. Phase 4 — Units UI (the core of the spec)

### 7.1 Shared cost-sheet component — `apps/web/src/components/shared/CostSheet.tsx`

Build this once, use it in the wizard preview (Phase 3), the Add Unit flow, the Unit Detail page, and eventually the standalone Property pricing tab (Phase 5). Props: `computation: PriceComputation` (the exact shape returned by every pricing endpoint) plus `finalPrice`, `overridePrice?`, `overrideReason?`. Renders, in order: Base Price (with `rate × quantity` shown, e.g. "1,750 Sq.Ft × ₹4,285"), a Premiums section, an Additional Charges section, Calculated Price, Discount (if any), then either Final Selling Price (if no override) or **both** Calculated Price and Final Selling Price with the override reason/who/when (if overridden) — per spec §13/§14/§20, this must never hide the calculated figure once an override exists.

### 7.2 Add/Generate Units flow — new file `apps/web/src/components/projects/AddUnitsWizard.tsx` (replaces `BulkUnitWizard.tsx`)

Two modes, one shared field set:

**Add one unit**: Unit Type radio (Plot/Flat/Villa/House/Commercial/Other, per spec §26) → identity fields (branch per type — reuse the exact field groupings from the spec §26: Plot gets plot_number/plot_area/length/width/facing/road_width/corner/road_facing; Flat gets tower/floor/flat_number/BHK/carpet/built_up/super_built_up/bedrooms/bathrooms/balconies/facing/corner/park_facing/road_facing/view/parking; Villa gets villa_number/villa_type(`type_code`)/BHK/plot_area/length/width/built_up/ground_floor/first_floor/bedrooms/bathrooms/parking/facing/corner/road_facing) → live `<CostSheet>` preview via `POST /:id/units/preview-price` (debounce ~400ms on field changes) → Status → Submit (`POST /:id/units`).

**No address field anywhere in this form** — a chip reading "Inherits address from _[Project Name]_" replaces it entirely (spec §28, and Sandeep's explicit instruction from the scope conversation).

**Generate many**: a small config panel first —

- Flats: towers × floors × units-per-floor + a numbering pattern (`{tower}-{floor}{index:02}`, e.g. A-501, A-502...)
- Plots: prefix + start number + count (e.g. "Plot-", 1, 50 → Plot-1..Plot-50)
- Villas: prefix + count + `type_code` assignment (spec §15's Villa Types A/B/C)

Generates a preview grid using the existing `DataTable` component (`apps/web/src/components/ui/DataTable.tsx`) with editable cells — reuse `BulkUnitWizard.tsx`'s proven pattern for this exact interaction (per-cell `render` returning an `<input>`/`<select>` wired to `updateUnit(id, field, value)`), but wire the price column to `POST /:id/units/preview-price` per row (debounced) instead of client-side arithmetic — **this is the concrete fix for "each unit has different charges like east facing charges"**: change a row's facing/corner and its price column updates live from the server, independently of every other row. On submit, calls `POST /:id/units/generate` with `{common, units: [...]}`.

Keep `BulkUnitWizard.tsx`'s `phase`/`block` common-field collection but **fix the bug where it's silently dropped** — it never reached the old payload; make sure the new version actually includes it in the `common` object sent to `/units/generate`.

### 7.3 Units tab (inside `ProjectDashboard.tsx`)

Status chips row: `[All N] [Available n] [Hold n] [Reserved n] [Booked n] [Sold n] [Blocked n]`, sourced from `GET /:id/units/summary`'s `by_status`, each clickable as a filter. Below: search box + `Unit Type`/`Tower`/`Floor`/`BHK`/`Facing` filter dropdowns, all wired to `GET /:id/units` query params (server-side filtering, not client-side — this table can have hundreds of rows). Table columns: Unit, Type, BHK, Floor, Area (dual-unit via `formatAreaDual`), Facing, Price (`final_price`), Status (colored pill). Row click → navigate to unit detail. "+ Add Unit(s)" button opens `AddUnitsWizard`.

**Pagination is required here** and `DataTable.tsx` currently has none — add `page`/`pageSize` props and simple prev/next controls, or build a thin `<PaginatedDataTable>` wrapper around it rather than modifying the shared component's contract for its 14 other consumers.

### 7.4 Unit Detail page — new file `apps/web/src/components/projects/UnitDetail.tsx`

Route: `apps/web/src/App.tsx` → `<Route path="/projects/:projectId/units/:unitId" element={<UnitDetail />} />`.

Header: breadcrumb (Project name → Units → unit number), `unit_number`, `"{bhk} • Tower {tower} • Floor {floor}"` summary line, status pill, Edit / More (⋮ dropdown: Change Status, Archive... whatever "More" actions make sense).

Tabs: **Overview · Cost Sheet · Features · Documents · Activity**

- Overview: floor-plan image (from `ProjectUnitImage`, `is_primary`), identity card, Area card (dual units + loading factor for flats via `loadingFactor()`), Configuration card, Characteristics card (facing/corner/road/park/view), Parking card, and a prominent **Status card** with a colored dot (🟢 AVAILABLE / 🟡 HOLD or RESERVED / 🔴 SOLD or BOOKED) and a "Change Status" button opening a small modal → `POST /:unitId/status`.
- Cost Sheet: `<CostSheet>` fed by `GET /:id/units/:unitId`'s `price_lines`, plus "Edit Pricing" (opens a form for `base_rate`/`discount_amount`/`manual_lines`, submits via `PUT /:unitId`) and "Override Price" (→ `POST /:unitId/override-price`) and "Recalculate" (→ re-fetch after a `PUT` with no field changes, or add a dedicated `POST /:id/units/:unitId/recalculate` route if a bare recompute-without-edit action is needed — check whether `PUT` with an empty body already triggers `PricingService.recalculateUnit` via `updateUnit`; if not, add the endpoint).
- Features: list of `InventoryFeature` rows for this unit (+ Add Feature — simple label + optional charge amount, `POST` to a new endpoint `apps/api/src/routes/projects/units.ts` → `POST /:id/units/:unitId/features`, backed by a new `ProjectUnitService.addFeature`/`removeFeature`).
- Documents: `ProjectUnitDocument` list + upload (mirror the property-image upload pattern).
- Activity: `AuditEvent` rows filtered to `entity_type: 'PROJECT_UNIT', entity_id: unitId` — the `STATUS_CHANGE` and `PRICE_OVERRIDE` actions are already being written by `ProjectUnitService`; this tab just needs a `GET` endpoint to list them (add `GET /api/v1/projects/:id/units/:unitId/activity` — a thin wrapper around `prisma.auditEvent.findMany`, scoped and ordered by `created_at desc`).

### 7.5 Verification for Phase 4

- Generate 40 flats across 2 towers × 10 floors × 2/floor; confirm each row's price differs correctly per floor and facing.
- Open a generated unit's detail page; confirm the cost sheet reconciles exactly to its `final_price`.
- Change a unit's status to HOLD, confirm it disappears from the "Available" filter chip and appears under "Hold."
- Try to set a unit directly to RESERVED or BOOKED via the status UI — confirm it's rejected client-side or server-side (409) with a clear message.
- Book the unit (existing booking flow, now targeting `project_unit_id`) — confirm status flips to RESERVED automatically, and the manual-status UI reflects that a booking now owns it.

---

## 8. Phase 5 — Standalone Properties Rebuild

### 8.1 Files to delete at the end of this phase

- `apps/web/src/components/properties/AddPropertyWizard.tsx` (1,912 lines)
- `apps/web/src/components/properties/EditPropertyModal.tsx`

### 8.2 One form, two modes — `apps/web/src/components/properties/PropertyForm.tsx`

Same category-branched field sets as `ProjectUnit` (Land/Villa/House/Flat/Commercial/Other), reusing the exact same sub-form components built for Phase 4's `AddUnitsWizard` where the fields overlap (a Flat's configuration/area/characteristics fields are identical whether it's a project unit or a standalone property — extract them into shared components under `apps/web/src/components/shared/unitFields/` — e.g. `FlatFields.tsx`, `PlotFields.tsx`, `VillaFields.tsx`, `HouseFields.tsx`, `CommercialFields.tsx` — used by both `AddUnitsWizard` and `PropertyForm`).

Differences from a unit: `PropertyForm` **has** its own Location section (state/city/locality/pincode/address/lat-lng, with `lookupPincode`), and always uses the standalone-property pricing path (`recalculateProperty`, no project rules — just `base_rate` + `manual_lines`, per Phase 1's `PricingService.recalculateProperty`).

`mode="create"` → on submit, `POST /api/v1/properties` (existing endpoint, already accepts everything this form collects per the Phase 1 CRM foundation fixes from the prior session — confirm `PropertyCreateSchema` in `apps/api/src/shared/property.ts` includes all the new area/pricing fields added to the `Property` model in Phase 1's schema change; if not, extend it). Sets `publication_status: PENDING_VERIFICATION` (the approval pipeline stays, per the confirmed scope decision).

`mode="edit"` → `PUT /api/v1/properties/:id`. **This is the fix for the current "Edit is a lesser form than Add" problem** — the same component, same fields, same validation, just pre-filled and using PUT.

**Backend work needed**: `PropertyService.updateProperty`'s safe-fields whitelist needs extending to include every new field added in Phase 1 (`area_value/area_unit/area_sqyd`, `plot_area_sqyd/plot_length_ft/plot_width_ft`, `carpet_area_sqft/built_up_area_sqft/super_built_up_area_sqft/ground_floor_area_sqft/first_floor_area_sqft/total_floors/construction_year`, `price_basis`, `view/road_width_ft/is_corner/is_park_facing/is_road_facing/is_main_road_facing`, `base_rate/base_rate_unit/discount_amount/discount_reason`) plus `manual_lines` handling (mirroring `ProjectUnitService.updateUnit`'s `PriceLine` delete-and-recreate-for-manual-rows pattern) and a call to `PricingService.recalculateProperty` at the end, matching how `ProjectUnitService.updateUnit` always ends with `PricingService.recalculateUnit`.

### 8.3 Property list — `apps/web/src/components/properties/PropertyManagement.tsx`

Replace the brand tabs (`SONTHILLU`/`RADHA_REAL_HOMES`) with category tabs (All/Land/Villas/Houses/Flats/Commercial/Other) as the primary filter; brand becomes a small badge on each card instead. Add a `sales_status` filter row separate from the existing `publication_status` pipeline filter — they are different axes now (Decision 3) and must never be shown as one dropdown.

### 8.4 Property detail — extend the existing dossier or build `apps/web/src/components/properties/PropertyDetail.tsx`

Tabs: Overview · Cost Sheet (new — properties never had this) · Features · Amenities · Location · Media · Documents · **Verification** (existing PM→DM→MD pipeline UI, unchanged, just re-skinned to match the new page's visual language) · Activity.

### 8.5 Verification for Phase 5

- Create one property of each category (Land/Villa/House/Flat/Commercial), confirm each shows the correct type-specific fields and a working cost sheet.
- Edit a property created before this phase shipped (one of the 5–7 properties already in `test_db`) — confirm no data loss, confirm pricing fields that were previously uneditable are now editable.
- Confirm the PM → DM → MD approval pipeline still functions exactly as before (this must not regress — run the pipeline manually: verify → dm-polish → md-approve, watch `publication_status` progress).

---

## 9. Phase 6 — Cleanup

1. Delete `AddPropertyWizard.tsx`, `EditPropertyModal.tsx`, `BulkUnitWizard.tsx`, `ProjectFormWizard.tsx`, and the dead `apps/web/src/components/ui/PropertyCard.tsx` (confirmed zero importers as of Phase 1's exploration).
2. Remove the deprecated `POST /:id/units/bulk` route from `routes/projects/core.ts` and `PropertyService.bulkCreateUnitsForProject` — **only after** confirming nothing in the shipped frontend still calls it (grep `apps/web/src` for `/units/bulk` first).
3. Consolidate the two parallel card/status-pill systems flagged in Phase 1's original exploration: `ui/StatusPill.tsx` + a canonical `PropertyCard` vs. `PropertyManagement.tsx`'s local `StatusBadge`/`STATUS_CONFIG`/`PipelineStepper`. Extend the `ui/` versions (they have 14–19 existing importers elsewhere in the app) rather than the reverse.
4. Sweep for the three missing `@keyframes` (`animate-fadeIn`, `animate-scaleUp`, `custom-scrollbar` — used 70+ times across the app but never defined) and add them to `apps/web/tailwind.config.js`. Cheap, high-leverage, animates every modal/wizard transition in the product instantly.
5. Fix `resolveImageUrl` being skipped on layout images (`ProjectDashboard`'s Location tab, `ProjectLayoutViewer.tsx` line ~44).
6. Final full-suite run (`npm run test:api`) — confirm the failing-suite count is still exactly the pre-existing baseline (17 suites / 48 tests as of Phase 1; re-verify this hasn't drifted before treating it as ground truth) with zero new failures.

---

## 10. Cross-cutting rules that apply to every phase

- **`npx tsc --noEmit` on both `apps/api` and `apps/web` after every meaningful change** — this codebase has caught real bugs this way every single time it's been run in this project.
- **The server computes prices. Always.** Any frontend code that does `basePrice + premium1 + premium2` instead of calling `preview-price` or reading `price_lines` is a regression back to the exact problem this rebuild exists to fix.
- **Never touch production.** Every schema/data command in every phase runs against local `test_db` unless Sandeep explicitly says otherwise, using the `DATABASE_URL_PRODUCTION` variable deliberately and by name.
- **A unit never asks for an address.** If a form under `/projects/:id/...` ever grows a location/address field, that's a regression of Decision 1 and spec §28 — inherit from the project instead.
- **Manual status changes never set RESERVED/BOOKED.** Those are the booking workflow's exclusively — any new UI that lets someone pick a unit's status must exclude those two values from the picker, mirroring `ProjectUnitService.changeStatus`'s server-side guard.
- **Browser-check every phase** at both desktop and mobile widths before calling it done — this app has a fluid type scale (`clamp()`-based root font size) and a `md:` breakpoint-driven card/table swap (`DataTable.tsx`'s mobile-card view) that silent regressions hide in easily.
