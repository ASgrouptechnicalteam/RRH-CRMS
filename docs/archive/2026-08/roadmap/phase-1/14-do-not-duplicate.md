# RRH-CRMS Do Not Duplicate Guidelines

## Overview
This document highlights specific conceptual traps that could lead to duplicated code, duplicated logic, or duplicated data during the CRM transformation.

## 1. Do Not Duplicate Role & Permission Enums
- **Risk**: Frontend and Backend defining the same roles manually.
- **Rule**: All role names and permission constants MUST be imported from `@rrh-ems/shared`. The frontend should never hardcode `'telecallers'`.

## 2. Do Not Duplicate Scope Logic (Multi-Tenancy)
- **Risk**: A new API endpoint manually writing `where: { company_id: req.user.companyId }` instead of using the standard scope builder.
- **Rule**: All Prisma queries must use the `dataScope.ts` utility (e.g., `buildLeadScope()`) to ensure consistent, secure, and easily auditable tenant isolation.

## 3. Do Not Duplicate Workflow Logic
- **Risk**: Hardcoding status transitions like `if (status === 'CONFIRMED')` directly inside Express controllers.
- **Rule**: All state transitions must route through the `WorkflowEngine` to guarantee that validation hooks, side effects, and `AuditEvent` logs are fired uniformly.

## 4. Do Not Duplicate "Customer" Contact Info
- **Risk**: When a `Lead` becomes a `Customer`, creating a separate `Employee/Contact` style table for customers.
- **Rule**: Maintain a distinct `Customer` table. Do NOT link Customers to the `Employee` table. Do NOT leave critical contact information stored solely on the `Lead` after conversion. Information should migrate.

## 5. Do Not Duplicate Inventory Definitions
- **Risk**: Storing global project amenities (e.g., "Clubhouse") on 100 distinct `Unit` records.
- **Rule**: Elevate global, shared data to the proposed `Project` entity. Only unit-specific data (dimensions, unit price) belongs on the `Unit` table.
