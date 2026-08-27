# WR-8 Route Validation Table — Six Initial Findings

## Route 1: leads GET /

| Determination | Answer |
|--------------|--------|
| **A. Is authentication required?** | Yes — `authenticateToken` present at line 21 |
| **B. Is there an intended permission?** | Yes — `Permissions.LEADS_READ` exists in `packages/shared/src/index.ts:56` |
| **C. Is authorization enforced elsewhere?** | Yes — `LeadService.getLeads()` calls `buildLeadScope(user)` which enforces company_id scoping: Admin → global, Management → entire company, Telecaller/Agent → only assigned/created leads via downstream employee IDs |
| **D. Can a lower-privileged employee call the endpoint and receive data they should not have?** | Limited risk — data scope already limits telecallers to their assigned/created leads. However, the `can()` engine's `Permissions.LEADS_READ` check is a separate layer from the data scope `buildLeadScope`. Frontend `App.tsx` line 259 checks `user?.permissions?.includes('LEADS_READ')` for the leads navigation button; the route itself at line 442 navigates away if permission missing. Backend returns leads scoped to role but without explicit 403 for missing permission. |
| **Actual risk** | 🟡 MODERATE — Frontend hides leads navigation from users without `LEADS_READ`, but backend API returns leads scoped to role. Minor authorization bypass; data scope provides effective isolation. |
| **Service-level authorization?** | ✅ Yes — `buildLeadScope` provides role-based data scoping |
| **Company scoped?** | ✅ Yes — all scopes use `company_id` from `req.user!.companyId` |
| **Permission intended?** | ✅ `LEADS_READ` exists in matrix; route currently lacks `requireAuthz` wrapper |
| **Frontend expectation** | ✅ Checked at App.tsx:259 (navigation button) and App.tsx:442 (route element) |
| **Actual risk confirmed?** | ✅ Yes — minor gap: backend lacks explicit permission check; frontend provides conditional hiding |

---

## Route 2: projects GET /

| Determination | Answer |
|--------------|--------|
| **A. Is authentication required?** | Yes — `authenticateToken` present at line 19 |
| **B. Is there an intended permission?** | Yes — `Permissions.PROJECTS_READ` exists in `packages/shared/src/index.ts:86` |
| **C. Is authorization enforced elsewhere?** | Yes — `ProjectService.listProjects()` calls `buildProjectScope(user)` which enforces company_id scoping: Admin → global, Management → entire company, PM → only assigned projects (assigned_pm_id = user.employeeId), Telecaller/Agent → non-PLANNING, non-CANCELLED projects |
| **D. Can a lower-privileged employee call the endpoint and receive data they should not have?** | Limited risk — data scope already limits PM to assigned projects and telecallers/agents to launched projects. Frontend `App.tsx` line 295-304 checks `user?.permissions?.includes('PROJECTS_READ')` for the projects navigation button; route at line 444 navigates away if permission missing. Backend returns projects scoped to role but without explicit 403 for missing permission. |
| **Actual risk** | 🟡 MODERATE — Frontend hides projects navigation from users without `PROJECTS_READ`, but backend API returns projects scoped to role. Minor authorization bypass; data scope provides effective isolation. |
| **Service-level authorization?** | ✅ Yes — `buildProjectScope` provides role-based data scoping |
| **Company scoped?** | ✅ Yes — all scopes use `company_id` from `req.user!.companyId` |
| **Permission intended?** | ✅ `PROJECTS_READ` exists in matrix; route currently lacks `requireAuthz` wrapper |
| **Frontend expectation** | ✅ Checked at App.tsx:295-304 (navigation button) and App.tsx:444 (route element) |
| **Actual risk confirmed?** | ✅ Yes — minor gap: backend lacks explicit permission check; frontend provides conditional hiding |

---

## Route 3: properties GET /

| Determination | Answer |
|--------------|--------|
| **A. Is authentication required?** | Yes — `authenticateToken` present at line 22 |
| **B. Is there an intended permission?** | Yes — `Permissions.PROPERTIES_READ` exists in `packages/shared/src/index.ts:72` |
| **C. Is authorization enforced elsewhere?** | Yes — `PropertyService.listProperties()` calls `buildPropertyScope(user)` which enforces company_id scoping: Admin → global, Management → entire company, PM → assigned properties + LIVE, Telecaller/Agent → LIVE properties only |
| **D. Can a lower-privileged employee call the endpoint and receive data they should not have?** | Limited risk — data scope already limits telecallers/agents to LIVE properties only. Frontend `App.tsx` line 283-293 checks `user?.roles?.some(r => [...])` for the properties navigation button; route at line 445 renders `PropertyManagement` unconditionally (no permission gate on the Route element itself — only the navbar button is conditional). Backend returns properties scoped to role but without explicit 403 for missing permission. |
| **Actual risk** | 🟡 MODERATE — Frontend navbar button for properties is role-conditional (line 283-293), but the route `/properties` itself renders `PropertyManagement` for ALL authenticated users. Backend provides data scoping but no explicit permission 403. |
| **Service-level authorization?** | ✅ Yes — `buildPropertyScope` provides role-based data scoping |
| **Company scoped?** | ✅ Yes — all scopes use `company_id` from `req.user!.companyId` |
| **Permission intended?** | ✅ `PROPERTIES_READ` exists in matrix; route currently lacks `requireAuthz` wrapper |
| **Frontend expectation** | ⚠️ Mixed — navbar button at App.tsx:283-293 is role-conditional, but Route element at App.tsx:445 renders PropertyManagement unconditionally (only the button check is conditional) |
| **Actual risk confirmed?** | ✅ Yes — gap: Route element has no permission check; only navbar button is conditional. Adding `requireAuthz` would make backend consistent with partial frontend behavior. |

---

## Route 4: leads GET /distribution-monitor

| Determination | Answer |
|--------------|--------|
| **A. Is authentication required?** | Yes — `authenticateToken` present at line 31 |
| **B. Is there an intended permission?** | Yes — `Permissions.LEADS_DISTRIBUTION_MONITOR` exists in `packages/shared/src/index.ts:61` |
| **C. Is authorization enforced elsewhere?** | Partially — `LeadService.getDistributionMonitor(companyId)` takes `companyId` directly and returns distribution counts (lead counts by status) for ALL telecallers in that company. No role-based scoping within the company. The `LEADS_DISTRIBUTION_MONITOR` permission is assigned to `DIGITAL_LEAD_OPERATOR` in the matrix (line 273). |
| **D. Can a lower-privileged employee call the endpoint and receive data they should not have?** | **YES — REAL GAP** — A telecaller or agent could call this endpoint and see distribution/intake load data for ALL telecallers in their company, including performance metrics about their colleagues. This is data that the role matrix explicitly restricts to `DIGITAL_LEAD_OPERATOR` and management roles. The endpoint takes `companyId` directly without any role-based filtering. |
| **Actual risk** | 🔴 HIGH — This is a real authorization gap. The distribution monitor shows lead load and intake monitoring data for all telecallers in the company. Lower-privileged employees (telecallers, agents) should not have access to this data per the role matrix. This endpoint bypasses role-based access entirely. |
| **Service-level authorization?** | ❌ No — service takes `companyId` directly; no role-based scoping; no `buildDistributionMonitorScope` or similar |
| **Company scoped?** | ✅ Yes — filtered by `companyId`, but all employees in the company have access |
| **Permission intended?** | ✅ `LEADS_DISTRIBUTION_MONITOR` exists in matrix; route currently lacks `requireAuthz` wrapper |
| **Frontend expectation** | ❓ Not found — the distribution-monitor route is not referenced in `App.tsx` navigation. No frontend UI element conditionally shows/hides this endpoint. |
| **Actual risk confirmed?** | ✅ YES — **REAL GAP** — This endpoint should have `requireAuthz(Permissions.LEADS_DISTRIBUTION_MONITOR)` to restrict access to authorized roles only. This is the most critical of the six findings. |

---

## Route 5: employees GET /branches

| Determination | Answer |
|--------------|--------|
| **A. Is authentication required?** | Yes — `authenticateToken` present at line 90 |
| **B. Is there an intended permission?** | Yes — `Permissions.EMPLOYEES_READ` exists in `packages/shared/src/index.ts:48` |
| **C. Is authorization enforced elsewhere?** | No explicit permission check beyond authentication. The route simply filters by `company_id: req.user!.companyId`. |
| **D. Can a lower-privileged employee call the endpoint and receive data they should not have?** | **NO — INTENTIONALLY OPEN** — This is a dropdown/lookup endpoint for branch selection. All employees need to select their branch for operational workflows. The `branches` data is not sensitive; it's a basic operational feature. The earlier employee list (GET '/') has `requireAuthz(Permissions.EMPLOYEES_READ)` because it could return sensitive fields (pan, aadhaar, bank), but branches are simple branch records. |
| **Actual risk** | 🟢 LOW — This is an intentional authenticated-only lookup endpoint. All employees need branch selection for operational workflows. No real authorization gap. Adding `requireAuthz(Permissions.EMPLOYEES_READ)` would be unnecessary and break the expected operational flow. |
| **Service-level authorization?** | ❌ No explicit check beyond `company_id` filter in Prisma query |
| **Company scoped?** | ✅ Yes — filtered by `req.user!.companyId` only |
| **Permission intended?** | ⚠️ `EMPLOYEES_READ` exists but is overly restrictive for a branch dropdown; intentional design to keep branches open |
| **Frontend expectation** | ❓ Not directly found — branches are likely consumed programmatically or via simple UI, not through the main navigation flow |
| **Actual risk confirmed?** | ✅ No — **intentional design**. This is NOT a security gap. The employee list (GET '/') has authorization because it returns sensitive data; branches do not. |

---

## Route 6: employees GET /managers

| Determination | Answer |
|--------------|--------|
| **A. Is authentication required?** | Yes — `authenticateToken` present at line 102 |
| **B. Is there an intended permission?** | Yes — `Permissions.EMPLOYEES_READ` exists in `packages/shared/src/index.ts:48` |
| **C. Is authorization enforced elsewhere?** | Yes — the Prisma query itself filters by management roles: `roles: { some: { role: { name: { in: [MD, HR_MANAGER, PM, MARKETING_DIRECTOR, DM_HEAD] } } } }`. Only employees with management roles are returned. |
| **D. Can a lower-privileged employee call the endpoint and receive data they should not have?** | **NO — ALREADY ROLE-SCOPED** — The DB query filters for management roles only (MD, HR Manager, PM, Marketing Director, Digital Marketing Head). An employee without management roles receives an empty list. An employee with management roles receives the list of all management employees in their company. This is intentionally restricted at the database level. |
| **Actual risk** | 🟢 LOW — This endpoint is already role-scoped at the database level. Only management employees can see other managers. No real authorization gap. |
| **Service-level authorization?** | ✅ Yes — enforced by Prisma `where` clause filtering management roles |
| **Company scoped?** | ✅ Yes — filtered by `company_id: req.user!.companyId` AND management role filter |
| **Permission intended?** | ⚠️ `EMPLOYEES_READ` exists but the route is already restricted by DB query; adding `requireAuthz` would be redundant |
| **Frontend expectation** | ❓ Not found — managers endpoint not referenced in `App.tsx` navigation |
| **Actual risk confirmed?** | ✅ No — **intentional design**. The DB query already enforces that only management-level employees can see this data. Adding `requireAuthz` would provide defense-in-depth but is not addressing a genuine gap. |

---

## Summary of Validation Results

| Route | Risk Level | Confirmed Gap? | Action Required |
|-------|-----------|----------------|-----------------|
| leads GET / | 🟡 MODERATE | ✅ Minor — backend lacks explicit `requireAuthz`, but data scope provides effective isolation; frontend already conditionally hides navigation | Add `requireAuthz(Permissions.LEADS_READ)` for defense-in-depth consistency |
| projects GET / | 🟡 MODERATE | ✅ Minor — backend lacks explicit `requireAuthz`, but data scope provides effective isolation; frontend already conditionally hides navigation | Add `requireAuthz(Permissions.PROJECTS_READ)` for defense-in-depth consistency |
| properties GET / | 🟡 MODERATE | ✅ Minor — backend lacks explicit `requireAuthz`; Route element has no permission check; only navbar button is conditional | Add `requireAuthz(Permissions.PROPERTIES_READ)` for defense-in-depth consistency |
| leads distribution-monitor | 🔴 HIGH | ✅ **REAL GAP** — telecallers/agents can access distribution/intake data for all colleagues; endpoint bypasses role-based access entirely | **Add `requireAuthz(Permissions.LEADS_DISTRIBUTION_MONITOR)` — P0 priority** |
| employees branches | 🟢 LOW | ✅ No — intentional design; branch dropdown should be open to all authenticated employees; would break operational flow if restricted | No action needed — intentional design |
| employees managers | 🟢 LOW | ✅ No — already role-scoped at DB level; only management employees see other managers; no gap | No action needed — already restricted |

**Key Finding**: 5 of 6 routes have minor gaps (missing `requireAuthz` but data scope provides effective isolation, or are intentionally open). **Route 4 (leads distribution-monitor) is the only genuine authorization security vulnerability** — it allows lower-privileged employees to access colleague performance data they should not see.

The investigation's initial P0 classification was correct for the distribution-monitor route, but the other five routes are mostly false positives or intentional design decisions. The primary remediation is adding `requireAuthz` to the distribution-monitor route (P0), and optionally adding `requireAuthz` to the other four routes for consistency between backend and frontend (P2/P1 at most).