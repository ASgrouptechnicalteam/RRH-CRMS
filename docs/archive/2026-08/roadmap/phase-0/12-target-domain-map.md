# RRH-CRMS Proposed Target Domain Map

## Overview
This document maps the theoretical future architecture domains to the actual current repository components. 
*Note: Do not restructure the repository yet. This is a mapping guide.*

## Domain Mapping

### 1. Identity & Authorization
- **Target**: `identity/`, `authorization/`
- **Current Locations**: 
  - `apps/api/src/authz/`
  - `apps/api/src/routes/auth.ts`
  - `packages/shared/src/index.ts` (Roles/Permissions)

### 2. Employees (EMS Foundation)
- **Target**: `employees/`
- **Current Locations**:
  - `apps/api/src/routes/employees.ts`
  - `apps/api/src/routes/attendance.ts`
  - `apps/api/src/routes/performance.ts`

### 3. CRM Core
- **Target**: `crm/` (`leads/`, `customers/`, `opportunities/`, `activities/`)
- **Current Locations**:
  - `apps/api/src/routes/leads.ts`
  - `apps/api/src/services/lead.service.ts`
  - *Note: `customers/` and `opportunities/` are currently missing and wrapped inside Leads.*

### 4. Inventory
- **Target**: `properties/`, `projects/`, `inventory/`
- **Current Locations**:
  - `apps/api/src/routes/properties.ts`
  - `apps/api/src/services/property.service.ts`

### 5. Sales & Finance
- **Target**: `sales/` (`site-visits/`, `bookings/`, `payments/`)
- **Current Locations**:
  - `apps/api/src/routes/siteVisits.ts`
  - `apps/api/src/services/siteVisit.service.ts`
  - *Note: Bookings and Payments are missing.*

### 6. Channel Partners
- **Target**: `channel-partners/`
- **Current Locations**:
  - `apps/api/src/routes/cp.ts`

### 7. Workflow & Automation
- **Target**: `automation/`, `audit/`, `notifications/`
- **Current Locations**:
  - `apps/api/src/workflows/`
  - `apps/api/src/routes/notifications.ts`
  - `apps/api/src/routes/pushSubscriptions.ts`

### 8. Unimplemented Domains
- `documents/` (Missing)
- `marketing/` (Missing)
- `after-sales/` (Missing)
