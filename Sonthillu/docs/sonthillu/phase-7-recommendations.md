# Packet 7 — Search Recommendation Engine

Deterministic recommendation groups layered **on top of** the approved Packet 6
Match & Ranking Engine. The recommendation engine never re-scores: every ranked
candidate is ranked by Packet 6. This module only classifies deviations, packages
them into clearly-labeled groups, and adds deterministic diversity. It is
independent of React, the CRM database, and any AI / ML provider.

## 1. Design principles

1. **One ranking authority.** `buildRecommendations` calls Packet 6's
   `rankByRequirementModel` for every pool. Group membership is a classification of
   the engine output, never a second scoring pass.
2. **Type-safe boundary.** Packet 6's `rankByRequirementModel` and
   `evaluatePropertyMatch` are generic (`<T extends MatchCandidate>`), so the
   pipeline's `T extends MatchCandidate` subtypes flow through ranking without any
   casts. There is no `as unknown as RankedProperty<T>[]` bridge and no `any` in the
   recommendation pipeline.
3. **Hard constraints are never silently relaxed.** A property that fails a HARD
   gate is excluded from match groups. Over-budget properties are collected into a
   clearly-labeled `ABOVE_BUDGET` group with the overage amount.
4. **No invented data.** Only published, available, publicly-eligible Sonthillu
   properties (fetched via the existing `getPublishedProperties` CRM path) are ever
   recommended. Reserved / sold / unpublished properties never appear. Empty
   inventory yields empty recommendations.
5. **Determinism.** Same inventory + same context ⇒ same result. `ctx.now` is a test
   seam for a stable `generatedAt`.
6. **No second engine, no ML, no AI provider.**

## 2. Pipeline

```
Candidate retrieval (published + exclude primary)
        │
        ▼
1. Core pool      → Packet 6 rankByRequirementModel (full model, gated)
        │              → SIMILAR / CLOSE_MATCH / NEARBY / (budget partials)
        ▼
2. Budget pool    → candidates failing ONLY the price gate (or marginally over)
        │              → ABOVE_BUDGET (labeled, ranked by model minus price)
        ▼
3. Type pool      → valid alternative types only (VILLA ⇄ INDEPENDENT_HOUSE)
        │              → ALTERNATIVE_TYPE
        ▼
4. Recently viewed → session ids, recency order, deduped → RECENTLY_VIEWED
        ▼
5. Popular        → popular-ids signal, else newest-first deterministic fallback
        │              → POPULAR
        │       (if no match group exists → NO_RESULT_RECOVERY replaces POPULAR)
        ▼
Deterministic group order + per-group caps + global dedup
        ▼
RecommendationResult
```

`buildRecommendations(inventory, ctx)` in `src/lib/recommendations/pipeline.ts`
orchestrates the pipeline.

## 3. Recommendation groups

| Type                 | Meaning                                                            | Source pool | Labels                                       |
| -------------------- | ------------------------------------------------------------------ | ----------- | -------------------------------------------- |
| `SIMILAR`            | Tier PRIMARY (≥ 0.75) under the primary model                      | Core        | Matched reasons                              |
| `CLOSE_MATCH`        | Tier CLOSE (0.6–0.75) under the primary model                      | Core        | Partial + matched reasons                    |
| `ABOVE_BUDGET`       | Price gate partial-over or exceeds budget; everything else matches | Budget pool | Overage amount, listed price                 |
| `ALTERNATIVE_TYPE`   | Valid alternative property type (VILLA ⇄ INDEPENDENT_HOUSE)        | Type pool   | "An alternative to … — …"                    |
| `NEARBY`             | Location deviation but structured geo confirms same city           | Core        | "Located in …, same city"                    |
| `RECENTLY_VIEWED`    | Session-scoped viewing history                                     | Recency ids | "You viewed this earlier"                    |
| `POPULAR`            | Popularity signal or newest-first fallback                         | Leftovers   | "Popular with other buyers" / "Newly listed" |
| `NO_RESULT_RECOVERY` | No match group produced; newest listings fallback                  | Leftovers   | "No exact matches found"                     |

### Group classification rules

- **Core classification** iterates the Packet 6-ranked eligible list:
  1. Price evaluation `PARTIAL` with reason "above budget" → owned by the budget pool.
  2. Property-type mismatch (only reachable when type is not a HARD gate) → left for
     the type pool.
  3. Location `MISMATCH`:
     - structured geo confirms the **same city** → `NEARBY`;
     - different city → not recommended (leftover only).
  4. Otherwise tier `PRIMARY` → `SIMILAR`, tier `CLOSE` → `CLOSE_MATCH`.
     `RELATED` / `NO_MATCH` tiers are never recommended directly; they may only
     surface in `POPULAR`.
- **Budget pool** eligibility: passes eligibility with the price requirement removed
  AND price evaluation is partial-over-budget or exceeds-budget. Below-minimum-budget
  properties are not recommended (the floor is respected).
- **Type pool** eligibility: property type is a valid alternative AND the candidate
  passes eligibility with the property-type requirement removed.
- **Dedup**: a property can appear in exactly one group (first assignment wins,
  processed in precedence order). `excludeIds` (the primary property) are removed
  before classification.

## 4. Hard-constraint guarantees

- `propertyType` is HARD in every default model ⇒ match groups can only contain the
  requested type; only the type pool surfaces alternatives, and only for valid pairs
  (`VALID_ALTERNATIVE_TYPES`). **An APARTMENT is never auto-offered as an alternative.**
- `price` is HARD with a 15% tolerance stretch ⇒ over-budget properties are never
  in `SIMILAR` / `CLOSE_MATCH`; they appear only in the labeled `ABOVE_BUDGET` group.
- Location is `STRONG_PREFERENCE` (not a gate) so same-city options can still rank;
  `NEARBY` additionally requires structured geo (`property.city`) matching the
  reference city.

## 5. NEARBY (structured-geo limitation)

`NEARBY` requires the candidate to carry `city` (or the free-text location to exactly
match the reference locality/city). On the **property-detail** flow the reference city
is the primary property's structured `city`, so same-city/different-locality
properties are classified `NEARBY`. On the **search** flow the free-text `location`
must match the candidate's `city`/`locality` exactly. No geo-distance is computed in
V1 — documented limitation.

## 6. Model builders

`src/lib/recommendations/pipeline.ts` exposes:

- `recommendationModelFromQuery(query)` — reuses the Packet 6 normalization
  (`location` STRONG_PREFERENCE/HIGH, `propertyType` HARD/HIGH, `listingType`
  STRONG_PREFERENCE/LOW, `price` HARD/HIGH with 15% stretch, `possessionStatus`
  STRONG_PREFERENCE/MEDIUM).
- `recommendationModelFromProperty(property)` — builds a model from a reference
  property (type HARD, price band ±15%, bedrooms, area band ±30%, facing, and a
  location requirement that targets the **locality** when available so that
  same-city/different-locality candidates classify as `NEARBY` rather than `SIMILAR`).

## 7. Analytics foundation

`src/lib/recommendations/analytics.ts` defines the event contract:

- Event types: `recommendation_impression`, `recommendation_click`,
  `recommendation_shortlist`, `recommendation_compare`, `recommendation_enquiry`.
- `trackRecommendationEvent(payload)` dispatches a typed
  `sonthillu:recommendation` `CustomEvent` on the client (no-op server-side). A
  future analytics provider subscribes via
  `window.addEventListener('sonthillu:recommendation', handler)`.
- `buildRecommendationEvent(type, fields)` stamps the ISO timestamp.
- `readRecentlyViewedIds()` / `recordRecentlyViewed(id)` — localStorage-backed,
  session-scoped recently-viewed foundation feeding the `RECENTLY_VIEWED` group.
- `POPULAR` is a foundation: `ctx.popularIds` is the future view/shortlist-count
  signal; V1 falls back to a deterministic newest-first, price-ascending order.

## 8. UI insertion points

- `src/components/recommendations/RecommendationsSection.tsx` — presentational
  client component: renders one labeled group per section, fires
  `recommendation_impression` on mount, renders nothing for empty groups.
- **Property detail** (`src/app/properties/[id]/page.tsx` +
  `src/components/property/PropertyDetailClient.tsx`) — wired: publishes all
  Sonthillu properties, builds recommendations with
  `recommendationModelFromProperty(property)` + `excludeIds: [property.id]`, and
  renders `RecommendationsSection` below the existing similar-properties block.
- **Search results** (`src/components/search/SearchResults.tsx`) and **homepage** —
  prepared integration points (surface = `'search'` / `'homepage'`); no broad
  redesign. They render once the CRM-backed search inventory is available.

## 9. Constants

| Constant                  | Value                                                                           | Purpose                        |
| ------------------------- | ------------------------------------------------------------------------------- | ------------------------------ |
| `MAX_ITEMS_PER_GROUP`     | 4                                                                               | Cap per recommendation group   |
| `MAX_NO_RESULT_ITEMS`     | 4                                                                               | Cap for the no-result fallback |
| `VALID_ALTERNATIVE_TYPES` | `{ APARTMENT: [], VILLA: ['INDEPENDENT_HOUSE'], INDEPENDENT_HOUSE: ['VILLA'] }` | Valid alternative pairs        |
| `GROUP_ORDER`             | fixed array                                                                     | Deterministic output ordering  |

## 10. Files

- `src/lib/recommendations/types.ts` — types, labels, constants.
- `src/lib/recommendations/pipeline.ts` — model builders + `buildRecommendations`.
- `src/lib/recommendations/analytics.ts` — event contract + recently-viewed/popular
  foundations.
- `src/lib/recommendations/pipeline.test.ts` — 21 tests.
- `src/lib/recommendations/analytics.test.ts` — 5 tests.
- `src/components/recommendations/RecommendationsSection.tsx` — UI section.

## 11. Verification

```
npm run test:run    # 59 tests pass (33 engine + 21 recommendations + 5 analytics)
npm run typecheck   # clean
npm run build       # passes
```
