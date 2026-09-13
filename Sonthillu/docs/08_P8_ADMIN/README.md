# Phase 8: Admin + Analytics (P8)

## Overview

Phase P8 replaced the local/mock administration system with a production-ready, database-backed Sonthillu Admin architecture. It provides a secure, role-based, decoupled identity model for monitoring business demand, customer behavior, leads, and configuring platform content.

## Key Architectural Principles

1. **Decoupled Identity**
   - Admin identity is completely separate from Customer identity.
   - Separate models: `Admin`, `AdminSession`, `AdminAuditLog`.
   - Admin authentication uses constant-time bcrypt hashing.

2. **Role-Based Access Control (RBAC)**
   - Granular, strictly-enforced roles:
     - `SUPER_ADMIN`: All permissions.
     - `ADMIN`: Write access to content, full analytics visibility including PII.
     - `ANALYST`: Read-only access to aggregated analytics, no PII visibility.
     - `CONTENT_MANAGER`: Write access to content, no analytics visibility.
   - Enforced both at the routing level (Middleware) and data layer (Server Actions/Services).

3. **Database-Backed CMS**
   - The mock `LocalCMSProvider` is replaced with `PrismaCMSProvider`.
   - `HeroSlide` schema tracks homepage hero banners.
   - Admin interface dynamically updates and previews banner configurations.

4. **Analytics Pipeline**
   - Centralizes events from the `ActivityEvent` pipeline.
   - Groups metrics into critical business domains: Overview, Leads, AI Search, Traditional Search Demand, Properties, Recommendations, and Customers.
   - Surfaces CRM resilience state (e.g., handles absent CRM by graying out context gracefully).

5. **Security & Auditability**
   - **Audit Logs**: Every write-operation, login, or sensitive access generates an immutable `AdminAuditLog` entry.
   - **No Shared Session State**: Admin sessions live in a dedicated secure cookie (`sonthillu_admin_session`).
   - **Defense in Depth**: PII routes strictly assert the `ADMIN` role. No arbitrary IDOR is possible.

## Implemented Pages

- `/admin/login` - Secure login endpoint.
- `/admin/overview` - Funnel and overall demand dashboard.
- `/admin/leads` - CRM submissions, callbacks, appraisals.
- `/admin/searches` - Zero-result demand and popular locations.
- `/admin/ai-search` - AI NLP interpretation metrics.
- `/admin/properties` - Inventory and property views.
- `/admin/recommendations` - Personalization funnel.
- `/admin/customers` - Funnel and PII gating.
- `/admin/content/hero` - Dynamic CMS configuration.
- `/admin/system` - Audit logs and deployment settings.

## Quality Assurance

- Automated tests verify RBAC constraints (e.g. `AdminForbiddenError`).
- Tests assert constant-time password execution on non-existent logins.
- Typescript boundaries validate Prisma CMS mutations.
