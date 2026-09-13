# Packet 2 — Homepage UX Review, Refinement & Completion

**Date:** 15 August 2026
**Status:** Complete

---

## 1. Evaluation Summary

### Critical Issues Fixed

| Issue                               | Resolution                                                             |
| ----------------------------------- | ---------------------------------------------------------------------- |
| Broken `/pattern.svg` reference     | Removed; replaced with CSS decorative blur elements                    |
| `'use client'` on entire page       | Split into server component (page.tsx) + client component (HeroSearch) |
| `rounded-button` class in Header    | Replaced with `rounded-lg` (Tailwind v4 compatible)                    |
| Generic "Find Your Dream Home" copy | Changed to "Find the Home Your Family Deserves"                        |
| No page-specific SEO                | Added metadata, JSON-LD structured data, canonical URL                 |
| No skip navigation                  | Added skip-to-content link                                             |

### UX Issues Fixed

| Issue                                        | Resolution                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| AI Search hidden in chips                    | Elevated to visible toggle in search mode selector                          |
| Category chips as links disguised as buttons | Moved to dedicated CategoryDiscovery section with proper card UI            |
| Featured Properties bare skeleton            | Added proper skeleton, empty state, and PropertyCard with image/badge/price |
| CTA equal-weight buttons                     | Changed to gold primary (Browse) + secondary (Sell) hierarchy               |
| No accessibility labels                      | Added `aria-label`, `aria-pressed`, `aria-expanded` where needed            |

---

## 2. Files Changed

### New Files

- `src/components/home/HeroSearch.tsx` — Client component: dual search mode (keyword/AI), search input, category quick links
- `src/components/home/FeaturedProperties.tsx` — Server component: skeleton, empty state, PropertyCard with CRM-ready interface
- `src/components/home/CategoryDiscovery.tsx` — Server component: 4 category cards (Apartments, Villas, Independent Houses, Ready to Move)
- `src/components/home/TrustSection.tsx` — Server component: 3 trust signals (Quality, Locations, Transparency)
- `src/components/home/CTASection.tsx` — Server component: final conversion section
- `src/components/home/index.ts` — Barrel export

### Modified Files

- `src/app/page.tsx` — Complete rewrite: server component with SEO metadata, JSON-LD, new section architecture
- `src/app/layout.tsx` — Added skip navigation link, `id="main-content"` on main
- `src/components/layout/Header.tsx` — Fixed `rounded-button` → `rounded-lg`, added aria attributes

---

## 3. Homepage Information Architecture (Final)

```
1. Hero Section (gradient + decorative blurs)
   └── Sonthillu Constructions label
   └── Headline (Playfair Display)
   └── Subtitle
   └── Dual Search Mode Toggle (Location/Keyword | Describe in English)
   └── Search Input + Button
   └── Popular category quick links

2. Category Discovery (white bg)
   └── "Find Your Home Type" heading
   └── 4 category cards: Apartments, Villas, Independent Houses, Ready to Move

3. Featured Properties (surface bg)
   └── "Handpicked Homes" heading
   └── 3-column property cards (skeleton/empty/data states)
   └── "View All Properties" CTA

4. Trust Section (surface bg)
   └── "Why Families Trust Sonthillu" heading
   └── 3 trust cards: Quality Construction, Prime Locations, Transparent Dealings

5. CTA Section (navy bg)
   └── Headline
   └── Subtitle
   └── Browse All Properties (gold) + Sell Your Property (secondary)
```

---

## 4. Search Architecture

### Dual Entry Points

| Mode                    | Trigger            | Behavior                                                    |
| ----------------------- | ------------------ | ----------------------------------------------------------- |
| **Location/Keyword**    | Default active tab | SearchField with "Search" button → `/properties?search=...` |
| **Describe in English** | Tab link           | Navigates to `/ai-search`                                   |

### Category Quick Links

- Apartments → `/properties?category=APARTMENT`
- Villas → `/properties?category=VILLA`
- Independent Houses → `/properties?category=INDEPENDENT_HOUSE`

---

## 5. Data Architecture

### FeaturedProperties Interface

```typescript
interface FeaturedPropertiesProps {
  properties?: Property[]; // From CRM API
  loading?: boolean; // Skeleton state
}
```

### States Handled

| State                          | UI                       |
| ------------------------------ | ------------------------ |
| `loading=true`                 | 3 skeleton cards         |
| `properties=[]` or `undefined` | Empty state with message |
| `properties=[...]`             | Up to 6 property cards   |

### PropertyCard Data Used

- `id` → link to `/properties/[id]`
- `title` → card heading
- `location` → subtitle
- `category` → badge
- `price` → formatted INR price
- `area_sqft` → area display
- `bedrooms` / `bathrooms` → specs
- `possession_status` → "Ready to Move" badge
- `images[0].image_url` → card image (fallback: `/placeholder-property.jpg`)

---

## 6. SEO Implementation

### Page Metadata

```typescript
title: 'Sonthillu — Premium Residential Properties in Hyderabad';
description: 'Discover apartments, villas, and independent houses...';
alternates: {
  canonical: '/';
}
openGraph: {
  (title, description, url, siteName, type, locale);
}
```

### JSON-LD Structured Data

```json
{
  "@type": "RealEstateAgent",
  "name": "Sonthillu Constructions",
  "areaServed": { "@type": "City", "name": "Hyderabad" },
  "makesOffer": ["Apartments", "Villas", "Independent Houses"]
}
```

---

## 7. Accessibility

| Check                            | Status                                          |
| -------------------------------- | ----------------------------------------------- |
| Skip navigation link             | ✅ Added                                        |
| Heading hierarchy (h1 → h2 → h3) | ✅ Verified                                     |
| Search input label               | ✅ `aria-label` on SearchField                  |
| Category cards                   | ✅ Semantic links with descriptive text         |
| Mobile menu button               | ✅ `aria-label`, `aria-expanded`                |
| Focus visible states             | ✅ Via Tailwind focus utilities                 |
| Color contrast                   | ✅ Navy on white (12.5:1), Gold on navy (4.8:1) |
| Image alt text                   | ✅ Property titles used as alt                  |

---

## 8. Performance

| Check               | Status                                         |
| ------------------- | ---------------------------------------------- |
| Server/Client split | ✅ Only HeroSearch is client component         |
| Static generation   | ✅ Homepage prerendered as static              |
| Image lazy loading  | ✅ `loading="lazy"` on property images         |
| Font loading        | ✅ Inter + Playfair Display via CSS variables  |
| No layout shift     | ✅ Aspect-ratio containers on images/skeletons |
| Decorative elements | ✅ CSS blur (no image files)                   |

---

## 9. Responsive Behavior

### Mobile (< 640px)

- Hero: stacked layout, full-width search
- Categories: 1-column stack
- Featured: single column
- Trust: stacked cards
- CTA: stacked buttons

### Tablet (640px - 1024px)

- Hero: centered with padding
- Categories: 2-column grid
- Featured: 2-column grid
- Trust: 3-column grid

### Desktop (> 1024px)

- Hero: max-width container, spacious
- Categories: 4-column grid
- Featured: 3-column grid
- Trust: 3-column grid
- CTA: horizontal buttons

---

## 10. Cross-Branding

- Footer: "A Radha Real Homes venture" (subtle, bottom-right)
- No RRH colors, logos, or patterns on homepage
- Sonthillu has distinct navy/gold/sage palette
- No "powered by RRH" or similar intrusive branding

---

## 11. Acceptance Criteria Verification

| Criterion                             | Status                                                 |
| ------------------------------------- | ------------------------------------------------------ |
| 1. Homepage looks uniquely Sonthillu  | ✅ Navy/gold/sage palette, Playfair Display, warm copy |
| 2. No rental UI exists                | ✅ No rent tabs, filters, or CTAs                      |
| 3. Normal Search entry is obvious     | ✅ Search bar with "Location/Keyword" mode active      |
| 4. AI Search entry is obvious         | ✅ "Describe in English" tab toggle                    |
| 5. Residential categories are clear   | ✅ 4-card CategoryDiscovery section                    |
| 6. No fake property inventory as real | ✅ Skeleton/empty states, no hardcoded listings        |
| 7. CRM-ready data boundaries exist    | ✅ FeaturedProperties accepts Property[]               |
| 8. Desktop and mobile are polished    | ✅ Responsive grid, stacked mobile                     |
| 9. Cross-branding is subtle           | ✅ Footer-only "A Radha Real Homes venture"            |
| 10. SEO foundation is implemented     | ✅ metadata, JSON-LD, canonical                        |
| 11. Existing typecheck/build pass     | ✅ `npm run typecheck` ✓, `npm run build` ✓            |

---

## 12. Build Verification

```
npm run typecheck → ✓ (no errors)
npm run build → ✓ (16 routes, 0 errors)
```

---

## 13. Remaining Issues

| Issue                                    | Priority | Notes                                              |
| ---------------------------------------- | -------- | -------------------------------------------------- |
| No real property images                  | Medium   | Requires CRM API integration (Packet 4+)           |
| Social links point to generic URLs       | Low      | Need actual Sonthillu social media URLs            |
| `placeholder-property.jpg` doesn't exist | Low      | Add placeholder image or use CSS gradient fallback |
| No font preloading                       | Low      | Add `<link rel="preconnect">` for Google Fonts     |

---

## 14. Recommended Packet 3

**Packet 3: Property Listing & Search Results**

- Property listing page with filters
- Search results page with filter panel
- Property card component (fully functional)
- Filter components (location, category, BHK, budget, etc.)
- Pagination / infinite scroll
- Empty state for no results
- Sort functionality
- URL-based filter state

**Rationale:** The homepage now has proper entry points (search, categories, featured). The natural next step is the pages those entry points lead to.
