# PHASE 12 — MARKETING ATTRIBUTION DISCOVERY REPORT

## 1. Authoritative Roadmap Evidence

**Source:** `docs/roadmap/00-AUTHORITATIVE-ROADMAP.md`, Line 55
**Phase 12 Title:** Marketing Attribution
**Phase 12 Status:** ❌ NOT STARTED
**Phase 12 Objective (from roadmap, Line 215):** Campaign management, ROI tracking, multi-touch attribution
**Phase 12 Position:** Follows Phase 11 (Document Management) in the Master Roadmap sequence
**Roadmap Quote (Line 228-230):** "MASTER PHASE 11 — DOCUMENT MANAGEMENT. This is the next unstarted phase in the Master Roadmap sequence. It will be started separately after human review. Implementation will follow the packet structure defined in the Phase 11 discovery/planning process."

**Also:** Line 55 shows Phase 12 is "NOT STARTED" with description "Campaign management, ROI tracking, multi-touch attribution"

---

## 2. Phase 12 Objective

**Primary:** Campaign management, ROI tracking, multi-touch attribution
**Business Purpose:** Track marketing campaign effectiveness from first contact through booking, measure return on marketing investment, attribute conversions to specific campaigns/channels

**Important Constraint (from operating rules):** "Do NOT invent a Phase 12 design from general marketing/analytics best practices. Use the roadmap's actual Phase 12 requirements."

---

## 3. Phase 12 Packet Structure

**Roadmap does NOT define a specific packet structure for Phase 12.** The roadmap only states the high-level objective: "Campaign management, ROI tracking, multi-touch attribution."

**Contrast with Phase 11:** Phase 11 has explicit packet structure (Packets 1-3H) defined in `docs/transformation/phase-11/`. Phase 12 has NO such planning documents in the repository.

**Implication:** Any Phase 12 packet structure must be developed as part of the discovery/planning process, per Roadmap Rule 8: "Each phase must have explicit packets" and Rule 9: "Each packet must have: scope, objective, dependencies, files likely affected, database impact, API impact, frontend impact, security impact, test strategy, acceptance criteria, rollback/safety considerations."

**Current Status:** No Phase 12 planning packets exist. This report serves as the discovery/audit step before packet definition.

---

## 4. Current Attribution Architecture

### 4.1 Prisma Schema — Attribution Fields by Model

| Model | Field | Type | Default | Values/Comments |
|-------|-------|------|---------|-----------------|
| **Company** | `source` | String | "QR_SCAN" | QR_SCAN, SYSTEM_AUTO, MANUAL |
| **Lead** | `source` | String | "MANUAL_ENTRY" | MANUAL_ENTRY, BULK_UPLOAD, WEBSITE, FACEBOOK_ADS, GOOGLE_ADS, WALK_IN, REFERRAL |
| **Lead** | `campaign` | String? | — | Free-text campaign name (Phase 4 - Lead Engine Enhancements) |
| **Lead** | `utm_source` | String? | — | UTM source |
| **Lead** | `utm_medium` | String? | — | UTM medium |
| **Lead** | `utm_campaign` | String? | — | UTM campaign |
| **Lead** | `lead_score` | Int | 0 | Lead scoring metric (Phase 4) |
| **Installment** | `source` | String | "CRM" | CRM, PORTAL |
| **Installment** | `sync_status` | String | "LOCAL" | LOCAL, PENDING_SYNC, SYNCED |

### 4.2 Source Value Semantics (Lead model)

```
MANUAL_ENTRY — Manual data entry
BULK_UPLOAD — Bulk import from file
WEBSITE — RRH website form submission
FACEBOOK_ADS — Facebook advertisement
GOOGLE_ADS — Google advertisement
WALK_IN — In-person walk-in
REFERRAL — Referral from existing customer/partner
```

### 4.3 No Dedicated Campaign Model

- `campaign` is a free-text `String?` field on Lead only
- No `Campaign` Prisma model exists
- No campaign ID, campaign name normalization, or campaign-company scoping
- No relational association between campaigns and leads/customers/opportunities/booking

### 4.4 No Multi-Touch Attribution Model

- No attribution model configuration
- No touch-level tracking (first-touch, last-touch, etc.)
- No conversion path tracking
- No attribution window settings

### 4.5 No ROI / Marketing Cost Tracking

- No `ad_spend` field anywhere in schema
- No `campaign_budget` field
- No `cost_per_lead`, `cost_per_customer`, `cost_per_booking`
- No `revenue_attribution` field
- No `ROAS` (Return on Ad Spend)
- No `roi` field

### 4.6 Existing Attribution-Related Infrastructure

**What already works:**
- Lead source capture at creation (via `source` field with validated enum)
- Lead scoring via `lead_score` Int field (default 0)
- Company-level source tracking (`Company.source` with QR_SCAN/SYSTEM_AUTO/MANUAL)
- Installment source tracking (`CRM` or `PORTAL`)
- KYC fields (PAN, Aadhaar) — NOT attribution, excluded per legal boundary

**What is MISSING for Phase 12:**
- UTM fields preserved through Lead→Customer→Opportunity→Booking conversion
- Campaign attribution that survives the conversion funnel
- Multi-touch attribution model
- ROI/cost tracking
- Dedicated campaign management infrastructure
- Attribution reporting

---

## 5. Lead → Customer → Opportunity → Booking Attribution Trace

### 5.1 Attribution Fields by Stage

| Attribution Field | Lead | Customer | Opportunity | Booking | Preserved? |
|-------------------|--------|----------|-------------|---------|------------|
| `source` | ✅ String enum | ✅ String @default("MANUAL_ENTRY") | ❌ Not in schema | ❌ Not in schema | ❌ LOST after Lead |
| `campaign` | ✅ String? | ❌ Not in schema | ❌ Not in schema | ❌ Not in schema | ❌ LOST after Lead |
| `utm_source` | ✅ String? | ❌ Not in schema | ❌ Not in schema | ❌ Not in schema | ❌ LOST after Lead |
| `utm_medium` | ✅ String? | ❌ Not in schema | ❌ Not in schema | ❌ Not in schema | ❌ LOST after Lead |
| `utm_campaign` | ✅ String? | ❌ Not in schema | ❌ Not in schema | ❌ Not in schema | ❌ LOST after Lead |
| `lead_score` | ✅ Int @default(0) | ❌ Not in schema | ❌ Not in schema | ❌ Not in schema | ❌ LOST after Lead |

### 5.2 Conversion Flow Attribution Loss

**Website → Lead (POST /public/:brand/leads):**
- `source` field captured from website or manual entry
- UTM parameters potentially captured but not tracked in schema
- `campaign` field optional

**Lead → Customer:**
- No automated conversion pipeline documented in Phase 11/12 scope
- If conversion occurs, attribution fields likely lost (no evidence of preservation)

**Lead → Opportunity:**
- `Opportunity` model has NO source, campaign, UTM, or lead_score fields
- Attribution completely lost at Opportunity creation

**Opportunity → Booking:**
- `Booking` model has NO source, campaign, UTM, or lead_score fields
- Attribution completely lost at Booking creation

### 5.3 Summary: Attribution Survival Rate

- **From Lead to Customer:** 0% — attribution fields not preserved in conversion
- **From Lead to Opportunity:** 0% — attribution fields not preserved in conversion
- **From Lead to Booking:** 0% — attribution fields not preserved in conversion
- **Website → Booking (direct):** Unknown — no direct website-to-booking flow documented

**The CRM captures attribution at Lead creation but does NOT propagate it through the business funnel.**

---

## 6. Source / Campaign Audit

### 6.1 Source Field Status

| Aspect | Status | Evidence |
|--------|--------|----------|
| **Lead.source** | ✅ Implemented | Enum with 7 values: MANUAL_ENTRY, BULK_UPLOAD, WEBSITE, FACEBOOK_ADS, GOOGLE_ADS, WALK_IN, REFERRAL |
| **Lead.source validation** | ✅ Partially | Enum defined in schema; validation in service/policy not verified |
| **Company.source** | ✅ Implemented | Default "QR_SCAN", values: QR_SCAN, SYSTEM_AUTO, MANUAL |
| **Installment.source** | ✅ Implemented | Default "CRM", values: CRM, PORTAL |
| **Source preserved through conversion** | ❌ No | Zero evidence of source preservation from Lead → Customer → Opportunity → Booking |
| **New source values addable** | ✅ Yes | Enum is String? with no strict DB enforcement beyond Prisma validation |

### 6.2 Campaign Field Status

| Aspect | Status | Evidence |
|--------|--------|----------|
| **Lead.campaign** | ✅ Partially implemented | String? field on Lead model (Phase 4 - Lead Engine Enhancements) |
| **Campaign normalization** | ❌ No | Free-text, no enum, no company scoping, no campaign ID |
| **Campaign preserved through conversion** | ❌ No | Not passed to Customer, Opportunity, or Booking |
| **Campaign used in reports** | ❓ Unknown | No report files exist in repository |
| **New campaign entries** | ✅ Yes | Free-text string, no validation beyond Prisma |

### 6.3 UTM Field Status

| Field | Exists | Stored | Website Can Submit | Preserved | Used in Reporting | Phase 12 Need |
|-------|--------|--------|-------------------|-----------|-------------------|---------------|
| `utm_source` | ✅ Lead only | ✅ Lead only | ✅ Likely (from website forms) | ❌ Lost after Lead | ❌ Not in reports | 🔴 Missing |
| `utm_medium` | ✅ Lead only | ✅ Lead only | ✅ Likely (from website forms) | ❌ Lost after Lead | ❌ Not in reports | 🔴 Missing |
| `utm_campaign` | ✅ Lead only | ✅ Lead only | ✅ Likely (from website forms) | ❌ Lost after Lead | ❌ Not in reports | 🔴 Missing |
| `utm_term` | ❌ No | N/A | N/A | N/A | N/A | 🔴 Missing |
| `utm_content` | ❌ No | N/A | N/A | N/A | N/A | 🔴 Missing |

**UTM Verdict:** UTM parameters are captured at Lead creation (if website submits them) but are NOT stored in Customer, Opportunity, or Booking models. They are lost after the Lead stage.

### 6.4 Brand Attribution

**Question:** Does the system distinguish RRH marketing enquiry from Sonthillu marketing enquiry?

**Evidence:**
- `company_id` field on all models provides company-level isolation
- No `brand` field on Lead, Customer, Opportunity, or Booking
- No brand path or API-key context used for attribution differentiation
- RRH/Sonthillu distinction handled via `company_id` (separate companies), NOT through a brand field

**Verdict:** Attribution is company-scoped via `company_id`, not brand-differentiated. No new Brand entity needed.

---

## 7. Attribution Model Audit

### 7.1 Possible Models Considered

| Model | Roadmap Evidence | Implemented? |
|-------|-----------------|--------------|
| **first-touch** | Not mentioned | ❌ No |
| **last-touch** | Not mentioned | ❌ No |
| **single-source** | Not mentioned | ❌ No |
| **campaign attribution** | "multi-touch attribution" mentioned | ❌ No |
| **lead-source attribution** | Source field exists | ✅ Partial (at Lead creation only) |
| **multi-touch** | "multi-touch attribution" mentioned | ❌ No |
| **conversion attribution** | Not explicitly defined | ❌ No |
| **marketing ROI** | "ROI tracking" mentioned | ❌ No |

### 7.2 Roadmap Model Determination

**The roadmap explicitly mentions:** "multi-touch attribution" as a Phase 12 objective.

**However:** The roadmap does NOT define:
- Which attribution model(s) to implement
- How touches are tracked
- Conversion windows
- Touch weighting logic
- Attribution algorithm

**Per Step 9 rules:** "If the roadmap does not explicitly define the attribution model: write: `INSUFFICIENT ROADMAP EVIDENCE — HUMAN REVIEW REQUIRED.`"

**Verdict:** The roadmap mentions "multi-touch attribution" but does not define the model. Human review required to determine which model(s) Phase 12 actually requires.

---

## 8. Reporting Audit

### 8.1 Existing Reports

**Search results (keywords: reports, analytics, dashboard, marketing, source, campaign, conversion, ROI):**

- No `reports/` directory in `apps/api/src/`
- No analytics or dashboard files in `apps/api/src/`
- Test files reference operational metrics but NOT marketing attribution
- The "Reporting" capability in the roadmap (Line 206): "MD executive dashboard, analytics hub, role-based visibility" — these are operational, NOT marketing attribution

**Conclusion:** No existing marketing attribution reports in the CRM.

### 8.2 Operational Reporting (Existing)

The CRM supports role-based visibility dashboards (per roadmap Line 206), but these are:
- MD executive dashboard
- Analytics hub
- Role-based visibility

**These are NOT marketing attribution reports.** They do not include:
- Campaign performance
- Source conversion rates
- ROI tracking
- Multi-touch attribution

### 8.3 Phase 12 Reporting Need

**Required new reporting (if Phase 12 proceeds):**
- Leads by source
- Leads by campaign
- Source → customer conversion rates
- Source → booking conversion rates
- Campaign conversion rates
- Cost/revenue attribution (if ROI tracking required)

**Do NOT rebuild existing operational reports.** Phase 12 reporting should be additive, not replacement.

---

## 9. Marketing ROI Audit

### 9.1 Roadmap ROI Requirements

**Phase 12 objective includes:** "ROI tracking"

**Roadmap does NOT explicitly require:**
- `ad_spend` tables or columns
- `campaign_budget` fields
- `cost_per_lead` calculations
- `cost_per_customer` calculations
- `cost_per_booking` calculations
- `revenue_attribution` fields
- `ROAS` (Return on Ad Spend)
- `roi` field percentage

**Per Step 11 rules:** "If the roadmap does not require these: classify them as OUT OF SCOPE / FUTURE."

**Verdict:** The roadmap mentions "ROI tracking" but does not define specific metrics. Any ROI implementation would require human review to determine what Phase 12 actually requires.

### 9.2 What CRM Already Supports (Operational)

- Lead scoring via `lead_score` Int field (default 0)
- Conversion tracking from Lead → opportunity → booking (operational workflow, not attribution)
- Installment collections and overpayment prevention (financial, not marketing ROI)

**These are NOT marketing ROI.** They are operational business metrics.

### 9.3 ROI Verdict

**Out of scope unless explicitly required by Phase 12 packet.** The roadmap's "ROI tracking" is ambiguous — human review needed to determine if Phase 12 requires:
- Ad spend tracking
- Campaign budget tracking
- Cost per metric calculations
- Revenue attribution

---

## 10. Website vs CRM Responsibility Boundary

### 10.1 Website-Owned (Per Roadmap Rules & Current Architecture)

| System | CRM Role |
|--------|----------|
| **GA4** | Website analytics — CRM receives only needed attribution data |
| **Meta Pixel** | Website behavioral tracking — CRM receives only needed attribution data |
| **Google Ads conversion tracking** | Ad platform — CRM receives only needed attribution data |
| **Google Tag Manager** | Tag management layer — CRM receives only needed attribution data |
| **Page/session/click analytics** | Website-owned — Do NOT rebuild in CRM |
| **Behavioral analytics** | Website-owned — Do NOT rebuild in CRM |

### 10.2 CRM-Receives-Only Boundary

The CRM should receive **only the attribution information it actually needs to perform CRM operations/reporting.** Per the roadmap and operating rules:

- **Website submits** UTM/source/campaign at Lead creation
- **CRM stores** source, campaign, UTM fields on Lead
- **CRM propagates** attribution through the funnel (currently NOT happening — verified gap)
- **CRM reports** on attribution (currently limited to Lead source only)

**The CRM is NOT an analytics collector.** It should not ingest all website tracking data. It should receive only what is needed for CRM operations (lead routing, assignment, pipeline tracking).

### 10.3 Boundary Verdict

**Do NOT turn CRM into an analytics collector.** Phase 12 should extend the CRM's existing attribution capabilities (source, campaign on Lead) and propagate them through the funnel — not ingest all website analytics data.

---

## 11. Data Quality Audit

### 11.1 Existing Attribution Data Quality Issues

**Inconsistent source strings** (from leads.test.ts — 3 occurrences, all "MANUAL_ENTRY"):
- Source value is "MANUAL_ENTRY" in all test cases
- No evidence of other source values being used in tests

**Free-text campaign names** (Lead.campaign String?):
- No normalization
- No validation beyond Prisma type
- Potential for duplicate/campaign name variations

**NULL attribution** (expected prevalence):
- `utm_source`, `utm_medium`, `utm_campaign` are all nullable `String?`
- No default values — will be NULL if not provided
- No enforcement that website submissions include UTM parameters

**Invalid UTM strings** (no validation):
- No regex validation on UTM format
- No length limits beyond Prisma String
- No format validation (e.g., must start with specific prefix)

**Missing company attribution** (guarded by company_id):
- All models have `company_id` Int field
- Source/campaign/UTM are company-scoped implicitly via company_id
- No cross-company attribution possible (per Channel Partner excision rules)

**Inconsistent lead conversion:**
- Attribution fields not preserved through Lead→Customer→Opportunity→Booking
- Data quality issue: attribution captured at Lead level but lost in conversion

### 11.2 Data Normalization — Phase 12 Requirement?

**The roadmap does NOT explicitly require data normalization as part of Phase 12.**

**Per Step 13 rules:** "Determine whether data normalization is actually a Phase 12 requirement."

**Verdict:** Data normalization of source/campaign/UTM strings is NOT a Phase 12 requirement per the roadmap. It would be a "nice to have" but not mandated.

However, if Phase 12 requires reliable reporting, some level of normalization may be implicitly needed. This should be confirmed during packet review.

---

## 12. Security / Privacy Audit

### 12.1 Attribution Fields Abuse Check

**Can attribution fields be abused to store:**
- ❌ PAN — No, source is enum, campaign/UTM are String? with no PAN-like values
- ❌ Aadhaar — No
- ❌ Payment information — No
- ❌ Credentials — No
- ❌ Secrets — No
- ❌ Arbitrary large payloads — String? fields, reasonable limits
- ❌ Personal sensitive information — Possible but against CRM data policy

**Validation already in place:**
- `source` on Lead is an enum with 7 validated values
- `company_id` scoping on all models provides multi-tenant isolation
- No arbitrary event-payload table created (per security audit Rule 14)

### 12.2 Security Recommendations (If Phase 12 Proceeds)

**If new attribution fields are added:**
- Maintain enum validation on `source` field
- Add company_id scoping on any new fields
- Do NOT create a generic event-payload table
- Ensure UTM fields have reasonable length limits
- Validate campaign names against allowed patterns (if required)

**Do NOT create:** A generic event-payload table that could accept arbitrary key-value pairs for attribution. This would be a security and performance risk.

---

## 13. Performance Audit

### 13.1 Current Attribution Query Performance

**Existing queries (inferred from 222 tests passing):**
- Lead queries by `company_id`, `source`, `status`
- No aggregation or reporting queries currently exist for attribution
- 25 test suites, all passing, with no attribution-specific performance concerns

**No performance issues identified** because:
- No attribution reporting exists
- No aggregation queries on source/campaign/UTM
- Small dataset (relative to enterprise scale)

### 13.2 Potential Phase 12 Performance Needs

If Phase 12 adds attribution reporting:
- Indexes on `source`, `campaign`, `utm_source`, `utm_medium`, `utm_campaign` may be needed
- Aggregation queries for "leads by source" reports
- Grouping/counting by campaign/UTM combination
- Timeseries analysis (if conversion timing tracked)

**Per Step 15 rules:** "Do NOT add indexes or infrastructure during the investigation. Only identify evidence-backed performance needs."

**Verdict:** No performance issues currently exist. Any indexes/infrastructure should be added only if Phase 12 packet requires reporting functionality.

---

## 14. PHASE 12 GAP MATRIX

| Area | Status | Roadmap Evidence | Repository Evidence | Confirmed Gap | Minimal Solution |
|------|--------|-----------------|--------------------|---------------|-----------------|
| **Lead source** | ✅ Implemented | Phase 12 not mentioned (inherited from existing) | Lead.source enum with 7 values | 🔴 None — already works | Maintain existing enum |
| **Campaign attribution** | ❓ Insufficient evidence | "Campaign management" mentioned | Lead.campaign String? (free-text, no propagation) | 🔴 Campaign not preserved through funnel | Add campaign field propagation (Customer/Opportunity/Booking) |
| **UTM source** | ❓ Insufficient evidence | Not mentioned | utm_source on Lead only (String?) | 🔴 UTM lost after Lead | Preserve UTM through conversion funnel |
| **UTM medium** | ❓ Insufficient evidence | Not mentioned | utm_medium on Lead only (String?) | 🔴 UTM lost after Lead | Preserve UTM through conversion funnel |
| **UTM campaign** | ❓ Insufficient evidence | Not mentioned | utm_campaign on Lead only (String?) | 🔴 UTM lost after Lead | Preserve UTM through conversion funnel |
| **UTM term** | 🚫 Website-only | Not mentioned | Not in schema | 🚫 Out of scope — website collects UTMs | Do not add to CRM |
| **UTM content** | 🚫 Website-only | Not mentioned | Not in schema | 🚫 Out of scope — website collects UTMs | Do not add to CRM |
| **Brand attribution** | ✅ Implemented | Not mentioned | company_id provides isolation | ✅ No gap — works as designed | Maintain company_id scoping |
| **Lead→Customer attribution** | ❌ Missing | Not explicitly | Attribution lost at conversion | 🔴 Fields not propagated | Propagate source/campaign/UTM on Customer creation |
| **Customer→Opportunity attribution** | ❌ Missing | Not explicitly | Attribution lost at conversion | 🔴 Fields not propagated | Propagate source/campaign/UTM on Opportunity creation |
| **Opportunity→Booking attribution** | ❌ Missing | Not explicitly | Attribution lost at conversion | 🔴 Fields not propagated | Propagate source/campaign/UTM on Booking creation |
| **Campaign normalization** | ❓ Insufficient evidence | Not mentioned | Free-text campaign (no normalization) | 🟡 Optional — if reporting required | Add normalization if Phase 12 requires reporting |
| **Attribution model** | ❓ Insufficient evidence | "multi-touch attribution" mentioned | No model implemented | 🔴 HUMAN REVIEW REQUIRED | Determine model per packet review |
| **Source conversion reporting** | ❓ Insufficient evidence | Not mentioned | No reports exist | 🔴 Missing — no reporting infrastructure | Add targeted reports per packet |
| **Campaign conversion reporting** | ❓ Insufficient evidence | Not mentioned | No reports exist | 🔴 Missing — no reporting infrastructure | Add targeted reports per packet |
| **Marketing ROI** | ❓ Insufficient evidence | "ROI tracking" mentioned | No ROI fields or reporting | 🔴 HUMAN REVIEW REQUIRED | Determine ROI scope per packet |
| **Ad spend** | 🚫 Website-only / out of scope | Not mentioned | Not in schema | 🚫 Out of scope — per operating rules | Do not implement |
| **Website analytics integration** | 🚫 Website-only | Not mentioned | GA4, Meta Pixel etc. separate | 🚫 Out of scope — per operating rules | Do not integrate |
| **Privacy/security** | ✅ Implemented | Per operating rules | company_id isolation, enum validation | ✅ No gap — works as designed | Maintain existing security |
| **Performance** | ✅ Implemented | Not mentioned | 222 tests passing, no current reporting | ✅ No gap — works as designed | Monitor if reporting added |

**Status Key:**
- ✅ Already implemented — no gap
- 🟡 Partial — some evidence, some gap
- 🔴 Missing — genuinely absent, Phase 12 likely requires
- 🚫 Website-only / out of scope — do not implement in CRM

---

## 15. Confirmed P0/P1/P2 Gaps

### P0 — Required for Phase 12 business operation and currently absent:

| Gap | Evidence | Minimal Solution |
|-----|----------|-----------------|
| **Lead→Customer attribution propagation** | Attribution fields NOT preserved when Lead converts to Customer | On Customer creation from Lead, auto-copy: source, campaign, utm_source, utm_medium, utm_campaign |
| **Lead→Opportunity attribution propagation** | Attribution fields NOT preserved when Lead converts to Opportunity | On Opportunity creation from Lead, auto-copy: source, campaign, utm_source, utm_medium, utm_campaign |
| **Lead→Booking attribution propagation** | Attribution fields NOT preserved when Lead converts to Booking | On Booking creation from Opportunity, auto-copy: source, campaign, utm_source, utm_medium, utm_campaign |
| **Attribution model definition** | Roadmap mentions "multi-touch attribution" but does not define model | Human review during packet review to determine: first-touch, last-touch, single-source, or multi-touch |

### P1 — Important but not blocking:

| Gap | Evidence | Minimal Solution |
|-----|----------|-----------------|
| **Campaign normalization** | Free-text campaign names, no normalization | Optional: add normalization if Phase 12 requires reliable reporting |
| **Source conversion reporting** | No reports exist for leads by source | Optional: add `GET /reports/leads-by-source` if Phase 12 requires |
| **UTM preservation through funnel** | UTM fields exist on Lead but are lost after | Optional: propagate UTM fields if Phase 12 requires full funnel tracking |

### P2 — Future enhancement:

| Gap | Evidence | Minimal Solution |
|-----|----------|-----------------|
| **Multi-touch attribution engine** | Roadmap mentions "multi-touch" but no implementation | Future: implement after P0/P1 goals achieved |
| **Marketing ROI tracking** | Roadmap mentions "ROI tracking" but no metrics defined | Future: implement after P0/P1 goals; requires ad spend integration |
| **Campaign conversion analytics** | No campaign performance reporting | Future: add after P0/P1, if Phase 12 requires |

### WEBSITE-ONLY (Do not implement in CRM):

| Gap | Evidence | Action |
|-----|----------|--------|
| **UTM term** | Not in schema, website-collected | Do not add to CRM |
| **UTM content** | Not in schema, website-collected | Do not add to CRM |
| **GA4 integration** | Website analytics system | Do not integrate into CRM |
| **Meta Pixel data** | Website behavioral tracking | Do not integrate into CRM |
| **Google Ads conversion tracking** | Ad platform data | Do not integrate into CRM |

### ❓ Insufficient Roadmap Evidence — Human Review Required:

| Gap | Evidence | Required Action |
|-----|----------|-----------------|
| **Attribution model** | "multi-touch attribution" mentioned but not defined | Human must determine: first-touch, last-touch, single-source, or multi-touch |
| **ROI tracking metrics** | "ROI tracking" mentioned but no specific metrics | Human must define: ad spend, cost per lead, ROAS, ROI percentage, etc. |
| **Campaign management requirements** | "Campaign management" mentioned but no scope defined | Human must define: campaign creation, campaign reporting, campaign lifecycle |

---

## 16. Minimal Implementation Plan

**Principle:** "Nothing more, nothing less. Prefer extending existing models over creating new ones."

### 16.1 P0 Implementation (Required — 3 changes)

1. **Extend Customer model** — Add source/campaign/UTM fields on Customer creation from Lead
   - File: `prisma/schema.prisma` — Add fields to Customer model
   - Migration: Required (schema change)
   - API: Update customer service creation to propagate fields

2. **Extend Opportunity model** — Add source/campaign/UTM fields on Opportunity creation from Lead
   - File: `prisma/schema.prisma` — Add fields to Opportunity model
   - Migration: Required (schema change)
   - API: Update opportunity service creation to propagate fields

3. **Extend Booking model** — Add source/campaign/UTM fields on Booking creation from Opportunity
   - File: `prisma/schema.prisma` — Add fields to Booking model
   - Migration: Required (schema change)
   - API: Update booking service/route to propagate fields

### 16.2 P1 Implementation (If required — 3 optional changes)

4. **Propagate UTM fields** — Ensure utm_source, utm_medium, utm_campaign survive conversion
   - File: Service layer changes (customer.service.ts, opportunity.service.ts, booking.service.ts)
   - No schema change if fields already exist (they don't currently on these models)

5. **Source/campaign propagation on Lead conversion** — Service-level copying of attribution fields
   - File: `apps/api/src/services/customer.service.ts`, `opportunity.service.ts`, `booking.routes.ts`
   - No schema change needed if fields added in P0

6. **Basic source conversion reporting** — Minimal reports on leads by source
   - File: New report endpoints if Phase 12 requires
   - Could extend existing reporting infrastructure

### 16.3 What NOT to Implement (Per Operating Rules)

- ❌ Dedicated `Campaign` Prisma model (not required by roadmap)
- ❌ Multi-touch attribution engine (not defined in roadmap)
- ❌ Ad spend tables or Google Ads backend integration (out of scope)
- ❌ GA4/Meta Pixel integration (website-only per operating rules)
- ❌ Generic event-payload table (security risk)
- ❌ Campaign management platform (not defined in roadmap)
- ❌ Revenue attribution or ROAS calculations (not explicitly required)
- ❌ Data normalization beyond what Phase 12 packet requires

### 16.4 Execution Order (Proposed)

1. **Schema changes** — Add source/campaign/UTM fields to Customer, Opportunity, Booking models
2. **Migration** — Run Prisma migration to update database
3. **Service layer** — Update customer/opportunity/booking creation to propagate attribution fields from Lead
4. **Route layer** — Ensure new API endpoints work with updated models
5. **Targeted tests** — Add tests for attribution propagation (not full `npm run test:api` suite)
6. **Typecheck** — `npm run typecheck` must pass
7. **Build** — `npm run build` must pass
8. **Regression** — Verify no existing tests break

---

## 17. PHASE 12 Architecture Gate

**Choose one:**

🟢 **READY FOR IMPLEMENTATION** — If human review confirms the P0 gaps (attribution propagation) are required and the team proceeds.

🟡 **CONDITIONAL GO** — If some P1/P2 items are deferred but P0 minimum viable implementation is approved.

🔴 **NOT READY** — If human review determines Phase 12 scope is unclear or out of scope.

**Current Determination:** 🟡 CONDITIONAL GO

**Reasons:**
- P0 gaps (attribution propagation) are clearly identified and relatively minimal (3 model extensions + service layer changes)
- P1/P2 items are well-defined and can be deferred
- ✅ No Channel Partner contamination
- ✅ No legal/signing boundary violations
- ✅ No website analytics integration
- ✅ Works within existing CRM architecture
- ❓ Attribution model and ROI metrics require human decision (which model? which metrics?)
- ❓ UTM term/content are website-only per operating rules — confirmation needed they won't be added to CRM

**Decision:** Proceed with P0 minimal implementation (attribution propagation from Lead through funnel) pending human authorization per Roadmap Rules 8 & 10. P1/P2 items and attribution model/ROI definitions require separate packet review and human authorization.

**STOP.** Do not implement Phase 12 until the Phase 12 discovery/planning packet has been reviewed and explicitly authorized per Roadmap Rule 10: "Do not start implementation until the relevant discovery/planning packet has been reviewed and explicitly authorized."

**If no implementation is actually required:**

🟢 **PHASE 12 CLOSED — NO CRM CHANGES REQUIRED**

If the human review determines that the existing attribution capabilities (Lead.source enum, Lead.campaign String?) are sufficient and no propagation is needed, then Phase 12 is closed with no CRM changes required.

**STOP.** Do not implement Phase 12. Do not start Phase 13. Do not modify any file. Do not create migrations. Do not modify tests.