# WR-9 Step 1 — Requirements Audit (Read-Only Investigation)

## CRM-Capable Data (Already Available in Schema/Api)

| Field | CRM Source | Status |
|-------|-----------|--------|
| Company name | `Company.name` | ✅ Available |
| Company code | `Company.code` @unique | ✅ Available |
| Property type group | `Company.property_type_group` (RADHA_REAL_HOMES / SONTHILLU) | ✅ Available |
| Property title | `Property.title` | ✅ Available |
| Property description | `Property.description` @db.Text | ✅ Available |
| Property price | `Property.price` (Float) | ✅ Available |
| Property area | `Property.area_sqft` (Float) | ✅ Available |
| Property bedrooms | `Property.bedrooms` (Int?) | ✅ Available |
| Property bathrooms | `Property.bathrooms` (Int?) | ✅ Available |
| Property location | `Property.location` (String) | ✅ Available |
| Property address | `Property.address` @db.Text | ✅ Available |
| Property state | `Property.state` (String?) | ✅ Available |
| Property city | `Property.city` (String?) | ✅ Available |
| Property locality | `Property.locality` (String?) | ✅ Available |
| Property pincode | `Property.pincode` (String?) | ✅ Available |
| Property slug | `Property.slug` (String?) | ✅ Available (WR-6) |
| Property seo_title | `Property.seo_title` (String?) | ✅ Available (WR-6) |
| Property seo_keywords | `Property.seo_keywords` (String?) | ✅ Available (WR-6) |
| Project project_code | `Project.project_code` (String @unique) | ✅ Available |
| Project name | `Project.name` (String) | ✅ Available |
| Project description | `Project.description` @db.Text | ✅ Available |
| Project location | `Project.location` (String) | ✅ Available |
| Project total_area | `Project.total_area` (String?) | ✅ Available |
| Project slug | `Project.slug` (String) | ✅ Available (WR-6, @unique w/ company_id) |
| Project launch_date | `Project.launch_date` (DateTime?) | ✅ Available |
| Project status | `Project.status` (String) | ✅ Available |
| Project amenities | `Project.amenities` (Json?) | ✅ Available |
| Employee full_name | `Employee.full_name` (String?) | ✅ Available |
| Employee phone | `Employee.phone` (String?) | ✅ Available |
| Employee email | `Employee.email` (String?) | ✅ Available |
| Employee social_links | `Employee.social_links` (String?) | ✅ Available (LinkedIn, Twitter, Instagram) |
| Employee current_address | `Employee.current_address` (String?) | ✅ Available |
| Employee permanent_address | `Employee.permanent_address` (String?) | ✅ Available |
| Branch name | `Branch.name` (String) | ✅ Available |
| Company announcement_image_url | `Company.announcement_image_url` String? | ✅ Available |
| Company announcement_active | `Company.announcement_active` Boolean | ✅ Available |

## Website-Only Data (Not in CRM Schema/API)

| Field | Required by Website | CRM Source | Status |
|-------|-------------------|-----------|--------|
| HTML `<title>` tag | Yes | Not applicable | 🚫 Website responsibility |
| meta description tag | Yes | Not applicable | 🚫 Website responsibility |
| canonical URL | Yes | Not applicable | 🚫 Website responsibility |
| robots.txt | Yes | Not applicable | 🚫 Website responsibility |
| sitemap.xml | Yes | Not applicable | 🚫 Website responsibility |
| Open Graph meta tags | Yes | Not applicable | 🚫 Website responsibility |
| Twitter cards | Yes | Not applicable | 🚫 Website responsibility |
| JSON-LD structured data | Yes | Not applicable | 🚫 Website responsibility |
| Footer HTML | Yes | Not applicable | 🚫 Website responsibility |
| JavaScript analytics | Yes | Not applicable | 🚫 Website responsibility |
| Page rendering | Yes | Not applicable | 🚫 Website responsibility |

## API-Available Public Data (Already Exposed)

| Endpoint | Data Provided | Status |
|----------|--------------|--------|
| `GET /:brand/properties` | Properties with pagination, filters, `seo_title`, `seo_keywords`, `slug`, `state`, `city`, `pincode`, `title`, `description`, `price`, `area_sqft`, `bedrooms`, `bathrooms` | ✅ Exposed |
| `GET /:brand/properties/:id` | Property detail with all above + `project` subset | ✅ Exposed |
| `GET /:brand/projects` | Projects with `project_code`, `name`, `description`, `slug`, `inventory_summary` | ✅ Exposed |
| `GET /:brand/projects/:id` | Project detail with `inventory_summary` | ✅ Exposed |
| `POST /:brand/leads` | Captures website leads (customer_name, phone, email, source: WEBSITE) | ✅ Exposed |

## Company-Brand Identity (Available)

| Brand | CRM Field | Value |
|-------|-----------|-------|
| RRH | `Company.property_type_group` = `RADHA_REAL_HOMES` | Commercial/Plots |
| Sonthillu | `Company.property_type_group` = `SONTHILLU` | Residential/Villas |

## Gaps Identified — Insufficient Evidence

| Requirement | CRM Status | Evidence |
|-------------|-----------|----------|
| Company display name for footer | ⚠️ May need customization | `Company.name` exists but footer layout not inspected |
| Office contact phone/email | ⚠️ May need configuration | `Company` has no dedicated `phone`/`email` fields beyond what's in employee records |
| Office address (street) | ⚠️ May need configuration | `Branch.name` exists; `Employee.current_address`/ `permanent_address` available but not company-wide |
| Working hours | ❓ Not in schema | No `working_hours` field in Company or Employee |
| Support/contact details | ❓ Not in schema | No dedicated field; would need configuration |
| SEO title (per-property customization) | ⚠️ Partial | `Property.seo_title` exists but may be null/default |
| SEO description (per-property) | 🔴 Missing | No `seo_description` field in Property model; WR-6 explicitly did NOT add it |
| SEO description (per-project) | 🔴 Missing | No `seo_description` field in Project model |
| Canonical URL construction | ⚠️ Partial | `brand + slug` pattern exists; full URL construction not in CRM |
| Social links (company-level) | ⚠️ Partial | `Employee.social_links` exists per employee; company-level not centralized |
| Social links (brand-level) | ❓ Not centralized | No brand-level social media fields |
| Property "last updated" date | ⚠️ Partial | `Property.updated_at` exists but not exposed in public API select |
| Project "last updated" date | ⚠️ Partial | `Project.updated_at` exists but not exposed in public API select |
| Property image alt text | ⚠️ Partial | `PropertyImage.alt_text` exists; only APPROVED images exposed in public API |
| Project property image selection | ⚠️ Partial | Public API selects approved images only |

## Classification Summary

| Category | Count | Classification |
|----------|-------|---------------|
| ✅ CRM can provide (already in schema/API) | 38 fields | Already implemented |
| 🟡 Partial / conditional | 12 fields | Available but may need configuration/defaults |
| 🔴 Missing from CRM | 5 fields | `seo_description` (property), `seo_description` (project), company working_hours, support details, company-level social links |
| 🚫 Website responsibility | 8 fields | HTML title, meta description, canonical URL, robots.txt, sitemap, OG tags, Twitter cards, JSON-LD, footer HTML |

## Key Observations

1. **WR-6 explicitly avoided adding `seo_description`** — The investigation noted that `seo_description` was not added in WR-6 because it was not explicitly required by V1. This remains the current state.

2. **Property and Project slugs are already available** — Both have `slug` fields with uniqueness constraints (`@unique([company_id, slug])` for Property, implicit for Project via `project_code`).

3. **Public API already exposes significant SEO-relevant data** — `seo_title`, `seo_keywords`, `slug`, `state`, `city`, `pincode` are all exposed through the public routes.

4. **Company-level branding is separated by `property_type_group`** — RRH = RADHA_REAL_HOMES (Commercial/Plots), Sonthillu = SONTHILLU (Residential).

5. **No company-level phone/email/address fields** — Contact information would need to come from configuration or employee records, not centralized company fields.

6. **No sitemap, robots.txt, or JSON-LD generation in CRM** — These are clearly website responsibilities per the separation boundary.

7. **The websites are separate applications** — As confirmed in the business boundary, RRH and Sonthillu frontends are not built in this repository.