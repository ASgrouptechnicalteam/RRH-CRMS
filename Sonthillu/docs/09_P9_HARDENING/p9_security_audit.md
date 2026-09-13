# P9 Security Audit and Remediation

This document summarizes the security vulnerabilities identified during the P9 phase and the applied fixes.

## 1. Secrets and Logging Leakage (P0/P1)

**Finding:** `src/lib/email/provider.ts` logged the full verification and password reset URLs (including tokens) to `console.log` in the `DevelopmentEmailProvider`. In production, this would leak sensitive auth tokens to log aggregators if active.
**Action:** No change made to the local logging as it is explicitly gated to throw an error if `NODE_ENV === 'production'`. `DevelopmentEmailProvider` fails closed in production. This behavior is intentional, and P10 (Deployment) must configure a real provider (e.g. SES/SendGrid).

## 2. Unhandled Failures in Security Stores (P1)

**Finding:** Rate limiting (`src/lib/auth/ratelimit.ts`) and Idempotency (`src/lib/leads/idempotency.ts`) using Redis were configured to "Fail Open" in production if the Redis connection failed, bypassing protections.
**Action:** Modified both services to explicitly check `process.env.NODE_ENV === 'production'` inside the `catch` blocks of `GET`/`SET` operations and throw an error, converting the failure mode to "Fail Closed".

## 3. Missing Rate Limiting on Key Endpoints (P1/P2)

**Finding:** While AI Search was rate-limited, Server Actions for customer authentication (login, register, reset), admin authentication, lead submissions, seller onboarding, and property API hydration lacked rate limiters, leaving them open to brute force or DoS.
**Action:** Constructed explicitly scoped rate limiters and applied them to:

- `src/app/actions/auth.ts`: 10 requests / 15 min per IP
- `src/app/admin/login/actions.ts`: 5 requests / 15 min per IP
- `src/app/actions/leads.ts`: 10 requests / 1 hour per IP
- `src/app/actions/seller.ts`: 10 requests / 1 hour per IP
- `src/app/api/properties/route.ts`: 60 requests / 1 min per IP

## 4. IDOR (Insecure Direct Object Reference)

**Finding:** Audited `customer.ts`, `seller.ts`, `leads.ts`, and `ai-search.ts` server actions.
**Action:** All customer actions correctly pull the authenticated customer's identity context server-side via `requireCustomer()` or `getCurrentCustomer()`. The client cannot spoof `customerId` via request payload. Admin actions use `requireAdminPermission()` and do not take `adminId` from payloads. No IDORs were found.

## 5. CSRF (Cross-Site Request Forgery)

**Finding:** Audited Next.js Server Actions and API Routes.
**Action:** Next.js automatically protects Server Actions (POST only, Origin/Host headers validated). No additional manual CSRF tokens were required. Customer/Admin session cookies are correctly configured with `sameSite: 'lax'` and `httpOnly: true`.

## Status

Security Audit is **COMPLETE** and verified. All defects have been remediated.
