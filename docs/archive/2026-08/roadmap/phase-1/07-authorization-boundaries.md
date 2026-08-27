# RRH-CRMS Authorization Boundaries

## Overview
This document defines the authorization requirements for the proposed future domains. It does not create new permissions, but outlines the boundaries that future RBAC implementations must satisfy.

## 1. CRM & Sales (Customers, Opportunities)
- **Create**: Sales Agents (Telecallers, Walk-in managers), Bulk Upload scripts.
- **Read**: 
  - `Assigned_To` Agent (Full Read).
  - Managers / Team Leads (Read all under their hierarchy).
  - MD (Global Read).
  - Cross-company read is strictly **FORBIDDEN**.
- **Update**: `Assigned_To` Agent, Managers.
- **Delete**: Extremely restricted (Admin/MD only), prefer soft-delete or `LOST` state.
- **Assign**: Automatic routing engine, or Manual override by Managers/MD.

## 2. Inventory (Projects, Units)
- **Create**: Project Managers (PM), Admins.
- **Read**: Globally visible to all internal sales staff within the same `company_id`.
- **Update**: PM assigned to the Project, MD.
- **Delete**: Admin/MD only.
- **Approve**: MD (for making inventory `LIVE`).

## 3. Financial (Bookings, Payments)
- **Create**: Sales Agents (draft booking), Finance/Accountants (registering received payment).
- **Read**: Sales Agents (for their own deals), Finance, MD.
- **Update/Cancel**: Requires explicit workflow approval. A Sales Agent cannot silently cancel a confirmed booking.
- **Approve**: Finance confirms receipt of funds.

## 4. Fundamental Boundaries
- **Tenant Scope (`company_id`)**: The absolute hard boundary. No standard employee role can ever cross companies.
- **Ownership Scope**: Agents only see their assigned deals. PMs only see their assigned projects.
- **External Scope**: Channel Partners can never read internal inventory tables freely. They interact via specific API gateways that shield internal data.
