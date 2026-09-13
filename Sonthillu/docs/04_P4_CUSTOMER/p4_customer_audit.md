# Phase P4 (Customer Conversion) Audit

## Database & Models

- **Status:** ✅ VERIFIED
- **Findings:** The Prisma schema (`prisma/schema.prisma`) successfully implements `Customer`, `Session`, `EmailVerificationToken`, `PasswordResetToken`, `ShortlistItem`, `CompareItem`, `CustomerPreference`, and `ActivityEvent`. The `.env` correctly maps `DATABASE_URL` to XAMPP MySQL.

## Authentication System

- **Status:** ✅ VERIFIED
- **Findings:** Server-side sessions are fully implemented in `src/lib/auth/`.
  - Registration handles `bcrypt` password hashing and creates verification tokens.
  - Login safely validates hashes and generates HttpOnly `SESSION_COOKIE_NAME` without exposing tokens to JS.
  - Password Reset securely uses 256-bit crypto hashes for one-time links and revokes old sessions.
  - `/account` page correctly prevents exposure of password hashes or session tokens.

## Customer Privacy & Isolation

- **Status:** ⚠️ INCOMPLETE
- **Findings:** Database logic safely segregates `customerId` limits for Shortlist and Compare via `src/lib/customer/prisma-store.ts`. However, the frontend context `CustomerActivityProvider` is rigidly locked into `guest` mode. It currently stores all activity in browser `localStorage`, effectively bypassing the Sonthillu Web DB and customer isolation entirely.

## Activity Tracking

- **Status:** ⚠️ INCOMPLETE
- **Findings:** The schema provides an `ActivityEvent` table, and a server action `trackActivityEventAction` exists in `analytics.ts`. However, no client-side listener actively captures the browser event `CUSTOMER_ACTIVITY_EVENT_NAME` to transmit this payload to the database.

## Registration/Login Flow Migration

- **Status:** ⚠️ INCOMPLETE
- **Findings:** When a guest logs in, their existing Shortlist and Compare items in `localStorage` are discarded rather than being merged into their new session via `mergeGuestActivityAction`.

## Seller Foundation

- **Status:** ✅ VERIFIED
- **Findings:** The `sellerStatus` enum foundation exists (`NONE`, `PENDING_VERIFICATION`, `VERIFIED`, `SUSPENDED`), and route handlers safely protect the boundaries.

---

**Summary:** The foundational database, authentication, and layout infrastructure for P4 is structurally sound. Implementation requires connecting the frontend Activity Provider to the backend to achieve full database persistence and customer isolation.
