# RRH-CRMS Frontend Inventory

## Overview
This document maps the major UI boundaries and components in the Vite/React application.

## High-Level Hubs & Dashboards
The application renders specific components based on the user's role mapping in `App.tsx`:
- `MDExecutiveDashboard`: Top-level reporting
- `PMDashboard`: Project Manager dashboard
- `TelecallerDashboard`: Sales entry dashboard
- `StaffDashboard`: General employee dashboard
- `HRDashboard`: Employee onboarding, attendance oversight
- `SystemControlHub`: Technical Admin control panel
- `AnalyticsHub`: Cross-module analytics reporting
- `FinanceHub`: Petty cash refunds and CP payout approvals

## Major CRM Components
- **Lead Management** (`apps/web/src/components/leads/LeadManagement.tsx`)
  - Features: Bulk Upload, Add Lead, Lead List, Filtering
  - Dossier Tabs: Details, Activities, Live Matches (Property Matching), Saved Interests, Site Visits
- **Property Management** (`apps/web/src/components/properties/PropertyManagement.tsx`)
  - Features: Add Property, Inventory View, Image Uploads, Verification Status toggling
- **Site Visit Management** (`apps/web/src/components/siteVisits/SiteVisitManagement.tsx`)
  - Features: Multi-tab view for New Bookings, Active Visits, Completed. Handles workflow state advances (Assign Agent, Complete Visit).
- **Channel Partner Management** (`apps/web/src/components/cp/ChannelPartnerManagement.tsx`)
  - Features: CP Registration, network/upline tracking.

## Reusable UI (Design System Baseline)
- Standardized buttons, modals, badges using TailwindCSS utilities directly inline.
- Standardized icons from `lucide-react`.
- Form inputs generally use raw HTML `<input>` with heavy Tailwind classes. 
- Mobile navigation is implemented via `MobileBottomNav.tsx` for core routes.
