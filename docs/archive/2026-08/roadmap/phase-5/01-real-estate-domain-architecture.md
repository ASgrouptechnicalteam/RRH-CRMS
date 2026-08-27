# Phase 5 Real Estate Domain Architecture

## 1. Project Definition
- **What is a Project in RRH-CRMS?**
  A Project is an overarching real-estate development (e.g., "My Home Gardens", "Sunrise Valley Plots"). It aggregates common amenities, location details, marketing collateral, and groups multiple sellable assets.
- **Fields Belonging to Project:**
  `id`, `project_code`, `company_id`, `branch_id`, `name`, `description`, `location`, `total_area`, `launch_date`, `status` (PLANNING, UNDER_CONSTRUCTION, COMPLETED, CANCELLED), `amenities` (JSON), `marketing_collateral` (brochure links), `assigned_pm_id`.
- **Data Belonging at Project Level:**
  Global project status, project-level marketing materials, and aggregated financial/booking metrics.
- **Roles capable of viewing/managing:**
  Managing Director (MD), Project Manager (full control over assigned projects), Marketing Director (view/marketing collateral), HR/Admin (view).

## 2. Property / Unit Definition
- **Canonical Sellable Asset:**
  The existing `Property` model remains the canonical sellable asset.
- **Conceptual Renaming:**
  While it remains `Property` in the database, it conceptually acts as a `Property/Unit`.
- **Fields Belonging to the Sellable Asset:**
  `id`, `project_id` (Nullable), `title`, `price`, `area_sqft`, `category` (VILLA, PLOT, APARTMENT), `facing`, `bedrooms`, `bathrooms`, `status` (LIVE, BOOKED, SOLD).
- **Standalone Capability:**
  Yes. Because `project_id` is nullable, a `Property` can exist entirely without a `Project` (e.g., an individual resale house).

## 3. Inventory Definition
- **Is Inventory a separate entity?**
  No. Inventory is a lifecycle/state concept represented by the combination of `Property.status` and active `Booking` records.
- **Representing Availability:**
  - `Available`: Property `status == 'LIVE'` and no active Booking.
  - `Booking Pending`: Booking exists with `status == 'PENDING'`.
  - `Booked / Sold`: Booking exists with `status == 'CONFIRMED'` or `Property` status is explicitly `BOOKED`/`SOLD`.
  - `Blocked`: Property `status == 'BLOCKED'` (e.g., withheld from market).
- **Preventing Double Booking:**
  `BookingService.createBooking` strictly enforces a check: if `Property.status` is `BOOKED` or `SOLD`, or if a confirmed `Booking` already exists, it rejects with a `409 Conflict`. A database-level transaction lock (or Prisma's interactive transaction isolation) ensures concurrent bookings cannot succeed on the same `property_id`.

## 4. Project Hierarchy Architecture
The approved and recommended architecture is:
```text
Company
  |
  +-- Project (1 to Many)
  |     |
  |     +-- Property / Unit (1 to Many)
  |
  +-- Property / Unit (Standalone)
```
This avoids unnecessary `Inventory` and `Unit` models, keeping the schema clean, flexible, and fully compatible with existing Booking and Site Visit workflows that already target `Property`.
