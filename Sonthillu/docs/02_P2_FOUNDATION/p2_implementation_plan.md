# Phase P2 Implementation Plan

## Global Foundation & Styling

- Audit `layout.tsx` to verify standard page shell, language, and theme configuration.
- Enforce `container-page` class consistently across all page templates.
- Ensure the header maintains the official JPEG logo without introducing oversized "Sell Property" CTAs or fake AI search functionalities.

## Routing & Resilience

- **Error Boundary**: Create a global `error.tsx` boundary to gracefully catch unexpected application crashes and API failures without exposing internal CRM stack traces or secrets.
- **Not Found & Loading states**: Refactor `not-found.tsx` and `loading.tsx` to use the P1 design system tokens (`text-primary`, `bg-brand-navy`, etc.) instead of hardcoded tailwind values.
- **Robots Block**: Update `robots.ts` to add `/login`, `/register`, `/account` and `/admin` to the `disallow` array to prevent indexing of authentication and user-specific routes.
- **Sitemap Failover**: Implement a `try-catch` wrapper around `getPublishedProperties()` to ensure the sitemap successfully builds with static routes even if the CRM API is unavailable. Remove `/login` and `/register` from the sitemap static routes.

## SEO & Layouts

- Review existing `Metadata` across major dynamic routes (`properties`, `projects`) to ensure canonical links and open-graph data are safely populated.
- Review existing `JSON_LD` structures to ensure no internal CRM properties are leaked.

## Documentation

- **p2_foundation_audit.md**: Formalize pre-implementation findings regarding routing and global UI foundations.
- **p2_implementation_plan.md**: Document the changes explicitly planned to accomplish P2.
- **p2_final_report.md**: Compile final exit checks.
