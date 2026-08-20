# CRM-FEATURE-INVENTORY

> Feature-by-feature matrix for RRH-CRMS. Columns: **Status**, **Backend**, **Frontend**,
> **Database**, **API**, **Tests**, **Notes**. Legend: 🟢 IMPLEMENTED · 🟡 PARTIALLY ·
> 🔴 NOT IMPLEMENTED · 🔵 FUTURE / V2 · ⚪ OUT OF SCOPE · ⚫ UNKNOWN.

## 1. Core CRM

| Feature | Status | Backend | Frontend | Database | API | Tests | Notes |
|---------|--------|---------|----------|----------|-----|-------|-------|
| Authentication | 🟢 | `routes/auth.ts`, `utils/jwt.ts` | `AuthContext.tsx` | `AuthSession` | `/auth/login, /refresh, /logout, /me` | `auth.test.ts`, `auth-integration.test.ts` | JWT access + httpOnly refresh cookie, rotation & reuse detection |
| Authorization / RBAC | 🟢 | `authz/*`, `policies/*` | role-gated UI | `Role`, `Permission`, `RolePermission`, `EmployeePermissionOverride` | `requireAuthz` guard | `rbac.test.ts`, `authorization.test.ts`, `mutationAuthorization.test.ts` | `can()` engine; MD=all perms |
| Users / Employees | 🟢 | `routes/employees.ts` | PWA admin UI | `Employee` | `/employees` CRUD, reset-password | `md-employees-isolation.test.ts` | sensitive-field filtering by `EMPLOYEES_VIEW_SENSITIVE` |
| Roles | 🟢 | seeded from shared | — | `Role` (11 roles) | — | `rbac.test.ts` | no Channel Partner role |
| Permissions | 🟢 | `packages/shared` (84) | — | `Permission` (84) | — | `rbac.test.ts` | ⚠️ older reports claim “~145”; **actual count = 84** (verified) |
| Companies | 🟢 | `Company` model, seed | — | `Company` | — | — | multi-tenant isolation |
| Customers | 🟢 | `customer.service.ts` | PWA | `Customer` | `/customers` | `phase3-customer.test.ts` | KYC encrypted |
| Leads | 🟢 | `lead.service.ts` | PWA | `Lead`, `LeadActivity` | `/leads` | `leads.test.ts`, `phase4-lead-engine.test.ts` | statuses/sources below |
| Lead lifecycle | 🟢 | `lead.workflow.ts` | — | Lead.status | — | `phase4-lead-engine.test.ts` | NEW→…→WON/LOST |
| Lead assignment | 🟢 | `distributionService.ts` | — | Lead.assigned_to_id, assignment_type | `/leads/distribution-monitor` | `packet12-1-attribution.test.ts` | performance-weighted / manual / PM-pref |
| Lead source / UTM | 🟢 | service | — | source, campaign, utm_* | — | — | source enum incl. WEBSITE |
| Opportunities | 🟢 | `opportunity.service.ts`, `opportunity.workflow.ts` | PWA | `Opportunity`, `OpportunityHistory` | `/opportunities` | `opportunities.test.ts`, `opportunity-pipeline.test.ts` | stages + pipeline/conversion metrics |
| Projects | 🟢 | `project.service.ts` | PWA | `Project` | `/projects` | `projects.test.ts` | status enum |
| Properties | 🟢 | `property.service.ts`, `property.workflow.ts` | PWA | `Property`, `PropertyImage`, `PropertyVerificationLog`, `PropertyPublication` | `/properties` | `properties.test.ts`, `wr1-*.test.ts` | publish/verify/approve flow |
| Property inventory | 🟢 | service | — | Property + Booking lock | — | `packet3-opp-booking.test.ts` | `locked_by_booking_id`, `locked_until` |
| Site visits | 🟢 | `siteVisit.service.ts` | PWA | `SiteVisitBooking` | `/site-visits` | `phase4-site-visits.test.ts`, `siteVisits.test.ts` | lifecycle verified |
| Bookings | 🟢 | `booking.service.ts` | PWA | `Booking` | `/bookings` | `packet3-opp-booking.test.ts`, `booking-concurrency.test.ts` | property lock; handoff |
| Payments | 🟢 | `payment.service.ts` | PWA | `Payment` | `/payments` | `payment-sync.test.ts`, `packet4-installments.test.ts` | status; Portal sync |
| Collections | 🟡 | payments + installments | PWA | `Installment` | `/installments` | `packet4-installments.test.ts` | no dedicated collections app module |
| Documents | 🟢 | `document.service.ts` | PWA | `Document` | `/documents` | `documents.test.ts` | verify/archive/restore |
| KYC | 🟢 | `kyc.service.ts` | — | Customer KYC fields + Document KYC types | `/customers/:id/kyc`, `/integration/portal/kyc-callback` | `kyc-bridge.test.ts`, `kyc-callback.test.ts` | encrypted at rest |
| Tasks | 🟢 | `routes/tasks.ts` | PWA | `Task` | `/tasks` | `tasks-sla.test.ts`, `tasks-sla-read.test.ts` | overdue auto-flip |
| SLA | 🟢 | `task-sla.status.ts` | — | Task.target_date/completed_at | `/tasks/:id/sla` | `tasks-sla*.test.ts` | derived status |
| Escalation | 🟡 | task overdue → MD alert | — | Notification | — | `tasks-sla.test.ts` | task-specific; not generic |
| Notifications | 🟡 | `notification.service.ts` | PWA | `Notification`, `PushSubscription`, `CustomerNotification` | `/notifications`, `/push`, `/integration/portal/customer-notifications` | `customer-notifications.test.ts` | employee in-app + web push; portal read-only |
| Audit events | 🟢 | `AuditEvent` writes | — | `AuditEvent` | `/admin/audit-logs`, `/admin/security-alerts` | `auth.test.ts` | LOGIN, SECURITY_ALERT, TASK_COMPLETED, etc. |
| Reporting | 🟢 | `/reports`, `analytics.service.ts` | PWA | `DailyReport`, `DailyTarget`, `PerformanceSnapshot` | `/reports/daily`, `/analytics/kpis`, `/md/executive-metrics` | `analytics-routes.test.ts`, `performance-*.test.ts` | MD + per-role |
| Dashboards | 🟡 | analytics KPIs | `AnalyticsHub.tsx` | — | `/analytics/kpis` | `analytics-routes.test.ts` | MD dashboard exists; role dashboards partial |
| Search | 🟡 | `matchingEngine.ts` | — | — | lead `/leads/:id/matches` only | `phase8.test.ts` | **no public search endpoint** |
| Public property API | 🟢 | `routes/public.ts` | — | — | `/public/:brand/properties|projects` | `public-project-api.test.ts`, `wr5-*.test.ts`, `public-property-detail.test.ts` | API-key, brand-scoped, allowlist |
| Public lead capture | 🟢 | `routes/public.ts` | — | `Lead` (creator nullable) | `POST /public/:brand/leads` | `phase1-public-boundary.test.ts` | source=WEBSITE |
| Brand separation | 🟢 | public brand routing; `brand_type` | — | Property.brand_type, Company.property_type_group | `/public/:brand/*` | `wr1-public-safety.test.ts` | rrh / sonthillu |
| Company isolation | 🟢 | `dataScope.ts`, `can()` | — | company_id FK everywhere | — | `dataScope.test.ts`, `phase2-security.test.ts` | ADMIN bypass intended |

## 2. Status enums (verified)

| Domain | Enum values (source: `prisma/schema.prisma`) |
|--------|-----------------------------------------------|
| Lead.status | NEW, ASSIGNED, CONTACTED, QUALIFIED, SITE_VISIT_SCHEDULED, NEGOTIATION, WON, LOST, RECOVERED_TO_POOL |
| Lead.source | MANUAL_ENTRY, BULK_UPLOAD, WEBSITE, FACEBOOK_ADS, GOOGLE_ADS, WALK_IN, REFERRAL |
| Opportunity.stage | PROSPECT_QUALIFIED, REQUIREMENT_CAPTURED, PROPERTY_SHORTLISTED, SITE_VISIT_PLANNED, SITE_VISIT_COMPLETED, PROPERTY_INTEREST_CONFIRMED, NEGOTIATION, BOOKING_INITIATED, BOOKED, DROPPED |
| Property.status | PENDING_VERIFICATION, PENDING_DM_POLISH, PENDING_MD_APPROVAL, LIVE, REJECTED, LOCKED, BOOKED, SOLD |
| Property.category | APARTMENT, INDEPENDENT_HOUSE, DUPLEX, INDEPENDENT_FLOOR, VILLA, PENTHOUSE, STUDIO, PLOT, FARM_HOUSE, AGRICULTURAL_LAND |
| Property.brand_type | SONTHILLU, RADHA_REAL_HOMES |
| SiteVisitBooking.status | PENDING_VERIFICATION, CONFIRMED, ASSIGNED_TO_AGENT, COMPLETED, RESCHEDULED, CANCELLED |
| Booking.status | INITIATED, PENDING, TOKEN_RECEIVED, CONFIRMED, REGISTERED, COMPLETED, CANCELLED (default PENDING) |
| Payment.status / method | PENDING, SUCCESS, FAILED, REFUNDED · CASH, CHEQUE, BANK_TRANSFER, ONLINE |
| Installment.status | PENDING, PARTIALLY_RECEIVED, RECEIVED, OVERDUE, CANCELLED |
| Customer.status | ACTIVE, INACTIVE, BLACKLISTED |
| Complaint.status / priority / closure | OPEN, IN_PROGRESS, RESOLVED, CLOSED, REOPENED · LOW, MEDIUM, HIGH · RESOLVED, CUSTOMER_UNSATISFIED, NOT_APPLICABLE, CUSTOMER_WITHDRAWN |
| Document.verification_status | PENDING (+ VERIFIED/REJECTED via verify flow) |
| ExpenseRefund.status | PENDING, ACCOUNTANT_APPROVED, MD_APPROVED, REFUNDED, REJECTED_BY_ACCOUNTANT, REJECTED_BY_MD |
| Project.status | PLANNING, UNDER_CONSTRUCTION, COMPLETED, CANCELLED |

## 3. AI-related feature status (Phase 17-A)

| Feature | Status | Notes |
|---------|--------|-------|
| `AIProvider` interface + mock provider | 🟢 | `services/ai/provider.ts`, `mockProvider.ts` |
| Gateway (timeout + bounded retry + normalized errors) | 🟢 | `services/ai/gateway.ts` |
| Config abstraction (`AIConfig`) | 🟢 | `services/ai/config.ts` (disabled by default) |
| SearchIntent JSON contract + validation | 🟢 | `services/ai/searchIntent.ts` |
| Redaction, context builder, cost/audit hooks | 🟢 | `services/ai/*` |
| HTTP AI-search route | 🔴 | **no route mounted** in `server.ts`; wiring exists only in tests |
| Live provider (OpenAI/OpenRouter) adapter | 🔴 | mock only; SDKs declared but unused |
| CRM deterministic consumer of SearchIntent | 🔴 | `matchingEngine.ts` exists but is **not** called from an AI-search flow |

See [CRM-AI-ARCHITECTURE](CRM-AI-ARCHITECTURE.md).
