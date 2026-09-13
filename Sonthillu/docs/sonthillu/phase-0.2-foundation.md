# Phase 0.2 — Foundation Report: Sonthillu Website

**Date:** 15 August 2026
**Status:** Implementation Complete — Awaiting Review

---

## 1. Project Structure

```
D:\HYD\Sonthillu\
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Homepage
│   │   ├── not-found.tsx             # 404 page
│   │   ├── loading.tsx               # Loading state
│   │   ├── sitemap.ts                # Dynamic sitemap
│   │   ├── robots.ts                 # Robots.txt
│   │   ├── properties/
│   │   │   ├── page.tsx              # Property listing
│   │   │   └── [slug]/page.tsx       # Property detail
│   │   ├── projects/
│   │   │   ├── page.tsx              # Project listing
│   │   │   └── [slug]/page.tsx       # Project detail
│   │   ├── search/page.tsx           # Search results
│   │   ├── ai-search/page.tsx        # AI search
│   │   ├── sell-property/page.tsx    # Seller intake
│   │   ├── shortlist/page.tsx        # Saved properties
│   │   ├── compare/page.tsx          # Property comparison
│   │   ├── about/page.tsx            # About page
│   │   ├── contact/page.tsx          # Contact page
│   │   ├── login/page.tsx            # Customer login
│   │   └── register/page.tsx         # Customer registration
│   ├── components/
│   │   ├── layout/                   # Layout components (empty for now)
│   │   ├── property/                 # Property components (empty for now)
│   │   ├── project/                  # Project components (empty for now)
│   │   ├── search/                   # Search components (empty for now)
│   │   ├── common/                   # Common components (empty for now)
│   │   └── ui/                       # UI components (empty for now)
│   ├── lib/
│   │   ├── crm.ts                    # Server-only CRM client
│   │   ├── dto.ts                    # Public DTO transformations
│   │   ├── constants.ts              # Brand configuration
│   │   └── utils.ts                  # Utility functions
│   ├── types/
│   │   ├── property.ts               # Property types
│   │   ├── project.ts                # Project types
│   │   ├── search.ts                 # Search/requirement types
│   │   ├── auth.ts                   # Auth types
│   │   └── api.ts                    # API types
│   └── styles/
│       └── globals.css               # Global styles with Tailwind
├── public/                           # Static assets (empty for now)
├── tests/
│   ├── unit/                         # Unit tests (empty for now)
│   ├── integration/                  # Integration tests (empty for now)
│   └── e2e/                          # E2E tests (empty for now)
├── scripts/
│   └── verify-security.ts            # Security verification script
├── docs/sonthillu/                   # Documentation
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── postcss.config.mjs                # PostCSS configuration
├── package.json                      # Dependencies and scripts
└── README.md                         # Project documentation
```

---

## 2. Dependencies

### Production Dependencies

| Package   | Version | Purpose           |
| --------- | ------- | ----------------- |
| next      | ^16.3.1 | Next.js framework |
| react     | ^19.1.0 | React library     |
| react-dom | ^19.1.0 | React DOM         |
| zod       | ^3.25.0 | Schema validation |

### Development Dependencies

| Package              | Version  | Purpose               |
| -------------------- | -------- | --------------------- |
| typescript           | ^5.4.5   | TypeScript compiler   |
| @types/node          | ^22.15.0 | Node.js types         |
| @types/react         | ^19.1.0  | React types           |
| @types/react-dom     | ^19.1.0  | React DOM types       |
| tailwindcss          | ^4.1.0   | Tailwind CSS          |
| @tailwindcss/postcss | ^4.1.0   | PostCSS plugin        |
| postcss              | ^8.5.0   | PostCSS               |
| autoprefixer         | ^10.4.21 | Autoprefixer          |
| eslint               | ^9.28.0  | Linter                |
| eslint-config-next   | ^16.3.1  | Next.js ESLint config |
| prettier             | ^3.5.0   | Formatter             |
| clsx                 | ^2.1.0   | Class name utility    |

---

## 3. Framework Versions

| Framework         | Version |
| ----------------- | ------- |
| Next.js           | 16.3.1  |
| React             | 19.1.0  |
| TypeScript        | 5.4.5   |
| Tailwind CSS      | 4.1.0   |
| Node.js (runtime) | 24.14.0 |
| npm               | 11.9.0  |

---

## 4. Route Foundation

### Static Routes (Prerendered)

| Route            | Page                  | Status                       |
| ---------------- | --------------------- | ---------------------------- |
| `/`              | Homepage              | ✅ Implemented (basic shell) |
| `/properties`    | Property listing      | ✅ Placeholder               |
| `/projects`      | Project listing       | ✅ Placeholder               |
| `/search`        | Search results        | ✅ Placeholder               |
| `/ai-search`     | AI search             | ✅ Placeholder               |
| `/sell-property` | Seller intake         | ✅ Placeholder               |
| `/shortlist`     | Saved properties      | ✅ Placeholder               |
| `/compare`       | Property comparison   | ✅ Placeholder               |
| `/about`         | About page            | ✅ Implemented               |
| `/contact`       | Contact page          | ✅ Implemented               |
| `/login`         | Customer login        | ✅ Implemented               |
| `/register`      | Customer registration | ✅ Implemented               |

### Dynamic Routes (Server-Rendered)

| Route                | Page            | Status         |
| -------------------- | --------------- | -------------- |
| `/properties/[slug]` | Property detail | ✅ Placeholder |
| `/projects/[slug]`   | Project detail  | ✅ Placeholder |

### Special Routes

| Route          | Purpose         | Status         |
| -------------- | --------------- | -------------- |
| `/sitemap.xml` | Dynamic sitemap | ✅ Implemented |
| `/robots.txt`  | Robots.txt      | ✅ Implemented |
| `/not-found`   | 404 page        | ✅ Implemented |
| `/loading`     | Loading state   | ✅ Implemented |

---

## 5. API/BFF Architecture

### Server-Only CRM Client (`src/lib/crm.ts`)

```
Browser → Next.js Server → CRM API
                ↑
        API key stays here
```

**Available Functions:**

| Function                   | Status         | Description                            |
| -------------------------- | -------------- | -------------------------------------- |
| `getPublishedProperties()` | ✅ Implemented | Fetches published Sonthillu properties |
| `getPropertyById()`        | ⚠️ Stub        | Needs CRM property detail endpoint     |
| `getPropertyByCode()`      | ⚠️ Stub        | Needs CRM property detail endpoint     |
| `getProjects()`            | ⚠️ Stub        | Needs CRM project listing endpoint     |
| `getProjectById()`         | ⚠️ Stub        | Needs CRM project detail endpoint      |
| `getProjectByCode()`       | ⚠️ Stub        | Needs CRM project detail endpoint      |
| `createLead()`             | ✅ Implemented | Creates enquiry/lead                   |
| `healthCheck()`            | ✅ Implemented | Checks CRM health                      |

**Note:** Property detail and project endpoints are documented as CRM dependencies. They do not exist yet.

---

## 6. Environment Variable Strategy

### Server-Side Only (NEVER exposed to browser)

| Variable           | Purpose                        | Example                        |
| ------------------ | ------------------------------ | ------------------------------ |
| `CRM_API_BASE_URL` | CRM API base URL               | `http://localhost:3000/api/v1` |
| `CRM_API_KEY`      | API key for CRM authentication | (placeholder in .env.example)  |

### Public (Safe for browser)

| Variable                | Purpose            | Example                              |
| ----------------------- | ------------------ | ------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`  | Canonical site URL | `https://sonthilluconstructions.com` |
| `NEXT_PUBLIC_SITE_NAME` | Site name          | `Sonthillu Constructions`            |

### Security Rules

1. ✅ CRM API key is in `process.env.CRM_API_KEY` (server-only)
2. ✅ No `NEXT_PUBLIC_CRM_*` variables exist
3. ✅ `.env.example` contains only placeholders
4. ✅ `.env.local` is gitignored
5. ✅ No production secrets in documentation

---

## 7. CRM Integration Status

### Currently Available CRM Endpoints

| Endpoint                       | Method | Status     | Notes                                   |
| ------------------------------ | ------ | ---------- | --------------------------------------- |
| `/public/sonthillu/properties` | GET    | ✅ Working | Returns published, available properties |
| `/public/sonthillu/leads`      | POST   | ✅ Working | Creates lead with source 'WEBSITE'      |
| `/health`                      | GET    | ✅ Working | Health check                            |

### Missing CRM Endpoints (Dependencies)

| Endpoint                                  | Method | Priority | Notes                              |
| ----------------------------------------- | ------ | -------- | ---------------------------------- |
| `/public/sonthillu/properties/:id`        | GET    | P0       | Property detail page requires this |
| `/public/sonthillu/properties/code/:code` | GET    | P1       | Alternative lookup by code         |
| `/public/sonthillu/projects`              | GET    | P0       | Project listing page requires this |
| `/public/sonthillu/projects/:id`          | GET    | P0       | Project detail page requires this  |
| `/public/sonthillu/projects/code/:code`   | GET    | P1       | Alternative lookup by code         |

### CRM Data Readiness

| Requirement                       | Status         | Notes                                 |
| --------------------------------- | -------------- | ------------------------------------- |
| Sonthillu company seeded          | ⚠️ Unknown     | Must verify in CRM DB                 |
| Sonthillu API key generated       | ⚠️ Unknown     | Must generate                         |
| PropertyPublication for Sonthillu | ⚠️ Unknown     | Schema exists, needs data             |
| Public-safe field filtering       | ✅ Implemented | `PUBLIC_PROPERTY_SELECT` in public.ts |

---

## 8. Public DTO Strategy

### Transformation Layer (`src/lib/dto.ts`)

The website NEVER receives raw CRM responses. All data goes through DTO transformations:

```
CRM Response → toPublicProperty() → PublicPropertyDTO → Browser
```

### Fields Excluded from Public Response

| Field                  | Reason                        |
| ---------------------- | ----------------------------- |
| `company_id`           | Internal CRM data             |
| `brand_type`           | Internal brand classification |
| `assigned_pm_id`       | Employee identity             |
| `created_by_id`        | Employee identity             |
| `status`               | Internal workflow status      |
| `verified_by_pm_at`    | Internal approval data        |
| `dm_polished_at`       | Internal approval data        |
| `md_approved_at`       | Internal approval data        |
| `rejection_reason`     | Internal notes                |
| `locked_until`         | Internal reservation data     |
| `locked_by_booking_id` | Internal booking data         |

### Fields Included in Public Response

| Field               | Type     | Description              |
| ------------------- | -------- | ------------------------ |
| `id`                | number   | Property ID              |
| `property_code`     | string   | Public property code     |
| `title`             | string   | Property title           |
| `description`       | string   | Property description     |
| `category`          | string   | Property type            |
| `price`             | number   | Price in INR             |
| `area_sqft`         | number   | Area in square feet      |
| `location`          | string   | Location name            |
| `address`           | string   | Full address             |
| `bedrooms`          | number   | Number of bedrooms       |
| `bathrooms`         | number   | Number of bathrooms      |
| `facing`            | string   | Facing direction         |
| `amenities`         | string[] | List of amenities        |
| `possession_status` | string   | Ready/Under construction |
| `created_at`        | string   | Creation date            |
| `images`            | array    | Property images          |

---

## 9. Security Verification

### Verification Script Results

```
=== Security Verification: API Key Exposure Check ===

1. Checking client-side code (src/app, src/components, public)...
   ⚠ "password" found in login/register pages (UI labels, not secrets)

2. Checking server-side code (src/lib)...
   ✓ CRM API key accessed via process.env (server-only only)

3. Verifying CRM client architecture...
   ✓ CRM API key accessed via process.env (server-only)
   ✓ CRM API key does NOT use NEXT_PUBLIC_ prefix
   ✓ API key sent via x-api-key header

4. Checking environment variable documentation...
   ✓ .env.example contains placeholder for CRM API key
   ✓ No NEXT_PUBLIC_CRM variables in .env.example

=== Security Verification Complete ===

Conclusion: CRM API key is server-side only and NOT exposed to browser.
```

### Security Architecture

```
┌─────────────────────────────────────────────────┐
│                    BROWSER                       │
│  - No API keys in JavaScript                    │
│  - No NEXT_PUBLIC_CRM_* variables               │
│  - Only communicates with Next.js server        │
└─────────────────────┬───────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────┐
│              NEXT.JS SERVER (BFF)                │
│  - process.env.CRM_API_KEY (server-only)        │
│  - process.env.CRM_API_BASE_URL (server-only)   │
│  - API key in x-api-key header                  │
│  - Never exposes secrets to browser             │
└─────────────────────┬───────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────┐
│                  CRM API                         │
│  - Validates x-api-key header                   │
│  - Returns public-safe data                     │
└─────────────────────────────────────────────────┘
```

---

## 10. SEO Foundation

### Metadata Structure

| Element           | Implementation                              |
| ----------------- | ------------------------------------------- |
| Title tags        | `generateMetadata()` per page with template |
| Meta descriptions | Dynamic per page                            |
| OpenGraph         | Configured in root layout                   |
| Twitter cards     | Configured in root layout                   |
| Canonical URLs    | Via `metadataBase` in root layout           |
| Sitemap           | Dynamic `sitemap.ts`                        |
| Robots.txt        | Dynamic `robots.ts`                         |
| Structured data   | Ready for JSON-LD (V1 implementation)       |

### SEO-Friendly Routes

| Route                | SEO Strategy                |
| -------------------- | --------------------------- |
| `/`                  | Static, high priority       |
| `/properties`        | Static, weekly updates      |
| `/properties/[slug]` | ISR, 5-minute revalidation  |
| `/projects`          | Static, weekly updates      |
| `/projects/[slug]`   | ISR, 10-minute revalidation |

---

## 11. Image Strategy

### Next.js Image Configuration

```typescript
// next.config.ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.unsplash.com' },
    { protocol: 'https', hostname: '**.cloudinary.com' },
  ],
}
```

### Image Optimization Plan (V1 Implementation)

| Technique        | Implementation                |
| ---------------- | ----------------------------- |
| Format           | WebP/AVIF via next/image      |
| Sizes            | Responsive: 400w, 800w, 1200w |
| Lazy loading     | Default for below-fold        |
| Blur placeholder | Low-quality placeholder       |
| EXIF stripping   | Server-side processing        |

---

## 12. Build/Test Results

### TypeScript Check

```
✓ TypeScript passes with no errors
```

### Production Build

```
✓ Build successful
✓ 16 routes generated
  ○ 14 static routes
  ƒ 2 dynamic routes ([slug] pages)
```

### Security Verification

```
✓ No CRM API key exposed to browser
✓ Server-only variables properly isolated
✓ Public variables safe for browser
```

---

## 13. Remaining Dependencies

### CRM Changes Required

| Change                       | Priority | Status      |
| ---------------------------- | -------- | ----------- |
| Seed Sonthillu company       | P0       | ❌ Not done |
| Generate Sonthillu API key   | P0       | ❌ Not done |
| Add property detail endpoint | P0       | ❌ Not done |
| Add project listing endpoint | P0       | ❌ Not done |
| Add project detail endpoint  | P0       | ❌ Not done |

### Design Assets Required

| Asset                | Status     |
| -------------------- | ---------- |
| Sonthillu logo (SVG) | ⏳ Pending |
| Favicon              | ⏳ Pending |
| OG image             | ⏳ Pending |
| Brand colors         | ⏳ Pending |
| Typography           | ⏳ Pending |

---

## 14. Recommended Packet 1

### Packet 1.0 — CRM Readiness + Brand Foundation

**Objective:** Connect to CRM and establish brand identity.

**Tasks:**

1. **CRM Readiness**
   - Seed Sonthillu company in CRM database
   - Generate Sonthillu API key
   - Add property detail endpoint
   - Add project listing/detail endpoints
   - Verify all endpoints work

2. **Brand Foundation**
   - Obtain Sonthillu logo
   - Define brand colors and typography
   - Create favicon and OG image
   - Update Tailwind config with brand tokens

3. **Layout Components**
   - Header component
   - Footer component
   - Mobile navigation
   - Breadcrumbs

4. **Verification**
   - All routes render correctly
   - CRM integration works end-to-end
   - Brand assets display correctly
   - No security issues

---

**Status:** Packet 0.2 Complete — Awaiting Review
**Next Step:** Wait for stakeholder approval before proceeding to Packet 1.0
