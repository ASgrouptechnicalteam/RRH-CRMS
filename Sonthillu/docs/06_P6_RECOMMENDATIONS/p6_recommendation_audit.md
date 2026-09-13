# P6 Recommendation Audit

## 1. Existing Recommendation Pipeline

The pipeline is currently implemented in `src/lib/recommendations/pipeline.ts`. It works elegantly and deterministically:

- Takes a primary query or primary reference property.
- Converts it into a `RequirementModel` (Packet 6 engine).
- Generates candidates from the active inventory.
- Filters and classifies them into well-defined groups:
  - `SIMILAR` (Primary matches)
  - `CLOSE_MATCH` (Minor deviations)
  - `NEARBY` (Same city, different precise locality)
  - `ABOVE_BUDGET` (Hard budget deviations)
  - `ALTERNATIVE_TYPE` (e.g. Villa vs Independent House)
  - `RECENTLY_VIEWED` (Currently relies on local storage context)
  - `POPULAR` (Currently deterministic based on newest/cheapest)
  - `NO_RESULT_RECOVERY` (Fallback when no exact matches exist)
- Renders via `src/components/recommendations/RecommendationsSection.tsx`.

**Conclusion:** Do not rebuild the core classification and ranking pipeline. It fulfills the V1 deterministic requirements perfectly.

## 2. Existing Activity Event Implementation

- `prisma.schema.prisma` already has an `ActivityEvent` model capable of capturing `customerId`, `anonymousId`, `eventName`, `propertyId`, `searchContext`, etc.
- `src/app/actions/analytics.ts` contains `trackActivityEventAction`. **However, it is insecure**. It accepts `customerId` straight from the client payload instead of deriving it safely from the server session.
- `trackActivityEventAction` is currently NOT integrated anywhere in the application. No events are actually being written to the DB during navigation.
- `src/lib/recommendations/analytics.ts` provides client-side `trackRecommendationEvent` using `window.dispatchEvent`, but this is not hooked up to persistent server storage.

## 3. Privacy & Merge

- The system must support guest-to-account migration for ActivityEvents (similar to Shortlist/Compare).
- Anonymous sessions must be tracked safely using an HTTP cookie (`sonthillu_anon_id`).

## 4. Signal Intelligence

The backend currently lacks a way to read `ActivityEvent` and extract behavioral context (like `recentlyViewedIds` and `popularIds`) for the recommendation pipeline. This will be the main engineering effort in P6.

## 5. Recovery & Empty States

The V1 recommendation engine currently supports `NO_RESULT_RECOVERY` by collecting the newest/popular inventory when no match groups are generated. This fulfills the V1 Blueprint requirement.
