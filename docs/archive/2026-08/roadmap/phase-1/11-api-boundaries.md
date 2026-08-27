# RRH-CRMS Target API Boundaries

## Overview
This document designs the RESTful API boundaries for the future architecture. It proposes resources and high-level operations.

## 1. CRM Domains
- `/api/v1/leads`: Continues as the ingestion point. (Create, List, Qualify, Disqualify).
- `/api/v1/customers`: New boundary. (Create from Lead, List, Update KYC).
- `/api/v1/opportunities`: New boundary. (Create for Customer, Update Stage, List Pipeline).
- `/api/v1/activities`: Consolidates tracking. (Log Call, Log Note, associated with Customer/Opportunity).

## 2. Sales & Finance Domains
- `/api/v1/site-visits`: Existing boundary. Will gradually support `opportunityId` payload.
- `/api/v1/bookings`: New boundary. (Create Draft, Approve, Cancel). Must implement distributed locking logic.
- `/api/v1/payments`: New boundary. (Record Receipt, Approve, Refund).

## 3. Inventory Domains
- `/api/v1/projects`: New boundary. (Create Project, Upload Masterplan).
- `/api/v1/units`: Replaces `/properties` conceptually. (List Units under Project, Update Price, Change Status).

## 4. Other Domains
- `/api/v1/documents`: (Generate Agreement, Upload Signed Copy).
- `/api/v1/channel-partners`: Existing boundary. (Read, Register, Upline/Downline).
- `/api/v1/marketing`: (Campaigns, Source Attribution).

## Authorization per Boundary
All these endpoints will continue to use the standard Express middleware:
```typescript
router.post('/', authenticateToken, requirePermission(Permissions.OPPORTUNITY_CREATE), createOpportunityHandler);
```
