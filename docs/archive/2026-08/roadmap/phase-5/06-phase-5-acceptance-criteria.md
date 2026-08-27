# Phase 5 Acceptance Criteria

## 1. Project Management (MD & PM)
- [ ] MD can create a new Project, assigning it to a Project Manager.
- [ ] MD can view a global list of all Projects within the company.
- [ ] PM can view their assigned Projects.
- [ ] PM CANNOT view Projects assigned to other PMs (Data Scope Enforcement).
- [ ] Project details screen displays aggregated lists of Properties attached to the Project.

## 2. Property / Unit Enhancements
- [ ] Properties can be created as standalone (no Project assigned).
- [ ] Properties can be created and linked to an existing Project.
- [ ] Existing Property workflows (Verification, DM Polish, MD Approval) continue to function without errors.

## 3. Commercial Continuity (Do Not Break)
- [ ] Existing tests for Bookings pass successfully.
- [ ] Existing tests for Payments pass successfully.
- [ ] Existing tests for Site Visits pass successfully.
- [ ] Lead Matching Engine successfully returns properties (both standalone and project-linked) based on budget and location.
- [ ] Double-booking a Property still throws a `409 Conflict`.

## 4. Security & Isolation
- [ ] All `Project` data strictly isolated by `company_id`.
- [ ] Cross-tenant data access attempts return `403 Forbidden` or filter out inaccessible records.
