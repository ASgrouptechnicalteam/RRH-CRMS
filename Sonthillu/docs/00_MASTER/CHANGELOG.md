# Master Changelog

## [Phase P3] - Discovery Implementation

- **Search Architecture**: Verified URL state persistence for property filters via `useTransition` and robust search parameters mapping.
- **CRM Integration Safety**: Audited `lib/dto.ts` mapping layer. Verified that the `toPublicPropertyDetail` cleanly strips seller details, geo-coordinates, and private internal notes leveraging an `ALLOWED_DETAIL_KEYS` whitelist.
- **Empty States**: Confirmed truthful degradation UX depending on CRM availability (`CRM_UNAVAILABLE`) or zero-result filtered states.
- **Layout Rectification**: Resolved duplicate `.container-page` margin issues in Project listings and enforced canonical `<Button>` elements within the Search filters sidebar.

## [Phase P2] - Foundation Implementation

- **Global Layout**: Enforced `container-page` standard layout across properties, projects, and top-level pages.
- **Routing Resilience**: Added robust global `error.tsx` boundary. Reconstructed `not-found.tsx` to handle gracefully missing paths.
- **SEO Foundation**: Secured `robots.ts` to disallow sensitive internal scopes (`/admin`, `/login`, `/account`). Handled CRM outage edge cases smoothly inside `sitemap.ts`.
- **Loading states**: Standardized UI loader semantics via `text-text-secondary` and `border-brand-navy`.
- **Testing**: Validated routing mapping to valid 404 paths correctly. Built strictly matching Phase P1 visual contracts.

## [Phase P1] - Design Implementation

- **Logo Integration**: Replaced generic components with official `sonthillu logo.jpeg`.
- **Design Tokens**: Standardized global tailwind semantic color palette (Navy & Gold base).
- **Responsive Components**: Upgraded existing `Button`, `Card`, `Badge`, and form fields to rigorously consume unified utility tokens across multiple responsive breakpoints.
- **Accessibility**: Audited focus rings, accessible names, and baseline touch targets.

### Phase 4.1 (Customer Conversion Stabilization) [2026-08-21]

- **Synchronized Activity States:** Implemented Guest-to-Account migration for shortlist & compare actions.
- **Customer Isolation:** Safely enforced Session HttpOnly identity without hidden bounds.
- **Fixes:** Typecheck stabilized to respect async signatures, lint runs natively, and sitemap dynamic server usage warns cleared using static revalidation.

### Phase 8 (Admin + Analytics) [2026-08-21]

- **Admin Identity & RBAC**: Decoupled Admin authentication with constant-time security checks and strictly enforced role-based access control (`SUPER_ADMIN`, `ADMIN`, `ANALYST`, `CONTENT_MANAGER`).
- **Database-Backed CMS**: Transitioned Hero configurations from mock data to Prisma, with live activation and ordering.
- **Analytics Pipeline**: Delivered secure dashboards for Customer Funnel, Conversions, AI Search Success, Zero-Result Search Demand, and Recommendation CTRs.
- **Audit Logging**: Implemented a comprehensive, tamper-evident audit log for sensitive admin operations, protecting against IDOR and misuse.
- **Security Enhancements**: Middleware routing gates, strict session cookies (`sonthillu_admin_session`), and component-level RBAC assertions.
- **Fixes**: Fixed `/admin/login` redirect loop by isolating protected admin routes into a Route Group `(protected)` to prevent layout inheritance on the login route.

## [2026-08-21] P5 Seller Completion

- Implemented strict server-side access control for seller status matrix (NONE, PENDING, VERIFIED, SUSPENDED)
- Established Seller Onboarding workflow with secure Prisma state transition
- Implemented Property Submission form with strict Zod validation
- Formalized CRM boundary returning CRM_DEPENDENT error to prevent false positives

## [2026-08-22] P10 Production Launch Readiness

- **Preflight Audit**: Reconciled master status for P0-P9.
- **Infrastructure Requirements**: Documented Hostinger requirements, CRM dependencies, and generated a Deployment Runbook.
- **Rollback & Recovery**: Defined Backup/Restore and safe Rollback strategies.
- **Go-Live Matrix**: Created Acceptance Matrix and Production Checklist for final staging.
