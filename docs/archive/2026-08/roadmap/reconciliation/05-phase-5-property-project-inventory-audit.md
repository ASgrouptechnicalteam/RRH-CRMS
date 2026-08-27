# Phase 5 Property / Project / Inventory Audit

## 1. Roadmap Requirement
The master roadmap Phase 5 objective is to establish the architecture for:
`Company` → `Project` → `Inventory / Units` → `Property / Listing information`.

This architecture is intended to support real estate businesses that sell multiple units within overarching projects, managing unit types, areas, facings, floors, prices, and bookings at the inventory level.

## 2. Current Property Architecture
- **Schema:** A single flat `Property` model exists. It acts as both the project/listing (e.g., `location`, `title`, `brand_type`, `category`) and the sellable unit (e.g., `price`, `bedrooms`, `area_sqft`, `facing`).
- **Relations:** 
  - Attached to `Company`, `Branch`, `Employee` (creator, assigned PM).
  - Directly related to `PropertyImage`, `PropertyVerificationLog`, `LeadPropertyInterest`, `SiteVisitBooking`, and `Booking`.
- **API & Service:** Full CRUD and lifecycle workflows (verification, DM polish, MD approval, LIVE) exist in `apps/api/src/routes/properties.ts` and `apps/api/src/services/property.service.ts`.
- **Authorization:** `apps/api/src/policies/property.policy.ts` ensures strict tenant (Company) isolation.
- **Frontend:** Integrated via `PropertyManagement.tsx`.
- **Tests:** Covered by `tests/api/properties.test.ts`.

## 3. Current Project Architecture
- **EXISTS / PARTIAL / MISSING:** MISSING
- **Schema Evidence:** No `Project` model exists in `prisma/schema.prisma`.
- **API Evidence:** No API routes or services for Projects. The only reference to "Project" is the RBAC role `PROJECT_MANAGER` (and `project_manager_id` on some models).
- **Frontend Evidence:** None.
- **Tests:** None.

## 4. Current Unit Architecture
- **EXISTS / PARTIAL / MISSING:** MISSING
- **Schema Evidence:** No separate `Unit` model exists. `Property` itself behaves as the individual sellable unit.
- **API Evidence:** None.
- **Frontend Evidence:** None.
- **Tests:** None.

## 5. Current Inventory Architecture
- **EXISTS / PARTIAL / MISSING:** MISSING
- **Schema Evidence:** No `Inventory` model exists. Inventory availability is implicitly managed via the `Booking` model and `Property` status (if a property is booked, `Booking` throws a 409 Conflict if already `BOOKED` or `SOLD`).
- **API Evidence:** None.
- **Frontend Evidence:** None.
- **Tests:** None.

## 6. Previous "Phase 5 Commercial Foundation"
The commit `f351ed3e87a7723970320f6fcdf761039783294f` (titled "feat: complete phase 5 commercial foundation") implemented the commercial transaction workflow:
- Created the `Booking` and `Payment` models.
- Implemented `Booking` and `Payment` APIs, policies, and services.
- Created `BookingDossier`, `BookingManagement`, `CreateBookingModal`, and `RecordPaymentModal` in the frontend.
- These transactions were built by linking the new `Customer` directly to the existing flat `Property` model.
- **Distinction:** The commit successfully implemented the "Commercial Foundation" (Booking & Payment) of Phase 5, but completely skipped the "Project / Inventory Architecture" structural changes.

## 7. Relationship Analysis
The current architecture strictly supports:
`Company` → `Property` (Unit/Listing combined)

It does **not** support the roadmap's hierarchical `Company` → `Project` → `Unit` → `Property` relationship.

## 8. Business Model Risk
Introducing Project/Unit/Inventory layers into the current system carries extremely high risk:
- **Breaking Workflows:** `Booking`, `SiteVisitBooking`, and `LeadPropertyInterest` all point directly to `property_id`. If `Property` is split into `Project` and `Unit`, all these relations must be re-mapped (likely to `Unit`), causing massive cascading changes.
- **Lead Matching Engine:** `LeadService.getMatches` dynamically compares `lead.budget_max` against `Property.price`. If price is moved to a `Unit` model, the matching algorithm will break and require complex joins to evaluate units within projects.
- **Duplicate Concepts:** If RRH primarily sells independent villas or plots, forcing them into a `Project` container adds unnecessary UI and database friction.

## 9. Recommended Architecture
To satisfy roadmap Phase 5 with minimum disruption:
- **Do not destroy the `Property` model.** Retain it as the primary "Sellable Unit / Listing".
- **Introduce a lightweight `Project` model:**
  - `id`, `title`, `description`, `location`, `company_id`.
- **Link `Property` to `Project`:**
  - Add an optional `project_id` to `Property`.
  - This allows independent villas/plots to remain standalone (`project_id = null`), while allowing apartment towers or gated communities to group multiple `Property` records under one `Project`.
- Leave Bookings, Site Visits, and Matching Engines pointing to `Property`.

## 10. Migration Impact
- **Schema:** Add `Project` model. Add `project_id` (Int?) to `Property`.
- **Existing Data:** No disruption. Existing properties remain standalone.
- **Relations:** New 1-to-Many between `Project` and `Property`.
- **API:** Require new `Project` CRUD routes. Update `Property` endpoints to optionally filter by `project_id`.
- **Frontend:** Add a Project Management screen. Update Property forms to include a Project dropdown.
- **Tests:** Add project isolation and RBAC test suites. Update property creation tests.

## 11. DO NOT BREAK
The following heavily integrated workflows must remain intact:
- `Property` verification and approval lifecycle
- Lead-to-Property matching logic (`matchingEngine.ts`)
- Site Visits (telecaller assignment and tracking)
- Bookings & Payments (conflict detection and status management)
- Tenant data isolation (`company_id` scoping across all models)

## 12. Phase 5 Readiness
- `Company` → `Project` Architecture: **MISSING**
- `Project` → `Inventory / Units`: **MISSING**
- Hierarchical Listing Structure: **MISSING**
- Commercial Foundations (Bookings/Payments): **READY** (Implemented previously)

## 13. Recommendation
**STATUS: BLOCKED — BUSINESS MODEL DECISION REQUIRED**
**CODE CHANGES: NONE**
**DATABASE CHANGES: NONE**
**MIGRATIONS: NONE**

**Explanation:**
The repository currently operates on a flat `Property` model that acts as an individual unit. The previous Phase 5 commit successfully built Bookings and Payments against this flat model.

Transforming this into a nested `Project -> Unit -> Property` hierarchy represents a major architectural shift that will deeply impact Lead Matching, Site Visits, and Bookings. We must first understand RRH-CRMS's actual real estate business model. If they primarily sell independent villas/plots, the current flat model is sufficient and introducing `Project` is over-engineering. If they sell large apartment towers where `Project` grouping is mandatory, we should adopt the "Recommended Architecture" (lightweight `Project` grouping) rather than completely splitting `Property` into `Unit` and `Inventory`. 

A business decision is required before modifying the database.
