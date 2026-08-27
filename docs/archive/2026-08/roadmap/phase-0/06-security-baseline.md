# RRH-CRMS Security Baseline

## Overview
This document evaluates the current security implementation of the RRH-CRMS application.

## Authentication
- **Mechanism**: JWT-based session tokens.
- **Handling**: Employs `family_token` and `refresh_token_hash` logic for robust session tracking (Phase 1 Stage 1 implemented).
- **Passwords**: Hashed (assumed bcrypt based on typical Node implementations, verified in `auth.ts`).
- **State**: `AuthSession` model persists active sessions and allows revocation.

## Authorization & RBAC
- **Middleware**: `authenticateToken` validates the JWT. `requirePermission` ensures the requestor holds specific capabilities.
- **Engine**: Centralized in `apps/api/src/authz/authorization.ts` via the `can(user, action, resource)` method.
- **Policies**: Granular resource policies control edit/view rights based on ownership and roles:
  - `PropertyPolicy`: Validates if PMs own the property.
  - `LeadPolicy`: Controls who can view/edit leads.
  - `SiteVisitPolicy`: Enforces workflow state authorization.
- **Tenant Isolation**: Uses `buildPropertyScope` and similar functions in `dataScope.ts` to strictly scope queries by `company_id`.

## Identified Risks & Findings

| Severity | Area | Description | Status |
|----------|------|-------------|--------|
| HIGH | Cross-Tenant Data Access | Assessed in Phase 7/8. Backend policies explicitly scope `where` clauses by `company_id`. | Already protected |
| MEDIUM | IDOR (Insecure Direct Object Reference) | Endpoints generally validate ownership before mutating data. Some endpoints might need explicit resource-level IDOR reviews. | Requires further testing |
| LOW | Over-privileged Roles | Hardcoded role arrays in frontend `App.tsx` dictate UI visibility. | Protected via backend |
| INFORMATIONAL | Token Storage | Frontend uses local variables or localStorage (implied via fetchWithAuth). | Known |

## Security Isolation
- **External Users**: `Roles.CHANNEL_PARTNER` triggers hard blocks in the backend against accessing internal employee data.
- **Data Scope**: Prisma queries heavily rely on injected `whereCondition` built from the user's token.
