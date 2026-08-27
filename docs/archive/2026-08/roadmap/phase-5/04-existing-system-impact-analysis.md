# Project, Property, and Inventory Model

## 1. Existing Data Migration
- **How existing Property records remain valid:**
  Existing `Property` records remain untouched. The new `project_id` field will be introduced as an optional (`Int?`) field. Therefore, all existing properties immediately default to "standalone properties."
- **How existing Bookings remain valid:**
  `Booking` currently points to `Property`. Since `Property` is preserved as the canonical sellable asset, existing Bookings do not need their relationships mapped to a new table. They remain fully valid.

## 2. Lead Matching
- **How matching continues to work:**
  `LeadService.getMatches()` compares `lead.budget_max` against `Property.price`, and `lead.preferred_location` against `Property.location`. 
  Because we keep `Property` as the sellable asset, the matching engine continues to loop through `p.property.findMany({ where: { status: 'LIVE' } })`. 
  **Enhancement for Phase 5:** We can optionally enhance the matching engine to display the `Project` name if `project_id` is present, giving telecallers better context during pitch calls.

## 3. Site Visits
- **Project → Property → Site Visit relationships:**
  `SiteVisitBooking` points directly to `Property`. 
  If a customer wants to visit "My Home Gardens", the site visit is booked against a specific unit (e.g., "Villa 104") or a representative dummy `Property` created for the project. 
  By keeping the relationship on `Property`, telecallers do not need to learn a new workflow.

## 4. Booking
- **Customer → Opportunity → Project → Property → Booking:**
  The `Booking` connects `Customer` to `Property`. 
  Because `Property` belongs to `Project`, a Booking implicitly belongs to the Project via `Booking.property.project`. 
  This allows aggregated reporting (e.g., "Total Bookings for My Home Gardens") without adding a redundant `project_id` to the `Booking` table itself.

## 5. Payment
- **Booking → Payment → Collections and Project-Level Reporting:**
  `Payment` is tied to `Booking`. 
  Because `Booking` → `Property` → `Project`, every payment can be rolled up to the Project level for financial reporting (e.g., "Total revenue collected for My Home Gardens").

## 6. Marketing
- **Project → Campaign → Lead → Customer → Opportunity → Booking → Revenue:**
  Marketing campaigns (Phase 4 UTMs) capture leads. If a campaign is specifically run for a `Project`, the Lead can be explicitly tagged with the `project_id` (future enhancement) or matched to properties within that project. Revenue generated from those leads rolling into Bookings can be directly attributed back to the marketing campaign.
