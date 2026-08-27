# Phase 5 Business Decision

## Decision Context
The repository had implemented a flat `Property` model. Previous Phase 5 execution implemented Commercial Foundations (Bookings + Payments) directly against this flat model.

The business decision is to formally adopt a Project-based architecture without destroying the existing standalone Property workflow.

## Approved Business Rules
1. **Hybrid Real Estate Operations:** RRH operates large real-estate projects (e.g., "My Home Gardens") while also selling standalone properties.
2. **Project Composition:** One project may contain multiple individually sellable properties/units.
3. **Canonical Sellable Asset:** The existing `Property` model represents the individual sellable asset (unit or standalone property).
4. **Inventory Management:** Inventory availability must be managed at the individual sellable asset level (the `Property` model).
5. **Project-Level Business Importance:** Project-level information is critical for aggregations, reporting, and management by the Managing Director (MD), Project Manager, and Marketing Director.
6. **Long-Term Vision:** Transform RRH-CRMS into a comprehensive Real Estate Business Operating System (Marketing → Leads → Customers → Requirements → Projects → Properties/Units → Matching → Site Visits → Opportunities → Negotiation → Booking → Payments → Documents → Collections → Channel Partners → After-Sales → Project Operations → Analytics → AI).

## Architectural Directive
- **Preserve Existing Property:** DO NOT destroy the existing `Property` model.
- **Do Not Overengineer:** DO NOT blindly create an overcomplicated `Project → Inventory → Unit → Property` abstraction.
- **Existing Workflows Must Survive:** Lead matching, Site visits, Bookings, Payments, Property verification, and frontend property management must remain intact and functional for both standalone properties and project-linked properties.
