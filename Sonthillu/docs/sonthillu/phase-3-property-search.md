# Packet 3 — Property Listing, Normal Search & Search Results Foundation

**Date:** 15 August 2026
**Status:** Complete

---

## 1. Search Architecture

### Overview

The Sonthillu search architecture follows a **BFF (Backend-for-Frontend)** pattern:

```
Browser → Next.js Server → CRM Public API → MySQL
```

- CRM API key never exposed to browser
- Search state is URL-serializable (shareable)
- Architecture ready for future AI Search and Match Engine

### Search Model

The canonical search model (`SearchQuery`) supports:

| Field              | Type                                             | Description               |
| ------------------ | ------------------------------------------------ | ------------------------- |
| `location`         | `string`                                         | Free-text location search |
| `propertyType`     | `APARTMENT \| VILLA \| INDEPENDENT_HOUSE`        | Property type filter      |
| `listingType`      | `NEW \| RESALE \| ANY`                           | New/Resale classification |
| `minBudget`        | `number`                                         | Minimum budget in INR     |
| `maxBudget`        | `number`                                         | Maximum budget in INR     |
| `possessionStatus` | `READY_TO_MOVE \| UNDER_CONSTRUCTION \| ANY`     | Availability              |
| `sortBy`           | `relevance \| newest \| price_low \| price_high` | Sort order                |
| `page`             | `number`                                         | Pagination                |
| `limit`            | `number`                                         | Results per page          |

### Future AI Search Integration

Both Normal Search and AI Search will produce the same `SearchQuery` structure:

- **Normal Search**: User fills form → `SearchQuery`
- **AI Search**: Natural language → AI interprets → `SearchQuery` → same matching/ranking

---

## 2. Public Property DTO

### Fields Included

| Field              | Source                                      | Safe for Browser |
| ------------------ | ------------------------------------------- | ---------------- |
| `id`               | CRM property.id                             | ✅               |
| `title`            | CRM property.title                          | ✅               |
| `slug`             | CRM property.property_code                  | ✅               |
| `propertyType`     | Mapped from category                        | ✅               |
| `listingType`      | Default 'NEW' (CRM doesn't distinguish yet) | ✅               |
| `price`            | CRM property.price                          | ✅               |
| `priceFormatted`   | Computed (₹XX L / ₹XX Cr)                   | ✅               |
| `location`         | CRM property.location                       | ✅               |
| `areaSqft`         | CRM property.area_sqft                      | ✅               |
| `bedrooms`         | CRM property.bedrooms                       | ✅               |
| `bathrooms`        | CRM property.bathrooms                      | ✅               |
| `facing`           | CRM property.facing                         | ✅               |
| `possessionStatus` | CRM property.possession_status              | ✅               |
| `primaryImage`     | From property.images                        | ✅               |
| `images`           | From property.images                        | ✅               |
| `amenities`        | Parsed from CRM                             | ✅               |
| `isVerified`       | Default false (CRM doesn't provide yet)     | ✅               |

### Fields Excluded

- ❌ seller data
- ❌ internal source type
- ❌ CRM internal notes
- ❌ employee information
- ❌ exact GPS coordinates
- ❌ private documents
- ❌ internal workflow state

---

## 3. CRM Integration

### Endpoints Used

| Endpoint                               | Method | Purpose                  |
| -------------------------------------- | ------ | ------------------------ |
| `GET /public/sonthillu/properties`     | GET    | List/search properties   |
| `GET /public/sonthillu/properties/:id` | GET    | Property detail (future) |

### Known Limitations

| Limitation                       | Impact                                 | Workaround                                                       |
| -------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| Property detail endpoint missing | Cannot fetch individual property pages | Placeholder page; will be implemented when CRM provides endpoint |
| Project APIs missing             | Cannot show project details            | Placeholder pages                                                |
| `listing_type` not distinguished | Cannot filter New vs Resale            | Default to 'NEW'; UI ready for future                            |
| `is_verified` not provided       | Cannot show verification badge         | Default to false                                                 |
| No pagination in API response    | Limited to single page                 | Architecture ready; pagination placeholder exists                |

---

## 4. Filters Implemented

### Location

- Free-text input
- Search by area name (e.g., "Miyapur", "Gachibowli")

### Property Type

- Dropdown: All Types, Apartment/Flat, Villa, Independent House
- Maps to CRM category field

### Listing Type

- Toggle buttons: Any, New, Resale
- Default: Any

### Budget

- Min/Max text inputs
- Supports: `50L`, `1Cr`, `5000000` formats
- Quick presets: Under ₹50L, ₹50L–₹75L, ₹75L–₹1Cr, ₹1Cr–₹1.5Cr, ₹1.5Cr–₹2Cr, Above ₹2Cr

### Possession Status

- Toggle buttons: Any, Ready, Under Construction
- Default: Any

### Sorting

- Dropdown (desktop) / Bottom sheet (mobile)
- Options: Relevance, Newest First, Price Low to High, Price High to Low
- "Relevance" is placeholder for future Match Engine

---

## 5. Result States

| State       | UI                                                        |
| ----------- | --------------------------------------------------------- |
| **Loading** | 6 skeleton cards in grid                                  |
| **Empty**   | Illustration + "No properties found" + message + CTA      |
| **Error**   | Illustration + error message + "Try Again" button         |
| **Results** | 3-column grid of PropertyCards                            |
| **Partial** | Structure ready for future "Related Properties" insertion |

---

## 6. Responsive Behavior

### Desktop (> 1024px)

- Sidebar filters (272px wide)
- 3-column property grid
- Sort dropdown in header
- Full filter panel always visible

### Tablet (640px – 1024px)

- 2-column property grid
- Filters via drawer (slide-in)
- Sort via bottom sheet

### Mobile (< 640px)

- Single column property cards
- Sticky filter/sort bar at top
- Filters via full-screen drawer
- Sort via bottom sheet
- Comfortable touch targets (44px+)

---

## 7. Property Card Design

### Visual Hierarchy

1. **Image** (4:3 aspect ratio)
2. **Property Type badge** (navy)
3. **Listing Type badge** (gold, if Resale)
4. **Possession badge** (green, if Ready to Move)
5. **Price** (large, navy, bold)
6. **Title** (medium, charcoal)
7. **Location** (with map pin icon)
8. **Specs** (BHK, Bath, Area, Facing)

### Card Features

- Hover shadow elevation
- Image zoom on hover
- Click navigates to `/properties/[slug]`
- Responsive image loading

---

## 8. Accessibility

| Check               | Status                                              |
| ------------------- | --------------------------------------------------- |
| Form labels         | ✅ All inputs have `id` and `label`                 |
| Keyboard navigation | ✅ Tab order, Enter to submit                       |
| Focus visible       | ✅ Focus ring on all interactive elements           |
| ARIA attributes     | ✅ `aria-pressed`, `aria-expanded`, `aria-haspopup` |
| Heading hierarchy   | ✅ h1 → h2 → h3                                     |
| Button semantics    | ✅ `<button>` for actions, `<Link>` for navigation  |
| Color contrast      | ✅ Navy on white (12.5:1), meets WCAG AA            |

---

## 9. Files Created

| File                                      | Purpose                           |
| ----------------------------------------- | --------------------------------- |
| `src/types/search.ts`                     | Search model, types, constants    |
| `src/lib/dto.ts`                          | CRM → Public DTO transformers     |
| `src/components/search/PropertyCard.tsx`  | Property card component           |
| `src/components/search/SearchFilters.tsx` | Filter panel + mobile filter bar  |
| `src/components/search/SortDropdown.tsx`  | Sort dropdown + mobile sort sheet |
| `src/components/search/ResultStates.tsx`  | Loading, empty, error states      |
| `src/components/search/SearchResults.tsx` | Main search results orchestrator  |
| `src/components/search/index.ts`          | Barrel export                     |

## 10. Files Changed

| File                                         | Change                                    |
| -------------------------------------------- | ----------------------------------------- |
| `src/types/search.ts`                        | Complete rewrite with new search model    |
| `src/lib/dto.ts`                             | Extended with PublicProperty transformers |
| `src/app/properties/page.tsx`                | Complete rewrite with search integration  |
| `src/app/search/page.tsx`                    | Redirect to /properties                   |
| `src/components/home/FeaturedProperties.tsx` | Updated to use PublicProperty type        |

---

## 11. Build Verification

```
npm run typecheck → ✓ (no errors)
npm run build → ✓ (16 routes, 0 errors)
```

---

## 12. Known Issues

| Issue                            | Priority | Notes                                                       |
| -------------------------------- | -------- | ----------------------------------------------------------- |
| No real property data            | High     | Requires CRM API integration with real Sonthillu properties |
| Property detail page placeholder | Medium   | CRM property detail endpoint missing                        |
| No pagination                    | Medium   | Architecture ready; API doesn't support yet                 |
| `listing_type` always 'NEW'      | Low      | CRM doesn't distinguish; UI ready                           |
| `is_verified` always false       | Low      | CRM doesn't provide; UI ready                               |

---

## 13. CRM Dependencies

| Dependency                             | Status     | Notes                     |
| -------------------------------------- | ---------- | ------------------------- |
| `GET /public/sonthillu/properties`     | ✅ Exists  | Returns Property[]        |
| `GET /public/sonthillu/properties/:id` | ❌ Missing | Needed for detail pages   |
| `GET /public/sonthillu/projects`       | ❌ Missing | Needed for project pages  |
| `GET /public/sonthillu/projects/:id`   | ❌ Missing | Needed for project detail |

---

## 14. Future Match Engine Integration Point

The search architecture is designed to support a future Match & Ranking Engine:

1. **Normal Search** produces `SearchQuery`
2. **AI Search** produces `SearchQuery` (same structure)
3. **Match Engine** receives `SearchQuery` → returns ranked `PublicProperty[]`
4. **Relevance sort** uses Match Engine score
5. **"Related Properties"** section uses Match Engine recommendations

The `SearchQuery` model is intentionally simple and extensible for:

- Hard requirements (must-have)
- Preferences (nice-to-have)
- Flexible requirements (AI-interpreted)
- Recommendations (behavioral)

---

## 15. Recommended Packet 4

**Packet 4: Property Detail Page + CRM Property Detail Endpoint**

- Implement property detail page at `/properties/[slug]`
- Requires CRM to provide `GET /public/sonthillu/properties/:id`
- Property image gallery
- Full specifications
- Amenities list
- Location map
- Enquiry form (creates lead via CRM)
- Request a Call button
- SEO metadata per property

**Rationale:** The listing/search experience is complete. Users can now discover properties. The natural next step is viewing individual property details.
