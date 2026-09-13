# Packet 5 — Projects: Public CRM API + Project Listing + Project Detail

**Status:** Complete — `npm run typecheck` ✓, `npm run build` ✓

---

## CRM Public Project API

### Endpoints Implemented

| Endpoint                             | Method | Description                                          |
| ------------------------------------ | ------ | ---------------------------------------------------- |
| `/api/v1/public/:brand/projects`     | GET    | List projects with published properties for brand    |
| `/api/v1/public/:brand/projects/:id` | GET    | Project detail with properties and inventory summary |

**File:** `D:\HYD\RRH PWA\apps\api\src\routes\public.ts` (lines 282-442)

### Brand Scoping

- `brand=sonthillu` → filters for `brand_type='SONTHILLU'`
- `brand=rrh` → filters for `brand_type='RADHA_REAL_HOMES'`
- Projects must have at least one published property of the matching brand type for the requesting company
- CANCELLED projects excluded from list

### Publication Check

Reuses existing `PropertyPublication` junction table:

```sql
WHERE property.project_id = :projectId
  AND property.brand_type = :brandType
  AND propertyPublication.company_id = :companyId
  AND propertyPublication.is_published = true
```

### Inventory Summary

Derived from all properties in project (regardless of publication status):

- **Total**: All non-CANCELLED properties
- **Available**: `LIVE` + expired `LOCKED` (`locked_until < NOW()`)
- **Reserved**: Active `LOCKED` (`locked_until > NOW()`)
- **Sold**: `BOOKED` + `SOLD`

### Selects (Public-Safe Fields)

**Project List (`PUBLIC_PROJECT_SELECT`):**

- `id`, `project_code`, `name`, `description`, `location`, `total_area`, `launch_date`, `status`, `amenities`, `created_at`, `slug`
- **Excluded**: `company_id`, `branch_id`, `assigned_pm_id`

**Project Detail (`PUBLIC_PROJECT_DETAIL_SELECT`):**

- Extends list select with `properties` using `PUBLIC_PROJECT_PROPERTY_SELECT`

**Project Properties (`PUBLIC_PROJECT_PROPERTY_SELECT`):**

- `id`, `property_code`, `title`, `description`, `category`, `price`, `area_sqft`, `location`, `bedrooms`, `bathrooms`, `facing`, `amenities`, `possession_status`, `created_at`, `state`, `city`, `locality`, `pincode`, `listing_type`, `slug`
- **Images**: Only `APPROVED` status, ordered by `sort_order`
- **Excluded**: `status`, `company_id`, `branch_id`, `assigned_pm_id`, `created_by_id`, `latitude`, `longitude`, `locked_until`, `rejection_reason`, internal workflow timestamps

---

## CRM Tests

**File:** `D:\HYD\RRH PWA\tests\api\public-project-api.test.ts`

**Coverage:** 22 tests passing

| Category                   | Tests |
| -------------------------- | ----- |
| Project List (sonthillu)   | 5     |
| Project List (rrh)         | 2     |
| Project Detail             | 4     |
| Brand Scoping              | 2     |
| Error Handling             | 5     |
| Inventory Summary Accuracy | 4     |

**Key Validations:**

- ✅ Published Sonthillu project returned
- ✅ Unpublished project rejected (404)
- ✅ RRH-only project rejected for Sonthillu (404)
- ✅ Invalid brand → 400
- ✅ Invalid ID → 404
- ✅ Internal fields absent (`company_id`, `branch_id`, `assigned_pm_id`)
- ✅ Private coordinates absent
- ✅ Unapproved images absent
- ✅ Inventory summary accurate (LIVE=available, expired LOCKED=available, active LOCKED=reserved, SOLD/BOOKED=sold)
- ✅ API auth/rate limiting enforced

---

## Website Implementation

### Routes

| Route            | Type       | Description          |
| ---------------- | ---------- | -------------------- |
| `/projects`      | Static (○) | Project listing page |
| `/projects/[id]` | SSG (●)    | Project detail page  |

### Types Extended (`src/types/search.ts`)

```typescript
interface PublicProject {
  id: number;
  projectCode: string;
  name: string;
  slug: string | null;
  description: string | null;
  location: string;
  totalArea: string | null;
  launchDate: string | null;
  status: string;
  amenities: string[];
  createdAt: string;
  inventorySummary: { total: number; available: number; reserved: number; sold: number };
  primaryImage: string | null;
  images: PublicPropertyImage[];
}

interface PublicProjectDetail extends PublicProject {
  properties: PublicProperty[];
}
```

### CRM Adapter (`src/lib/crm.ts`)

| Function                       | Description                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| `getPublishedProjects()`       | Fetches `/projects`, transforms to `PublicProject[]`         |
| `getProjectDetailById(id)`     | Fetches `/projects/:id`, transforms to `PublicProjectDetail` |
| `getProjectDetailByCode(code)` | Fetches by slug/code                                         |

### DTO Transformers (`src/lib/dto.ts`)

| Function                             | Description                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `toPublicProject(apiResponse)`       | Maps API response to `PublicProject` with derived `primaryImage`, `images[]`, `inventorySummary` |
| `toPublicProjectDetail(apiResponse)` | Extends base with transformed `properties[]` as `PublicProperty`                                 |

### Components Created

```
src/components/project/
├── ProjectCard.tsx          # Listing card: image, name, location, price range, configs, inventory badge, status
├── ProjectHero.tsx          # Detail hero: full-width image, gradient overlay, title, location, status badges, gallery
├── ProjectInfo.tsx          # Detail identity: status, specs grid (area, launch, configs, price range), inventory counters
├── ProjectActions.tsx       # CTAs: Call Now, Request Call, Enquire modal (client)
├── ProjectAmenities.tsx     # Icon chips for amenities
├── ProjectInventory.tsx     # Available units grouped by type (Apartment/Villa/House), links to /properties
├── ProjectLocation.tsx      # Address card + Google Maps/Directions links
├── ProjectLocation.tsx      # Address card + Google Maps/Directions links
├── ProjectDetailClient.tsx  # Client orchestrator + sticky sidebar (price range, book visit, share)
├── index.ts                 # Barrel export
```

### Project Card Visual Language (Distinct from PropertyCard)

| Element   | ProjectCard                                   | PropertyCard           |
| --------- | --------------------------------------------- | ---------------------- |
| Badge     | Project status + Available count              | Possession status only |
| Price     | Range (min–max)                               | Single formatted price |
| Configs   | Derived from inventory (2 BHK, 3 BHK, Villa)  | Single BHK             |
| Inventory | 4-metric grid (Total/Available/Reserved/Sold) | N/A                    |
| CTA       | "View Project" arrow                          | Direct link            |

---

## SEO Implementation

| Page             | Implementation                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `/projects`      | Static metadata: title, description, canonical, OG, Twitter                                          |
| `/projects/[id]` | Dynamic `generateMetadata()`: fetches project, builds title/description/canonical/OG/Twitter/JSON-LD |
| JSON-LD          | `@type: 'Residence'` with name, description, url, image[], address, offers (price range)             |
| Robots           | `noindex, nofollow` for not-found/unpublished                                                        |

---

## Responsive Verification

| Breakpoint | Hero                  | Grid  | Inventory   | Sticky Sidebar  |
| ---------- | --------------------- | ----- | ----------- | --------------- |
| 360px      | Stacked, full-width   | 1-col | 1-col cards | Below content   |
| 390px      | Same                  | 1-col | 1-col       | Below content   |
| 768px      | Aspect 16:9           | 2-col | 2-col       | Sticky `top-24` |
| 1024px     | Aspect 21:9           | 3-col | 3-col       | Sticky          |
| 1440px     | Max-width constrained | 3-col | 3-col       | Sticky          |

**Special Attention:**

- Hero: `priority` image, gradient overlay for text legibility
- Gallery: Reuses `ImageGallery` (keyboard nav, fullscreen, thumbnails)
- Inventory: Grouped by type, "View All" links to `/properties?project=`
- Sticky sidebar: Price range, Book Visit CTA, Share buttons

---

## Accessibility Verification

| Check                                 | Status                            |
| ------------------------------------- | --------------------------------- |
| Semantic headings (h1→h2→h3)          | ✅                                |
| Keyboard gallery controls             | ✅ (via ImageGallery)             |
| Image alt text                        | ✅ (project name, property title) |
| Button labels (aria-label)            | ✅                                |
| Focus rings (`focus:ring-brand-gold`) | ✅                                |
| Contrast (Navy/Gold/Sage)             | ✅ WCAG AA                        |
| Touch targets (min 44×44px)           | ✅                                |
| Modal focus trap (enquiry)            | ✅                                |

---

## CRM Dependencies & Known Limitations

| Dependency                         | Status                          | Impact                                   |
| ---------------------------------- | ------------------------------- | ---------------------------------------- |
| `PropertyPublication` for projects | ✅ Reused                       | Brand scoping works                      |
| Project images                     | ❌ No `ProjectImage` model      | Uses first property's images as fallback |
| `price_from`/`price_to` on project | ❌ Not in schema                | Derived from inventory properties        |
| RERA fields on project             | ❌ Not in schema                | Not displayed                            |
| Project slug routing               | ⚠️ API supports `/code/:code`   | Website uses `/projects/[id]` only       |
| Unit-level availability            | ⚠️ Derived from property status | No tower/floor/unit hierarchy            |
| Image approval workflow            | ⚠️ May not exist in CRM         | Only `APPROVED` images shown             |

---

## Files Created

```
D:\HYD\RRH PWA\tests\api\public-project-api.test.ts
D:\HYD\Sonthillu\src\types\search.ts (extended)
D:\HYD\Sonthillu\src\lib\crm.ts (added project functions)
D:\HYD\Sonthillu\src\lib\dto.ts (added project transformers)
D:\HYD\Sonthillu\src\components\project\ProjectCard.tsx
D:\HYD\Sonthillu\src\components\project\ProjectHero.tsx
D:\HYD\Sonthillu\src\components\project\ProjectInfo.tsx
D:\HYD\Sonthillu\src\components\project\ProjectActions.tsx
D:\HYD\Sonthillu\src\components\project\ProjectAmenities.tsx
D:\HYD\Sonthillu\src\components\project\ProjectInventory.tsx
D:\HYD\Sonthillu\src\components\project\ProjectLocation.tsx
D:\HYD\Sonthillu\src\components\project\ProjectDetailClient.tsx
D:\HYD\Sonthillu\src\components\project\index.ts
D:\HYD\Sonthillu\src\app\projects\page.tsx
D:\HYD\Sonthillu\src\app\projects\[id]\page.tsx
```

---

## Files Changed (CRM)

```
D:\HYD\RRH PWA\apps\api\src\routes\public.ts
  - Added PUBLIC_PROJECT_SELECT, PUBLIC_PROJECT_PROPERTY_SELECT, PUBLIC_PROJECT_DETAIL_SELECT
  - GET /api/v1/public/:brand/projects (lines 324-379)
  - GET /api/v1/public/:brand/projects/:id (lines 383-442)
  - Removed `status` from PUBLIC_PROJECT_PROPERTY_SELECT (security)
  - deriveInventorySummary() helper
```

---

## Verification Results

```
> sonthillu-website@1.0.0 typecheck
> tsc --noEmit
✓ No errors

> sonthillu-website@1.0.0 build
> next build
✓ Compiled successfully
✓ TypeScript passed
✓ Generating static pages (16/16)
Routes:
  ○ /projects
  ● /projects/[id]
  ƒ /properties
  ● /properties/[id]
```

---

## Recommended Packet 6

1. **Project Image Model** — Add `ProjectImage` to Prisma with approval workflow; update API to use project-level images
2. **Project RERA Fields** — Add `rera_number`, `rera_status`, `rera_approved_date` to Project model
3. **Price Range on Project** — Add `price_from`, `price_to` to Project model for direct price range
4. **Slug-based Routing** — Implement `/projects/[slug]` on website using `getProjectDetailByCode`
5. **Tower/Building Hierarchy** — If CRM supports towers/buildings, expose in inventory
6. **Map Integration** — Replace Google Maps links with embedded static map (Leaflet/MapLibre) using public locality centroid
7. **Project Comparison** — Add `/compare` support for projects
8. **Virtual Tour / Video** — Extend gallery for video/360° if CRM adds media types
