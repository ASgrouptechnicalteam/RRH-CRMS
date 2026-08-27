# RRH-CRMS Site Visit Domain Positioning

## Overview
This document analyzes the current `SiteVisitBooking` model and defines its target positioning in the future architecture.

## 1. Current State
- **Entity**: `SiteVisitBooking`
- **Tied To**: Explicitly requires `lead_id`. Optionally linked to `property_id`.
- **Workflow**: A well-tested workflow engine controls states (`PENDING_VERIFICATION` -> `COMPLETED`).
- **Authorization**: Scoped by the `Lead`'s `company_id`. Access is governed by specific roles (PM, Telecaller, Field Agent) linked to the visit.

## 2. Target Positioning
A Site Visit is a mid-funnel sales activity. It occurs *after* initial qualification but *before* a financial booking. 
In the future architecture where `Opportunity` replaces `Lead` as the core deal tracker:
- A Site Visit fundamentally belongs to an **Opportunity**.
- A Site Visit targets a specific **Project** or **Unit**.

## 3. Recommended Migration Path
1. **Short Term (Backward Compatibility)**: 
   - Leave `lead_id` on the `SiteVisitBooking` table. The existing frontend heavily relies on viewing Site Visits inside the Lead Dossier.
2. **Medium Term (Dual Support)**: 
   - Introduce `opportunity_id` to the `SiteVisitBooking` table (nullable).
   - As new Opportunities are created, Site Visits are linked to them.
3. **Long Term**: 
   - `lead_id` is deprecated from `SiteVisitBooking`. The hierarchy becomes: `Customer` -> `Opportunity` -> `SiteVisitBooking`.

**Do not implement this migration in Phase 1.**
