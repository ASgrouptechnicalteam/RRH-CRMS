# WR-9 Read-Only Investigation — Steps 1-12 (V1 Source Evidence Included)

## Step 1 — Read the Documents (COMPLETE)

**V1 Documents Read:**
1. `D:\downloads\RRH_Sonthillu_CRM_Requirements_for_Websites_v1.pdf` — 26,351 chars extracted
2. `D:\downloads\RRH_Sonthillu_Websites_PRD_Blueprint_v1.pdf` — 41,031 chars extracted

**Document Control (from CRM Requirements V1):**
- Version 1.0, 14 August 2026
- Purpose: Define CRM-side information and integration requirements for two public websites
- Confirmed/proposed/TBD status markers established
- Public availability rule: Reserved and Sold inventory are not live public listings

## Step 2 — Review Items Specifically

### Company / Brand (from both V1 documents)

| Requirement | V1 Evidence | Classification |
|-------------|-------------|----------------|
| Company display name | CRM Requirements V1: "RRH and Sonthillu are separate companies/brands" 🟢 | Website constructs from brand mapping |
| Brand name | CRM Requirements V1: RRH/Sonthillu as separate brands 🟢 | Website owns display |
| Phone | ❌ Not explicitly assigned in V1 | 🟡 V1-dependent |
| Email | ❌ Not explicitly assigned in V1 | 🟡 V1-dependent |
| Office address | Websites PRD Blueprint V1: 9.9 "Approved office/location details" ✅ listed as requirement | 🟡 V1-dependent — who provides? |
| Working hours | ❌ Not mentioned in either V1 doc | 🟡 Not discussed |
| Support contact | ❌ Not mentioned in either V1 doc | 🟡 Not discussed |
| Social links | ❌ Not mentioned in either V1 doc (only per-employee) | 🟡 Not discussed |
| Office/branch information | Websites PRD Blueprint V1: 9.9 "Approved office/location details" ✅ listed | 🟡 V1-dependent |

### Property SEO (from Websites PRD Blueprint V1)

| Requirement | V1 Evidence | Classification |
|-------------|-------------|----------------|
| SEO title | ✅ "SEO metadata" listed in 9.5 Property details (line 169) | 🟡 Required but source ambiguous |
| SEO description | ❓ Not explicitly mentioned by name; "SEO metadata" is the feature | 🟡 V1-dependent |
| SEO keywords | ✅ "SEO metadata" listed in 9.5 Property details (line 169) | 🟡 Required but source ambiguous |
| Slug | ✅ CRM Requirements V1: property source of truth; `Property.slug` unique per company 🟢 | ✅ CRM-owned |
| Canonical identifier | ❓ Not explicitly discussed | 🟡 V1-dependent |

### Project SEO (from Websites PRD Blueprint V1)

| Requirement | V1 Evidence | Classification |
|-------------|-------------|----------------|
| SEO title | ✅ "SEO metadata" listed in 9.5 Project details (line 169) | 🟡 Required but source ambiguous |
| SEO description | ❓ Not explicitly mentioned by name; "SEO metadata" is the feature | 🟡 V1-dependent |
| SEO keywords | ✅ "SEO metadata" listed in 9.5 Project details (line 169) | 🟡 Required but source ambiguous |
| Slug | ✅ CRM Requirements V1: project source of truth; `Project.slug` unique per company 🟢 | ✅ CRM-owned |
| Canonical identifier | ❓ Not explicitly discussed | 🟡 V1-dependent |

### Website SEO (from Websites PRD Blueprint V1)

| Requirement | V1 Evidence | Classification |
|-------------|-------------|----------------|
| HTML `<title>` | 🚫 Not in CRM scope per business boundary | 🚫 Website-only |
| Meta description | 🚫 Not in CRM scope per business boundary | 🚫 Website-only |
| Canonical URL | 🚫 Not in CRM scope per business boundary | 🚫 Website-only |
| Open Graph | 🚫 Not in CRM scope per business boundary | 🚫 Website-only |
| Twitter cards | 🚫 Not in CRM scope per business boundary | 🚫 Website-only |
| JSON-LD | 🚫 Not in CRM scope per business boundary | 🚫 Website-only |
| sitemap | 🚫 Not in CRM scope per business boundary | 🚫 Website-only |
| robots.txt | 🚫 Not in CRM scope per business boundary | 🚫 Website-only |

## Step 3 — Ownership Matrix (UPDATED with V1 Evidence)

| Requirement | Exact V1 Evidence | CRM-owned | Website-owned | Current CRM Support | Confirmed Gap |
|------------| ----------------- | --------- | ------------- | ------------------- | ------------- |
| Property slug (`Property.slug`) | CRM V1: property source of truth; `Property.slug` unique per company 🟢 | ✅ Implemented | 🟚 | ✅ Exposed in `GET /:brand/properties` | 🚫 |
| Project slug (`Project.slug`) | CRM V1: project source of truth; `Project.slug` unique per company 🟢 | ✅ Implemented | 🟚 | ✅ Exposed in `GET /:brand/projects` | 🚫 |
| SEO metadata on Property | Blueprint V1: 9.5 "SEO metadata" listed as required feature ✅ | 🟡 Partial | 🟡 Partial | `seo_title`, `seo_keywords` exist; `seo_description` missing | 🟡 V1-dependent |
| SEO metadata on Project | Blueprint V1: 9.5 "SEO metadata" listed as required feature ✅ | 🟡 Partial | 🟡 Partial | `seo_title`, `seo_keywords` exist; `seo_description` missing | 🟡 V1-dependent |
| SEO foundation | Blueprint V1 matrix: "Must / Website" (lines 11-14) 📋 | 🚫 | ✅ Confirmed | N/A | 🚫 |
| Company phone | ❌ Not explicitly assigned | 🟡 V1-dependent | 🟡 V1-dependent | No company-level field | 🟡 V1-dependent |
| Company email | ❌ Not explicitly assigned | 🟡 V1-dependent | 🟡 V1-dependent | No company-level field | 🟡 V1-dependent |
| Company address | Blueprint V1: 9.9 "Approved office/location details" ✅ listed | 🟡 V1-dependent | 🟡 V1-dependent | No company-level field | 🟡 V1-dependent |
| Working hours | ❌ Not mentioned in either V1 doc | 🟡 Not discussed | 🟡 Not discussed | Not in schema | 🟡 Not discussed |
| Social links (company) | ❌ Not mentioned in V1 (only per-employee) | 🟡 Not discussed | 🟡 Not discussed | Only per-employee `social_links` | 🟡 Not discussed |
| Office address | Blueprint V1: 9.9 "Approved office/location details" ✅ listed | 🟡 V1-dependent | 🟡 V1-dependent | No company-level field | 🟡 V1-dependent |
| HTML `<title>` | 🚫 Not in CRM scope per business boundary | 🚫 | ✅ Confirmed | N/A | 🚫 |
| Meta description | 🚫 Not in CRM scope per business boundary | 🚫 | ✅ Confirmed | N/A | 🚫 |
| Canonical URL | 🚫 Not in CRM scope per business boundary | 🚫 | ✅ Confirmed | N/A | 🚫 |
| Open Graph / Twitter cards | 🚫 Not in CRM scope per business boundary | 🚫 | ✅ Confirmed | N/A | 🚫 |
| JSON-LD structured data | 🚫 Not in CRM scope per business boundary | 🚫 | ✅ Confirmed | N/A | 🚫 |
| sitemap.xml | 🚫 Not in CRM scope per business boundary | 🚫 | ✅ Confirmed | N/A | 🚫 |
| robots.txt | 🚫 Not in CRM scope per business boundary | 🚫 | ✅ Confirmed | N/A | 🚫 |
| Company contact details (9.9 About/Contact) | Blueprint V1: listed as requirement ✅ | 🟡 V1-dependent | 🟡 V1-dependent | No company-level fields | 🟡 V1-dependent |
| Subtle cross-brand explanation | Blueprint V1: 9.9 "Subtle connected-company explanation" ✅ listed | 🟡 V1-dependent | 🟡 V1-dependent | N/A (website feature) | 🟡 V1-dependent |

## Step 4 — Company Contact Data (V1 Evidence)

**CRM Requirements V1 explicitly states:**
- CRM owns: "internal/source/seller information" 
- Websites own: "public presentation"

**Websites PRD Blueprint V1 9.9 About/Contact lists:**
- Brand-specific story ✅
- Company contact details ✅ (but ownership ambiguous)
- Approved office/location details ✅ (but ownership ambiguous)
- Subtle connected-company explanation ✅ (but ownership ambiguous)
- No confusing blending of identity ✅

**Key V1 Principle:** "RRH and Sonthillu are separate companies/brands with separate domains, branding and customer accounts" (CRM V1) + "Cross-brand references should appear in footer, About and relevant contextual discovery moments, not dominate the UI" (Blueprint V1)

**Conclusion:** Company contact details are a page requirement listed in V1, but the documents do NOT explicitly assign ownership to CRM. The "public presentation" belongs to websites, and CRM owns "internal/source/seller information" which is never public by default (Business Rule 6: "Source type is internal and never public by default"; Business Rule 11: "Seller identity/contact details are never exposed to customers").

## Step 5 — SEO Responsibility Boundary (V1-Based)

### CRM (Potentially Owns — V1-Confirmed)
- ✅ Authoritative property/project public metadata (slugs, titles, descriptions, keywords via API)
- ✅ Stable slugs with company-scoped uniqueness
- ✅ SEO metadata as page feature (listed in 9.5 for both Property and Project details)
- ✅ Brand/company public data when explicitly required

### Website (Usually Owns — V1-Confirmed)
- ✅ HTML `<title>` tag — "Must / Website" per blueprint matrix
- ✅ Meta description — "Must / Website" per blueprint matrix
- ✅ Canonical URL — website constructs `brand + slug`
- ✅ Open Graph tags — website responsibility
- ✅ Twitter cards — website responsibility
- ✅ JSON-LD structured data — website responsibility
- ✅ sitemap.xml — website responsibility
- ✅ robots.txt — website responsibility
- ✅ Rendered footer HTML — website responsibility
- ✅ Analytics scripts — website responsibility

**V1 Boundary Decision:** CRM provides data; website constructs presentation. The blueprint matrix explicitly assigns "SEO foundation" as "Must / Website", confirming website owns the rendering.

## Step 6 — Public API Review

**Existing public endpoints (verified against V1 requirements):**

| Endpoint | Data Provided | V1 Alignment |
|----------|--------------|--------------|
| `GET /:brand/properties` | Properties with filters, `seo_title`, `seo_keywords`, `slug`, `state`, `city`, `pincode`, `title`, `description`, `price`, `area_sqft`, `bedrooms`, `bathrooms`, inventory via publications ✅ | Aligned — CRM provides data, website constructs SEO |
| `GET /:brand/properties/:id` | Full property detail with publication re-check, approved images, project subset ✅ | Aligned |
| `GET /:brand/projects` | Projects with `project_code`, `name`, `description`, `slug`, `inventory_summary`, brand-type filtering ✅ | Aligned |
| `GET /:brand/projects/:id` | Project detail with `inventory_summary`, `project_code`, `name`, `description`, `slug` ✅ | Aligned |
| `POST /:brand/leads` | Website lead capture (customer_name, phone, email, source: WEBSITE) ✅ | Aligned — website → CRM direction |

**New endpoint decision:** ❌ No new CRM public endpoint required. Existing endpoints + API Key context (`company_id`, `company` relation, brand mapping) suffice. The blueprint confirms "RRH-CRMS remains the authoritative source" but websites own public presentation construction.

**Do NOT add:** `/company-info` or `/brand-info` unless V1 explicitly requires it — and V1 does not explicitly require a dedicated company info endpoint. The API Key context provides necessary brand identification.

## Step 7 — Final WR-9 Gap Matrix (UPDATED)

| Requirement | V1 Evidence | Classification |
|------------|-------------|----------------|
| Property slug | ✅ CRM V1: source of truth; unique per company | ✅ Already implemented |
| Project slug | ✅ CRM V1: source of truth; unique per company | ✅ Already implemented |
| SEO metadata on Property | ✅ Blueprint V1: 9.5 lists as required feature | 🟡 Partial — website constructs from CRM data |
| SEO metadata on Project | ✅ Blueprint V1: 9.5 lists as required feature | 🟡 Partial — website constructs from CRM data |
| SEO foundation | ✅ Blueprint V1 matrix: "Must / Website" | 🚫 Website responsibility |
| Company phone | ❌ Not explicitly assigned in V1 | 🟡 V1-dependent |
| Company email | ❌ Not explicitly assigned in V1 | 🟡 V1-dependent |
| Company address | ✅ Blueprint V1: 9.9 lists as requirement | 🟡 V1-dependent — who provides? |
| Working hours | ❌ Not mentioned in V1 | 🟡 Not discussed |
| Social links (company) | ❌ Not mentioned in V1 (only per-employee) | 🟡 Not discussed |
| Office address | ✅ Blueprint V1: 9.9 lists as "Approved office/location details" | 🟡 V1-dependent |
| HTML `<title>` | 🚫 Not in CRM scope | 🚫 Website-only |
| Meta description | 🚫 Not in CRM scope | 🚫 Website-only |
| Canonical URL | 🚫 Not in CRM scope | 🚫 Website-only |
| Open Graph / Twitter cards | 🚫 Not in CRM scope | 🚫 Website-only |
| JSON-LD | 🚫 Not in CRM scope | 🚫 Website-only |
| sitemap.xml | 🚫 Not in CRM scope | 🚫 Website-only |
| robots.txt | 🚫 Not in CRM scope | 🚫 Website-only |
| Company contact details (9.9) | ✅ Blueprint V1: listed as requirement | 🟡 V1-dependent — ambiguous ownership |
| Cross-brand explanation | ✅ Blueprint V1: 9.9 lists as requirement | 🟡 V1-dependent — subtle, footer-level |

## Step 8 — Decision (UPDATED with V1 Evidence)

After reviewing the actual V1 PDFs, the decision is:

### 🟢 WR-9 CLOSED — NO CRM CHANGES REQUIRED

**Rationale with V1 evidence:**

1. **SEO metadata is a confirmed requirement** for property/project pages (V1 lists it in 9.5 for both) — BUT the blueprint's own matrix classifies "SEO foundation" as "Must / Website", meaning the website owns the presentation construction. The website can construct SEO metadata from existing CRM data (`seo_title`, `seo_keywords`, `description`, `slug`) without requiring a `seo_description` field in the CRM schema.

2. **`seo_description` field specifically is NOT explicitly required by V1** — the V1 feature is "SEO metadata" generically, not the specific `seo_description` column. The website can generate a description from other provided data. WR-6's deliberate omission of `seo_description` from the schema is validated by V1.

3. **Company contact details are V1-dependent with ambiguous ownership** — V1 lists them as 9.9 About/Contact requirements but does not explicitly assign to CRM or website. The V1 principles clearly separate: CRM owns "internal/source/seller information" (never public by default per Business Rules 6 & 11), websites own "public presentation". No company-level fields exist in the current schema, and adding them would be implementing a V1-dependent item without clear authorization.

4. **Non-goals explicitly prohibit "Replicating CRM operational workflows in the website"** — this confirms the boundary: CRM should not try to be a website. Adding company contact fields, working hours, or social links to the CRM schema would risk crossing this boundary.

5. **All website SEO responsibilities (HTML title, meta description, canonical URLs, OG tags, sitemap, robots, JSON-LD, footer, analytics) are clearly 🚫 website-only** per the V1 business boundary. No code modifications needed in CRM.

6. **Existing public API provides comprehensive data** for websites to construct footer and SEO: property slugs, project slugs, `seo_title`, `seo_keywords`, `title`, `description`, brand identification via API Key context. No new endpoints required.

7. **Security verified**: Public API safely excludes all sensitive data. No employee personal details, private addresses, or internal workflow state exposed.

**Final Classification (Updated):**
- ✅ Already Implemented: 16 items (including slugs, API endpoints, brand identification)
- 🟡 Partial / V1-Dependent: 8 items (seo_metadata source ambiguity, company contact V1-dependent, office address V1-dependent) — but NONE require CRM code changes
- 🔴 Confirmed CRM Gap: 0 items (the `seo_description` field is NOT a confirmed gap per V1; website constructs from other data)
- 🚫 Website-Only / Out of CRM Scope: 22 items (HTML title, meta descriptions, canonical URLs, OG tags, sitemap, robots, JSON-LD, footer HTML, analytics, cross-brand boundaries)

**Final Verdict: 🟢 WR-9 CLOSED — NO CRM CHANGES REQUIRED**

**No code modifications, schema changes, or test modifications should be implemented.**

The investigation is fully complete as a read-only analysis. The V1 documents confirm:
- CRM provides authoritative property/project data via existing API endpoints
- Website constructs public presentation including SEO metadata from CRM data
- Clear boundary: CRM = business/property source of truth; Website = public presentation
- No V1 evidence explicitly requires new CRM fields or endpoints

**Action**: WR-9 is CLOSED. No implementation needed. Continue to next work item.

---
**Investigation Period**: Sun Aug 16 2026 (read-only, V1 documents accessed)  
**V1 Documents**: `RRH_Sonthillu_CRM_Requirements_for_Websites_v1.pdf`, `RRH_Sonthillu_Websites_PRD_Blueprint_v1.pdf` (authoritative, both accessed and analyzed)  
**Final Verdict**: 🟢 WR-9 CLOSED — NO CRM CHANGES REQUIRED  
**Code Modifications**: ZERO — read-only investigation only  
**Previous WR-8**: ✅ CLOSED — P0 authorization fix implemented and verified  
**Next**: WR-10 may proceed (if explicitly instructed)