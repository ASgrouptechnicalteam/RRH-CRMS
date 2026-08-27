# WR-9 Step 2-3 — Company/Brand Data & Brand-Specific Public Data (Read-Only)

## Step 2 — Current CRM Company / Brand Data

### Company Model (`prisma/schema.prisma` lines 13-41)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | Int | No | autoincrement() | Primary key |
| `name` | String | Yes | — | Company display name |
| `code` | String | Yes | — | @unique identifier (e.g., TEST_COMP_01) |
| `property_type_group` | String | Yes | "RADHA_REAL_HOMES" | Determines brand: RRH or Sonthillu |
| `announcement_image_url` | String? | Yes | — | For website header banner |
| `announcement_active` | Boolean | Yes | false | Toggle banner visibility |

**Additional data pathways** (not direct Company fields, but accessible via relations):

- `Company.branches` → `Branch.name` — office names
- `Company.employees` → `Employee.full_name`, `Employee.phone`, `Employee.email` — individual contact records
- `Company.leads`/`customers`/`properties`/`projects` — business data (not contact info)

### Brand Identification

| Brand | `property_type_group` Value | Positioning |
|-------|---------------------------|-----------|
| **RRH** | `RADHA_REAL_HOMES` | Commercial plots, residential land, agricultural land |
| **Sonthillu** | `SONTHILLU` | Residential villas, apartments, independent houses |

### Existing Public Data Pathways

| Data Type | Pathway | Availability |
|-----------|---------|--------------|
| Company name | `Company.name` ✅ | Direct |
| Company code | `Company.code` ✅ | Direct |
| Brand identity | `Company.property_type_group` ✅ | Direct |
| Office names | `Company.branches → Branch.name` ✅ | Via relations |
| Company logo/image | `Company.announcement_image_url` ✅ | Optional banner |
| Contact phone | `Employee.phone` ✅ | Per employee; no company-level |
| Contact email | `Employee.email` ✅ | Per employee; no company-level |
| Office address | `Employee.current_address`/`permanent_address` ✅ | Per employee; no company-level |
| Working hours | ❌ Not in schema | Nowhere |
| Support details | ❌ Not in schema | Nowhere |
| Company social media | ❌ Not centralized | `Employee.social_links` only per employee |

## Step 3 — Brand-Specific Public Data

### RRH (RADHA_REAL_HOMES)

| Data Type | Availability | Notes |
|-----------|-------------|-------|
| Public brand identity | ✅ | `property_type_group = RADHA_REAL_HOMES` |
| Commercial/land positioning | ✅ | Schema supports `category: PLOT`, `AGRICULTURAL_LAND`; `listing_type: NEW/RESALE` |
| Property types | ✅ | Villa, Independent Floor, Plot, Farm House, Agricultural Land |
| SEO metadata | ⚠️ Partial | `seo_title`, `seo_keywords`, `slug` exist; `seo_description` does not |
| Property slugs | ✅ | `Property.slug` with `@unique([company_id, slug])` |
| Project slugs | ✅ | `Project.slug` with implicit uniqueness |
| City/state/locality | ✅ | `Property.state`, `Property.city`, `Property.locality` |
| Pincode | ✅ | `Property.pincode` |

### Sonthillu (SONTHILLU)

| Data Type | Availability | Notes |
|-----------|-------------|-------|
| Public brand identity | ✅ | `property_type_group = SONTHILLU` |
| Apartments/villas positioning | ✅ | `category: APARTMENT, VILLA, INDEPENDENT_HOUSE, DUPLEX, INDEPENDENT_FLOOR, PENTHOUSE, STUDIO`; `listing_type: NEW/RESALE` |
| Property types | ✅ | Full residential category enum |
| SEO metadata | ⚠️ Partial | Same as RRH — `seo_title`, `seo_keywords`, `slug` exist; `seo_description` does not |
| Property slugs | ✅ | `Property.slug` with `@unique([company_id, slug])` |
| Project slugs | ✅ | `Project.slug` |
| City/state/locality | ✅ | `Property.state`, `Property.city`, `Property.locality` |
| Pincode | ✅ | `Property.pincode` |

## Brand Coexistence Verification

The architecture intentionally separates RRH and Sonthillu via `Company.property_type_group`:

- **One Company record per brand** — Each brand has its own Company record with `property_type_group` set accordingly
- **No mixed branding** — A single Company record cannot have both `RADHA_REAL_HOMES` and `SONTHILLU`
- **Public API brand filtering** — `GET /:brand/properties` and `GET /:brand/projects` filter by brand name in URL (`rrh` or `sonthillu`), which maps to `property_type_group` via `BRAND_TYPE_MAP`

**Verification:** The schema supports multiple Company records (each with their own `code` @unique), so multiple brands can coexist naturally. No new CMS or schema changes required.

## Step 3 Classification

| Brand | SEO Title | SEO Description | Property Slug | Project Slug | Working Hours | Support Details | Company Social |
|-------|-----------|-----------------|---------------|--------------|---------------|-----------------|----------------|
| **RRH** | ✅ `seo_title` | ❌ Missing | ✅ `Property.slug` | ✅ `Project.slug` | ❌ Not in schema | ❌ Not in schema | ⚠️ Per-employee only |
| **Sonthillu** | ✅ `seo_title` | ❌ Missing | ✅ `Property.slug` | ✅ `Project.slug` | ❌ Not in schema | ❌ Not in schema | ⚠️ Per-employee only |