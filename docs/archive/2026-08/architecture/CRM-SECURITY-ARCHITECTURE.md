# CRM-SECURITY-ARCHITECTURE

> Authentication, authorization, company isolation, RBAC, audit, and security boundaries
> for RRH-CRMS, verified against source. Each control is classified:
> 🟢 **Implemented** · 🟡 **Partially implemented** · 🔴 **Missing** · 🔵 **Recommended future hardening**.

## 1. Authentication (authN)

| Control | Status | Detail (source) |
|---------|--------|-----------------|
| Password hashing | 🟢 | `bcryptjs` bcrypt (cost 12) — `server.ts` seeding, `routes/auth.ts` |
| Access token (JWT) | 🟢 | `generateAccessToken` (`utils/jwt.ts`); short-lived Bearer |
| Refresh token | 🟢 | `generateRefreshToken`; httpOnly cookie `refreshToken`, `secure` in production, `sameSite=lax` |
| Refresh rotation | 🟢 | every refresh mints a new token + new `AuthSession` row |
| Refresh reuse detection | 🟢 | reused/hashed token → revoke family + `TOKEN_FAMILY_REVOKED` security alert |
| Refresh hashing at rest | 🟢 | `sha256(refreshToken)` stored in `AuthSession.refresh_token_hash` |
| Session expiry | 🟢 | 7-day refresh expiry (`AuthSession.expires_at`) |
| Service-to-service token | 🟢 | `authenticateServiceToken` validates Bearer vs `PORTAL_CRM_SECRET` with `crypto.timingSafeEqual` (constant-time) |
| Public API key | 🟢 | `PublicApiKey` resolved by `authenticatePublicKey` → `req.apiKeyContext.company_id` |
| Production secret enforcement | 🟢 | fail-fast boot if `JWT_*` / `ENCRYPTION_KEY` missing/short |
| MFA / OTP / SSO | 🔴 | not implemented (no evidence in source) |
| Password policy (strength) | 🟡 | default-reset flow exists; complexity enforcement not verified |
| Account lockout / throttling | 🟡 | `loginRateLimiter` present; permanent lockout not implemented |

## 2. Authorization (authZ) & RBAC

| Control | Status | Detail (source) |
|---------|--------|-----------------|
| RBAC model | 🟢 | `Role`, `Permission`, `RolePermission`, `EmployeePermissionOverride` |
| Canonical permission list | 🟢 | `Permissions` in `packages/shared` — **84** permissions (⚠️ older docs claim ~145) |
| Role→permission matrix | 🟢 | `RolePermissionsMatrix`; MD = all; seeded into DB by `prisma/seed.ts` |
| Per-employee overrides | 🟢 | `EmployeePermissionOverride` (grant/deny) applied at login |
| Central authorization engine | 🟢 | `can(user, action, resource)` (`authz/authorization.ts`) |
| Route guard | 🟢 | `requireAuthz(Permission, getResource?)` (`middleware/authz.ts`) |
| Object-level policies | 🟢 | `ProjectPolicy, LeadPolicy, PropertyPolicy, SiteVisitPolicy, ExpenseRefundPolicy, TaskPolicy, DocumentPolicy, KycPolicy` |
| Legacy guards | 🟡 | `requireRole`/`requirePermission` still used on several routes (opportunities, site-visits, admin, attendance) |
| Row-level security in queries | 🟡 | data-scope builders exist for Lead/Project/Property/Customer/Employee; other domains rely on service-level checks |

## 3. Company / tenant isolation

| Control | Status | Detail (source) |
|---------|--------|-----------------|
| Tenant FK everywhere | 🟢 | `company_id` on all tenant tables (`prisma/schema.prisma`) |
| Default cross-company deny | 🟢 | `can()` default: `resource.company_id !== user.companyId` → deny unless ADMIN |
| Data-scope builders | 🟢 | `buildLeadScope/buildProjectScope/buildCustomerScope/buildPropertyScope/buildEmployeeScope` |
| Management vs team scope | 🟢 | management = company-wide; telecaller/agent = own/team (downstream employee ids) |
| ADMIN bypass | 🟢 | intended global access (documented in WR-8) |
| Cross-tenant analytics isolation | 🟢 | `/analytics/kpis`, `/md/executive-metrics`, `/integration/metrics` derive `companyId` from `req.user` only |

## 4. Input validation & hardening

| Control | Status | Detail |

## 5. Audit & logging

| Control | Status | Detail |
|---------|--------|--------|
| Audit event model | 🟢 | `AuditEvent` (`actor_id, action, entity_type, entity_id, old_value, new_value`) |
| Security-sensitive events audited | 🟢 | login failure, invalid password, token-family revoked, task completed, attendance toggle, emergency lockdown |
| Admin audit read | 🟢 | `GET /admin/audit-logs` (ADMIN), `GET /admin/security-alerts` (ADMIN/MD) |
| Data-leakage indicators | 🟢 | `GET /admin/system-metrics` (recent errors, counts) |
| Structured logs / observability | 🔴 | only `console.*`; no log-shipping/observability platform |
| PII redaction in logs | 🔴 | not implemented (see AI redaction boundary which is separate) |

## 6. Data-at-rest protections

| Control | Status | Detail |
|---------|--------|--------|
| KYC encryption (PAN/Aadhaar) | 🟢 | AES-256-CBC via `utils/crypto.ts` with `ENCRYPTION_KEY` |
| Sensitive employee data gating | 🟢 | `EMPLOYEES_VIEW_SENSITIVE` strips PAN/Aadhaar/bank/salary from list responses |
| Passwords | 🟢 | bcrypt hash only, never stored plaintext |
| Refresh tokens | 🟢 | sha256 hash only at rest |
| Field-level encryption for other PII | 🟡 | only KYC fields; other PII (employee bank) stored plaintext but response-filtered |

## 7. Upload & public API security

| Control | Status | Detail |
|---------|--------|--------|
| Public allowlist (no GPS/status/seller) | 🟢 | `PUBLIC_PROPERTY_SELECT`/`PUBLIC_PROJECT_SELECT` exclude internal fields |
| Public image gating | 🟢 | only `status: 'APPROVED'` images exposed |
| Public brand restriction | 🟢 | URL `:brand` ∈ {rrh, sonthillu}; maps to `brand_type` |
| Public API key scoping | 🟢 | key → `company_id` (tenant) |
| Public read/write rate limits | 🟢 | `publicReadLimiter`, `publicWriteLimiter` |
| Public search endpoint | 🔴 | none (WR-7 gap) — properties list only |

## 8. Missing controls (🔴) & recommended hardening (🔵)

- 🔴 Global centralized error handler / consistent error envelope.
- 🔴 MFA, account lockout, password-strength policy.
- 🔴 Structured logging + observability (request IDs in logs, log retention).
- 🔴 Public search endpoint abuse controls (dedicated limiter when added).
- 🔵 Per-company API-key rotation & scopes.
- 🔵 Signed URLs / CDN for uploaded media.
- 🔵 Centralized authorization metadata audit (drift between `Permissions` and routes).
- 🔵 Admin JWT revocation broadcast (emergency lockdown currently only logs, per code comment).

> **AI security** is covered separately in [CRM-AI-ARCHITECTURE](CRM-AI-ARCHITECTURE.md#6-ai-security).

|---------|--------|--------|
| Request-body validation | 🟢 | `validateRequestBody(ZodSchema)`; `.strict()`/`.strip()` inbound |
| Numeric/range constraints | 🟢 | Zod refinements (positive ints, budget min≤max, etc.) |
| Upload limits & type allowlist | 🟢 | documents ≤10MB (jpg/jpeg/png/pdf/webp); expense proofs ≤5MB |
| Rate limiting | 🟢 | `express-rate-limit` (`rateLimiter.ts`): public read/write, login, per-resource |
| Security headers | 🟢 | `helmet` (`crossOriginResourcePolicy: same-site`) |
| CORS | 🟢 | `cors({ origin: APP_URL, credentials: true })` |
| Correlation ID | 🟢 | `correlationId` middleware |
| Error handling | 🟡 | per-route try/catch; **no global centralized error handler verified**; some `console.error` only |
| Body-size limits | 🟢 | `express.json()` default limit |
| IP allow-listing / abuse controls | 🔴 | not implemented |
