# RRH-CRMS "Do Not Break" Inventory

## Overview
This list represents functional domains and capabilities that currently exist and are actively required. Future phases must navigate around these features without silently breaking them.

## DO NOT BREAK
- **Authentication System**: JWT Token family lifecycle and Refresh logic.
- **Tenant Isolation**: Backend scoping queries matching `company_id` injected via the authentication payload (`dataScope.ts`).
- **RBAC**: The `Permissions` and `Roles` enums, and frontend rendering based on `App.tsx` role definitions.
- **Employee Management (EMS)**: Creation, attendance logs, tasks, daily reports, notifications.
- **Lead Generation & Management**: The core ability to upload, create, list, and modify Leads.
- **Auto-Matching Engine**: Lead to Property matching via `LeadMatchingRequirement`.
- **Property Workflow**: Inventory tracking, images, and MD approval flow.
- **Site Visits Engine**: State machine routing (`PENDING_VERIFICATION` -> `COMPLETED`).
- **Channel Partner Approvals**: `CPPayout` generation and MD approvals.
- **Test Integrity**: The 13 existing Jest test suites MUST continue passing to prove that isolation and access controls remain intact.
