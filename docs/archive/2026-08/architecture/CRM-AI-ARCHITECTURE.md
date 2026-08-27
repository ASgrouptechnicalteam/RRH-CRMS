# CRM-AI-ARCHITECTURE

> **Phase 17-A** AI architecture for RRH-CRMS, verified against `apps/api/src/services/ai/**`
> and `tests/api/phase17a-ai-foundation.test.ts`. This section is **extremely precise** about
> what the AI is allowed to do, what is implemented, and what is not.

## 1. AI ROLE — interpretation layer, NOT a business-decision engine

The CRM AI is **not** a chatbot that recommends properties. Its sole role is:

> **Natural-language requirement extraction and structured search-query generation.**

The AI **must NOT** (all of these are enforced by the shipped contract and system
instructions):
- recommend properties / tell users what to buy;
- rank properties or calculate match percentage;
- modify property data or any CRM data;
- make booking, payment, collection, or financial decisions;
- approve KYC or execute business workflows;
- override deterministic CRM rules, availability, inventory locks, SLA, scoring,
  permissions, or company isolation.

> **AI interprets. CRM decides. Website displays.**

## 2. Intended AI Search workflow (approved architecture)

```text
User enters natural-language search
        ↓
AI interprets user intent
        ↓
AI extracts structured requirements
        ↓
AI returns strict JSON (SearchIntentExtraction)
        ↓
CRM validates JSON (deterministic, Zod)
        ↓
CRM performs deterministic property matching
        ↓
CRM calculates match percentage
        ↓
CRM orders matching properties
        ↓
Website displays results
```

## 3. Incomplete-search behaviour (approved interaction model)

If the user's search is incomplete, the AI **must NOT** answer with clarification text
inside the search-result flow. Instead it returns a **machine-readable `INCOMPLETE`
extraction** that routes the user into an **AI chat/clarification experience**:

```text
User search
   ↓
AI detects incomplete requirements
   ↓
Search cannot be converted into a valid search request
   ↓
Redirect to AI chat/clarification mode
   ↓
AI politely asks required questions
   ↓
User provides missing details
   ↓
AI updates structured requirements
   ↓
Requirements become complete
   ↓
AI emits final JSON
   ↓
CRM performs deterministic search
```

**Schema-level enforcement (verified):** `SearchIntentExtractionSchema` models this via
`status: 'COMPLETE' | 'INCOMPLETE'` with `nextAction: 'AI_CHAT'` (default). An `INCOMPLETE`
extraction carries `missingRequirements[]` and/or `ambiguities[]` and **must not** carry a
`searchIntent`; a `COMPLETE` extraction **must** carry a `searchIntent`.

**Mandatory vs optional fields:** the shipped `SearchIntentSchema` makes **every field
optional** (an empty `{}` is a valid unconstrained SearchIntent) and the extraction schema
does **not** define a required-field list. Which specific fields must be present for a
search to be considered "complete" is a **semantic/provider-level decision**, not enforced
by the current schema.

> ✅ **Verified (schema)**: the Phase 17-A `SearchIntentSchema` intentionally defines **no
> mandatory field set** — every field is `.optional()` and a bare `{}` is schema-valid.
> "Completeness" is therefore **not** a schema rule; it is a provider/requirement-level
> decision signalled by `Extraction.status === 'COMPLETE'` carrying a (possibly minimal)
> `searchIntent`. The mock provider returns `INCOMPLETE` whenever it cannot recognise any
> actionable criterion (source: `apps/api/src/services/ai/mockProvider.ts`).
>
> ⚫ **Human review (product)**: *which* criteria constitute "complete enough to search" is a
> product decision outside the current code — do not infer a mandatory field list.

## 4. AI OUTPUT CONTRACT — SearchIntent JSON

Source: `apps/api/src/services/ai/searchIntent.ts`. Two nested shapes.

### 4.1 `SearchIntent` (the actionable filter set) — outer `.strict()` (unknown fields rejected)

```jsonc
{
  "propertyType": "APARTMENT",                 // enum, optional
  "brandType": "SONTHILLU",                    // "SONTHILLU" | "RADHA_REAL_HOMES", optional
  "location": { "city": "Hyderabad" },         // {state?, city?, locality?, pincode?} optional, strict
  "budget": { "max": 6000000 },                // {min?, max?} optional; min<=max enforced
  "bhk": { "min": 2 },                         // {min? int>0} optional
  "bathrooms": { "min": 1 },                   // {min? int>0} optional
  "area": { "min": 1000 },                     // {min?, max?} optional; min<=max enforced
  "facing": "EAST",                            // EAST|WEST|NORTH|SOUTH|NORTH_EAST|SOUTH_EAST, optional
  "listingType": "NEW",                        // "NEW" | "RESALE", optional
  "possessionStatus": "READY_TO_MOVE",         // "READY_TO_MOVE" | "UNDER_CONSTRUCTION", optional
  "unsupportedCriteria": ["pool"]              // string[] max 8, optional
}
```

- **Every field is optional.** An empty `{}` is a valid (unconstrained) SearchIntent.
- Enums (exact): `propertyType` ∈ APARTMENT, INDEPENDENT_HOUSE, DUPLEX, INDEPENDENT_FLOOR,
  VILLA, PENTHOUSE, STUDIO, PLOT, FARM_HOUSE, AGRICULTURAL_LAND.
- `location`/`budget`/`area` are nested `.strict()` objects with the listed keys only.
- `budget.min <= budget.max` and `area.min <= area.max` enforced by Zod `refine`.
- Unknown keys inside `SearchIntent` are **rejected** (`InvalidSearchIntentError`).

### 4.2 `SearchIntentExtraction` (wrapper returned to the caller) — outer `.strip()`

```jsonc
{
  "status": "COMPLETE",                        // "COMPLETE" | "INCOMPLETE"
  "searchIntent": { /* SearchIntent — REQUIRED if COMPLETE, FORBIDDEN if INCOMPLETE */ },
  "missingRequirements": ["budget"],           // string[] max 16, optional (INCOMPLETE)
  "ambiguities": [                             // max 8, optional (INCOMPLETE)
    { "field": "location", "candidates": ["Hyderabad", "Secunderabad"] }
  ],
  "unsupportedCriteria": [],                   // string[] max 8, optional
  "nextAction": "AI_CHAT"                      // enum ['AI_CHAT'], default "AI_CHAT"
}
```

- Outer wrapper uses `.strip()` (unknown top-level keys dropped); inner `SearchIntent`
  uses `.strict()`.
- `superRefine`: `COMPLETE` requires `searchIntent`; `INCOMPLETE` must **not** carry one.

### 4.3 Client input contract (`application.ts` `AISearchInputSchema`, `.strict()`)

```jsonc
{
  "query": "I want a good apartment in Hyderabad",   // string 1..4000, REQUIRED
  "retrieved": [                                      // optional, max 50
    { "kind": "property", "content": "..." }          // kind 1..80, content 1..4000
  ]
}
```

- `.strict()` + `assertNoTenantOverride` (recursive) reject `company_id`, `tenant`,
  `org_id`, `company`, etc. — **tenant identity is never client-supplied**.

### 4.4 Canonical example (from the foundation test `COMPLETE_JSON`)

```json
{
  "status": "COMPLETE",
  "searchIntent": {
    "propertyType": "APARTMENT",
    "brandType": "SONTHILLU",
    "location": { "city": "Hyderabad" },
    "budget": { "max": 6000000 },
    "bhk": { "min": 2 },
    "listingType": "NEW"
  }
}
```


### 4.5 Validation & error handling

- `validateSearchIntentExtraction(raw)` — Zod safeParse; throws `InvalidSearchIntentError`.
- `parseSearchIntentContent(content)` — JSON parse → `validateSearchIntentExtraction`;
  invalid JSON → `InvalidAIStructuredOutputError`.
- `InvalidAIInputError` — malformed client input.
- `AITenantOverrideError` — client tenant override attempt (defense-in-depth).
- Deterministic validation happens **before** any CRM logic; malformed/malicious AI output
  is **fail-closed**.

## 5. AI PROVIDER ABSTRACTION

Layer diagram (what the code actually implements):

```text
CRM AI Application (SearchIntentService — services/ai/application.ts)
        ↓
AI Gateway (AIGateway — timeout + bounded retry + normalized errors — services/ai/gateway.ts)
        ↓
Provider Adapter (AIProvider interface — services/ai/provider.ts)
        ↓
Selected AI Provider (mock by default; OpenRouter via direct HTTPS — services/ai/mockProvider.ts)
```

| Component | Status | Detail |
|-----------|--------|--------|
| `AIProvider` interface | 🟢 | provider-independent: `capabilities` + `generate(request)`. No OpenAI/OpenRouter/Ollama types leak in. |
| Provider adapter for OpenAI | 🔴 | **NOT IMPLEMENTED** (SDK `openai` declared in `package.json`, unused) |
| Provider adapter for OpenRouter | 🟢 | **IMPLEMENTED** — direct HTTPS `fetch` to the documented OpenRouter chat-completions API (`@openrouter/sdk` declared but deliberately unused; narrow, dependency-free, isolated to `openRouterProvider.ts`) |
| Provider adapter for Ollama/local | 🔴 | **NOT IMPLEMENTED** |
| Provider factory / registry | 🟢 | **IMPLEMENTED** — `createAIProvider` selects `mock` / `openrouter` from `AI_PROVIDER` at runtime; unknown names fail fast |
| `MockProvider` | 🟢 | deterministic, never contacts network, supports programmed failures + usage |
| `AIGateway` | 🟢 | `withTimeout` (configurable), bounded retry (`maxRetries` 0..5), normalized `AIProviderErrorInfo`, fail-closed on unknown/non-retryable |
| `AIConfig` | 🟢 | `fromEnv`/`from`; zod-validated; fail-fast when enabled-without-provider; disabled by default (`AI_ENABLED`, provider `mock`, timeout 30s, maxTokens 1024, maxRetries 1) |
| Model configuration | 🟢 | `AI_MODEL` default model; request may pass `model`; validated config snapshot |
| Token limits | 🟢 | `AI_MAX_TOKENS` (default 1024), `maxOutputTokens` capability |
| Timeout / retry | 🟢 | timeout + retry only on retryable failures; never infinite |
| Cost hooks | 🟢 | `AICostHook` interface + `NullCostHook` (no-op default); **no billing/persistence** |
| Audit hooks | 🟢 | `AIAuditHook` + `NullAuditHook`; carries `requestId, correlationId, companyId, employeeId, provider, model, status, latencyMs, usage, promptVersion, responseVersion, errorCategory`; **no persistence** |
| Context builder | 🟢 | system / user / retrieved-data messages; retrieved data labelled `isRetrievedData: true` |
| Redaction | 🟢 | `Redactor` default-drops sensitive field kinds (api key, password, token, jwt, pan, aadhaar, kyc, otp, account, cvv, pin…) and sensitive value patterns |
| Provider-independent error categories | 🟢 | `AIErrorCategory`: TIMEOUT, PROVIDER_UNAVAILABLE, RATE_LIMITED, MODEL_UNAVAILABLE, INVALID_PROVIDER_RESPONSE, INVALID_REQUEST, QUOTA_EXCEEDED, CONFIGURATION_ERROR, UNKNOWN_PROVIDER_ERROR |
| Cost guard / spend limit enforcement | 🔴 | hook interface only; **no enforcement** |
| Provider failover/fallback | 🔴 | **NOT IMPLEMENTED** (no secondary provider) |
| Streaming | 🔴 | foundation does not stream (`supportsStreaming: false`) |

## 6. AI SECURITY

| Control | Status | Detail |
|---------|--------|--------|
| Authentication | 🟢 | `AuthenticatedAICaller` derived from `authenticateToken`; `POST /api/v1/ai/search` is mounted and requires a valid bearer token |
| Authorization (permission) | 🟢 | `AI_SEARCH` permission enforced via `requireAuthz` middleware on the AI search route |
| Tenant identity server-derived | 🟢 | `AuthenticatedAICaller.companyId` from `req.user`; `assertNoTenantOverride` rejects client tenant fields recursively |
| Company isolation in AI | 🟢 | retrieval is company-scoped by caller; tenant never client-supplied |
| Prompt-injection resistance | 🟢 | retrieved content is placed as **labelled `user` messages** (never system), redacted, and system instructions forbid using it as authority; test asserts adversarial content never enters system instructions |
| Redaction of sensitive data | 🟢 | `Redactor` wired into `SearchIntentService.extract` before provider call |
| Sensitive-data handling | 🟢 | audit/cost contracts explicitly exclude API keys, JWTs, passwords, unrestricted KYC, raw prompts/responses |
| Provider data transmission | 🟢 | OpenRouter via direct HTTPS `fetch`; redaction is the boundary — system instructions + user query + approved retrieval data only |
| Deterministic output validation | 🟢 | strict schema + `superRefine`; fail-closed |
| Logging / audit events (DB) | 🔴 | no DB `AuditEvent` for AI calls; audit/cost hooks are no-op by default |
| API keys | 🟢 | no AI provider keys configured; mock reads no credentials |
| Client-controlled tenant fields | 🟢 | rejected (see above) |

**Core invariant (verified in `types.ts` and `contextBuilder.ts`):**

> Retrieved CRM content is **DATA**, never **AUTHORITY**. AI must never obtain authority
> from retrieved text and must never override authorization, company isolation, booking
> state, property availability, inventory locks, payments, collections, KYC, permissions,
> SLA rules, or deterministic scoring.


## 7. Current AI limitations (verified)

| Limitation | Impact | Current state |
|------------|--------|---------------|
| No HTTP AI-search route | AI search callable by the authenticated website | ✅ Mounted: `POST /api/v1/ai/search` behind `authenticateToken` → `aiSearchLimiter` → `requireAuthz(AI_SEARCH)` → strict validation |
| OpenAI / Ollama provider adapters | Cannot run against a live OpenAI or local LLM | `MockProvider` default; `OpenRouterProvider` active via direct HTTPS `fetch`; OpenAI/Ollama SDKs declared but unused |
| Provider factory / registry | ✅ Implemented | `createAIProvider` selects `mock` / `openrouter` from `AI_PROVIDER` at runtime |
| No DB persistence of AI audit/cost | No auditability / spend tracking | `NullAuditHook`/`NullCostHook` no-ops |
| No mandatory-field definition | "Complete" vs "incomplete" is provider-semantic | schema permits all-optional `SearchIntent` (⚫ product decision; see §3) |
| No AI observability / UI | No dashboards, no token/cost telemetry | none |
| No AI chat/clarification UI | Incomplete-search routing not user-facing yet | contract (`INCOMPLETE`+`AI_CHAT`) exists; no endpoint/UI |
| No provider failover | Single point of failure when enabled | none |
| `AI_*` env not in `.env.example` | Risk of misconfiguration | AI disabled by default (`mock`) |

## 8. V2 / FUTURE boundaries (not implemented)

- OpenAI / Ollama / local provider adapters (OpenRouter adapter and provider factory already implemented).
- HTTP AI-search endpoint + authN/authZ wiring.
- AI chat/clarification conversational flow for incomplete searches.
- Persistence of AI audit/cost records; cost guardrails; observability dashboards.
- Provider failover / model routing / streaming.
- RAG / embeddings / vector search / recommendation engine (V2, not now).

> Do **not** classify any of the above as implemented. They belong to
> [CRM-V2-ROADMAP](CRM-V2-ROADMAP.md).

## 9. AI decision-making — NOT ALLOWED (summary)

| Decision | Owner | AI allowed? |
|----------|-------|-------------|
| Interpret natural language | AI | ✅ yes (extraction only) |
| Produce structured SearchIntent | AI | ✅ yes |
| Validate the SearchIntent | CRM | ✅ |
| Match properties | CRM | ✅ |
| Calculate match percentage | CRM | ✅ |
| Rank / order results | CRM | ✅ |
| Recommend / tell user what to buy | — | ❌ (AI forbidden; CRM decides) |
| Modify any CRM data | — | ❌ |
| Booking / payment / collection decisions | — | ❌ |
| KYC approval | — | ❌ |
| Override permissions / isolation / SLA / scoring | — | ❌ |

> **AI ROLE:** Natural-language requirement extraction.
> **AI OUTPUT:** Structured search JSON (`SearchIntentExtraction`).
> **CRM ROLE:** Validation + deterministic property matching + match percentage.
> **WEBSITE ROLE:** User interface + display results.
> **AI DECISION-MAKING:** NOT ALLOWED.

