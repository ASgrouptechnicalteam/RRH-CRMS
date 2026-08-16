# CRM WEBSITE READINESS GAP MATRIX

**Date:** 15 August 2026
**Documents:** RRH-CRMS Requirements for RRH + Sonthillu Websites v1.0, RRH + Sonthillu Websites PRD Blueprint Draft 1.0
**Scope:** CRM-side readiness only. No website implementation.
**Baseline:** 35 suites / 371 tests passing.

---

## How to Read This Matrix

| Symbol | Meaning |
|--------|---------|
| ✅ | Already implemented — CRM provides this |
| 🟡 | Partially implemented — exists but needs extension |
| 🔴 | Missing — CRM does not provide this; website cannot build without it |
| 🚫 | Out of scope for CRM (website-side or future concern) |

---

## 1. PROPERTY TAXONOMY & CATEGORIES

**Requirement:** Websites need stable canonical IDs + public labels for property types. RRH = Commercial, Agricultural Land, Open Plots. Sonthillu = Apartments, Independent Houses, Villas. New/Resale variants for both.

**Evidence:**
- `Property.category` enum: `APARTMENT, INDEPENDENT_HOUSE, DUPLEX, INDEPENDENT_FLOOR, VILLA, PENTHOUSE, STUDIO, PLOT, FARM_HOUSE, AGRICULTURAL_LAND` (schema.prisma:491)
- `Property.brand_type`: `SONTHILLU | RADHA_REAL_HOMES` (schema.prisma:490)
- `PropertyCreateSchema` shared enum matches (shared/index.ts:604-607)

**Gap:** `PLOT` exists but the RRH brand also needs categories like `COMMERCIAL_OFFICE`, `COMMERCIAL_SHOP`, `COMMERCIAL_LAND`, `OPEN_PLOT` that aren't explicitly in the enum. `FARM_HOUSE` may need to be `AGRICULTURAL_LAND` (which exists). No `NEW_RESALE` classification field.

**Verdict:** 🟡 **PARTIAL** — Core taxonomy exists. Missing: commercial subcategories, explicit New/Resale dimension.

---

## 2. PROJECT HIERARCHY (Project/Tower/Floor/Unit/Plot)

**Requirement:** Projects may contain towers/buildings, floors, and units (apartments) or individual plots (layouts). Project pages need project-level data + current available inventory.

**Evidence:**
- `Project` model exists with `id, project_code, name, description, location, total_area, launch_date, status, amenities, assigned_pm_id` (schema.prisma:452-480)
- `Property.project_id` FK links property to project (schema.prisma:485)
- `ProjectService` has CRUD + list with PM assignment (project.service.ts)

**Gap:** No tower/building/floor/unit sub-hierarchy. A project has `properties[]` but no intermediate grouping (e.g., Tower A → Floor 3 → Unit 301). PRD explicitly requires this hierarchy.

**Verdict:** 🟡 **PARTIAL** — Project→Property link exists. Missing: tower/floor/unit intermediate levels for apartment projects.

---

## 3. PROPERTY FIELDS — AVAILABILITY

**Requirement:** Inventory states: Available, Reserved, Sold. Availability must be separate from publication and construction status. Reserved/Sold must NOT be exposed as live public inventory.

**Evidence:**
- `Property.status` enum: `PENDING_VERIFICATION, PENDING_DM_POLISH, PENDING_MD_APPROVAL, LIVE, REJECTED, LOCKED, BOOKED, SOLD` (schema.prisma:500)
- `Property.locked_until` + `locked_by_booking_id` for reservation locking (schema.prisma:525-527)
- Booking status: `INITIATED, PENDING, TOKEN_RECEIVED, CONFIRMED, REGISTERED, COMPLETED, CANCELLED` (schema.prisma:749)

**Gap:** No explicit `availability_status` field (AVAILABLE/RESERVED/SOLD). The current `status` conflates workflow status (PENDING_VERIFICATION) with availability (SOLD). The public API filters `status: 'LIVE'` which doesn't distinguish Available vs Reserved vs Sold. Need a separate `availability_status` field.

**Verdict:** 🟡 **PARTIAL** — Locking mechanism exists for reservation. Missing: explicit `availability_status` enum separate from workflow status.

---

## 4. PROPERTY FIELDS — PUBLICATION

**Requirement:** Per-brand publication control. A property can be published for RRH only, Sonthillu only, both, or neither. Publication requires PM verification → DM polish → MD approval.

**Evidence:**
- Workflow: PENDING_VERIFICATION → PENDING_DM_POLISH → PENDING_MD_APPROVAL → LIVE (property.service.ts:206, 256, 298)
- `brand_type` is a single value (SONTHILLU or RADHA_REAL_HOMES) (schema.prisma:490)
- Public API filters by brand: `GET /api/v1/public/:brand/properties` with `status: 'LIVE'` (public.ts:49-53)

**Gap:** `brand_type` is single-select — a property belongs to ONE brand only. Requirements explicitly state a property can be associated with BOTH companies and published independently per brand. Need a `PropertyPublication` junction table or similar mechanism for per-brand publication control.

**Verdict:** 🔴 **MISSING** — Cannot independently publish to RRH and Sonthillu. This is a critical gap.

---

## 5. PROPERTY FIELDS — PUBLIC-SAFE DATA

**Requirement:** Public payload must exclude seller identity, internal source type, exact coordinates, internal notes. Must include: stable ID, title, slug, type, classification, price range, location (safe), area, specifications, amenities, RERA badge, media, verification badge, availability.

**Evidence:**
- Public API returns all property fields including `brand_type`, full `location`, `address` (public.ts:49-61)
- No `is_public_safe()` or field-level public/private filtering
- `seo_title` and `seo_keywords` exist on Property (schema.prisma:507-508)
- No `slug` field on Property
- No `new_resale` classification field
- No price range (min/max) — only single `price`
- No approximate/safe location — only exact `location` + `address`

**Gap:** Major: No slug, no new/resale, no price range, no public-safe data filtering, no approximate location. The public API currently returns ALL fields raw.

**Verdict:** 🔴 **MISSING** — Public-safe data contract not implemented.

---

## 6. DUAL-BRAND PUBLICATION

**Requirement:** Property A: RRH = Published, Sonthillu = Not Published. Property B: both Published. CRM must support independent per-brand publication.

**Evidence:**
- `brand_type` is a single enum value (schema.prisma:490)
- Public API hard-filters by brand (public.ts:41-47)
- No junction table for brand↔publication relationship

**Gap:** Completely missing. Cannot associate a property with both brands or control publication independently per brand.

**Verdict:** 🔴 **MISSING** — Fundamental structural gap.

---

## 7. MEDIA / PHOTO HANDLING

**Requirement:** Approved photos/videos for public display. CRM PM captures photographs during site verification.

**Evidence:**
- `PropertyImage` model: `id, property_id, image_url, is_primary, uploaded_by_id` (schema.prisma:539-552)
- Public API includes `images: true` (public.ts:55)
- `Document` model supports `PROPERTY_TITLE`, `PROPERTY_PLAN` types (shared/index.ts:735-736)

**Gap:** Only images supported — no video support. No `is_approved` or `is_public` flag on images for DM-controlled publication. No image ordering/sorting field. No optimization/CDN metadata.

**Verdict:** 🟡 **PARTIAL** — Image storage exists. Missing: video, approval flag, ordering, public/private control per image.

---

## 8. RERA DOCUMENTS & VERIFICATION BADGE

**Requirement:** Public verified badge/status as approved. Detailed RERA documents remain internal. RERA can be shown as public indicator where applicable.

**Evidence:**
- `Document` model supports `document_type` with verification workflow (schema.prisma:913-985)
- `Document.verification_status`: PENDING/VERIFIED/REJECTED (schema.prisma:940)
- No explicit `RERA` document type in the enum
- No `rera_number` or `rera_verified` field on Property
- No public-safe RERA indicator derivation

**Gap:** No RERA-specific fields on Property. No RERA document type. No public badge derivation logic.

**Verdict:** 🟡 **PARTIAL** — Generic document verification exists. Missing: RERA-specific schema, public badge.

---

## 9. LOCATION / GEOLOCATION

**Requirement:** CRM site verification captures latitude, longitude, accuracy, timestamp, employee identity. Exact coordinates remain internal; public receives approximate location. Structured state/city/locality/project identifiers needed.

**Evidence:**
- `Property.location` is a single string field (schema.prisma:494)
- `Property.address` is a text field (schema.prisma:495)
- No `latitude`, `longitude`, `accuracy`, `location_captured_at` fields
- No `state`, `city`, `locality` structured fields
- No `PropertyVerificationLog` capturing GPS data

**Gap:** Completely missing structured location. No GPS capture fields. No approximate location derivation. Location is a flat string — not structured for geographic search.

**Verdict:** 🔴 **MISSING** — No geolocation or structured location support.

---

## 10. SELLER INTAKE / RESALE SUBMISSION

**Requirement:** Website seller form → CRM intake → PM assignment. Seller submits basic details; no images required during initial submission.

**Evidence:**
- `Lead` model with `source: 'WEBSITE'` exists (schema.prisma:362)
- Public lead creation: `POST /api/v1/public/:brand/leads` (public.ts:69-107)
- Lead captures: customer_name, phone, email, property_type_preference, preferred_location, budget_max, notes
- No dedicated "seller submission" intake — only generic lead capture

**Gap:** No seller-specific intake endpoint. Lead capture doesn't distinguish seller submissions from buyer enquiries. No `property_listing_details` (property type, location, expected price, description) in the intake form. No `SELLER_SUBMISSION` lead source.

**Verdict:** 🟡 **PARTIAL** — Basic lead capture exists. Missing: seller-specific intake with property listing fields, dedicated source type.

---

## 11. ENQUIRY / CALL REQUEST / MULTI-PROPERTY ENQUIRY

**Requirement:** Request-a-Call, Call Now, multi-property enquiry. Guest and logged-in enquiry flows. Customer provides only preferred contact time when identity is known.

**Evidence:**
- Public lead creation exists (public.ts:69-107)
- Lead source `WEBSITE` exists (shared/index.ts:505)
- No multi-property enquiry model
- No `preferred_call_time` field on Lead
- No `ENQUIRY` or `CALL_REQUEST` lead source distinction

**Gap:** No multi-property enquiry support. No call scheduling fields. No guest vs logged-in enquiry distinction.

**Verdict:** 🟡 **PARTIAL** — Basic enquiry via lead capture exists. Missing: multi-property, call scheduling, guest/logged-in distinction.

---

## 12. SEARCH DATA READINESS

**Requirement:** Normal Search needs: location, type, New/Resale, budget, applicable attributes, amenities, availability, publication. Structured enough for filtering.

**Evidence:**
- `Property` has: `category`, `price`, `area_sqft`, `location`, `bedrooms`, `bathrooms`, `facing`, `amenities`, `possession_status`, `brand_type`, `status` (schema.prisma:482-537)
- No structured `state/city/locality` fields
- No `new_resale` classification
- `amenities` is a text field, not structured (schema.prisma:509)
- No indexed search fields beyond basic property attributes

**Gap:** Amenities not structured (text blob). No new/resale. No structured location. No availability_status for search filtering.

**Verdict:** 🟡 **PARTIAL** — Core fields exist. Missing: structured amenities, new/resale, availability_status, structured location.

---

## 13. AI SEARCH DATA

**Requirement:** Same canonical data as Normal Search plus searchable relationships and values. AI converts natural language to structured requirements; CRM must expose canonical values.

**Evidence:**
- Existing Property fields cover basic AI requirements (price, type, BHK, location, amenities)
- `LeadMatchingRequirement` model: `property_type, location, max_budget, min_bedrooms` (schema.prisma:421-433) — proves the matching concept exists
- `matchingEngine.ts` utility exists for lead-property matching

**Gap:** Same as search readiness gaps. AI search can only be as good as the underlying structured data.

**Verdict:** 🟡 **PARTIAL** — Foundation exists. Same structured data gaps as #12.

---

## 14. RECOMMENDATION DATA

**Requirement:** Stable IDs, structured searchable attributes, availability/publication state. Categories: exact match, related, nearby, above-budget, no-result recovery.

**Evidence:**
- Property has stable `id` and `property_code` (schema.prisma:483-484)
- `LeadPropertyInterest` tracks property interests (schema.prisma:435-450)
- No recently-viewed tracking
- No popularity/view count tracking
- Recommendation engine would need the same structured data improvements as search

**Gap:** No recommendation-specific data (views, popularity, recently-viewed). Same structured data gaps.

**Verdict:** 🟡 **PARTIAL** — Basic IDs and interests exist. Missing: analytics, popularity, recently-viewed.

---

## 15. AVAILABILITY SYNCHRONIZATION

**Requirement:** When property changes to Reserved/Sold, public search must stop presenting it. Short-cache/revalidation. CRM is authoritative when website/cache and CRM disagree.

**Evidence:**
- `Property.status` changes trigger `PropertyVerificationLog` entries (property.service.ts)
- No webhook/event mechanism for availability changes to websites
- Public API simply queries `status: 'LIVE'` on each request (public.ts:52)
- No cache invalidation signal

**Gap:** No push-based availability sync. Website would need to poll or CRM would need to emit events when availability changes. The current architecture (website queries CRM API) actually works for V1 since the API is always current, but no explicit webhook/event exists.

**Verdict:** 🟡 **PARTIAL** — On-demand query works for V1. Missing: explicit change events/webhooks for cache invalidation.

---

## 16. AVAILABILITY STATE TRANSITIONS

**Requirement:** Available → Reserved → Sold transitions. Available/Reserved → Sold removes from live. Published + Available → public. Unpublished/rejected → never expose.

**Evidence:**
- `Property.status` has `LIVE` and `SOLD` states
- `Booking.status` handles reservation flow: INITIATED → PENDING → TOKEN_RECEIVED → CONFIRMED
- Property locking via `locked_by_booking_id` (schema.prisma:526-527)
- No explicit `AVAILABLE`/`RESERVED` states on Property

**Gap:** The status enum mixes workflow and availability. `LOCKED` somewhat maps to Reserved, `BOOKED` to Reserved/Sold, `SOLD` to Sold. But no clear AVAILABLE/RESERVED/SOLD availability layer.

**Verdict:** 🟡 **PARTIAL** — Locking mechanism exists. Missing: clear availability state separation.

---

## 17. PUBLIC API ENDPOINTS

**Requirement:** Public-safe property listing by brand, property detail, enquiry capture, seller submission.

**Evidence:**
- `GET /api/v1/public/:brand/properties` — returns LIVE properties filtered by brand (public.ts:36-66)
- `POST /api/v1/public/:brand/leads` — creates lead with source WEBSITE (public.ts:69-107)
- Both behind API key auth via `x-api-key` header (public.ts:9-31)
- `PublicApiKey` model referenced but not in schema (public.ts:16) — likely exists in DB

**Gap:** Only 2 endpoints. Missing: single property detail endpoint, project listing, project detail, seller submission endpoint, multi-property enquiry endpoint, call request endpoint.

**Verdict:** 🟡 **PARTIAL** — Foundation exists. Missing: detail endpoints, seller intake, enquiry types.

---

## 18. INTEGRATION SECURITY

**Requirement:** Authenticated API boundary. Server-side brand authorization. Least-privilege. IDOR protection. Rate limits. No secrets in browser. Separate public-read from privileged write APIs.

**Evidence:**
- API key auth for public routes (public.ts:9-31)
- JWT auth for internal routes (auth.ts)
- Service token auth for Portal callbacks (auth.ts:25-53)
- CORS configured (server.ts:51)
- Helmet security headers (server.ts:50)
- No rate limiting middleware visible
- `trust proxy` enabled (server.ts:47)
- No explicit IDOR protection on public routes (property returned raw)

**Gap:** No rate limiting on public API. No brand-scoped authorization on public routes (API key maps to company but brand filtering is URL-param based). No CORS origin restriction for public API (uses same APP_URL CORS as internal). No separate rate limit tiers.

**Verdict:** 🟡 **PARTIAL** — Auth exists. Missing: rate limiting, brand-scoped auth, CORS for public origins.

---

## 19. PROPERTY IMAGES — APPROVAL FLOW

**Requirement:** DM reviews photographs. Only approved photos shown publicly.

**Evidence:**
- `PropertyImage` has `is_primary` flag (schema.prisma:543)
- No `is_approved`, `is_public`, `approved_by_id` fields
- Images uploaded during property creation (property.service.ts:109-117 via `propertyFAQ.createMany` — note: FAQ creation exists but not image creation in the create flow)
- Document model can link to property for plan/title docs

**Gap:** No image-level approval workflow. DM cannot approve/reject individual photos. No public/private flag per image.

**Verdict:** 🔴 **MISSING** — No image approval mechanism.

---

## 20. SEO FIELDS

**Requirement:** SEO-friendly data for website pages.

**Evidence:**
- `Property.seo_title` (schema.prisma:507)
- `Property.seo_keywords` (schema.prisma:508)
- DM Polish step writes seo_title and seo_keywords (property.service.ts:257-258)
- No `seo_description`, `meta_description`, `og_image`, `canonical_url` fields

**Gap:** Basic SEO fields exist. Missing: meta description, OG image, canonical URL, structured data (schema.org JSON-LD).

**Verdict:** 🟡 **PARTIAL** — seo_title and seo_keywords exist. Missing: richer SEO metadata.

---

## 21. CUSTOMER / LEAD ATTRIBUTION FOR WEBSITE

**Requirement:** Website leads must carry brand, source, UTM, campaign attribution. Lead scoring for website leads.

**Evidence:**
- Lead has `source: 'WEBSITE'` (schema.prisma:362)
- Lead has `campaign`, `utm_source`, `utm_medium`, `utm_campaign` fields (schema.prisma:376-379)
- Lead scoring exists in `calculateLeadScore` (lead.service.ts:124-137) — WEBSITE source gets +10 points
- Public lead creation uses `source: 'WEBSITE'` (public.ts:93)
- No `brand` or `company_id` attribution on lead (company_id is set from API key)

**Gap:** UTM tracking fields exist but public lead creation doesn't capture them from the request. No `lead_source_detail` to distinguish RRH website vs Sonthillu website leads. The company_id is set from API key which is correct.

**Verdict:** 🟡 **PARTIAL** — UTM fields exist on schema. Missing: public endpoint doesn't pass UTM through, no brand-specific lead source detail.

---

## 22. DOCUMENT MANAGEMENT FOR WEBSITE

**Requirement:** Property title documents, plans, RERA docs managed in CRM. Verification workflow.

**Evidence:**
- `Document` model with full CRUD + verification (document.service.ts)
- Document types include `PROPERTY_TITLE`, `PROPERTY_PLAN` (shared/index.ts:735-736)
- Verification workflow: PENDING → VERIFIED/REJECTED (schema.prisma:940)
- Documents linked to properties via `property_id` FK

**Gap:** No `RERA_CERTIFICATE` document type. No public-facing document exposure. Document listing is internal-only.

**Verdict:** 🟡 **PARTIAL** — Document management exists. Missing: RERA doc type, public document exposure for website.

---

## 23. COMPANY / BRAND MODEL

**Requirement:** RRH and Sonthillu as separate companies with separate branding, domains, customer accounts. Connected through CRM ecosystem.

**Evidence:**
- `Company` model: `id, name, code, property_type_group` (schema.prisma:13-39)
- `Company.code`: 'RRH' seeded (server.ts:118-121)
- `Company.property_type_group`: 'RADHA_REAL_HOMES' (schema.prisma:17)
- Two companies seeded: RRH (code: 'RRH') and presumably Sonthillu (not visible in seed)
- All entities scoped by `company_id`

**Gap:** Company model is basic. No `brand_domain`, `brand_logo_url`, `brand_colors`, `brand_config` fields for brand-specific configuration. Only one company (RRH) is seeded in the bootstrap — Sonthillu company must exist but isn't shown.

**Verdict:** 🟡 **PARTIAL** — Company model exists with brand_type_group. Missing: brand configuration fields for website.

---

## 24. RATE LIMITING & API OBSERVABILITY

**Requirement:** Rate limits on public API. Correlation/request IDs. API health logging. Failed enquiry tracking. Failed seller submission tracking.

**Evidence:**
- No rate limiting middleware (server.ts has no rate limiter)
- No correlation ID middleware
- `AuditEvent` model tracks some actions (schema.prisma:289-300)
- Public API has basic error logging (public.ts:62, 105)
- No request ID generation

**Gap:** No rate limiting, no correlation IDs, no structured API health metrics, no failed enquiry tracking.

**Verdict:** 🔴 **MISSING** — No rate limiting or observability for public API.

---

## 25. NEW/RESALE CLASSIFICATION

**Requirement:** New vs Resale is an explicit search dimension. Properties must be classified.

**Evidence:**
- No `new_resale` or `property_listing_type` field on Property model
- Lead has `property_type_preference` but no new/resale preference
- PRD explicitly lists "New/Resale" as a search requirement

**Gap:** Completely missing. No way to classify or filter properties as New vs Resale.

**Verdict:** 🔴 **MISSING** — No new/resale classification.

---

## SUMMARY

| # | Area | Status | Priority |
|---|------|--------|----------|
| 1 | Property Taxonomy & Categories | 🟡 Partial | HIGH |
| 2 | Project Hierarchy (Tower/Floor/Unit) | 🟡 Partial | HIGH |
| 3 | Property Availability Fields | 🟡 Partial | P0 |
| 4 | Per-Brand Publication Control | 🔴 Missing | P0 |
| 5 | Public-Safe Data Filtering | 🔴 Missing | P0 |
| 6 | Dual-Brand Publication | 🔴 Missing | P0 |
| 7 | Media / Photo Handling | 🟡 Partial | MEDIUM |
| 8 | RERA Documents & Badge | 🟡 Partial | MEDIUM |
| 9 | Location / Geolocation | 🔴 Missing | HIGH |
| 10 | Seller Intake / Resale | 🟡 Partial | HIGH |
| 11 | Enquiry / Call Request | 🟡 Partial | MEDIUM |
| 12 | Search Data Readiness | 🟡 Partial | HIGH |
| 13 | AI Search Data | 🟡 Partial | MEDIUM |
| 14 | Recommendation Data | 🟡 Partial | MEDIUM |
| 15 | Availability Synchronization | 🟡 Partial | MEDIUM |
| 16 | Availability State Transitions | 🟡 Partial | HIGH |
| 17 | Public API Endpoints | 🟡 Partial | HIGH |
| 18 | Integration Security | 🟡 Partial | HIGH |
| 19 | Image Approval Flow | 🔴 Missing | HIGH |
| 20 | SEO Fields | 🟡 Partial | LOW |
| 21 | Customer/Lead Attribution | 🟡 Partial | MEDIUM |
| 22 | Document Management | 🟡 Partial | MEDIUM |
| 23 | Company/Brand Model | 🟡 Partial | MEDIUM |
| 24 | Rate Limiting & Observability | 🔴 Missing | HIGH |
| 25 | New/Resale Classification | 🔴 Missing | HIGH |

---

## P0 GAPS (Must fix before websites can function)

1. **Dual-Brand Publication** (#4, #6) — Property must support per-brand publication independently. Currently single brand_type only.
2. **Public-Safe Data Filtering** (#5) — No mechanism to strip internal fields from public API responses.
3. **Availability Status** (#3, #16) — No AVAILABLE/RESERVED/SOLD state separate from workflow status.

## HIGH PRIORITY (Should fix for V1 launch)

4. **Structured Location** (#9) — GPS, state/city/locality fields for geographic search.
5. **New/Resale Classification** (#25) — Explicit search dimension.
6. **Image Approval** (#19) — DM must approve photos before public display.
7. **Public API Expansion** (#17) — Detail endpoints, seller intake, enquiry types.
8. **Rate Limiting** (#24) — Protect public API from abuse.
9. **Search Data** (#12) — Structured amenities, availability for filtering.

## MEDIUM PRIORITY (Can iterate post-launch)

10. Project Hierarchy (#2)
11. Seller Intake Refinement (#10)
12. RERA Badge (#8)
13. Availability Sync Events (#15)
14. Brand Configuration (#23)

## LOW PRIORITY (Future enhancement)

15. SEO Enrichment (#20)

---

## NEXT ACTION

Implement the three P0 structural gaps in order:
1. **PropertyPublication junction table** — per-brand publication control
2. **Public-safe API response filtering** — field exclusion layer
3. **availability_status field** — AVAILABLE/RESERVED/SOLD enum on Property

Then re-verify against the acceptance checklist (PDF §26).
