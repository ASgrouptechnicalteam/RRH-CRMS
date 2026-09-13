# Current State

## Tech Stack

**Frontend**: React, Vite, TypeScript, PWA
**Backend**: Node.js, Express, TypeScript, Prisma
**Database**: MySQL / MariaDB

## Current Prisma Models

(Regenerated 2026-09-06 from `apps/api/prisma/schema.prisma` — see Phase 3.3 of the implementation plan. Keep this list in sync when models are added/removed; a stale list here is worse than no list.)

- Company
- Branch
- Employee
- Role
- Permission
- RolePermission
- EmployeeRole
- EmployeeBranch
- EmployeeCompanyAccess
- EmployeePermissionOverride
- EmployeeQrCode
- AttendanceLog
- KioskCredential
- AttendanceProposal
- CompanyHoliday
- Task
- DailyReport
- AuditEvent
- Notification
- DailyTarget
- PerformanceSnapshot
- Lead
- LeadActivity
- LeadMatchingRequirement
- LeadPropertyInterest
- Project
- ProjectLayoutImage
- PropertyLayoutRegion
- Property
- PropertyImage
- PropertyPublication
- PropertyVerificationLog
- SiteVisitBooking
- SiteVisitProperty
- SiteVisitReassignment
- MessageTemplate
- ExpenseRefund
- PushSubscription
- AuthSession
- Complaint
- Customer
- Booking
- Payment
- Installment
- Opportunity
- BookingPortalMapping
- IntegrationEvent
- CustomerNotification
- PublicApiKey
- PMLocationAssignment
- PMReassignmentHistory
- SiteVisitEscalation
- Demo
- DemoInterestedProperty
- PropertyPricing
- PropertyPlotDetails
- PropertyApartmentDetails

## Multi-Company Support

This system is multi-company (confirmed 2026-09-06): Radha Real Homes (commercial) and Sonthillu Constructions (residential), currently sharing one employee base. Cross-company access is resolved at query time via the `EmployeeCompanyAccess` grant table (`apps/api/src/authz/dataScope.ts`'s `getAccessibleCompanyIds`/`buildLeadScope`/`buildPropertyScope`/`buildProjectScope`/etc.), not baked into the JWT. Any doc predating 2026-09-06 that assumes single-company isolation, or that every employee's `company_id` is their only visibility boundary, is stale — see Phase 1.2 in `docs/RRH-CRM-Implementation-Plan.md`.

## Key Specifications

- [Lead Workflow Specification](../LEAD-WORKFLOW-SPEC.md)
- [Implementation Plan (living, actively tracked)](../RRH-CRM-Implementation-Plan.md)
