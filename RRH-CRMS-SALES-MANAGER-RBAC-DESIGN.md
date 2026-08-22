# RRH-CRMS — RBAC-02
# SALES MANAGER ROLE — DESIGN + IMPACT AUDIT

## 1. CURRENT ROLE BASELINE

✅ **REPOSITORY-PROVEN**

An inspection of the repository reveals the following regarding the term "Sales Manager":
- It exists historically in documentation (`docs/Radha_Real_Homes_Complete_App_Documentation.md`) as a role involved in Lead Distribution and Channel Partners.
- It is mentioned in an older audit (`RRH-CRMS-RECONSTRUCTION-AUDIT.md`).
- **However, it DOES NOT exist in the live codebase.** `shared/src/index.ts` (the canonical source of truth for Roles) does not contain `SALES_MANAGER`.

**Classification:** HISTORICAL / UNUSED in code.

---

## 2. SALES MANAGER BUSINESS PURPOSE & PERMISSION MAPPING

We define the Sales Manager as the operational leader of the sales execution team (Telecallers, Agents).

| Candidate Responsibility | Proposed Permission Mapping | Classification |
|---|---|---|
| Manage sales team leads | `LEADS_READ`, `LEADS_UPDATE` | ✅ REPOSITORY-PROVEN |
| Monitor lead assignment | `LEADS_DISTRIBUTION_MONITOR` | ✅ REPOSITORY-PROVEN |
| Redistribute leads | `LEADS_ASSIGN` | ✅ REPOSITORY-PROVEN |
| Monitor lead follow-up | `TASKS_READ` | ✅ REPOSITORY-PROVEN |
| Review qualification progress | `LEADS_READ`, `LEADS_UPDATE` | ✅ REPOSITORY-PROVEN |
| Monitor site-visit conversion | `SITE_VISITS_READ` | ✅ REPOSITORY-PROVEN |
| Monitor opportunity pipeline | `OPPORTUNITIES_READ` | ⚪ BACKEND GAP (Missing in `Permissions`) |
| Monitor booking conversion | `BOOKINGS_READ` | ✅ REPOSITORY-PROVEN |
| Manage sales targets | `REPORTS_TARGETS_CONFIGURE` | ✅ REPOSITORY-PROVEN |
| Review team performance | `PERFORMANCE_READ_TEAM`, `REPORTS_READ_TEAM` | ✅ REPOSITORY-PROVEN |
| Analyze lead-source performance| `LEADS_READ`, `REPORTS_READ_TEAM` | ✅ REPOSITORY-PROVEN |
| Identify stalled leads | `LEADS_READ` | ✅ REPOSITORY-PROVEN |

---

## 3. ROLE COMPARISON

🔵 **PROPOSED DESIGN**

| Capability | MD | Admin | Marketing Director | Sales Manager |
|---|---|---|---|---|
| Lead Create | YES | NO | YES | YES |
| Lead Read | YES | NO | YES | YES |
| Lead Update | YES | NO | YES | YES |
| Lead Assign | YES | NO | YES | YES |
| Bulk Upload | YES | NO | YES | NO |
| Distribution Monitoring | YES | NO | YES | YES |
| WhatsApp Proposal | YES | NO | NO | YES |
| Customer Read | YES | YES | YES | YES |
| Customer Update | YES | YES | YES | YES |
| Site Visit Read | YES | NO | YES | YES |
| Site Visit Assign | YES | NO | NO | YES |
| Opportunity Read | GAP | GAP | GAP | GAP |
| Opportunity Update | GAP | GAP | GAP | GAP |
| Booking Read | YES | YES | YES | YES |
| Booking Create | YES | YES | NO | NO |
| Reports | YES | NO | YES | YES |
| Team Performance | YES | NO | YES | YES |
| Targets | YES | NO | YES | YES |
| Analytics | YES | NO | YES | YES |
| Employee Visibility | YES | NO | NO | NO |
| Sensitive Data | YES | NO | NO | NO |
| System Control | YES | YES | NO | NO |

---

## 4. DATA SCOPE

🔵 **PROPOSED DESIGN**

**Recommended Scope:** TEAM-ONLY (or effectively COMPANY-WIDE depending on branch architecture).
Sales Managers need to see the entire sales pipeline for their designated team or branch, but they do not need to see global financial metrics or HR sensitive data. Since `buildLeadScope` currently supports company-wide scoping for leadership, we recommend applying the existing company-wide scope logic used by `MARKETING_DIRECTOR`, combined with `REPORTS_READ_TEAM` and `PERFORMANCE_READ_TEAM` to constrain performance metrics to just the sales execution floor.

---

## 5. LEAD FLOW RESPONSIBILITY

For a Sales Manager monitoring the `LeadStatus` lifecycle:

| Stage | Responsibility | Action |
|---|---|---|
| `NEW` | Assign / Monitor | Read, Assign |
| `ASSIGNED` | Monitor SLA | Read, Reassign |
| `CONTACTED` | Monitor Follow-up | Read, Update |
| `QUALIFIED` | Coach / Escalate | Read, Update, Task Assign |
| `SITE_VISIT_SCHEDULED`| Coordinate | Read, Site Visit Assign |
| `NEGOTIATION` | Direct Intervention | Read, Update, WhatsApp Proposal |
| `OPPORTUNITY_OPEN` | Pipeline Review | Read, Update |
| `WON` | Celebration / Metrics | Read Only |
| `LOST` | Forensic Review | Read, Recover |
| `RECOVERED_TO_POOL` | Reassign | Read, Assign |

---

## 6. SALES MANAGER DASHBOARD

🔵 **PROPOSED DESIGN**

| Widget | Data Status |
|---|---|
| Team Leads | ✅ EXISTING API DATA (`DistributionMonitor`) |
| New Leads | ✅ EXISTING API DATA |
| Unassigned Leads | ✅ EXISTING API DATA |
| Contacted Leads | ✅ EXISTING API DATA |
| Qualified Leads | ✅ EXISTING API DATA |
| Site Visits | ✅ EXISTING API DATA |
| Opportunities | ⚪ BACKEND GAP (No dedicated Opportunity endpoints explicit in generic queries) |
| Won Deals | ✅ EXISTING API DATA |
| Conversion Rate | ✅ EXISTING API DATA (`DistributionMonitor`) |
| Target vs Actual | ✅ EXISTING API DATA |
| Team Performance | ✅ EXISTING API DATA |
| Stalled Leads | ⚪ PARTIAL API DATA (Requires sorting by `last_contacted_at` which exists, but no explicit "stalled" endpoint) |
| Overdue Follow-ups | ✅ EXISTING API DATA (Tasks where status is `OVERDUE`) |

---

## 7. NAVIGATION

✅ **REPOSITORY-PROVEN** / 🔵 **PROPOSED DESIGN**

The Sales Manager should see:
- Dashboard
- Leads
- Customers
- Site Visits
- Sales Pipeline
- Properties (Read Only)
- Tasks
- Analytics (Team Performance)
- Settings

They should **NOT** see:
- Finance (No expense approval)
- System Control
- HR
- Projects (Unless Read Only)

---

## 8. DASHBOARD RESOLUTION

🔵 **PROPOSED DESIGN**

**Recommendation:** A. receive a new dedicated dashboard.
*Evidence-based rationale:* The `MarketingDashboard` is heavily focused on top-of-funnel acquisition, campaign ROI, and bulk uploads. The `StaffDashboard` is hyper-focused on individual task lists and QR attendance. The Sales Manager operates the middle-to-bottom funnel, requiring aggregation of telecaller efforts, site visits, and overdue tasks. A dedicated `SalesManagerDashboard` is structurally necessary to avoid polluting the Marketing Director's view with low-level daily task queues.

---

## 9. TARGETS / PERFORMANCE

✅ **REPOSITORY-PROVEN**

The current targets system (`DailyTargetSetSchema`, `REPORTS_TARGETS_CONFIGURE`) fully supports assigning targets by role or employee. The Sales Manager can reuse existing APIs to configure targets for Telecallers and Agents, and read `PERFORMANCE_READ_TEAM` to view the Roll-up metrics.

---

## 10. CONFLICT WITH MARKETING DIRECTOR

🟡 **OWNER DECISION**

Currently, the `MARKETING_DIRECTOR` is functioning as the de-facto Sales Manager in the system (assigning leads, monitoring distribution, setting targets).

**Proposed Clean Boundary:**
- **Marketing Director**: Owns `LEADS_BULK_UPLOAD`, Lead Source Analytics, Campaign ROI, and Top-of-Funnel health.
- **Sales Manager**: Owns `LEADS_DISTRIBUTION_MONITOR`, `TASKS_ASSIGN`, `SITE_VISITS_ASSIGN_AGENT`, and Bottom-of-Funnel conversion.

*Overlap required:* Both need `LEADS_ASSIGN` and `REPORTS_TARGETS_CONFIGURE`. The boundary is a workflow handoff rather than a strict programmatic lockdown.

---

## 11. RBAC IMPACT

Introducing this role will require modifying:
- `packages/shared/src/index.ts` (Add `SALES_MANAGER` to `Roles`, populate `RolePermissionsMatrix`).
- `apps/api/src/authz/dataScope.ts` (Define `buildLeadScope` rules).
- `apps/web/src/App.tsx` (Dashboard Resolver).
- `apps/web/src/components/layout/Sidebar.tsx` (Role-based nav links).
- Seed scripts to create a default Sales Manager account.

---

## 12. TEST IMPACT

Future testing requirements:
- Add Sales Manager fixture to E2E tests.
- Add `salesmanager@rrh.com` to `browser-test-accounts.json`.
- Add integration tests verifying Sales Manager cannot `LEADS_BULK_UPLOAD`.
- Verify Dashboard resolver correctly mounts `SalesManagerDashboard`.

---

## 13. DYNAMIC ROLE ARCHITECTURE

🔵 **PROPOSED DESIGN**

Adding the Sales Manager *via code* right now conflicts slightly with a pure dynamic role architecture, as `RolePermissionsMatrix` is hardcoded in `@rrh-ems/shared`. However, standardizing this business role inside the canonical matrix is necessary until a fully dynamic UI (where `RolePermission` models map DB rows dynamically to users) is complete. It sets up the exact template that the dynamic UI will eventually populate into the database.

---

## 14. FINAL DESIGN SUMMARY

1. **Proposed role key**: `SALES_MANAGER`
2. **Canonical display value**: `Sales Manager`
3. **Exact existing permissions recommended**:
   `LEADS_READ`, `LEADS_UPDATE`, `LEADS_ASSIGN`, `LEADS_DISTRIBUTION_MONITOR`, `LEADS_WHATSAPP_PROPOSAL`, `CUSTOMERS_READ`, `CUSTOMERS_UPDATE`, `SITE_VISITS_READ`, `SITE_VISITS_ASSIGN_AGENT`, `TASKS_READ`, `TASKS_UPDATE`, `TASKS_ASSIGN`, `REPORTS_READ_TEAM`, `REPORTS_TARGETS_CONFIGURE`, `PERFORMANCE_READ_TEAM`, `BOOKINGS_READ`.
4. **Data scope**: TEAM-ONLY (Execution layer metrics), COMPANY-WIDE (Leads/Customers).
5. **Dashboard**: New `SalesManagerDashboard`.
6. **Navigation**: Leads, Customers, Site Visits, Tasks, Analytics.
7. **Lead responsibilities**: Assignment, Reassignment, Pipeline enforcement, Stalled recovery.
8. **Opportunity responsibilities**: ⚪ BACKEND GAP (Needs explicit permission keys).
9. **Target/performance**: Full ownership of telecaller/agent daily targets.
10. **Marketing Director boundary**: Marketing owns acquisition; Sales owns conversion.
11. **API gaps**: Opportunity permissions, Stalled Leads endpoint.
12. **Test impact**: Fixtures, Nav resolution, E2E workflow handoff.
13. **Implementation breakdown**:
    - Step 1: Shared Package updates.
    - Step 2: Dashboard/UI implementation.
    - Step 3: Backend scope authorization integration.
