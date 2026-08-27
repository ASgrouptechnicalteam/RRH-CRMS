# Phase 5 Execution Gate

**STATUS: READY FOR IMPLEMENTATION**

## Architectural Decision Summary
The business decision dictates that RRH operates a hybrid real-estate model (both large projects and standalone properties).

We have deliberately rejected the over-engineered `Project -> Inventory -> Unit -> Property` hierarchy in favor of a lightweight `Project (1) -> Property (Many)` approach. The existing `Property` model is preserved as the canonical sellable asset, seamlessly acting as both a unit within a project and a standalone property if `project_id` is null.

This architectural decision ensures absolute safety for existing Bookings, Site Visits, and Lead Matching workflows.

## Approved Conceptual Model
```text
Company
  |
  +-- Project (New Model)
  |     |
  |     +-- Property (Unit within Project)
  |           |-- Bookings
  |           |-- Site Visits
  |
  +-- Property (Standalone)
        |-- Bookings
        |-- Site Visits
```

## Implementation Packets
If approved to proceed, the implementation will be executed in the following strict order:

### Packet 1: Database Foundation
- Update `prisma/schema.prisma` with the `Project` model and `project_id` relation on `Property`.
- Generate Prisma Client (`npx prisma generate`).
- Create and apply the database migration (`npx prisma migrate dev`).

### Packet 2: Service & API Layer
- Implement `ProjectService` (CRUD).
- Update `PropertyService` to accept and validate `project_id`.
- Implement `apps/api/src/routes/projects.ts`.
- Update `apps/api/src/routes/properties.ts`.

### Packet 3: Security & Authorization
- Create `ProjectPolicy` ensuring strict `company_id` and `assigned_pm_id` data scoping.
- Update `DataScope` middleware to handle project-level filtering.

### Packet 4: Frontend Integration
- Create `ProjectManagement.tsx` dashboard.
- Update the "Add Property" wizard to include a Project selection dropdown.
- Update the Property Dossier to display Project associations.

### Packet 5: Validation
- Run full automated regression suite (`npm run test:api`).
- Ensure no existing Property, Site Visit, or Booking tests break.

---
**DO NOT COMMENCE IMPLEMENTATION WITHOUT EXPLICIT APPROVAL TO UNLOCK THIS EXECUTION GATE.**
