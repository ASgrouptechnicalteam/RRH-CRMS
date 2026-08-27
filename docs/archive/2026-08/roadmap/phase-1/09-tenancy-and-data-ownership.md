# RRH-CRMS Tenancy & Data Ownership

## Overview
This document defines how multi-tenancy (`company_id`) and data ownership should apply to the future architectural domains.

## 1. Absolute Tenancy Rule
The existing `company_id` isolation must not be weakened. Every core business entity MUST carry a `company_id`.

## 2. Target Entity Ownership

| Entity | Has company_id? | Cross-Company Allowed? | Authoritative Source |
|--------|-----------------|------------------------|----------------------|
| Customer | Yes | NO | `company_id` |
| Opportunity | Yes | NO | Inherited from `Customer` |
| Project | Yes | NO | `company_id` |
| Unit | Yes | NO | Inherited from `Project` |
| Booking | Yes | NO | Inherited from `Opportunity` & `Unit` (must match) |
| Payment | Yes | NO | Inherited from `Booking` |

## 3. Data Scope Application
The backend `dataScope.ts` utility currently injects `company_id` dynamically.
For future routes (e.g., `/api/v1/opportunities`), the same pattern MUST be used:
```typescript
const scope = buildScope(req.user);
const opportunities = await prisma.opportunity.findMany({
  where: { ...scope, /* other filters */ }
});
```

## 4. Cross-Company Validation
If a Booking attempts to link an `Opportunity` and a `Unit`, the backend service MUST explicitly validate that `opportunity.company_id === unit.company_id`. No cross-company transactional links are permitted under any circumstances.
