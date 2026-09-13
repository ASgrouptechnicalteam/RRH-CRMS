# Phase P3 Discovery Implementation Plan

## Goal Description

Complete the Phase P3 — Discovery implementation for Sonthillu to verify and lock in the V1 property/project discovery experience, adhering strictly to the V1 Blueprint constraints.

## Proposed Changes

### UI Components & Layouts

- **projects/page.tsx**: Removed the duplicate `.container-page` wrapper around the Project content since the page layout already wrapped it. This restored the consistent margins prescribed by the P1 Design System.
- **SearchFilters.tsx**: Replaced the custom "Apply Filters" button and Mobile Filter Bar buttons with the canonical `<Button>` component from the UI library, ensuring visual consistency and correct focus ring behavior.

### Data Privacy & CRM Contracts

- **Verification**: Confirmed that `src/lib/dto.ts` (`toPublicPropertyDetail`) strictly sanitizes API payloads against an `ALLOWED_DETAIL_KEYS` whitelist, guaranteeing seller identities, CRM internal notes, and private coordinates are never exposed to the browser.
- **Verification**: Confirmed that URL state parsing safely ignores unsupported/fake filters.

## Verification Plan

- [x] Run `npm run typecheck` (Passed)
- [x] Run `npm run lint`
- [x] Run `npm run build` (Passed)
