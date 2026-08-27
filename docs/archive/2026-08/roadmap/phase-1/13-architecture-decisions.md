# RRH-CRMS Architecture Decisions

## ADR-001 Lead vs Customer Separation
- **Status**: PROPOSED
- **Context**: Currently, `Lead` serves as the contact, the prospect, the opportunity, and the customer simultaneously.
- **Decision**: Separate the CRM funnel into `Lead`, `Customer`, and `Opportunity`. A Lead qualifies into a Customer and spawns an Opportunity. 
- **Consequences**: Requires new Prisma models, migration scripts, and frontend rewrites of the Lead Dossier.

## ADR-002 Property vs Project/Unit
- **Status**: PROPOSED
- **Context**: `Property` is a flat structure representing both listing information and the physical unit.
- **Decision**: Introduce a `Project` table. The existing `Property` table conceptually becomes the `Unit` table (saleable inventory), carrying a foreign key to `Project`.
- **Consequences**: Existing properties can be mapped to a generic "Standalone" project to maintain compatibility during migration.

## ADR-003 Site Visit Anchoring
- **Status**: PROPOSED
- **Context**: `SiteVisitBooking` is hard-linked to `lead_id`.
- **Decision**: It will eventually link to `opportunity_id`. For backward compatibility, both IDs will coexist in the schema initially.

## ADR-004 Transactional Lock Strategy
- **Status**: PROPOSED
- **Context**: Booking/Payment models are needed.
- **Decision**: Generating a `Booking` requires an explicit Prisma `$transaction` lock on the target `Unit` to prevent double-booking.

## ADR-005 Tenancy enforcement
- **Status**: FINAL
- **Context**: Strong multi-tenancy exists.
- **Decision**: The `dataScope.ts` approach will be preserved for all new tables. No new table should lack a `company_id`.
