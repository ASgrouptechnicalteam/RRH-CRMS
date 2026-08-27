# RRH-CRMS Architecture Map

## Overview
This document maps out the current architecture of the RRH-CRMS repository.

## Frontend
- **Framework**: React with Vite
- **Routing**: `react-router-dom` (App.tsx contains all main routes with role-based `<Navigate>` fallbacks)
- **State Management & Authentication**: React Context API (`AuthContext`, `ToastContext`)
- **API Client**: Native `fetch` API wrapped in a custom `fetchWithAuth` hook (handles automatic JWT injection).
- **Styling**: Tailwind CSS
- **Major Components/Pages**:
  - `LeadManagement.tsx` (CRM dossier, matching engine)
  - `PropertyManagement.tsx` (Inventory control, verification flows)
  - `SiteVisitManagement.tsx` (Booking, scheduling, verification, field agent dispatch)
  - `HRDashboard.tsx` & `AnalyticsHub.tsx`
  - Various role-specific dashboards (`MDExecutiveDashboard`, `PMDashboard`, `TelecallerDashboard`, `StaffDashboard`)
- **Performance Optimizations**:
  - Extensive use of `React.lazy` and `Suspense` for code-splitting routes.
  - Custom `useIdleTimer` for automatic logout.

## Backend
- **Framework**: Node.js / Express.js
- **Entry Point**: `apps/api/src/server.ts`
- **Route Structure**: Modular routes mapped in `apps/api/src/routes/` (e.g., `auth.ts`, `leads.ts`, `siteVisits.ts`, `employees.ts`, `cp.ts`).
- **Middleware**: 
  - `authenticateToken` (Validates JWT)
  - `requirePermission` (Checks RBAC)
- **Authorization**:
  - Dedicated `apps/api/src/authz/authorization.ts` and `dataScope.ts` managing tenant isolation.
  - Policy classes (e.g., `SiteVisitPolicy`, `PropertyPolicy`) for granular data access control.
- **Services**: Business logic abstracted in `apps/api/src/services/` (e.g., `lead.service.ts`, `property.service.ts`, `siteVisit.service.ts`).
- **Workflows**: Stateful business rules managed via a Workflow Engine (`apps/api/src/workflows/workflowEngine.ts`).

## Database
- **Technology**: MySQL
- **ORM**: Prisma Client
- **Structure**: Defined in `prisma/schema.prisma`
  - Contains extensive tenant isolation (`company_id`, `branch_id`).
  - Implements soft-delete patterns (`deleted_at`) and audit-friendly relations.

## Shared Package (`@rrh-ems/shared`)
- **Permissions Definitions**: Hardcoded capability matrix (`Permissions`).
- **Role Constants**: Hardcoded role definitions (`Roles`).
- **Constants**: Shared configurations.

## Testing Architecture
- **Frameworks**: Jest, Playwright
- **Configuration**: `jest.config.js`, `playwright.config.ts`.
- **API Tests**: Stored in `tests/api/` (e.g., `phase8.test.ts`, `siteVisits.test.ts`, `workflowEngine.test.ts`).
- **Test Database Strategy**: Uses a dedicated test `.env.test` file. Likely relies on seeding and tearing down tests dynamically.
