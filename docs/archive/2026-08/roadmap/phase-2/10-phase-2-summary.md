# Phase 2: Security & Authorization Hardening Summary

## Overview
Phase 2 focused on replacing ad-hoc, hardcoded role checks with a centralized, permission-based authorization engine (`authz.ts`) and object-level policy enforcement.

## Implementations
1. **API Routes Hardening**: Replaced direct role checks (e.g., `requireRole([Roles.MD])`) in `md.ts` and `tasks.ts` with `requireAuthz(Permissions.*)` to ensure consistency with the canonical permissions matrix.
2. **Authorization Engine Consolidation**: Integrated inline logic into `TaskPolicy.canMutateSync` and hooked it into the central `authorization.ts` `can()` engine, ensuring a unified IDOR boundary.
3. **Sensitive Data Protection**: Validated that `GET /api/v1/employees` uniformly masks sensitive data (PAN, Aadhaar, CTC, Bank details) based on the `EMPLOYEES_VIEW_SENSITIVE` permission.
4. **Tenant & Ownership Validation**: The central authorization checks strictly enforce `companyId` boundaries across all resources unless explicitly overridden by `Roles.ADMIN`.

## Regression Security Tests
A dedicated security regression test suite `phase2-security.test.ts` was implemented to verify:
- **Tenant Isolation**: Cross-company read/update rejection.
- **Ownership**: Rejection of agent attempts to update unassigned items.
- **Data Protection**: Verification of sensitive data masking when the requesting user lacks adequate permissions.

## Authentication Security & Rate Limiting
- `loginRateLimiter` remains correctly applied to `POST /auth/login`. 
- No public/unauthenticated endpoints like password-reset or OTP currently exist that necessitate additional rate limiting. All other endpoints are heavily authenticated.

The repository is now securely prepared for feature enhancements in the subsequent phases.
