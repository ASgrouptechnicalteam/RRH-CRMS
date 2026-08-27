# CRM-WEBSITE-INTEGRATION

> CRM ↔ website responsibility boundary for RRH-CRMS, verified against `apps/api/src/routes/public.ts`,
> `apps/api/src/routes/integration.routes.ts`, and `apps/api/src/utils/matchingEngine.ts`.

## 1. Responsibility boundary

The **website** is the **user-facing search & presentation interface**; the **CRM** is the
**business and data engine**. The CRM is the **authority** for data and business decisions;
the website must **not** independently implement business rules.

| Responsibility | Owner |
|----------------|-------|
| Public presentation & SEO | Website |
| Public search UI & filters | Website |
| AI Search interface (chat/input) | Website (calls CRM AI) |
| Customer account experience (future Portal) | Portal (external) |
| Natural-language → SearchIntent extraction | CRM AI |
| SearchIntent validation | CRM |
| Property matching & ordering | CRM |
| Match-percentage calculation | CRM |
| Property availability / inventory-lock decisions | CRM |
| Booking / payment / collection decisions | CRM |
| KYC decisions | CRM |
| Property matching rules, business rules | CRM (authoritative) |

> The website **must not** implement property-matching rules, match-percentage math, CRM
> business rules, availability decisions, booking/payment rules, or KYC decisions. The CRM
> remains authoritative even when a website cache disagrees (CRM wins on disagreement).

## 2. Intended website → CRM AI search flow

```text
Website
   ↓
User enters natural-language requirement
   ↓
CRM AI search API  (NOT IMPLEMENTED yet — see §5)
   ↓
AI extracts structured requirements
   ↓
CRM validates requirements
   ↓
CRM property matching engine
   ↓
CRM calculates match percentage
   ↓
CRM returns ordered results
   ↓
Website renders results
```

> ⚠️ The **AI search API** step is **NOT IMPLEMENTED** (no HTTP route). Only the AI
> foundation (contract + mock provider) exists. The website-facing AI search flow is
> therefore **not yet operational**.

## 3. Public APIs actually available (verified)

All under `/api/v1/public/:brand/...` (brand ∈ `rrh` | `sonthillu`), authenticated by the
**public API key** (`PublicApiKey`) → resolves `company_id`. Rate-limited by
`publicReadLimiter` / `publicWriteLimiter`.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/public/:brand/properties` | Public property list (allowlist, approved images only) |
| GET | `/public/:brand/properties/:id` | Public property detail (+ minimal project) |
| GET | `/public/:brand/projects` | Public project list |
| GET | `/public/:brand/projects/:id` | Public project detail (+ `inventory_summary`) |
| POST | `/public/:brand/leads` | Public lead capture (source=WEBSITE, creator NULL) |

Public response allowlists (`PUBLIC_PROPERTY_SELECT`, `PUBLIC_PROJECT_SELECT`) exclude
internal fields: **status, GPS coordinates, company_id, branch_id, assigned_pm_id, seller
info, internal workflow fields**. Only `status: 'APPROVED'` images are exposed.

## 4. Normal search vs AI search

### Normal search (structured filters)

```text
Filters (website)
 ↓
CRM API
 ↓
Deterministic matching
 ↓
Match percentage
 ↓
Results
```

> 🔴 **Current state:** there is **no public structured-search endpoint** yet
> (WR-7 gap). Public properties are retrievable via list endpoints; filter/search is the
> website's presentational concern until a CRM search endpoint is added.

### AI search (natural language)

```text
Natural language
 ↓
AI extraction (SearchIntent)
 ↓
Structured search JSON
 ↓
CRM validation
 ↓
Deterministic matching
 ↓
Match percentage
 ↓
Results
```

**AI Search does NOT replace the normal search engine.** AI Search is an interpretation
layer that feeds the **same** authoritative CRM search/matching engine.

## 5. Matching engine (authority) — `apps/api/src/utils/matchingEngine.ts`

`findMatchingPropertiesForLead(leadId)` computes a deterministic **`matchScore` (0–100)**
for each LIVE property in the lead's company, sorted descending. **The CRM calculates match
percentage — the AI never does.**

| Criterion | Weight (points) | Rule (verified) |
|-----------|-----------------|-----------------|
| Location | 40 | preferred_location ⊆ property.location (or ≥1 word match → 25) ; no preference → +20 neutral |
| Budget | 40 | price ≤ budget_max → 40; price ≤ budget_max × 1.15 → 20 (15% flex); no budget_max → +20 neutral |
| Category/BHK | 20 | preference matches property category or brand_type → 20; none → +10 |
| **Total** | **100** | `matchScore = min(100, sum)`; breakdown flags `locationMatch/budgetMatch/categoryMatch` |

> ⚠️ **Scope note (verified):** the engine is currently **lead-scoped** (driven by a
> `Lead`'s preferred_location / budget_max / property_type_preference) and is exposed only
> via `GET /leads/:id/matches`. It is **not** wired to a public search endpoint nor to the
> `SearchIntent` output. A SearchIntent-driven consumer is **NOT IMPLEMENTED**.

## 6. Brand separation

- Public URLs carry a `:brand` segment restricted to `rrh`/`sonthillu`.
- `BRAND_TYPE_MAP` maps brand → `brand_type` (SONTHILLU / RADHA_REAL_HOMES); public queries
  filter by the company's brand and check `PropertyPublication.is_published`.
- `Company.property_type_group` defaults to `RADHA_REAL_HOMES`.

## 7. What the website must NOT implement (guardrails)

- Property matching rules or match-percentage math (CRM authoritative).
- Availability / booking / payment / KYC decisions.
- Any CRM business logic (authorization, SLA, scoring, inventory locks).
- Tenant/brand selection beyond the allowed `:brand` segment.
- AI "recommendations" — the website displays CRM-determined results only.

## 8. Customer Portal (separate)

The customer portal is a **separate external system**. CRM provides a service-token
integration surface (`/integration/portal/*` callbacks, read-only customer notifications,
outbox events via `IntegrationEvent`). The portal worker is **disabled by default**
(`PORTAL_WORKER_ENABLED=false`). See [CRM-V2-ROADMAP](CRM-V2-ROADMAP.md).
