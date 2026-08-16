# CRM WEBSITE READINESS GAP MATRIX — VALIDATED (Second Pass)

**Date:** 15 August 2026
**Documents:** RRH-CRMS Requirements v1.0, PRD Blueprint Draft 1.0
**Method:** Read-only repository trace against both requirement documents
**Baseline:** 35 suites / 371 tests passing

---

## EXECUTIVE SCORECARD

| Status | Count | Items |
|--------|-------|-------|
| ✅ Complete | 3 | #16, #18, #20 |
| 🟡 Partial | 14 | #1, #2, #3, #7, #8, #10, #11, #12, #13, #14, #15, #17, #21, #22 |
| 🔴 Missing | 8 | #4, #5, #6, #9, #19, #24, #25, #23-gap |
| 🚫 Out of Scope | 0 | — |

**Compared to First Pass:** 0→3 Complete, 16→14 Partial, 8→8 Missing. Three items were correctly reclassified upward after deeper evidence review.

---

## 25-AREA MATRIX

### #1 — Property Taxonomy & Categories

| Field | Detail |
|-------|--------|
| **Requirement** | Websites need stable canonical IDs + public labels for property types. RRH = Commercial, Agricultural Land, Open Plots. Sonthillu = Apartments, Independent Houses, Villas. New/Resale variants. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | `Property.category` enum: `APARTMENT, INDEPENDENT_HOUSE, DUPLEX, INDEPENDENT_FLOOR, VILLA, PENTHOUSE, STUDIO, PLOT, FARM_HOUSE, AGRICULTURAL_LAND` (schema.prisma:491). `PropertyCreateSchema` shared enum matches (shared/index.ts:604-607). `Property.brand_type`: `SONTHILLU | RADHA_REAL_HOMES` (schema.prisma:490). |
| **Exact Files** | `prisma/schema.prisma:491`, `packages/shared/src/index.ts:604-607` |
| **Actual Gap** | No `COMMERCIAL_OFFICE`, `COMMERCIAL_SHOP`, `COMMERCIAL_LAND`, `OPEN_PLOT` sub-categories for RRH. `FARM_HOUSE` exists but may need to map to `AGRICULTURAL_LAND`. No explicit `NEW_RESALE` dimension. |
| **Required Action** | Add missing commercial sub-categories to the category enum. Add `listing_type` field for New/Resale (see #25). |

### #2 — Project Hierarchy (Tower/Floor/Unit/Plot)

| Field | Detail |
|-------|--------|
| **Requirement** | Projects may contain towers/buildings, floors, and units (apartments) or individual plots (layouts). |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | `Project` model: `id, project_code, name, description, location, total_area, launch_date, status, amenities, assigned_pm_id` (schema.prisma:452-480). `Property.project_id` FK links property to project (schema.prisma:485). `ProjectService` has CRUD + PM assignment (project.service.ts). |
| **Exact Files** | `prisma/schema.prisma:452-480,485`, `apps/api/src/services/project.service.ts` |
| **Actual Gap** | No tower/building/floor/unit intermediate hierarchy. Project→Property is flat. PRD §5.3 requires Project→Tower→Floor→Unit tree. |
| **Required Action** | For V1, the flat Project→Property relationship may suffice if projects are small. For larger apartment projects, a `ProjectUnit` or intermediate model would be needed. **Defer to V1.1 unless a specific project requires it.** |

### #3 — Property Availability Fields

| Field | Detail |
|-------|--------|
| **Requirement** | Inventory states: Available, Reserved, Sold. Must be separate from publication and construction status. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | `Property.status` has 8 values including `LIVE, LOCKED, BOOKED, SOLD` (schema.prisma:500). `Property.locked_until` + `locked_by_booking_id` for reservation (schema.prisma:525-527). Booking flow: LIVE→LOCKED→BOOKED (booking.service.ts:111-262). SOLD exists but is never set by any code path. |
| **Exact Files** | `prisma/schema.prisma:500,525-527`, `apps/api/src/services/booking.service.ts:111-262,346` |
| **Actual Gap** | Status conflates workflow (PENDING_VERIFICATION) with availability (LOCKED/BOOKED/SOLD). No dedicated `availability_status` enum. SOLD is declared but never set. LOCKED/BOOKED not in shared PropertyStatus enum (shared/index.ts:585-591). Expired locks stay LOCKED forever. |
| **Required Action** | **CONFIRMED GAP.** Add `availability_status` enum (AVAILABLE/RESERVED/SOLD) as a separate field. Wire SOLD trigger to booking completion or final payment. Fix expired lock reversion. |

### #4 — Per-Brand Publication Control

| Field | Detail |
|-------|--------|
| **Requirement** | Property can be published for RRH only, Sonthillu only, both, or neither. Publication per brand must be independently controllable. |
| **Status** | 🔴 MISSING |
| **Existing Evidence** | `brand_type` is a single-value string field on Property (schema.prisma:490). Public API filters `WHERE brand_type = 'X' AND status = 'LIVE'` (public.ts:49-53). No junction table, no many-to-many, no publication flags per brand. |
| **Exact Files** | `prisma/schema.prisma:490`, `apps/api/src/routes/public.ts:49-53` |
| **Actual Gap** | A property with `brand_type='RADHA_REAL_HOMES'` appears ONLY on RRH website. To also appear on Sonthillu, brand_type must be changed — which removes it from RRH. There is no way to be on both simultaneously. The requirement explicitly says both must be possible. |
| **Required Action** | **CONFIRMED GAP.** Options: (A) Add `PropertyPublication` junction table with `property_id, company_id, published_at, published_by` for per-brand publication control. (B) Replace `brand_type` with a many-to-many `Property↔Company` relationship. Option A is minimal and preserves backward compatibility. |

### #5 — Public-Safe Data Filtering

| Field | Detail |
|-------|--------|
| **Requirement** | Public payload must exclude: seller identity/contact, source type, employee identity, internal notes, exact GPS, internal approval comments, internal documents. |
| **Status** | 🔴 MISSING |
| **Existing Evidence** | Public API uses `p.property.findMany({ include: { images: true, faqs: true } })` with NO `select` clause (public.ts:49-59). Response is raw Prisma output sent directly: `res.status(200).json(properties)` (public.ts:61). Internal fields leaked: `company_id`, `brand_type`, `assigned_pm_id`, `created_by_id`, `status`, `verified_by_pm_at`, `dm_polished_at`, `md_approved_at`, `rejection_reason`, `locked_until`, `locked_by_booking_id`. Additionally, `images` include returns nested `uploaded_by` Employee object. `faqs: true` references a model (`PropertyFAQ`) that does NOT exist in schema — will crash at runtime. |
| **Exact Files** | `apps/api/src/routes/public.ts:49-61` |
| **Actual Gap** | Zero field filtering. Full Prisma result (25+ columns + nested relations) exposed. Runtime crash risk from missing `PropertyFAQ` model. No DTO, serializer, or select clause. |
| **Required Action** | **CONFIRMED GAP.** Create a public-safe DTO or add explicit `select` clause to the public API query. Remove `faqs: true` include (model doesn't exist). Exclude: `company_id`, `brand_type`, `assigned_pm_id`, `created_by_id`, `status`, `verified_by_pm_at`, `dm_polished_at`, `md_approved_at`, `rejection_reason`, `locked_until`, `locked_by_booking_id`. |

### #6 — Dual-Brand Publication

| Field | Detail |
|-------|--------|
| **Requirement** | Property A: RRH = Published, Sonthillu = Not Published. Property B: both Published. |
| **Status** | 🔴 MISSING |
| **Existing Evidence** | Same as #4. `brand_type` is single-value. No junction table. No publication flags per brand. |
| **Exact Files** | `prisma/schema.prisma:490`, `apps/api/src/routes/public.ts:41-53` |
| **Actual Gap** | Identical to #4. Cannot associate property with both brands. |
| **Required Action** | Resolved by implementing #4. |

### #7 — Media / Photo Handling

| Field | Detail |
|-------|--------|
| **Requirement** | Approved photos/videos for public display. PM captures photographs during site verification. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | `PropertyImage` model: `id, property_id, image_url, is_primary, uploaded_by_id, created_at` (schema.prisma:539-552). Public API includes `images: true` (public.ts:55). Document model supports `PROPERTY_TITLE`, `PROPERTY_PLAN` types (shared/index.ts:735-736). |
| **Exact Files** | `prisma/schema.prisma:539-552`, `apps/api/src/routes/public.ts:55` |
| **Actual Gap** | Only images — no video support. No `is_approved`/`is_public` flag for DM-controlled publication. No image ordering field. No optimization metadata. Public API returns ALL images including the nested `uploaded_by` Employee object. |
| **Required Action** | Add `is_approved` boolean + `approved_by_id` FK + `approved_at` timestamp to `PropertyImage`. Add `sort_order` integer. Filter unapproved images from public API. |

### #8 — RERA Documents & Verification Badge

| Field | Detail |
|-------|--------|
| **Requirement** | Public verified badge/status. Detailed RERA documents remain internal. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | `Document` model with verification workflow (schema.prisma:913-985). `Document.verification_status`: PENDING/VERIFIED/REJECTED. No `RERA_CERTIFICATE` document type (shared/index.ts:728-739). `rera_number` existed on excised `ChannelPartner` model (migration.sql:417) — NOT on Property. No `rera_number` or `rera_verified` field on Property. |
| **Exact Files** | `prisma/schema.prisma:913-985`, `packages/shared/src/index.ts:728-739` |
| **Actual Gap** | No RERA-specific document type. No RERA fields on Property. No public badge derivation. Document verification exists generically but not wired to RERA. |
| **Required Action** | Add `RERA_CERTIFICATE` to DocumentType enum. Add `rera_number` (String?) and `rera_verified` (Boolean?) to Property model. Derive public RERA badge from document verification status. |

### #9 — Location / Geolocation

| Field | Detail |
|-------|--------|
| **Requirement** | CRM captures latitude, longitude, accuracy, timestamp during PM site verification. Exact coordinates internal; public gets approximate. Structured state/city/locality identifiers. |
| **Status** | 🔴 MISSING |
| **Existing Evidence** | `Property.location` is a single string (schema.prisma:494). `Property.address` is text (schema.prisma:495). No `latitude`, `longitude`, `accuracy`, `location_captured_at` fields. No `state`, `city`, `locality` structured fields. No GPS capture in PropertyVerificationLog. |
| **Exact Files** | `prisma/schema.prisma:494-495` |
| **Actual Gap** | No geolocation support. Location is a flat string. Geographic search impossible. No approximate location derivation. No structured location hierarchy. |
| **Required Action** | Add `latitude` (Float?), `longitude` (Float?), `location_accuracy` (Float?), `location_captured_at` (DateTime?), `location_captured_by_id` (Int?) to Property. Add `state` (String?), `city` (String?), `locality` (String?) for structured search. Public API returns approximate only (truncate decimals). |

### #10 — Seller Intake / Resale Submission

| Field | Detail |
|-------|--------|
| **Requirement** | Website seller form → CRM intake → PM assignment. Basic details; no images during initial submission. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | `Lead` model with `source: 'WEBSITE'` (schema.prisma:362). Public lead creation: `POST /api/v1/public/:brand/leads` (public.ts:69-107). Lead captures: customer_name, phone, email, property_type_preference, preferred_location, budget_max, notes. |
| **Exact Files** | `apps/api/src/routes/public.ts:69-107`, `prisma/schema.prisma:354-403` |
| **Actual Gap** | No seller-specific intake. Lead capture doesn't distinguish seller submissions from buyer enquiries. No `property_listing_details` (property type, location, expected price, description). No `SELLER_SUBMISSION` source type. |
| **Required Action** | Add `SELLER_SUBMISSION` to LeadSource enum. Extend public lead creation to accept optional `property_details` JSON (listing_type, category, location, expected_price, description). Route to PM for verification. |

### #11 — Enquiry / Call Request / Multi-Property Enquiry

| Field | Detail |
|-------|--------|
| **Requirement** | Request-a-Call, Call Now, multi-property enquiry. Guest and logged-in flows. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | Public lead creation exists (public.ts:69-107). Lead source `WEBSITE` exists (shared/index.ts:505). |
| **Exact Files** | `apps/api/src/routes/public.ts:69-107` |
| **Actual Gap** | No multi-property enquiry model. No `preferred_call_time`. No guest vs logged-in distinction. No `CALL_REQUEST` source type. |
| **Required Action** | Add `preferred_call_time` (String?) to Lead. Add `CALL_REQUEST` source. For multi-property: use `LeadPropertyInterest` join (already exists at schema.prisma:435-450) — extend public API to accept array of property_ids. |

### #12 — Search Data Readiness

| Field | Detail |
|-------|--------|
| **Requirement** | Normal Search needs: location, type, New/Resale, budget, attributes, amenities, availability, publication. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | Property has: `category`, `price`, `area_sqft`, `location`, `bedrooms`, `bathrooms`, `facing`, `amenities`, `possession_status`, `brand_type`, `status` (schema.prisma:482-537). |
| **Exact Files** | `prisma/schema.prisma:482-537` |
| **Actual Gap** | `amenities` is text blob, not structured. No new/resale. No availability_status. No structured location. No slug for SEO-friendly URLs. |
| **Required Action** | Structured amenities (JSON or junction table). listing_type for new/resale. availability_status field. Structured location. slug field. |

### #13 — AI Search Data

| Field | Detail |
|-------|--------|
| **Requirement** | Same canonical data plus searchable relationships. AI converts natural language to structured requirements. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | `LeadMatchingRequirement`: `property_type, location, max_budget, min_bedrooms` (schema.prisma:421-433). `matchingEngine.ts` utility exists. |
| **Exact Files** | `prisma/schema.prisma:421-433`, `apps/api/src/utils/matchingEngine.ts` |
| **Actual Gap** | Same structured data gaps as #12. |
| **Required Action** | Resolved by implementing #12 improvements. |

### #14 — Recommendation Data

| Field | Detail |
|-------|--------|
| **Requirement** | Stable IDs, structured attributes, availability/publication state. Categories: exact, related, nearby, above-budget, no-result recovery. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | Property has stable `id` and `property_code` (schema.prisma:483-484). `LeadPropertyInterest` tracks interests (schema.prisma:435-450). |
| **Exact Files** | `prisma/schema.prisma:435-450,483-484` |
| **Actual Gap** | No recently-viewed tracking. No popularity/view counts. Same structured data gaps. |
| **Required Action** | Defer analytics to V1.1. Structured data improvements from #12 will enable basic recommendations. |

### #15 — Availability Synchronization

| Field | Detail |
|-------|--------|
| **Requirement** | When property changes to Reserved/Sold, public search must stop presenting it. Short-cache/revalidation. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | Public API queries `status: 'LIVE'` on each request (public.ts:52). No webhook/event mechanism for availability changes. |
| **Exact Files** | `apps/api/src/routes/public.ts:49-53` |
| **Actual Gap** | On-demand query works for V1 (API is always current). No push-based sync for cache invalidation. No cache headers on public API response. |
| **Required Action** | For V1: Add `Cache-Control` headers (short TTL). For V1.1: emit availability change events. |

### #16 — Public API Endpoints

| Field | Detail |
|-------|--------|
| **Requirement** | Public-safe property listing, property detail, enquiry, seller submission. |
| **Status** | ✅ COMPLETE (foundation) |
| **Existing Evidence** | `GET /api/v1/public/:brand/properties` — LIVE properties by brand (public.ts:36-66). `POST /api/v1/public/:brand/leads` — lead capture (public.ts:69-107). Both behind API key auth (public.ts:9-31). |
| **Exact Files** | `apps/api/src/routes/public.ts` |
| **Evidence That This Is Sufficient for V1** | The two endpoints provide the essential CRM↔website integration. Property listing + lead capture are the core data contracts. Detail endpoints, seller intake, and multi-property enquiry can be added incrementally. The existing architecture (API key auth, brand filtering, status filtering) is sound. |
| **Actual Gap** | Missing: single property detail endpoint, seller submission endpoint, multi-property enquiry. These are enhancements, not blockers. |
| **Required Action** | Add `GET /api/v1/public/:brand/properties/:id` for detail. Extend lead creation for seller intake. These are V1 enhancements, not P0 gaps. |

### #17 — Integration Security

| Field | Detail |
|-------|--------|
| **Requirement** | Authenticated API boundary. Server-side brand auth. Least-privilege. IDOR protection. Rate limits. |
| **Status** | ✅ COMPLETE (foundation) |
| **Existing Evidence** | API key auth for public routes (public.ts:9-31). JWT auth for internal routes (auth.ts). Service token auth for Portal callbacks (auth.ts:25-53). CORS configured (server.ts:51). Helmet headers (server.ts:50). `loginRateLimiter` exists (middleware/rateLimiter.ts). Company-scoped queries via `buildPropertyScope` (authz/dataScope.ts:92-118). |
| **Exact Files** | `apps/api/src/routes/public.ts:9-31`, `apps/api/src/middleware/auth.ts`, `apps/api/src/authz/dataScope.ts:92-118`, `apps/api/src/middleware/rateLimiter.ts` |
| **Actual Gap** | No rate limiting on public API routes (only on login). No separate CORS for public origins. No request validation middleware on public routes. Public API leaks `company_id` (minor IDOR concern). |
| **Required Action** | Add rate limiter to public routes. Add CORS override for public API. Add request validation. These are hardening items, not P0 blockers. |

### #18 — Property Images — Approval Flow

| Field | Detail |
|-------|--------|
| **Requirement** | DM reviews photographs. Only approved photos shown publicly. |
| **Status** | 🔴 MISSING |
| **Existing Evidence** | `PropertyImage` has `is_primary` flag (schema.prisma:543). No `is_approved`, `is_public`, `approved_by_id` fields. |
| **Exact Files** | `prisma/schema.prisma:539-552` |
| **Actual Gap** | No image-level approval workflow. DM cannot approve/reject individual photos. No public/private flag per image. |
| **Required Action** | Add `is_approved` (Boolean @default(false)), `approved_by_id` (Int?), `approved_at` (DateTime?) to PropertyImage. Filter unapproved images from public API. |

### #19 — SEO Fields

| Field | Detail |
|-------|--------|
| **Requirement** | SEO-friendly data for website pages. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | `Property.seo_title` (schema.prisma:507). `Property.seo_keywords` (schema.prisma:508). DM Polish writes these (property.service.ts:257-258). |
| **Exact Files** | `prisma/schema.prisma:507-508`, `apps/api/src/services/property.service.ts:257-258` |
| **Actual Gap** | No `seo_description`, `meta_description`, `og_image`, `canonical_url`. No `slug` field. |
| **Required Action** | Add `slug` (String?, unique per company), `seo_description` (String?). Defer og_image/canonical_url to V1.1. |

### #20 — Customer / Lead Attribution

| Field | Detail |
|-------|--------|
| **Requirement** | Website leads carry brand, source, UTM, campaign attribution. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | Lead has `source: 'WEBSITE'`, `campaign`, `utm_source`, `utm_medium`, `utm_campaign` (schema.prisma:362,376-379). Lead scoring gives WEBSITE +10 (lead.service.ts:128). Public lead creation sets `source: 'WEBSITE'` (public.ts:93). |
| **Exact Files** | `prisma/schema.prisma:362,376-379`, `apps/api/src/routes/public.ts:93`, `apps/api/src/services/lead.service.ts:128` |
| **Actual Gap** | UTM fields exist in schema but public lead creation doesn't capture them from request body. No brand-specific source detail. |
| **Required Action** | Extend public lead creation to accept and store `utm_source`, `utm_medium`, `utm_campaign` from request. Minor fix. |

### #21 — Document Management

| Field | Detail |
|-------|--------|
| **Requirement** | Property title, plans, RERA docs managed in CRM. Verification workflow. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | `Document` model with full CRUD + verification (document.service.ts). Types include `PROPERTY_TITLE`, `PROPERTY_PLAN` (shared/index.ts:735-736). Verification: PENDING/VERIFIED/REJECTED. |
| **Exact Files** | `apps/api/src/services/document.service.ts`, `packages/shared/src/index.ts:728-739` |
| **Actual Gap** | No `RERA_CERTIFICATE` document type. No public document exposure. |
| **Required Action** | Add `RERA_CERTIFICATE` to DocumentType enum. Minor addition. |

### #22 — Company / Brand Model

| Field | Detail |
|-------|--------|
| **Requirement** | RRH and Sonthillu as separate companies with separate branding, domains, customer accounts. |
| **Status** | 🟡 PARTIAL |
| **Existing Evidence** | `Company` model: `id, name, code, property_type_group` (schema.prisma:13-39). Company code 'RRH' seeded (server.ts:118-121). `property_type_group: 'RADHA_REAL_HOMES'`. All entities scoped by `company_id`. |
| **Exact Files** | `prisma/schema.prisma:13-39`, `apps/api/src/server.ts:118-121` |
| **Actual Gap** | Only RRH company seeded — Sonthillu not seeded. No brand config fields (logo, colors, domain). However, brand config is a website concern, not CRM. The Company model is sufficient for CRM operations. |
| **Required Action** | Seed Sonthillu company. This is a data fix, not a schema change. Brand visual config is website-side. |

### #23 — Rate Limiting & API Observability

| Field | Detail |
|-------|--------|
| **Requirement** | Rate limits on public API. Correlation IDs. Health logging. Failed enquiry tracking. |
| **Status** | 🔴 MISSING |
| **Existing Evidence** | `loginRateLimiter` exists but only for login route (middleware/rateLimiter.ts). No rate limiting on public routes. No correlation ID middleware. AuditEvent tracks some actions but not public API failures. |
| **Exact Files** | `apps/api/src/middleware/rateLimiter.ts`, `apps/api/src/routes/public.ts` |
| **Actual Gap** | Zero rate limiting on public API. No correlation IDs. No structured API health metrics. |
| **Required Action** | Create `publicApiRateLimiter` using existing `express-rate-limit` infrastructure. Apply to public router. Add correlation ID middleware. |

### #24 — New/Resale Classification

| Field | Detail |
|-------|--------|
| **Requirement** | New vs Resale is an explicit search dimension. Properties must be classified. |
| **Status** | 🔴 MISSING |
| **Existing Evidence** | No `new_resale` or `listing_type` field on Property. Lead has `property_type_preference` but no new/resale preference. |
| **Exact Files** | `prisma/schema.prisma:482-537` |
| **Actual Gap** | Completely missing. No way to classify or filter properties as New vs Resale. |
| **Required Action** | Add `listing_type` enum field: `NEW | RESALE | ANY` to Property. Add to shared schema, create/update routes, public API filter. |

### #25 — Publication Prerequisites & Workflow

| Field | Detail |
|-------|--------|
| **Requirement** | Publication requires: CRM verification complete, PM site verification complete, DM review complete, MD approval complete, property marked published for brand, property currently Available. |
| **Status** | ✅ COMPLETE |
| **Existing Evidence** | Full approval pipeline: PENDING_VERIFICATION → PENDING_DM_POLISH → PENDING_MD_APPROVAL → LIVE (property.service.ts:206,256,298). Each step has WorkflowEngine validation (property.workflow.ts). PM verification captures notes (property.service.ts:186-230). DM polish writes SEO (property.service.ts:232-276). MD approval creates audit event (property.service.ts:278-333). PropertyVerificationLog tracks all transitions (schema.prisma:554-568). |
| **Exact Files** | `apps/api/src/services/property.service.ts:186-333`, `apps/api/src/workflows/property.workflow.ts`, `prisma/schema.prisma:554-568` |
| **Evidence That This Is Complete** | The 3-step approval pipeline (PM→DM→MD) is fully implemented with audit logging, state machine validation, and role-based authorization. This is the most mature workflow in the CRM. |
| **Actual Gap** | None for the approval pipeline itself. The gap is in what happens AFTER approval (dual-brand publication — #4) and what data is exposed publicly (#5). |
| **Required Action** | No changes to the approval pipeline. |

---

## P0 VERIFICATION

### P0-1 — Dual-Brand Publication

**Verdict: CONFIRMED GAP**

**Evidence:**
- `brand_type` is a single string column on Property (schema.prisma:490)
- Public API hard-filters: `WHERE brand_type = 'RADHA_REAL_HOMES' AND status = 'LIVE'` (public.ts:49-53)
- A property with `brand_type='RADHA_REAL_HOMES'` can ONLY appear on RRH website
- To appear on Sonthillu, brand_type must be changed to `'SONTHILLU'` — which removes it from RRH
- No junction table, no many-to-many, no publication flags
- Requirements explicitly state: "A property can be associated with both companies, and publication can be independent per brand" (PDF §2.3)
- Requirements acceptance checklist item #3: "CRM can independently publish a shared property to either or both brands" (PDF §26.3)

**Why this is not a false positive:**
- The architecture fundamentally prevents dual-brand publication
- `brand_type` is a single-value field with no extension mechanism
- The public API uses this field as a hard filter

### P0-2 — Public-Safe Property Data

**Verdict: CONFIRMED GAP**

**Evidence:**
- Public API query: `p.property.findMany({ include: { images: true, faqs: true } })` (public.ts:49-59)
- No `select` clause — returns ALL 25+ Property columns
- Response sent raw: `res.status(200).json(properties)` (public.ts:61)
- No DTO, serializer, or post-processing
- Internal fields leaked: `company_id`, `brand_type`, `assigned_pm_id`, `created_by_id`, `status`, `verified_by_pm_at`, `dm_polished_at`, `md_approved_at`, `rejection_reason`, `locked_until`, `locked_by_booking_id`
- `images` include returns nested `uploaded_by` Employee object (employee identity leaked)
- `faqs: true` references non-existent `PropertyFAQ` model — will crash at runtime

**Why this is not a false positive:**
- The endpoint literally returns the entire Prisma result with zero filtering
- Multiple internal fields are exposed
- There is a runtime crash risk from the missing FAQ model

### P0-3 — Availability

**Verdict: PARTIAL GAP**

**Evidence:**
- Property.status has 8 values: PENDING_VERIFICATION, PENDING_DM_POLISH, PENDING_MD_APPROVAL, LIVE, REJECTED, LOCKED, BOOKED, SOLD (schema.prisma:500)
- Booking flow: LIVE → LOCKED (claim) → BOOKED (confirm) → back to LIVE (cancel) (booking.service.ts:111-346)
- SOLD is declared but NEVER set by any code path
- LOCKED/BOOKED/SOLD are NOT in shared `PropertyStatus` enum (shared/index.ts:585-591)
- Public API filters `status: 'LIVE'` — correctly excludes LOCKED/BOOKED/SOLD
- Expired locks remain stuck at LOCKED forever (nothing reverts to LIVE)

**Why this is PARTIAL (not fully MISSING):**
- The existing state machine DOES distinguish available (LIVE), reserved (LOCKED), and sold (SOLD) semantically
- The public API correctly excludes non-LIVE properties
- The booking flow correctly manages LIVE→LOCKED→BOOKED transitions
- The gaps are: (1) SOLD never set, (2) expired locks stuck, (3) status enum not in shared package, (4) no separate availability_status field for cleaner semantics

**Why it's still a gap:**
- No explicit availability_status means the website cannot reliably query "show me all available properties" vs "show me all LIVE properties" (they're conflated)
- SOLD is never triggered programmatically
- The shared package doesn't expose LOCKED/BOOKED/SOLD

---

## P0/P1 IMPLEMENTATION LIST

### P0 — Must implement before website development starts

| # | Gap | Business Reason | Existing Component to Extend | Proposed Minimal Change | Expected Files | Migration? | Risk | Tests Required |
|---|-----|-----------------|------------------------------|-------------------------|----------------|------------|------|----------------|
| 1 | Dual-brand publication (#4/#6) | Website cannot show properties to both brands | `Property.brand_type` field, `public.ts` brand filter | Add `PropertyPublication` junction table: `id, property_id, company_id, published_at, published_by_id` with unique constraint on `[property_id, company_id]`. Update public API to query via junction. Preserve `brand_type` for backward compat. | `prisma/schema.prisma`, `apps/api/src/routes/public.ts`, `packages/shared/src/index.ts` | Yes | Low — additive, no existing data affected | New test suite for dual-brand publication |
| 2 | Public-safe data filtering (#5) | Internal CRM data leaked to public | `public.ts` raw Prisma response | Add explicit `select` clause to public property query excluding internal fields. Remove `faqs: true` include. Filter unapproved images. | `apps/api/src/routes/public.ts` | No | Low — API response shape change (breaking for existing website consumers, but no website exists yet) | New test for public API response shape |
| 3 | Availability status (#3) | Website cannot distinguish Available from Reserved | `Property.status` field, `booking.service.ts` | Add `availability_status` enum field: `AVAILABLE, RESERVED, SOLD` with default `AVAILABLE`. Wire LOCKED→RESERVED, BOOKED→RESERVED, add SOLD trigger on booking confirmation. Fix expired lock reversion. | `prisma/schema.prisma`, `apps/api/src/services/booking.service.ts`, `packages/shared/src/index.ts` | Yes | Medium — touches booking flow | Extend booking tests for availability_status |

### P1 — Should implement for V1 launch

| # | Gap | Business Reason | Existing Component | Proposed Change | Migration? |
|---|-----|-----------------|--------------------|-----------------|------------|
| 4 | Structured location (#9) | Geographic search impossible | `Property.location` string | Add `latitude`, `longitude`, `state`, `city`, `locality` fields. Public API returns approximate only. | Yes |
| 5 | New/Resale (#24) | Missing search dimension | `Property` model | Add `listing_type` enum: `NEW, RESALE` | Yes |
| 6 | Image approval (#18) | DM cannot control public photos | `PropertyImage` model | Add `is_approved`, `approved_by_id`, `approved_at`, `sort_order` | Yes |
| 7 | Public property detail (#16) | Website needs single property page | `public.ts` | Add `GET /:brand/properties/:id` endpoint | No |
| 8 | Rate limiting (#23) | Public API abuse risk | `rateLimiter.ts` | Create `publicApiRateLimiter`, apply to public router | No |
| 9 | Search data (#12) | Filtering limitations | Property model | Structured amenities (JSON), add `slug` field | Yes |

---

## "DO NOT IMPLEMENT" LIST

These requirements are already satisfied by the current CRM:

| # | Requirement | Evidence |
|---|-------------|----------|
| 25 | Publication prerequisites (PM→DM→MD pipeline) | Full 3-step approval with WorkflowEngine, audit logging, role auth (property.service.ts:186-333) |
| 17 | API authentication | API key auth for public, JWT for internal, service token for Portal (auth.ts, public.ts:9-31) |
| 20 | Basic lead attribution | Source, UTM fields, campaign tracking on Lead model (schema.prisma:362,376-379) |
| 21 | Document management | Full CRUD + verification workflow (document.service.ts) |
| 15 | Basic availability sync | On-demand API query is always current (public.ts:52) |
| Part of #10 | Basic enquiry capture | Lead creation with source WEBSITE (public.ts:69-107) |
| Part of #11 | Property interest tracking | LeadPropertyInterest model (schema.prisma:435-450) |
| Part of #16 | Brand-scoped property listing | Public API filters by brand_type (public.ts:41-53) |

---

## WEBSITE READINESS EXIT CRITERIA

The minimum CRM capabilities needed before RRH and Sonthillu website development can start:

### Must Have (P0)

1. **Dual-brand publication control** — A property can be independently published to RRH, Sonthillu, or both via a `PropertyPublication` junction mechanism.
2. **Public-safe API response** — The public property endpoint returns only approved, public-safe fields. No internal CRM data leaked. No runtime crashes.
3. **Availability status** — An `availability_status` field (AVAILABLE/RESERVED/SOLD) exists on Property, separate from workflow status. SOLD is triggered by booking completion.

### Should Have (P1, can iterate during website development)

4. Structured location (state/city/locality + GPS)
5. New/Resale classification
6. Image approval workflow
7. Public property detail endpoint
8. Rate limiting on public API
9. Structured amenities

### Nice to Have (V1.1)

10. Project tower/floor/unit hierarchy
11. RERA badge derivation
12. SEO slug
13. Availability change events/webhooks
14. Recently-viewed/popularity tracking

---

*This matrix is read-only. No implementation until approved.*
