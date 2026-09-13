# Packet 6 — Property Match & Ranking Engine

Deterministic, requirement-aware, field-aware, explainable, and testable property matching
for the Sonthillu website. Independent of React, Next.js, the CRM database, and any AI provider.

## 1. Why universal fixed weights were rejected

A fixed business-weight table such as `HARD = 2`, `STRONG = 1.5`, `SOFT = 1`,
`FLEXIBLE = 0.8`, `UNKNOWN = 0.1` decides, for **every** user, what a particular
constraint is worth. That contradicts the product requirement: different users value
different things differently.

Example:

- User A: “I need a 2BHK in Hyderabad under ₹60L. Parking is preferred.”
- User B: “I need a villa. Parking is mandatory. Location can be flexible.”

If the engine applied one global weight table, both users would get identical
priorities — wrong. The engine instead lets the **individual RequirementModel** carry
its own priorities.

## 2. RequirementModel

```ts
interface Requirement {
  field: string;
  operator:
    | 'EQUALS'
    | 'NOT_EQUALS'
    | 'GREATER_THAN'
    | 'LESS_THAN'
    | 'BETWEEN'
    | 'IN'
    | 'CONTAINS'
    | 'EXCLUDES';
  value: unknown;
  importance: RequirementImportance; // constraint type
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'; // query-specific priority
  flexibility?: 'LOW' | 'MEDIUM' | 'HIGH';
  tolerance?: number;
}

interface RequirementModel {
  requirements: Requirement[];
  rawQuery?: string;
  confidence?: number;
}
```

## 3. Constraint type vs. priority (two different concepts)

| Concept                        | Meaning                                                                    | Role                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `importance` (constraint type) | HARD / STRONG_PREFERENCE / SOFT_PREFERENCE / FLEXIBLE / EXCLUDED / UNKNOWN | HARD and EXCLUDED gate eligibility; others influence ranking                         |
| `priority` (query-specific)    | HIGH / MEDIUM / LOW                                                        | relative weight of a requirement **within this query** among non-gating requirements |

`importance` and `priority` are independent:

```ts
// parking: a strong preference that this user cares a lot about
{ field: 'parking', operator: 'EQUALS', value: true, importance: 'STRONG_PREFERENCE', priority: 'HIGH' }

// budget: flexible, but this user cares about staying in budget
{ field: 'price', operator: 'BETWEEN', value: [0, 6000000], importance: 'FLEXIBLE', priority: 'HIGH' }
```

## 4. Field evaluators

Field evaluation is separated from user priority. Each evaluator inspects one field
and returns a structured `FieldEvaluation`:

```ts
interface FieldEvaluation {
  satisfaction: number; // 0..1
  status: 'MATCH' | 'PARTIAL' | 'MISMATCH' | 'UNKNOWN' | 'MISSING' | 'NOT_APPLICABLE';
  reason: string;
  matchedValue?: unknown;
  requestedValue?: unknown;
  deviation?: unknown;
}
```

Registered evaluators:

| Field                                        | Behavior                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `propertyType`                               | categorical equality                                                                     |
| `listingType`                                | NEW / RESALE equality                                                                    |
| `possessionStatus`                           | equality, MISSING when null                                                              |
| `facing`                                     | categorical equality                                                                     |
| `location`                                   | structured equality (state / city / locality) when present; V1 text-containment fallback |
| `price`                                      | single-price and price-range overlap, min floor, flexibility stretch                     |
| `parking`                                    | boolean amenity: true / false / UNKNOWN / NOT_APPLICABLE                                 |
| `bedrooms`, `bathrooms`, `areaSqft`, `floor` | numeric (EQUALS / GREATER_THAN / LESS_THAN / BETWEEN)                                    |
| `amenities`                                  | CONTAINS: exact, partial, missing, none                                                  |

Evaluators never decide the user's priority — they only report satisfaction and status.

## 5. Candidate eligibility (HARD / EXCLUDED gates)

`checkCandidateEligibility` runs before scoring:

- **HARD** requirement:
  - `MISMATCH` → candidate excluded entirely (no low-score fallback).
  - `UNKNOWN` / `MISSING` / `NOT_APPLICABLE` → excluded (a hard requirement whose value
    cannot be confirmed is not treated as a confirmed exact match — documented
    conservative rule).
  - `MATCH` / `PARTIAL` → eligible.
- **EXCLUDED** requirement: if the value matches → candidate excluded (explicitly unwanted).
- All other constraint types do not gate.

Conflicting hard requirements (e.g. `propertyType = VILLA, HARD` + `propertyType =
APARTMENT, HARD`) produce zero eligible candidates deterministically.

## 6. Aggregation formula (query-specific)

For each requirement in the RequirementModel:

```
evaluation        = fieldEvaluator(property, requirement)
priorityFactor    = PRIORITY_FACTOR[requirement.priority ?? 'LOW']
contribution      = evaluation.satisfaction * priorityFactor
finalScore        = sum(contribution) / sum(priorityFactor)
```

- Empty requirement model → deterministic `score = 1`, tier `PRIMARY`, no division by zero.
- Final score is rounded to 2 decimals and mapped to a band/tier.

### 7. Priority normalization

`PRIORITY_FACTOR` is an **internal normalization** for the explicit priority values
carried by an individual RequirementModel:

```
LOW = 1, MEDIUM = 1.5, HIGH = 2
```

These are **not** universal business weights — they translate the priority _this query
specified_ into an aggregation factor. A different query with a different priority
layout produces a different ranking. The user controls priority through the
RequirementModel.

### 8. UNKNOWN vs MISSING vs NOT_APPLICABLE vs FALSE

| State              | Satisfaction    | Meaning                                                     |
| ------------------ | --------------- | ----------------------------------------------------------- |
| `MATCH`            | 1.0             | verified true match                                         |
| `PARTIAL`          | 0..1 (computed) | partial overlap (e.g., budget range, subset of amenities)   |
| `MISMATCH` (FALSE) | 0.0             | verified false / mismatch                                   |
| `UNKNOWN`          | 0.5             | system does not know — neutral, reduces confidence          |
| `MISSING`          | 0.35            | expected field absent — distinct from UNKNOWN and FALSE     |
| `NOT_APPLICABLE`   | 0.5             | field does not apply to this property — no mismatch penalty |

These states are distinct in both score and `status`, and each is surfaced separately in
the explanation. A hard requirement plus UNKNOWN cannot be a confirmed match; a soft
preference plus UNKNOWN does not destroy the candidate.

## 9. Budget behavior

- `below max` / `equal max` → full match.
- `above max` within flexibility tolerance → partial score (decreases with distance).
- `above max` beyond tolerance → mismatch (and, if HARD, excluded).
- **Price range overlap** — property price range `[pMin, pMax]` vs budget `[min, max]`:
  - fully within → full match;
  - partially overlapping → partial satisfaction = `0.4 + 0.6 × (overlap / rangeWidth)`;
  - fully above but within stretch → partial (flexible-budget rule);
  - fully above stretch → mismatch;
  - below the budget floor → mismatch (minimum budget respected).
- Property range is never collapsed into a single arbitrary number.

Example: Property `₹45L–₹53L`, user `max ₹50L` → recognized range overlap (partial
score ≈ 0.78). Property `₹55L–₹65L`, user `max ₹50L` → partial 0.7 (within 15% stretch).
Property `₹70L–₹80L`, user `max ₹50L` → mismatch.

## 10. Location limitations

V1 uses **structured equality** when structured data is available
(`state`, `city`, `locality`), and falls back to text containment. It does **not**
compute geographic distance or proximity. No “nearby” or distance claims are made, and
the documentation explicitly marks this as a V1 limitation. When coordinates become
available, a new `geo` evaluator can be added without touching the rest of the engine.

## 11. Match bands

| Score  | Band      |
| ------ | --------- |
| ≥ 0.90 | EXCELLENT |
| ≥ 0.75 | VERY_GOOD |
| ≥ 0.60 | GOOD      |
| ≥ 0.40 | RELATED   |
| < 0.40 | NO_MATCH  |

## 12. Ranking tiers

| Band                 | Tier     |
| -------------------- | -------- |
| EXCELLENT, VERY_GOOD | PRIMARY  |
| GOOD                 | CLOSE    |
| RELATED              | RELATED  |
| NO_MATCH             | NO_MATCH |

Ranking order: score descending, then price ascending (deterministic tie-break).

## 13. Explanation model

`MatchExplanation` mirrors the actual evaluation results — nothing is synthesized
independently of the evaluators:

```ts
interface MatchExplanation {
  score: number;
  band: MatchBand;
  matched: string[];
  partial: string[];
  deviations: string[];
  unknown: string[];
  missing: string[];
  notApplicable: string[];
}
```

Each array item is the `reason` produced by the corresponding field evaluation.

## 14. Test strategy

The suite runs under **real Vitest** (`npm run test:run`) and asserts behavior, not
mere return values:

- Query-specific priority changes ranking (same inventory, two priority profiles).
- Priority changes the numeric aggregate score.
- HARD gates; SOFT/FLEXIBLE rank but do not gate.
- UNKNOWN / MISSING / NOT_APPLICABLE / FALSE remain distinct.
- Budget: below / equal / above / min+max / range overlap / flexible stretch.
- Property & listing type: exact / mismatch / missing / hard exclusion / ANY.
- Numeric fields (BHK, bathrooms) and amenities: exact / partial / missing / none.
- Location: exact city, structured locality, missing, and no false proximity claims.
- Empty requirement model and conflicting hard requirements.
- Determinism (identical model + inventory → identical result).
- Explanation correctness (matches evaluator results).

## 15. AI integration boundary

A future AI/LLM layer parses natural language into a `RequirementModel` and passes it to
`rankByRequirementModel(candidates, model)`. The engine stays pure and deterministic; it
does not depend on the AI provider.

## 16. Recommendation engine boundary

A recommendation engine can select candidate sets and hand them to the same
`rankByRequirementModel` entry point, reusing the identical, query-specific ranking and
explanation logic.

## Entry points

- `rankByRequirementModel(candidates, requirementModel)` — primary API (query-specific).
  Generic over the candidate type: `rankByRequirementModel<T extends MatchCandidate>(candidates: T[], model): RankedProperty<T>[]`, so callers preserve a property subtype through ranking (no casts).
- `rankProperties(candidates, searchQuery)` — convenience wrapper that normalizes a
  search query into a RequirementModel.
- `evaluatePropertyMatch(candidate, model)` — per-candidate score + explanation.
  Generic: `evaluatePropertyMatch<T extends MatchCandidate>(candidate: T, model): RankedProperty<T>`.
- `checkCandidateEligibility(candidate, requirements)` — eligibility gate.
- `evaluateField(candidate, requirement)` — single field evaluation.

## Current limitations

- Location matching is structured-equality + text-containment (V1); no geo-distance.
- `floor` and `areaSqft` are supported via numeric evaluators but depend on CRM data
  actually containing those values.
- Boolean sentinel states (UNKNOWN / NOT_APPLICABLE) are honored where the candidate
  carries them; the CRM DTO does not yet expose them for all fields.
