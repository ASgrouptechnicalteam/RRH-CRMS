# RRH-CRMS Entity Inventory

This document maps the proposed theoretical CRM entities to the actual entities currently found in the Prisma schema (`prisma/schema.prisma`).

| Domain | Proposed Entity | Exists? | Actual Prisma Model | Used By | Status | Notes |
|--------|-----------------|---------|----------------------|---------|--------|-------|
| EMS | Employee | ✅ EXISTING | `Employee` | Auth, HR, Sales, PMs | COMPLETE | Contains personal, HR, banking, hierarchy, roles |
| EMS | Role | ✅ EXISTING | `Role`, `EmployeeRole` | Auth Middleware | COMPLETE | Drives RBAC |
| EMS | Permission | ✅ EXISTING | `Permission`, `RolePermission`, `EmployeePermissionOverride` | Auth Middleware | COMPLETE | Granular permissions mapped in `@rrh-ems/shared` |
| EMS | Company | ✅ EXISTING | `Company` | Entire App | COMPLETE | Base tenant isolation layer |
| CRM | Lead | ✅ EXISTING | `Lead` | Marketing, Telecallers | COMPLETE | Current CRM opportunity/deal object (status: NEW -> WON/LOST) |
| CRM | LeadActivity | ✅ EXISTING | `LeadActivity` | Leads route | COMPLETE | Audit/Timeline for leads |
| CRM | LeadPropertyInterest | ✅ EXISTING | `LeadPropertyInterest` | Leads route | COMPLETE | Many-to-many Lead to Property mapping (Phase 8 logic) |
| CRM | LeadMatchingRequirement | ✅ EXISTING | `LeadMatchingRequirement` | Leads route | COMPLETE | Captures buyer preferences for property auto-matching |
| Inventory | Property | ✅ EXISTING | `Property` | PMs, Sales | COMPLETE | Inventory object. Contains pricing, location, status |
| Sales | SiteVisitBooking | ✅ EXISTING | `SiteVisitBooking` | Sales, Agents | COMPLETE | Ties Lead + Property + Telecaller + PM + Field Agent |
| Sales | Customer | ❌ MISSING | N/A | N/A | MISSING | A Lead currently acts as the customer object directly |
| Sales | Opportunity | ❌ MISSING | N/A | N/A | MISSING | A Lead currently acts as the Opportunity object directly |
| Inventory | Project | ❌ MISSING | N/A | N/A | MISSING | Only `Company` and `Branch` exist to group properties implicitly |
| Inventory | Unit | ❌ MISSING | N/A | N/A | MISSING | Properties act as standalone units right now |
| Sales | Booking | ❌ MISSING | N/A | N/A | MISSING | Not yet implemented in the schema (Phase 9/10 target) |
| Sales | Payment | ❌ MISSING | N/A | N/A | MISSING | Not yet implemented in the schema |
| Sales | PaymentSchedule | ❌ MISSING | N/A | N/A | MISSING | Not yet implemented in the schema |
| Sales | Document | ❌ MISSING | N/A | N/A | MISSING | Not yet implemented in the schema |
| Marketing | MarketingCampaign | ❌ MISSING | N/A | N/A | MISSING | `Lead.source` captures acquisition source statically |
| Partners | ChannelPartner | ✅ EXISTING | `ChannelPartner` | Leads, Finance | COMPLETE | Real estate partners (tiers, downlines) |
| Partners | Commission | ✅ EXISTING | `CPPayout` | Finance | COMPLETE | Commission payout tracking |
| Support | AfterSales | ❌ MISSING | N/A | N/A | MISSING | Not yet implemented |
| Support | Complaint | ❌ MISSING | N/A | N/A | MISSING | Not yet implemented |
| EMS | Task | ✅ EXISTING | `Task` | EMS Operations | COMPLETE | Internal employee task tracking |
| System | Notification | ✅ EXISTING | `Notification`, `PushSubscription` | PWA | COMPLETE | Web Push standard |
| System | AuditLog | ✅ EXISTING | `AuditEvent` | Admin | COMPLETE | Activity monitoring |
| EMS | DailyTarget | ✅ EXISTING | `DailyTarget`, `DailyReport`, `PerformanceSnapshot` | Sales, Management | COMPLETE | Daily quota and KPI tracking |
| Finance | ExpenseRefund | ✅ EXISTING | `ExpenseRefund` | Employees, Finance | COMPLETE | Multi-stage approval petty cash reimbursement |
