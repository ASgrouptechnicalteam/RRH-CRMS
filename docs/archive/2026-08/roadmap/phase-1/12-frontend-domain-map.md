# RRH-CRMS Frontend Domain Boundaries

## Overview
This document maps the target architectural domains to the future React frontend structure.

## 1. CRM Hub
- **Location**: `src/components/crm/`
- **Sub-Modules**:
  - `Leads`: Intake, basic qualification.
  - `Customers`: Customer 360 view (KYC, historic deals).
  - `Opportunities`: The active sales pipeline (Kanban board view or list).

## 2. Sales Hub
- **Location**: `src/components/sales/`
- **Sub-Modules**:
  - `SiteVisits`: Scheduling and field agent dispatch (Migrated from `src/components/siteVisits/`).
  - `Bookings`: Unit locking, booking forms, management approval.
  - `Payments`: Receipt generation, milestone tracking.

## 3. Inventory Hub
- **Location**: `src/components/inventory/`
- **Sub-Modules**:
  - `Projects`: High-level master plans, global amenities.
  - `Units`: Granular plot/villa availability status (Migrated conceptually from `PropertyManagement.tsx`).

## 4. Required Refactoring (Future Phases)
- `LeadManagement.tsx` is currently a monolithic file handling Leads, auto-matching, site visit scheduling, and activities.
- In Phase 4+, this component will be broken down into composable, smaller tab components (e.g., `<LeadDetailsTab />`, `<LeadActivityLog />`).
- The "Live Matches" feature should become a generalized `<PropertyMatchEngine />` component that can attach to an `Opportunity` instead of just a `Lead`.
