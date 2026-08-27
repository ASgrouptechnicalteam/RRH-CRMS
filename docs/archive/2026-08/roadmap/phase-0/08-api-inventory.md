# RRH-CRMS API Inventory

## Overview
This document records the major API endpoints currently implemented in the Express backend.

## Routing Structure
All routes are mounted under `/api/v1/`.

| Domain | Route File | Purpose | Auth Req? | Perm Req? | Scope Check |
|--------|------------|---------|-----------|-----------|-------------|
| System | `health.ts` | Server health check | No | No | N/A |
| System | `auth.ts` | JWT Login, Setup, Refresh | Mixed | No | N/A |
| EMS | `employees.ts` | CRUD for Employee records | Yes | Yes | `company_id` |
| EMS | `attendance.ts`| QR scanning, attendance logs | Yes | Yes | `company_id` |
| EMS | `tasks.ts` | Employee tasks management | Yes | No | Self/Assignee |
| EMS | `reports.ts` | Daily activity reports | Yes | No | Self |
| EMS | `targets.ts` | Daily KPIs per role/employee | Yes | Yes | `company_id` |
| EMS | `performance.ts`| Metrics snapshots | Yes | Yes | `company_id` |
| Admin | `admin.ts` | Role & Permission assignment | Yes | Yes | `company_id` |
| CRM | `leads.ts` | Leads CRUD, Assignments, Interests | Yes | Yes | `company_id` |
| Inventory| `properties.ts`| Property CRUD, Images | Yes | Yes | `company_id` |
| Sales | `siteVisits.ts`| Site Visit workflow | Yes | Yes | `company_id` |
| Partners | `cp.ts` | Channel Partner management | Yes | Yes | `company_id` |
| Finance | `expenseRefunds.ts`| Petty cash requests | Yes | Yes | `company_id` |
| MD | `md.ts` | MD-specific dashboards | Yes | Yes | `company_id` |

## Data Scoping
Most entities include a `company_id`. The application heavily relies on backend utility `buildLeadScope()`, `buildPropertyScope()`, etc., which inject `company_id` (and occasionally `branch_id`) onto Prisma `where` objects dynamically based on the JWT `TokenPayload`.

## Security Defaults
- Almost all routes apply `authenticateToken` middleware.
- Modifying routes (POST/PUT/DELETE) use `requirePermission` with specific `Permissions.X` constants.
