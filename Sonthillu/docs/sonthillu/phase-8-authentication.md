# Packet 8 — Customer Authentication & Account Foundation

Secure, website-owned customer account and session boundary for the Sonthillu
Constructions website. This packet builds the **method-agnostic auth foundation**:
the account/session types, a server-side session boundary, protected routes, a
rate-limiting and privacy foundation, SEO handling, and a documented
authentication-method recommendation. The authentication method itself is a
**business decision that is not finalized** and is documented as blocked under
`# Questions`.

The website **owns** customer authentication and account data in its own Sonthillu
Website Database, fully separate from the RRH-CRMS (which stores properties,
projects, and leads). Shortlist / Compare persistence is **out of scope** (later
packets).

## 1. Authentication architecture

```
Browser (customer)
   │  httpOnly, Secure, SameSite=Lax session cookie (sonthillu_session)
   ▼
Next.js server / BFF (server components, server actions / route handlers)
   │  CustomerAuthProvider contract
   ▼
Sonthillu Website DB  (customers, sessions — separate from RRH-CRMS)
```

- **Sonthillu Website DB** owns `customers` + `sessions`. It is NOT the CRM.
- **RRH-CRMS** owns `properties`, `projects`, `leads`. The website never writes
  CRM records directly; website-owned customer activity (e.g. shortlist/compare in
  a later packet) lives in the Website DB and only references CRM property IDs.
- The server is the only place that reads/writes session secrets. Browser
  JavaScript never sees tokens or credentials; session cookies are `httpOnly`,
  `Secure`, `SameSite=Lax`, and no auth secrets ship in client props.
- The auth boundary is a **provider contract** (`CustomerAuthProvider`), not a
  hard-coded implementation, so the method and database can be swapped without
  touching the boundary.

## 2. Authentication-method decision

**Status: BLOCKED — business decision required (see `# Questions`).**

V1 recommendation (documented, not decided):

- **OTP-based, passwordless verification** — phone OTP via SMS (WhatsApp optional)
  as the primary flow, with an email OTP / magic-link fallback.
- Rationale: lowest friction for a mobile-first Indian residential-buyer audience;
  no password storage, reset, or reuse liability; aligns with a guest-first
  transition into shortlist/compare; a verified identifier (phone/email) is all a
  customer-owned account needs in V1.

Alternatives considered (not chosen):

| Method                      | Pros                                     | Cons                                                   |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| OTP (phone-first)           | Frictionless, no passwords, mobile-first | SMS cost, delivery reliability                         |
| Email magic link            | Zero SMS cost                            | Email deliverability, slower                           |
| Email + password            | Familiar, no per-message cost            | Password storage/reset liability, friction             |
| Social login (Google/Apple) | Convenient                               | Privacy/account-vendor coupling, requires OAuth config |

Until the decision is made, **no login/register flow is wired**: the `/login` and
`/register` pages render brand-consistent placeholder forms, the session boundary
returns `null` for anonymous customers, and protected routes redirect to `/login`.

## 3. Account data ownership

- **Website-owned**: customer identity, verified identifiers, account status,
  communication preferences, and (in later packets) shortlist/compare/activity.
- **CRM-owned**: property/project listings and lead records. The website may store
  **CRM property IDs** for customer activity but never copies authoritative
  property records into the Website DB.
- No customer↔CRM mapping is established without an approved API contract
  (documented in section 7).

## 4. Session model

- Opaque random session token; the server stores only a **hash** of the token in
  the Website DB (verification hashes in, never stores the raw token).
- Cookie: `sonthillu_session`; attributes `httpOnly`, `Secure`, `SameSite=Lax`,
  path `/` (see `src/lib/auth/brand.ts`). Session cookies are browser-invisible.
- TTL: default 30 days, capped at 90 days (`src/lib/auth/session-core.ts`).
  Expired or revoked sessions are treated as inactive; the boundary clears the
  cookie. Sessions are revoked on logout, account disable, or security event.
- Session rotation on sensitive operations (e.g. changing the verified identifier)
  is recommended once the provider is implemented.

## 5. Security model

- **No auth secrets in client JS**: tokens/credentials only on the server;
  session cookie is `httpOnly` + `Secure` + `SameSite=Lax`.
- **No sensitive session data in localStorage** — server session only. (The
  existing localStorage recently-viewed foundation is non-sensitive.)
- **Anonymous-first**: public browsing needs no login. `getCurrentCustomer()`
  returns `null` without a provider/cookie; `requireCustomer()` is used only on
  protected routes and redirects to `/login`.
- **IDOR protection**: the session always identifies the customer; resource
  ownership is asserted with `assertCustomerOwns(sessionCustomerId,
resourceOwnerCustomerId)` (`src/lib/auth/session-core.ts`) — never trust
  customer IDs from the browser.
- **Rate limiting** on auth endpoints (section 10).
- **Privacy-safe logging** (section 11).
- **SEO**: auth/account pages are `noindex` (section 8); account data never
  appears in public structured data or sitemaps.

## 6. Cross-brand isolation

- Sonthillu sessions are scoped to the Sonthillu brand
  (`BRAND_AUTH_SCOPE = 'sonthillu'`, cookie `sonthillu_session`). A Sonthillu
  session must never authenticate into readhrealhomeproperties.com, and vice versa.
- `src/lib/auth/brand.ts` centralizes scope/cookie naming
  (`brandSessionCookieName(scope)`), and the rate limiter uses brand-prefixed keys
  so brands never share buckets.
- Cross-brand links remain allowed (marketing), but auth context is separate.

## 7. CRM relationship

- The website owns auth; the CRM is **not** the login database.
- `src/lib/crm.ts` remains a read/lead BFF for properties/projects/leads. The
  previous CRM-assumption `Customer`/`access_token` model in `src/types/auth.ts`
  was replaced with the website-owned model; the unused `Customer` import was
  removed from `crm.ts`.
- A customer→CRM-lead linkage is future work and requires an approved API
  contract before any mapping is stored.

## 8. Protected routes & SEO

Protected (require a `Customer`; anonymous users are redirected to `/login`):

- `/account` — account home (email/phone/status, links to profile).
- `/account/profile` — minimal profile boundary (name/email/phone/communication
  preferences placeholder).

All auth/account pages declare `robots: { index: false, follow: false }`:

- `/login`, `/register`, `/account`, `/account/profile`.

Anonymous browsing remains fully supported; no login is forced on public routes.
The Header's existing `Login` buttons now navigate to `/login`.

## 9. Database model

**Status: BLOCKED — website-database decision required (see `# Questions`).**

Proposed (for the chosen Sonthillu Website DB, e.g. a Hostinger MySQL database):

```sql
customers (
  id BIGINT PK, display_name VARCHAR(80) NULL, email VARCHAR(254) NULL,
  phone VARCHAR(16) NULL, email_verified BOOLEAN, phone_verified BOOLEAN,
  status ENUM('ACTIVE','DISABLED','PENDING_VERIFICATION'),
  created_at, updated_at
)
sessions (
  id BIGINT PK, customer_id FK, token_hash CHAR(64) UNIQUE,
  created_at, expires_at, revoked_at NULL
)
```

No ORM or schema migration was added in this packet (no DB decision yet). The
auth boundary consumes the `CustomerAuthProvider` contract
(`src/types/auth.ts`), which a Prisma/ORM-backed implementation will satisfy.

## 10. Rate limiting

- `src/lib/auth/ratelimit.ts` provides a server-side sliding-window rate limiter
  with a pluggable `RateLimitStore` (default in-memory) and brand-prefixed keys.
- Required on auth endpoints (OTP send/verify, login, register, session refresh):
  e.g. 5 attempts per identifier per 15 minutes for OTP, with `retryAfterMs`
  backoff on block.
- V1 ships the in-memory limiter as the foundation. Production should back it
  with a shared store (e.g. Redis/DB) so limits hold across server instances;
  documented limitation.

## 11. Privacy & logging

- `src/lib/auth/privacy.ts` redacts sensitive keys (`password`, `token`,
  `access_token`, `refresh_token`, `session`, `otp`, `secret`, `api_key`, etc.)
  from log payloads before any logger sees them.
- Never log passwords, OTP codes, tokens, cookies, or session payloads.
- Log auth events (login success/failure, lockout) at minimal cardinality.

## 12. Test strategy

`src/lib/auth/auth.test.ts` (framework-free, deterministic):

- **Brand**: cookie-name scoping and cross-brand isolation.
- **Schemas**: identity/profile input validation (email, phone, display name,
  communication preferences).
- **Session lifecycle**: TTL clamping, expiry boundary, revocation, activity.
- **Authorization**: `assertCustomerOwns` ownership guard.
- **Rate limiting**: window allowance, blocking + retry-after, sliding window,
  reset, brand-prefix isolation.
- **Privacy**: sensitive-key redaction and case-insensitivity.

The Next server adapter (`src/lib/auth/session.ts`) is a thin wrapper over
`next/headers` + `next/navigation` and is exercised through the app routes, not
unit tests.

## 13. Open Questions

See `# Questions` at the end of this document.

## 14. Dependencies

- **Added in this packet**: none outside `src`. No ORM, no auth library, no DB
  migration.
- **Required for the auth method** (once decided, via an approved change):
  an SMS/OTP provider (e.g. WhatsApp Business / SMS gateway) or email provider for
  magic links, plus a Website DB + ORM (e.g. Prisma) implementation of
  `CustomerAuthProvider`.
- `.env`/`.env.example` continue to hold no secrets.

## 15. Future Shortlist / Compare integration

Later packets will add shortlist/compare persistence in the Sonthillu Website DB,
keyed by `customerId` (from the session) and referencing CRM property IDs. This
packet deliberately does **not** implement persistence:

- The session boundary (`getCurrentCustomer` / `requireCustomer`) is the
  authentication gate those features will use.
- Guest-first principle is preserved: anonymous customers can still browse; a
  save action will prompt for sign-in while preserving the user's intent.
- IDOR and cross-brand isolation rules established here apply unchanged.

---

# Questions

1. **Authentication method (BLOCKED — required before the login flow is wired).**
   Is OTP-based passwordless sign-in (phone-first with email fallback) acceptable
   for V1? Or do we want email magic links, email+password, or social login? This
   is a business decision; the foundation supports any method.
2. **Website database (BLOCKED — required before real customers/sessions exist).**
   Where does the Sonthillu Website DB live (e.g. Hostinger MySQL)? Which ORM
   (e.g. Prisma) and schema tooling? Do we manage the schema by migration files?
3. **OTP/SMS provider.** If OTP-first: which SMS/WhatsApp provider and budget?
4. **Session TTL policy.** Confirm 30-day default / 90-day cap; any shorter
   session expectation for sensitive operations?
5. **Customer→CRM lead mapping.** Approved API contract for linking website
   customers to CRM leads before any mapping is stored.
6. **Rate-limit store.** Confirm a shared Redis/DB-backed store is acceptable to
   enforce limits across server instances in production.
7. **Account profile fields.** Is the minimal V1 profile (name/email/phone +
   communication preferences) sufficient, or should additional fields be planned?
