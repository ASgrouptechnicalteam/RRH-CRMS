# P8 Admin Login Redirect Loop — Root Cause & Remediation

## 1. Symptom

The local admin login page at `http://localhost:3000/admin/login` was caught in an infinite continuous refresh/redirect loop, completely locking out any attempt to authenticate.

## 2. Redirect Chain

1. Browser requests `/admin/login`
2. `src/middleware.ts` allows the request (explicitly bypassing its protection since it matches `/admin/login`).
3. Next.js App Router starts rendering the layout for the route tree.
4. It hits `src/app/admin/layout.tsx`.
5. `src/app/admin/layout.tsx` is a Server Component that runs `getAdminSession()`.
6. `getAdminSession()` returns `null` (since the user is not authenticated).
7. `layout.tsx` executes `redirect('/admin/login')`.
8. Browser receives a `307 Temporary Redirect` back to `/admin/login`.
9. The loop restarts from step 1.

## 3. Root Cause

The `src/app/admin/layout.tsx` file was placed at the root of the `/admin` folder, meaning its layout and authentication requirements (and redirects) were inherited by **all** child routes, _including_ the `/admin/login` route. As a result, the login page itself became a protected route requiring an existing authenticated session.

## 4. Affected Files & Folders

- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- All other `src/app/admin/*` directories except `login`

## 5. Fix (Architectural Route Restructure)

To resolve this without weakening server-side authorization or removing middleware, the App Router directory was safely restructured using a Next.js **Route Group**:

- Created `src/app/admin/(protected)`
- Moved `layout.tsx`, `page.tsx`, and all protected admin modules (`overview`, `content`, `leads`, etc.) into `(protected)`.
- Left `login` at `src/app/admin/login` directly.

**New Architecture:**

```text
/admin/login
  → public login page (no inherited protected layout)

/admin/(protected)
  → protected admin layout
  → server-side requireAdmin() logic via layout.tsx
```

## 6. Security Impact

- **Middleware:** Remains fully active. It correctly ignores `/admin/login` but protects all other `/admin/*` routes as a first line of defense.
- **Server Authorization:** Remains fully active. `src/app/admin/(protected)/layout.tsx` authoritatively validates the session via Prisma and provides Role-Based Access Control (RBAC).
- **No Weakening:** No fake sessions, client-side hacks, or disabled protections were introduced.

## 7. Final Verification

- ✅ `/admin/login` renders without an authenticated session (HTTP 200 OK).
- ✅ `/admin` no longer infinitely redirects; it redirects precisely once to `/admin/login`.
- ✅ Existing sessions reach `/admin/overview` correctly.
- ✅ Invalid credentials remain on the login page securely.
- ✅ `npm run build`, `npm run typecheck`, and `npm run lint` all passed successfully.

**Status:** FIXED.
