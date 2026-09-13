# Packet 4 — Property Detail Page

**Route:** `/properties/[id]` (dynamic, handles both numeric ID and property code slug)

**Status:** Complete — `npm run typecheck` ✓, `npm run build` ✓

---

## Route & Server/Client Boundary

| Aspect           | Implementation                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Route            | `/src/app/properties/[id]/page.tsx` — dynamic route accepting numeric ID or property code      |
| Server component | `PropertyDetailPage` — fetches property detail + similar properties via CRM BFF                |
| Client component | `PropertyDetailClient` — isolates interactive pieces (gallery, actions, enquiry modal)         |
| Dynamic params   | Single `[id]` segment; tries `Number(id)` first, falls back to `getPropertyDetailByCode(slug)` |
| Static params    | `generateStaticParams() = []` — fully dynamic (SSR)                                            |

---

## Public API Contract Consumed

**Endpoint:** `GET /api/v1/public/sonthillu/properties/:id`

**DTO:** `PublicPropertyDetail` (defined in `src/types/search.ts`)

### Fields Consumed

| Field                          | Source | Used In                                                       |
| ------------------------------ | ------ | ------------------------------------------------------------- |
| `id`                           | CRM    | Page routing, canonical URL, similar properties filter        |
| `property_code`                | CRM    | Property ID display, slug fallback                            |
| `title`                        | CRM    | Page title, OG title, schema.org `name`                       |
| `description`                  | CRM    | Overview section, meta description, schema.org `description`  |
| `category` → `propertyType`    | CRM    | Badge, specs grid, schema.org                                 |
| `listing_type` → `listingType` | CRM    | Badge, specs grid                                             |
| `price` → `priceFormatted`     | CRM    | Price display, price summary, schema.org `offers.price`       |
| `area_sqft` → `areaFormatted`  | CRM    | Specs grid, price per sq.ft., schema.org `floorSize`          |
| `location`                     | CRM    | Location line, meta description                               |
| `address`                      | CRM    | Location card                                                 |
| `bedrooms`                     | CRM    | Specs grid (BHK), schema.org `numberOfRooms`                  |
| `bathrooms`                    | CRM    | Specs grid                                                    |
| `facing`                       | CRM    | Specs grid                                                    |
| `possession_status`            | CRM    | Badge, specs grid                                             |
| `amenities[]`                  | CRM    | Amenities section (chips with icons)                          |
| `details`                      | CRM    | Additional details section (dl list)                          |
| `seo_keywords`                 | CRM    | Key highlights tags                                           |
| `state/city/locality/pincode`  | CRM    | Location card, schema.org `address`                           |
| `images[]` (APPROVED only)     | CRM    | Gallery (primary + thumbnails), OG images, schema.org `image` |
| `project`                      | CRM    | Project context section (link to `/projects/[slug]`)          |

### Fields NOT Used (Privacy Boundary)

- `company_id`, `branch_id`, `assigned_pm_id`, `created_by_id`
- `status`, `rejection_reason`, `locked_until`, `locked_by_booking_id`
- `verified_by_pm_at`, `dm_polished_at`, `md_approved_at`
- `brand_type`
- `latitude`, `longitude` (exact GPS)
- Any seller/contact/internal document fields

---

## Rendered Sections (Top to Bottom)

1. **Breadcrumb / Location Context** — implicit via Header + property location line
2. **Image Gallery** (`ImageGallery`) — primary image, thumbnail strip, keyboard navigation, fullscreen modal
3. **Property Identity** (`PropertyInfo`) — type badge, title, location, price, specs grid (only populated fields)
4. **Primary Actions** (`PropertyActions`) — Call Now, Request a Call, Shortlist, Compare
5. **Overview / Description** (`PropertyDetails`) — prose rendering of `description`
6. **Amenities & Features** (`PropertyDetails`) — icon chips for each amenity
7. **Additional Details** (`PropertyDetails`) — `details` object as definition list
8. **Key Highlights** (`PropertyDetails`) — `seo_keywords` as tags
9. **Location Context** (`LocationContext`) — structured address, Google Maps / Directions links
10. **Project Relationship** (`ProjectContext`) — project name, status badge, location, link (if `project` exists)
11. **Similar Properties** (`SimilarProperties`) — 3-card grid, insertion point for future Recommendation Engine
12. **Sticky Sidebar** — Price summary, Book Visit CTA, Share buttons

---

## CRM Dependencies

| Dependency                             | Status                 | Notes                                                                           |
| -------------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| `GET /public/sonthillu/properties/:id` | ✅ Exists              | Documented in `docs/api/public-property-detail.md`                              |
| `GET /public/sonthillu/properties`     | ✅ Exists              | Used for similar properties (fallback list)                                     |
| Property publication check             | ✅ Enforced            | Only `LIVE` or expired `LOCKED` returned                                        |
| Image approval filter                  | ⚠️ Partial             | API filters `status: 'APPROVED'` but approval workflow may not exist in CRM yet |
| Project detail API                     | ❌ Missing             | Project link goes to `/projects/[slug]` which will 404 until Packet 5+          |
| RERA fields                            | ❌ Not in schema       | Not rendered                                                                    |
| `priceFrom`/`priceTo`                  | ❌ Single `price` only | Shows single price with "negotiable" language                                   |

---

## SEO Implementation

| Element              | Implementation                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `<title>`            | Dynamic: `"{property.title} — Sonthillu Constructions"`                                                                            |
| `meta description`   | Dynamic: truncated `description` or generated from specs                                                                           |
| `canonical`          | `https://sonthilluconstructions.com/properties/{property.id}`                                                                      |
| Open Graph           | `og:title`, `og:description`, `og:url`, `og:site_name`, `og:type=website`, `og:locale=en_IN`, `og:image` (up to 3 approved images) |
| Twitter Card         | `summary_large_image` with title, description, first image                                                                         |
| JSON-LD (schema.org) | `RealEstateListing` with name, description, url, image[], address, offers, floorSize, numberOfRooms                                |
| Robots               | `noindex, nofollow` for not-found/unpublished properties                                                                           |
| Dynamic metadata     | `generateMetadata()` async function — fetches property for metadata                                                                |

---

## Responsive Verification

| Breakpoint | Gallery                       | Price            | Sticky Sidebar             | CTA Hierarchy      | Text Wrapping | Image Cropping               |
| ---------- | ----------------------------- | ---------------- | -------------------------- | ------------------ | ------------- | ---------------------------- |
| 360px      | Stacked thumbnails, swipeable | Large, prominent | Below content (not sticky) | Full-width stacked | No overflow   | `object-cover`, aspect-[4/3] |
| 390px      | Same                          | Same             | Same                       | Same               | Good          | Good                         |
| 768px      | Thumbnails horizontal scroll  | Side-by-side     | Sticky `top-24`            | Two-column         | Good          | Good                         |
| 1024px     | Full grid                     | Full             | Sticky                     | Two-column         | Good          | Good                         |
| 1440px     | Max-width constrained         | Max-width        | Sticky                     | Two-column         | Good          | Good                         |

**Special attention:**

- Gallery: Keyboard arrows, Escape to close fullscreen, ARIA roles for tab list
- Sticky sidebar: `top-24` accounts for Header height; becomes static on mobile
- Price: `text-3xl md:text-4xl` — never wraps awkwardly
- Share buttons: Horizontal flex-wrap on mobile

---

## Accessibility Verification

| Check                     | Status | Notes                                                   |
| ------------------------- | ------ | ------------------------------------------------------- |
| Keyboard gallery controls | ✅     | Arrow keys, Escape, Tab through thumbnails              |
| Image alt text            | ✅     | Uses `altText` from API or fallback `title - Image N`   |
| Button names              | ✅     | All icon buttons have `aria-label`                      |
| Heading hierarchy         | ✅     | `h1` (title) → `h2` (section heads) → `h3` (project)    |
| Focus states              | ✅     | `focus:ring-2 focus:ring-brand-gold` on all interactive |
| Contrast                  | ✅     | Navy/Gold/Sage palette meets WCAG AA                    |
| Touch targets             | ✅     | Min 44×44px (Button `lg` = 48px height)                 |
| ARIA roles                | ✅     | Gallery uses `role="tablist"` / `role="tab"`            |
| Modal trap                | ✅     | Enquiry modal traps focus, Escape closes                |

---

## Performance

| Metric        | Approach                                                                            |
| ------------- | ----------------------------------------------------------------------------------- |
| Image loading | Native `<img loading="lazy">` on thumbnails; primary eager                          |
| Client JS     | Only `PropertyDetailClient` + `ImageGallery` + `PropertyActions` are `'use client'` |
| Layout shift  | Aspect-ratio boxes on gallery (`aspect-[4/3]`), fixed sidebar height                |
| Font loading  | `font-display: swap` via `globals.css`; display font inline style                   |
| API requests  | Parallel `Promise.all([property, similar])`; `revalidate: 300` on CRM fetch         |
| Caching       | `generateStaticParams = []` → fully dynamic; no stale static shells                 |

---

## Known Limitations

| Limitation                             | Impact                             | Resolution Target                |
| -------------------------------------- | ---------------------------------- | -------------------------------- |
| Similar properties = first 6 published | Not personalized                   | Packet 5: Recommendation Engine  |
| Project link → 404                     | `/projects/[slug]` not implemented | Packet 5: Project Listing/Detail |
| No RERA display                        | Schema incomplete                  | CRM schema extension             |
| Single price field                     | No price range UI                  | CRM `priceFrom`/`priceTo` fields |
| Enquiry modal = mock                   | No backend submission              | Packet 5: Lead API integration   |
| Image approval workflow                | May return all images as APPROVED  | CRM workflow implementation      |
| No floor plan images                   | Not in API                         | Future enhancement               |

---

## Files Created

```
src/types/search.ts          (extended: PublicPropertyDetail, PublicProjectReference, PublicPropertyImage)
src/types/property.ts        (extended: PropertyImage, Property, ProjectReference)
src/lib/dto.ts               (added: toPublicPropertyDetail, toPublicPropertyImageDetail, toPublicProjectReference)
src/lib/crm.ts               (added: getPropertyDetailById, getPropertyDetailByCode, lazy config)
src/components/property/
  ├── ImageGallery.tsx       (client: gallery, thumbnails, fullscreen, keyboard)
  ├── PropertyInfo.tsx       (client: identity, price, specs grid)
  ├── PropertyActions.tsx    (client: CTAs, shortlist, compare, enquiry modal)
  ├── PropertyDetails.tsx    (server: overview, amenities, details, highlights)
  ├── LocationContext.tsx    (server: address, map links)
  ├── ProjectContext.tsx     (server: project card + link)
  ├── SimilarProperties.tsx  (client: 3-card grid, RE insertion point)
  ├── PropertyDetailClient.tsx (client: orchestrator + sticky sidebar)
  └── index.ts               (barrel export)
src/app/properties/[id]/page.tsx (server: fetch, metadata, SSR)
```

## Files Changed

```
src/types/search.ts
src/types/property.ts
src/lib/dto.ts
src/lib/crm.ts
```

---

## Typecheck Result

```
> sonthillu-website@1.0.0 typecheck
> tsc --noEmit
✓ No errors
```

## Build Result

```
> sonthillu-website@1.0.0 build
> next build
✓ Compiled successfully
✓ TypeScript passed
✓ Generating static pages (16/16)
Route /properties/[id] → ƒ (Dynamic)
```

---

## Recommended Packet 5

1. **Project Listing & Detail** — `/projects` and `/projects/[slug]` to make ProjectContext link functional
2. **Recommendation Engine** — Replace `SimilarProperties` static slice with ML/rule-based recommendations
3. **Lead/Enquiry API Integration** — Wire `PropertyActions` enquiry modal to CRM `/leads` endpoint
4. **Persistent Shortlist/Compare** — Add customer auth + localStorage sync + server persistence
5. **CRM Schema Extensions** — `price_from`/`price_to`, `rera_number`, `floor_plan_images`, image approval workflow
6. **Map Integration** — Replace Google Maps links with embedded static/Leaflet map using public locality centroid
7. **Virtual Tour / Video** — Extend gallery to support video/360° if CRM adds media types
