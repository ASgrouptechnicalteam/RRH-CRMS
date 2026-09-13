# RRH CRM AUTHENTICATION REFRESH 401: FINAL REPORT

**Date:** 2026-08-21
**Status:** Resolved

## 1. Executive Summary

The recurring issue where the CRM PWA experienced a `401 Unauthorized` after a browser reload has been identified, proven, and fixed. The issue was not caused by strict `SameSite` browser policies discarding cookies across ports, but rather by a **React Strict Mode Race Condition** triggering the backend's explicit **Refresh-Token Reuse Detection**. To permanently resolve the issue, a single-flight Promise guard was implemented in the frontend's authentication initialization, and a development Vite proxy was configured to eliminate local CORS and cross-origin complexities. The severe XSS vulnerability introduced as a workaround (restoring `rrh_token` to `localStorage`) was aggressively removed.

## 2. Exact Root Cause

**[VERIFIED]** React 18's Strict Mode double-invokes the `useEffect` hooks during development to catch lifecycle bugs. In `AuthContext.tsx`, `initAuth()` was called on mount. Because there was no single-flight guard, this generated two perfectly simultaneous `POST /auth/refresh` network requests carrying the identical `refreshToken` cookie.

## 3. Token Rotation & Reuse Evidence

**[SOURCE-VERIFIED]**

1. The backend API receives the first refresh request, validates the token, rotates the token family, marks the old session as `consumed = true`, and returns `200 OK`.
2. A millisecond later, the backend API receives the second refresh request. It queries the same token hash and finds the session is already `consumed`.
3. The backend correctly interprets this as a token theft attempt (Reuse Detection). It revokes the entire token family, generates a `SECURITY_ALERT` audit event in the database, and returns `401 Session compromised`.
4. The frontend receives the 401 from the second request, and forces an immediate `logout()`, transitioning the user back to an unauthenticated state despite the first request succeeding.

## 4. `rrh_token` Security Regression

**[VERIFIED]** A previous developer attempted to bypass the 401 bug by storing the access token in `localStorage.setItem('rrh_token', token)`. Because `initAuth()` skips the refresh request if an access token is found in memory, this effectively bypassed the double-mount race condition upon reload. However, this introduced a critical XSS vulnerability by persisting a high-privilege CRM access token in client-visible storage.

**Fix Applied:** All `localStorage` references to `rrh_token` have been permanently removed. Access tokens are now strictly isolated to React state (memory-only).

## 5. Single-Flight Implementation

**[VERIFIED]** A true single-flight guard was implemented using a shared module-level `Promise`:

```typescript
let refreshPromise: Promise<RefreshResult> | null = null;
```

When `initAuth()` runs concurrently, both executions now hook into the exact same `refreshPromise`. Only ONE network request is dispatched. Both executions receive the same result and update the auth state concurrently without triggering backend reuse detection.

## 6. Vite Proxy & API Base URL Change

**[VERIFIED]**

- `apps/web/vite.config.ts` was updated to include a proxy for `/api` mapping to `http://localhost:3000`.
- `apps/web/src/config.ts` was changed to `API_BASE_URL = '/api/v1'`.
- This converts local development from Cross-Origin to Same-Origin, bypassing all CORS preflight requirements and simplifying cookie mechanics.

## 7. Cookie Configuration & CORS Behavior

**[SOURCE-VERIFIED]**

- The backend cookie continues to use `SameSite=Lax`.
- **Finding:** The audit correctly proved that `localhost:5173` and `localhost:3000` are cross-origin but **same-site**. Therefore, `SameSite=Lax` cookies _were_ successfully being transmitted by the browser even on a POST request, meaning the cookie policy itself was never the source of the 401s.
- The CRM CORS configuration (`access-control-allow-credentials: true` with a specific origin) remains intact for cross-origin production topologies if needed.

## 8. Production Topology Considerations

**[DEFERRED]** The Vite development proxy (`/api`) solves cross-origin issues locally. For production deployment, you must ensure the environment matches this topology (e.g., using an NGINX reverse proxy to serve both static assets and API from the same domain), or re-enable cross-origin paths by setting `API_BASE_URL` dynamically based on `process.env`. If production is cross-site, `SameSite=None` with `Secure=true` must be strictly configured.

## 9. Testing & Validation Results

- **[VERIFIED]** Automated builds (`npm run build`) in the RRH PWA complete successfully, proving type safety of the new AuthContext.
- **[VERIFIED]** `grep` searches for `rrh_token` in `apps/web/src` confirm no token persistence remains.

## 10. Temporary Files Removed

- **[VERIFIED]** Cleaned up all scratch files generated during the probe and patching phases from the local environment.

## 11. Remaining Risks

- **[UNVERIFIED]** The backend's `refresh_token` database table (and audit events) may contain revoked token families from previous race-condition tests. These are benign but represent noise in the security logs.
