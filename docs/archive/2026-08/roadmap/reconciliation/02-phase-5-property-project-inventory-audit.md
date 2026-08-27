# Phase 5 — Property / Project / Inventory Audit

## Objective
Audit the current implementation of the Property architecture against Master Phase 5 requirements to determine how Project, Unit, and Inventory concepts are currently modeled and if new schemas are required.

## Key Architectural Questions

1. **Is Property currently acting as listing?**
   **YES**. The `Property` model contains `title`, `description`, `amenities`, `images`, `seo_title`, and `seo_keywords` which are listing-centric.
   
2. **Is Property currently acting as inventory/unit?**
   **YES**. The `Property` model holds `price`, `area_sqft`, `bedrooms`, `facing`, `possession_status`, and a strict `status` enum (including Booking linkages), making it behave as a transactable individual unit.

3. **Does the system already represent projects?**
   **NO**. There is no `Project` model. Properties are loosely grouped only by `company_id`, `branch_id`, `brand_type`, or generic location strings, but there is no relational hierarchy combining multiple units under a single overarching project entity.

4. **Does the system already represent individual units?**
   **YES**. As established, `Property` functions as the individual unit.

5. **Can one project contain many saleable units?**
   **NO**. Due to the lack of a `Project` model, managing a master project with 100 identical apartments requires duplicating listing data across 100 `Property` rows.

6. **Is availability modeled?**
   **YES**. The `Property.status` handles states like `PENDING_VERIFICATION`, `LIVE` (available), and `Booking` models reserve the unit.

7. **Is booking status modeled?**
   **YES**. The `Booking` model links a `Customer` to a `Property`, and transitions the property availability.

8. **Can inventory be safely locked?**
   **YES**. Bookings currently use a transaction to secure the `Property`.

9. **Are documents tied to properties?**
   **NO**. Only `PropertyImage` exists. General documents (e.g., floor plans, legal clearances, brochures) are missing.

10. **Would introducing Project/Unit/Inventory create duplication?**
    **YES**. If a separate `Project` and `Unit` structure is introduced, the existing `Property` model would be caught in the middle. The system must decide whether to rename/migrate `Property` to `Unit` and introduce `Project` above it, OR keep `Property` for independent resale listings while using a new `Project`->`Unit` hierarchy for developer inventory.

## Audit Matrix

| Requirement | Status | Evidence | Gap | Required Work |
|-------------|--------|----------|-----|---------------|
| Company Structure | ✅ COMPLETE | `Company` model acts as tenant. | None. | None. |
| Project Grouping | 🔴 MISSING | No `Project` model exists. | Properties exist as isolated listings. No master project data (RERA, master amenities, phase). | Introduce `Project` model and link `Property` (as units) to it. |
| Inventory / Units | 🟡 PARTIAL | `Property` acts as a unit. | Functional, but heavily duplicates "listing" data for identical units in a project. | Separate "Project Listing" data from "Unit Inventory" data. |
| Property Listings | ✅ COMPLETE | `Property` holds SEO, title, desc. | None. | None. |
| Booking Status | ✅ COMPLETE | `Booking` and `SiteVisitBooking` relation. | None. | None. |
| Availability | ✅ COMPLETE | `Property.status` handles lifecycle. | None. | None. |
| Documents | 🔴 MISSING | Only images are supported. | No PDF/brochure/legal doc attachment support. | Add `PropertyDocument` model or generic Document system. |

## Conclusion
The current `Property` model handles Phase 5's transactional needs (bookings/payments) correctly for independent listings, but utterly lacks the **Project vs Unit** hierarchical architecture needed for large-scale real estate development (where one project has many units). The historical "Phase 5 Booking Foundation" built the financial transaction layer, but did NOT build the "Property + Project + Inventory Architecture" layer required by the Master Roadmap.
