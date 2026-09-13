# Phase 0.1 — Architecture Decision: Sonthillu Website

**Date:** 15 August 2026
**Status:** Decision Document — Awaiting Review
**Scope:** Framework selection and application architecture for sonthilluconstructions.com

---

## 1. Framework Decision

### Selected: Next.js + TypeScript + React + Tailwind CSS

| Criterion                                | Next.js                                                                                                   | Vite + React                                                                                    | Winner                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Property-page SEO**                    | ISR/SSG generates static HTML per property. Search engines index full content.                            | Client-side rendered — search engines see empty shell or require separate prerendering service. | **Next.js**                                            |
| **Project-page ISR**                     | Same as properties. ISR revalidates on schedule without full rebuild.                                     | SPA — no indexable HTML without workarounds.                                                    | **Next.js**                                            |
| **Dynamic routes**                       | File-based `[slug]`, `[id]` with server-side data fetching per request.                                   | `react-router` client-side. No server data fetching.                                            | **Next.js**                                            |
| **Server rendering / static generation** | First-class: SSG, SSR, ISR, streaming. Choose per-route.                                                  | Client-only. No server rendering.                                                               | **Next.js**                                            |
| **Social metadata**                      | `generateMetadata()` — dynamic OpenGraph/Twitter cards per page, server-rendered.                         | Client-side `document.title` only. No server-rendered meta tags.                                | **Next.js**                                            |
| **Image optimization**                   | `next/image` — automatic WebP/AVIF, responsive sizes, lazy loading, blur placeholders.                    | Manual. Requires separate optimization pipeline or third-party service.                         | **Next.js**                                            |
| **Initial performance**                  | Good with ISR, edge caching, image optimization. Larger bundle than Vite but offset by server rendering.  | Smaller initial bundle. Fast dev server. But all rendering is client-side.                      | **Tie** — Vite faster in dev, Next.js faster for users |
| **Hostinger deployment**                 | Node.js server deployment via PM2. Hostinger supports this. Static export also possible with limitations. | Static files — simplest deployment to Hostinger static hosting.                                 | **Vite** (simpler)                                     |
| **CRM API integration**                  | Server components, API routes, middleware — all run server-side. Natural BFF pattern.                     | Requires separate BFF server or exposed API keys.                                               | **Next.js**                                            |
| **Server-side secret handling**          | Environment variables accessed in server components/API routes. Never reach browser.                      | NO server-side code. Secrets cannot be used safely.                                             | **Next.js**                                            |
| **AI Search integration**                | Server-side API routes call AI providers. Keys never exposed.                                             | Requires separate backend service for AI calls.                                                 | **Next.js**                                            |
| **Search/recommendation architecture**   | Server-side candidate retrieval, ranking, recommendation. Client displays results.                        | Would need full backend service.                                                                | **Next.js**                                            |
| **Customer authentication**              | NextAuth.js, middleware-based session checks, server-side token validation.                               | Client-side auth only. Session tokens in localStorage.                                          | **Next.js**                                            |
| **Long-term scalability**                | Proven at scale. ISR handles traffic spikes. Edge functions for geo-distributed serving.                  | Limited by SPA constraints. No server-side scaling path.                                        | **Next.js**                                            |
| **Testing**                              | Vitest + Playwright for E2E. Server-side logic testable with Jest.                                        | Vitest + Playwright. Simpler testing surface.                                                   | **Tie**                                                |
| **Maintenance**                          | Larger API surface but well-documented. React ecosystem maturity.                                         | Simpler API surface. Less to maintain.                                                          | **Vite** (simpler)                                     |

### Score Summary

| Category     | Next.js Wins | Vite Wins |
| ------------ | ------------ | --------- |
| SEO-critical | 6            | 0         |
| Performance  | 1            | 1         |
| Deployment   | 0            | 1         |
| Integration  | 4            | 0         |
| Maintenance  | 0            | 1         |
| **Total**    | **11**       | **3**     |

### Why Next.js Was Selected

**Primary reason: SEO is non-negotiable for a real-estate discovery website.**

The core value proposition of sonthilluconstructions.com is being discovered via search engines when potential buyers search for properties in Hyderabad. A client-side rendered SPA (Vite+React) produces empty HTML shells that search engines cannot index. This would make the entire website invisible to Google, eliminating its primary customer acquisition channel.

Next.js provides:

- **Static Site Generation (SSG)** for property detail pages — each property gets a fully rendered HTML page at build time, revalidated on schedule
- **Incremental Static Regeneration (ISR)** — property pages update without full rebuilds
- **Server-Side Rendering (SSR)** for search results — real-time filtered results rendered server-side
- **Server-side API routes** — CRM API keys stay server-side, never exposed to browsers

**Secondary reason: The BFF pattern is architecturally mandatory.**

The CRM public API requires an API key for authentication. This key MUST NOT be exposed in browser JavaScript (security rule). Next.js provides a natural server-side layer (API routes, middleware, server components) that acts as the Backend-for-Frontend (BFF), keeping the API key server-side while the browser communicates only with the Next.js server.

### Why Vite + React Was Rejected

Vite+React is an excellent choice for internal dashboards, admin panels, and applications where SEO does not matter. The existing RRH CRM frontend correctly uses Vite for this reason.

However, Vite+React has fundamental limitations for a public real-estate website:

1. **No server-side rendering** — property pages cannot be indexed by search engines
2. **No server-side secret handling** — API keys would be exposed client-side or require building a separate BFF server
3. **No built-in image optimization** — property images require manual optimization
4. **No server-side metadata** — OpenGraph/Twitter cards cannot be dynamically generated per property
5. **No ISR** — property pages would require full rebuilds to update

These are not minor gaps — they are fundamental architectural constraints that would require building significant custom infrastructure to work around, negating the simplicity advantage of Vite.

**The existing CRM can continue using Vite+React.** The Sonthillu public website needs a different architectural foundation because it has fundamentally different requirements (SEO, public-facing, server-side secrets).

---

## 2. Proposed Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js Client (React)                             │    │
│  │  - Property listing pages                           │    │
│  │  - Property detail pages                            │    │
│  │  - Search/filter UI                                 │    │
│  │  - AI Search input                                  │    │
│  │  - Shortlist/Compare UI                             │    │
│  │  - Enquiry forms                                    │    │
│  │  - Customer login                                   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP(S)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  NEXT.JS SERVER (BFF)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Server Components                                   │    │
│  │  - Property pages (ISR/SSG)                         │    │
│  │  - Project pages (ISR/SSG)                          │    │
│  │  - Search results (SSR)                             │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  API Routes (/api/*)                                │    │
│  │  - /api/properties/* (proxies to CRM)               │    │
│  │  - /api/search/* (candidate retrieval + ranking)    │    │
│  │  - /api/ai-search/* (AI Search abstraction)         │    │
│  │  - /api/enquiries/* (lead capture)                  │    │
│  │  - /api/auth/* (customer authentication)            │    │
│  │  - /api/shortlist/* (shortlist management)          │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  Middleware                                          │    │
│  │  - Auth session validation                          │    │
│  │  - Rate limiting                                    │    │
│  │  - Request logging                                  │    │
│  │  - Geolocation (approximate)                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Environment Variables (server-side only):                   │
│  - CRM_API_KEY (NEVER exposed to browser)                   │
│  - CRM_API_BASE_URL                                         │
│  - AI_SERVICE_API_KEY (NEVER exposed to browser)            │
│  - AUTH_SECRET                                              │
│  - DATABASE_URL (for customer accounts)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    CRM PUBLIC API                            │
│  (RRH-CRMS at rrh-api.onrender.com or Hostinger)           │
│  - GET /api/v1/public/sonthillu/properties                  │
│  - GET /api/v1/public/sonthillu/properties/:id              │
│  - POST /api/v1/public/sonthillu/leads                      │
│  - Authentication: x-api-key header                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    CRM DATABASE                              │
│  (MySQL at Hostinger — read-only from website perspective)  │
│  - Property inventory                                       │
│  - Project data                                             │
│  - Publication flags                                        │
│  - Lead records                                             │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Browser never touches CRM directly** — all communication flows through the Next.js BFF
2. **API keys live exclusively server-side** — environment variables on the Next.js server
3. **SEO pages are statically generated** — property and project pages use ISR/SSG
4. **Search results are server-rendered** — SSR for real-time filtered results
5. **AI Search is a server-side abstraction** — browser sends natural language, server resolves to structured requirements
6. **Deterministic matching after AI** — AI interprets; application logic matches and ranks

---

## 3. Next.js Rendering Strategy

### Route-Level Rendering Plan

| Route                | Rendering | Cache Strategy        | Rationale                                                                |
| -------------------- | --------- | --------------------- | ------------------------------------------------------------------------ |
| `/` (Homepage)       | ISR       | Revalidate every 60s  | Dynamic content (featured properties, announcements) but needs SEO       |
| `/properties`        | ISR       | Revalidate every 120s | Search results page. ISR provides fresh data with SEO.                   |
| `/properties/[slug]` | ISR       | Revalidate every 300s | Individual property page. Static HTML for SEO, revalidated periodically. |
| `/projects`          | ISR       | Revalidate every 300s | Project listing. Less frequent updates.                                  |
| `/projects/[slug]`   | ISR       | Revalidate every 300s | Individual project page. Static HTML for SEO.                            |
| `/search`            | SSR       | No static cache       | Real-time search with dynamic filters. Must reflect current inventory.   |
| `/ai-search`         | SSR       | No static cache       | AI-interpreted search. Server-side processing required.                  |
| `/sell-property`     | SSR       | No static cache       | Form page. Server rendering for auth check.                              |
| `/login`             | SSR       | No static cache       | Auth page. Server rendering for session check.                           |
| `/shortlist`         | SSR       | No static cache       | Authenticated. Dynamic user-specific data.                               |
| `/compare`           | SSR       | No static cache       | Dynamic comparison of selected properties.                               |

### ISR Implementation Pattern

```typescript
// Example: /properties/[slug]/page.tsx
export async function generateStaticParams() {
  // Pre-generate top N property pages at build time
  const properties = await fetchProperties({ limit: 1000 });
  return properties.map((p) => ({ slug: p.slug }));
}

export const revalidate = 300; // Revalidate every 5 minutes

export async function generateMetadata({ params }) {
  const property = await fetchProperty(params.slug);
  return {
    title: `${property.title} | Sonthillu Constructions`,
    description: property.seo_description,
    openGraph: {
      title: property.title,
      description: property.seo_description,
      images: [property.primary_image],
    },
  };
}

export default async function PropertyPage({ params }) {
  const property = await fetchProperty(params.slug);
  return <PropertyDetail property={property} />;
}
```

---

## 4. Server/BFF Architecture

### API Route Structure

```
app/
├── api/
│   ├── properties/
│   │   ├── route.ts              # GET /api/properties — list with filters
│   │   └── [id]/
│   │       └── route.ts          # GET /api/properties/:id — detail
│   ├── search/
│   │   └── route.ts              # POST /api/search — structured search
│   ├── ai-search/
│   │   └── route.ts              # POST /api/ai-search — NL → structured → results
│   ├── enquiries/
│   │   └── route.ts              # POST /api/enquiries — lead capture
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts          # POST /api/auth/login
│   │   ├── register/
│   │   │   └── route.ts          # POST /api/auth/register
│   │   └── session/
│   │       └── route.ts          # GET /api/auth/session — validate session
│   ├── shortlist/
│   │   └── route.ts              # GET/POST/DELETE /api/shortlist
│   └── health/
│       └── route.ts              # GET /api/health
```

### Server Component Data Fetching

```typescript
// Server Component — runs only on Next.js server
async function PropertyPage({ params }) {
  // This fetch happens server-side — API key is safe
  const property = await fetch(`${process.env.CRM_API_BASE_URL}/public/sonthillu/properties/${params.id}`, {
    headers: { 'x-api-key': process.env.CRM_API_KEY! },
  }).then(r => r.json());

  // Pass data to client component for interactivity
  return <PropertyDetailClient property={property} />;
}
```

### Middleware Layer

```
middleware.ts
├── Auth session validation (cookie-based)
├── Rate limiting (per-IP, per-route)
├── Request logging (structured)
├── Geolocation approximation (IP-based, not GPS)
└── Redirect rules (www → non-www, trailing slashes)
```

---

## 5. CRM Integration Boundary

### What the Website Reads from CRM

| Data                                     | Endpoint                               | Frequency       |
| ---------------------------------------- | -------------------------------------- | --------------- |
| Property listings (published, available) | `GET /public/sonthillu/properties`     | ISR + on-demand |
| Property detail                          | `GET /public/sonthillu/properties/:id` | ISR + on-demand |
| Project listings                         | `GET /public/sonthillu/projects`       | ISR             |
| Project detail                           | `GET /public/sonthillu/projects/:id`   | ISR             |

### What the Website Writes to CRM

| Action                 | Endpoint                                                  | Trigger            |
| ---------------------- | --------------------------------------------------------- | ------------------ |
| Enquiry/Lead capture   | `POST /public/sonthillu/leads`                            | Form submission    |
| Seller submission      | `POST /public/sonthillu/leads` (extended)                 | Sell Property form |
| Request a Call         | `POST /public/sonthillu/leads` (with preferred_call_time) | CTA button         |
| Multi-property enquiry | `POST /public/sonthillu/leads` (with property_ids)        | Enquiry form       |

### What the Website NEVER Does

- Directly queries CRM MySQL database
- Accesses internal CRM endpoints (`/api/v1/properties`, `/api/v1/leads`, etc.)
- Reads or writes CRM authentication tokens
- Accesses employee, booking, payment, or document endpoints
- Exposes CRM API keys to browser

### Data Flow for Property Listing

```
1. Browser requests /properties?location=miyapur&bedrooms=3
2. Next.js server receives request
3. Server component calls CRM: GET /public/sonthillu/properties?brand=sonthillu
4. CRM returns published, available Sonthillu properties
5. Next.js server applies client-side filters (location, bedrooms)
6. Next.js server renders HTML with filtered results
7. Browser receives fully rendered HTML (SEO-friendly)
```

### Data Flow for Enquiry

```
1. Browser submits enquiry form (name, phone, property_id)
2. Next.js API route receives: POST /api/enquiries
3. Server-side validation (Zod schema)
4. Server calls CRM: POST /public/sonthillu/leads (with API key)
5. CRM creates lead with source 'WEBSITE' and brand 'sonthillu'
6. CRM returns success
7. Next.js returns success to browser
8. Browser shows confirmation
```

---

## 6. Authentication Boundary

### Customer Authentication Architecture

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                           │
│  - Login form → POST /api/auth/login                │
│  - Register form → POST /api/auth/register          │
│  - Session cookie (httpOnly, secure, SameSite)      │
│  - NO tokens in localStorage                        │
└─────────────────────────┬───────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────┐
│                  NEXT.JS SERVER                      │
│  - API routes handle auth logic                     │
│  - Session stored in httpOnly cookie                │
│  - JWT signed with AUTH_SECRET (server-only)        │
│  - Customer data in separate DB or CRM Customer API │
│  - Middleware validates session on every request     │
└─────────────────────────────────────────────────────┘
```

### Auth Strategy Options (for Packet 0.2 decision)

| Option                                 | Description                                                         | CRM Integration                          |
| -------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------- |
| **A. NextAuth.js + CRM Customer API**  | NextAuth handles sessions. Customer data synced from CRM.           | Customer record in CRM, auth in Next.js  |
| **B. Custom JWT + CRM Customer API**   | Custom auth logic. JWT in httpOnly cookie. Customer lookup via CRM. | Direct CRM integration for customer data |
| **C. NextAuth + separate customer DB** | NextAuth with its own DB. Customer data duplicated.                 | Two sources of truth (not recommended)   |

**Recommended for Packet 0.2:** Option B — Custom JWT + CRM Customer API. Keeps customer data in CRM (single source of truth) while keeping auth logic simple.

---

## 7. Search Architecture Boundary

### Unified Search Architecture

Both Normal Search and AI Search converge on a common requirement model and use the same retrieval/ranking pipeline.

```
┌─────────────────────────────────────────────────────────┐
│                     SEARCH INPUT                         │
│                                                          │
│  Normal Search:                                          │
│  ┌─────────────────────────────────────┐                │
│  │  Structured filters                 │                │
│  │  - location: "Miyapur"              │                │
│  │  - bedrooms: 3                      │                │
│  │  - budget: 50L-80L                  │                │
│  │  - type: APARTMENT                  │                │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│  AI Search:                                              │
│  ┌─────────────────────────────────────┐                │
│  │  Natural language                   │                │
│  │  "3BHK flat in Miyapur under 80L"  │                │
│  │  "విల్లా కావాలి బంజరా దగ్గర"        │                │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│                     ▼                                    │
│  ┌─────────────────────────────────────┐                │
│  │  AI Interpretation Layer            │                │
│  │  (Future: LLM → Structured Query)   │                │
│  │  Output: RequirementModel           │                │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│                     ▼                                    │
│  ┌─────────────────────────────────────┐                │
│  │  Unified Requirement Model          │                │
│  │  {                                  │                │
│  │    location: string,                │                │
│  │    property_type: string,           │                │
│  │    bedrooms_min: number,            │                │
│  │    budget_min: number,              │                │
│  │    budget_max: number,              │                │
│  │    amenities: string[],             │                │
│  │    listing_type: NEW|RESALE,        │                │
│  │    ...                              │                │
│  │  }                                  │                │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│                     ▼                                    │
│  ┌─────────────────────────────────────┐                │
│  │  Candidate Retrieval                │                │
│  │  (Query CRM for matching properties)│                │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│                     ▼                                    │
│  ┌─────────────────────────────────────┐                │
│  │  Dynamic Matching Engine            │                │
│  │  (Score each candidate)             │                │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│                     ▼                                    │
│  ┌─────────────────────────────────────┐                │
│  │  Ranking Engine                     │                │
│  │  (Sort by relevance, price, etc.)   │                │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│                     ▼                                    │
│  ┌─────────────────────────────────────┐                │
│  │  Recommendation Engine              │                │
│  │  - Exact matches                    │                │
│  │  - Related properties               │                │
│  │  - Nearby properties                │                │
│  │  - Above-budget alternatives        │                │
│  │  - No-result recovery               │                │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│                     ▼                                    │
│  ┌─────────────────────────────────────┐                │
│  │  Search Results Page                │                │
│  │  - Property cards                   │                │
│  │  - Map view                         │                │
│  │  - Sort/filter controls             │                │
│  │  - "Did you mean?" suggestions      │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### Key Principle: AI Interprets, Application Matches

- **AI Search** converts natural language to structured `RequirementModel`
- **Deterministic matching** uses the same `RequirementModel` as Normal Search
- **No AI invents properties** — AI only interprets user intent
- **Same ranking/recommendation** pipeline regardless of input source

---

## 8. AI Search Boundary

### Abstraction Design

```typescript
// types/search.ts — Shared between Normal and AI Search

interface PropertyRequirement {
  location?: string;
  location_preferences?: string[];
  property_type?: PropertyCategory;
  bedrooms_min?: number;
  bedrooms_max?: number;
  bathrooms_min?: number;
  budget_min?: number;
  budget_max?: number;
  area_sqft_min?: number;
  area_sqft_max?: number;
  amenities?: string[];
  listing_type?: 'NEW' | 'RESALE' | 'ANY';
  possession_status?: 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION' | 'ANY';
  facing?: string;
  keywords?: string[];
}

interface SearchResult {
  properties: Property[];
  total_count: number;
  filters_applied: PropertyRequirement;
  suggestions?: string[];
  related_properties?: Property[];
  no_result_recovery?: {
    expanded_properties: Property[];
    message: string;
  };
}
```

### AI Search Interface (Abstraction Boundary)

```typescript
// lib/ai-search.ts — Abstraction boundary

interface AISearchProvider {
  /**
   * Convert natural language to structured PropertyRequirement.
   * This is the ONLY method that involves AI/LLM.
   * All subsequent processing is deterministic.
   */
  interpret(naturalLanguage: string, context?: SearchContext): Promise<PropertyRequirement>;
}

// Future implementations:
// - OpenRouter/LLM provider
// - Custom fine-tuned model
// - Rule-based fallback
```

### Architecture Flow

```
User input: "3BHK flat in Miyapur under 80 lakhs"
    │
    ▼
AISearchProvider.interpret()
    │
    ▼
Structured Requirement: {
  location: "Miyapur",
  property_type: "APARTMENT",
  bedrooms_min: 3,
  budget_max: 8000000
}
    │
    ▼
[Same pipeline as Normal Search]
    │
    ▼
Search Results
```

### Multi-Language Support

The AI interpretation layer must handle:

- English input
- Telugu input (script)
- Hindi input (script)
- Mixed language (English + Telugu words)
- Transliterated (Telugu words written in English script)

**This is a requirement of the AI interpretation layer, not the search/matching engine.** The `RequirementModel` is always in English/structured form regardless of input language.

---

## 9. Recommendation Boundary

### Recommendation Categories

| Category                      | Trigger               | Implementation                              |
| ----------------------------- | --------------------- | ------------------------------------------- |
| **Exact matches**             | All filters satisfied | Direct query result                         |
| **Related properties**        | User views a property | Same location, similar price, same type     |
| **Nearby properties**         | User views a property | Same locality, different type/price         |
| **Above-budget alternatives** | No results in budget  | Slightly higher price, same other filters   |
| **No-result recovery**        | Zero results          | Relax location or budget constraints        |
| **Recently viewed**           | User has history      | Properties user previously viewed (V1.1)    |
| **Popular in area**           | Location-based        | Most-enquired properties in the area (V1.1) |

### V1 vs V1.1 Scope

| Feature                      | V1  | V1.1 |
| ---------------------------- | --- | ---- |
| Exact matches                | ✅  | ✅   |
| Related properties           | ✅  | ✅   |
| Nearby properties            | ✅  | ✅   |
| Above-budget alternatives    | ✅  | ✅   |
| No-result recovery           | ✅  | ✅   |
| Recently viewed              | —   | ✅   |
| Popular in area              | —   | ✅   |
| Personalized recommendations | —   | ✅   |

---

## 10. Routing Structure

### File-Based Routing (Next.js App Router)

```
app/
├── layout.tsx                          # Root layout (header, footer, providers)
├── page.tsx                            # Homepage
│
├── properties/
│   ├── page.tsx                        # /properties — listing with search
│   └── [slug]/
│       └── page.tsx                    # /properties/:slug — detail page
│
├── projects/
│   ├── page.tsx                        # /projects — project listing
│   └── [slug]/
│       └── page.tsx                    # /projects/:slug — project detail
│
├── search/
│   └── page.tsx                        # /search — search results
│
├── ai-search/
│   └── page.tsx                        # /ai-search — AI search interface
│
├── sell-property/
│   └── page.tsx                        # /sell-property — seller intake form
│
├── login/
│   └── page.tsx                        # /login — customer login
│
├── register/
│   └── page.tsx                        # /register — customer registration
│
├── shortlist/
│   └── page.tsx                        # /shortlist — saved properties
│
├── compare/
│   └── page.tsx                        # /compare — property comparison
│
├── about/
│   └── page.tsx                        # /about — about Sonthillu
│
├── contact/
│   └── page.tsx                        # /contact — contact page
│
├── api/                                # API routes (BFF)
│   ├── properties/
│   │   ├── route.ts                    # GET /api/properties
│   │   └── [id]/
│   │       └── route.ts                # GET /api/properties/:id
│   ├── search/
│   │   └── route.ts                    # POST /api/search
│   ├── ai-search/
│   │   └── route.ts                    # POST /api/ai-search
│   ├── enquiries/
│   │   └── route.ts                    # POST /api/enquiries
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts
│   │   ├── register/
│   │   │   └── route.ts
│   │   └── session/
│   │       └── route.ts
│   ├── shortlist/
│   │   └── route.ts
│   └── health/
│       └── route.ts
│
├── sitemap.ts                          # Dynamic sitemap generation
├── robots.ts                           # Robots.txt
└── not-found.tsx                       # Custom 404 page
```

---

## 11. SEO Strategy

### Technical SEO

| Element               | Implementation                                                               |
| --------------------- | ---------------------------------------------------------------------------- |
| **Title tags**        | `generateMetadata()` per page. Pattern: `{Page Title}                        | Sonthillu Constructions` |
| **Meta descriptions** | Dynamic per property/project from CRM data                                   |
| **Canonical URLs**    | Set per page to prevent duplicate content                                    |
| **OpenGraph tags**    | Dynamic per property: title, description, image                              |
| **Twitter cards**     | Dynamic per property: summary_large_image                                    |
| **Structured data**   | JSON-LD for RealEstateListing, RealEstateAgent, Organization                 |
| **Sitemap**           | Dynamic `sitemap.ts` — generates from CRM property/project data              |
| **Robots.txt**        | Allow all public pages. Block `/api/*`, `/login`, `/register`, `/shortlist`. |
| **Image alt text**    | Property images: `{property.title} in {property.location}`                   |
| **Internal linking**  | Property → Project, Property → Related Properties, Property → Area page      |
| **Page speed**        | ISR + image optimization + code splitting                                    |

### Content SEO (V1.1)

| Page                 | Content Strategy                                  |
| -------------------- | ------------------------------------------------- |
| `/properties`        | "Properties for sale in {location}" — dynamic H1  |
| `/projects`          | "Residential projects by Sonthillu Constructions" |
| `/properties/[slug]` | Property details with structured data             |
| `/about`             | Company story, mission, team                      |
| `/contact`           | Contact information, office locations             |

### Structured Data (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "3 BHK Apartment in Miyapur",
  "description": "...",
  "image": "...",
  "offers": {
    "@type": "Offer",
    "price": "7500000",
    "priceCurrency": "INR"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Miyapur",
    "addressRegion": "Telangana",
    "addressCountry": "IN"
  }
}
```

---

## 12. Image/Media Strategy

### Image Pipeline

```
CRM (Property Images)
    │
    ▼
Next.js BFF (Server-side proxy)
    │
    ├─ Resize to multiple sizes (1200w, 800w, 400w)
    ├─ Convert to WebP/AVIF
    ├─ Add blur placeholder
    ├─ Strip EXIF data (privacy)
    └─ Serve via next/image
```

### Image Optimization

| Technique            | Implementation                                            |
| -------------------- | --------------------------------------------------------- |
| **Format**           | WebP primary, AVIF where supported                        |
| **Sizes**            | Responsive: 400w (mobile), 800w (tablet), 1200w (desktop) |
| **Lazy loading**     | Default for below-fold images                             |
| **Blur placeholder** | Low-quality placeholder while loading                     |
| **CDN**              | Next.js Image Optimization API or Hostinger CDN           |
| **EXIF stripping**   | Remove GPS, camera data for privacy                       |

### Media Types

| Type            | V1  | V1.1   |
| --------------- | --- | ------ |
| Property photos | ✅  | ✅     |
| Project photos  | ✅  | ✅     |
| Property videos | —   | ✅     |
| Virtual tours   | —   | Future |
| Floor plans     | ✅  | ✅     |

---

## 13. Hostinger Deployment Model

### Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                HOSTINGER BUSINESS                     │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Node.js Application (PM2)                   │    │
│  │  - Next.js server                            │    │
│  │  - API routes (BFF)                          │    │
│  │  - Server-side rendering                     │    │
│  │  - ISR cache (in-memory)                     │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Static Assets (CDN or Nginx)                │    │
│  │  - _next/static/ (JS bundles)               │    │
│  │  - Public assets (favicon, manifest)         │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Environment Variables                       │    │
│  │  - CRM_API_KEY                               │    │
│  │  - CRM_API_BASE_URL                          │    │
│  │  - AUTH_SECRET                               │    │
│  │  - DATABASE_URL (if separate customer DB)    │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  Domain: sonthilluconstructions.com                  │
│  SSL: AutoSSL / Let's Encrypt                       │
└─────────────────────────────────────────────────────┘
```

### Deployment Steps (Packet 0.2)

1. Build Next.js: `npm run build`
2. Start with PM2: `pm2 start npm --name "sonthillu" -- start`
3. Configure Nginx reverse proxy (if needed)
4. Set environment variables in Hostinger panel
5. Verify SSL and domain

### Hostinger Considerations

| Concern              | Mitigation                                                                              |
| -------------------- | --------------------------------------------------------------------------------------- |
| 3GB RAM limit        | Next.js server is lightweight. ISR cache is in-memory (no Redis).                       |
| 2 CPU cores          | Sufficient for SSR + ISR. No heavy background processing.                               |
| No Redis             | ISR uses in-memory cache. Sufficient for expected traffic.                              |
| No edge functions    | All server-side logic runs on single Node.js server. Acceptable for V1.                 |
| Static export option | If Node.js server is problematic, `next export` produces static files (loses ISR, SSR). |

---

## 14. Environment Variable / Secret Strategy

### Server-Side Only (NEVER in browser)

| Variable             | Purpose                                  | Source          |
| -------------------- | ---------------------------------------- | --------------- |
| `CRM_API_KEY`        | Authentication for CRM public API        | CRM admin       |
| `CRM_API_BASE_URL`   | Base URL of CRM API                      | CRM deployment  |
| `AUTH_SECRET`        | JWT signing secret for customer auth     | Generate random |
| `DATABASE_URL`       | Customer database (if separate from CRM) | Hostinger       |
| `AI_SERVICE_API_KEY` | AI/LLM provider key (for AI Search)      | AI provider     |
| `NODE_ENV`           | Environment mode                         | Deployment      |
| `NEXTAUTH_SECRET`    | NextAuth.js secret (if using NextAuth)   | Generate random |

### Public (Safe for browser)

| Variable                | Purpose                   |
| ----------------------- | ------------------------- |
| `NEXT_PUBLIC_SITE_URL`  | Canonical site URL        |
| `NEXT_PUBLIC_GA_ID`     | Google Analytics (V1.1)   |
| `NEXT_PUBLIC_SITE_NAME` | "Sonthillu Constructions" |

### Security Rules

1. **NEVER** put `CRM_API_KEY` in `NEXT_PUBLIC_*` variables
2. **NEVER** expose API keys in client-side JavaScript
3. **NEVER** commit `.env` files to git
4. **NEVER** log secrets in production
5. **Rotate** `AUTH_SECRET` periodically
6. **Use** Hostinger environment variable panel for production secrets

---

## 15. Testing Architecture

### Testing Layers

| Layer                 | Tool                           | Scope                                                               |
| --------------------- | ------------------------------ | ------------------------------------------------------------------- |
| **Unit tests**        | Vitest                         | Utility functions, RequirementModel transformations, matching logic |
| **Component tests**   | Vitest + React Testing Library | UI components in isolation                                          |
| **Integration tests** | Vitest                         | API routes, server components, CRM integration                      |
| **E2E tests**         | Playwright                     | Full user flows: search, view property, enquire, login              |
| **SEO tests**         | Playwright                     | Meta tags, structured data, sitemap validation                      |
| **Performance tests** | Lighthouse CI                  | Core Web Vitals, page speed                                         |

### Critical Test Scenarios

| Scenario                                                        | Type        | Priority |
| --------------------------------------------------------------- | ----------- | -------- |
| Property page renders with correct SEO meta                     | E2E         | P0       |
| Property page is indexed by search engine (simulated)           | E2E         | P0       |
| API key is NOT exposed in browser JavaScript                    | E2E         | P0       |
| Search results are server-rendered                              | E2E         | P0       |
| AI Search produces correct RequirementModel                     | Unit        | P0       |
| Normal Search and AI Search produce same results for same input | Integration | P0       |
| Customer login/session works correctly                          | E2E         | P1       |
| Shortlist persists across sessions                              | E2E         | P1       |
| Property images load with optimization                          | E2E         | P1       |
| Mobile responsive layout works                                  | E2E         | P1       |

---

## 16. Proposed Project Structure

```
sonthillu-website/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Homepage
│   ├── globals.css                   # Global styles
│   │
│   ├── properties/
│   │   ├── page.tsx                  # Property listing
│   │   └── [slug]/
│   │       └── page.tsx              # Property detail
│   │
│   ├── projects/
│   │   ├── page.tsx                  # Project listing
│   │   └── [slug]/
│   │       └── page.tsx              # Project detail
│   │
│   ├── search/
│   │   └── page.tsx                  # Search results
│   │
│   ├── ai-search/
│   │   └── page.tsx                  # AI search interface
│   │
│   ├── sell-property/
│   │   └── page.tsx                  # Seller intake
│   │
│   ├── login/
│   │   └── page.tsx                  # Customer login
│   │
│   ├── register/
│   │   └── page.tsx                  # Customer registration
│   │
│   ├── shortlist/
│   │   └── page.tsx                  # Saved properties
│   │
│   ├── compare/
│   │   └── page.tsx                  # Property comparison
│   │
│   ├── about/
│   │   └── page.tsx                  # About page
│   │
│   ├── contact/
│   │   └── page.tsx                  # Contact page
│   │
│   ├── api/                          # API routes (BFF)
│   │   ├── properties/
│   │   ├── search/
│   │   ├── ai-search/
│   │   ├── enquiries/
│   │   ├── auth/
│   │   ├── shortlist/
│   │   └── health/
│   │
│   ├── sitemap.ts
│   ├── robots.ts
│   └── not-found.tsx
│
├── components/                       # React components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileNav.tsx
│   │   └── Breadcrumbs.tsx
│   │
│   ├── property/
│   │   ├── PropertyCard.tsx
│   │   ├── PropertyGrid.tsx
│   │   ├── PropertyDetail.tsx
│   │   ├── PropertyGallery.tsx
│   │   ├── PropertyMap.tsx
│   │   └── PropertyEnquiryForm.tsx
│   │
│   ├── project/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectGrid.tsx
│   │   └── ProjectDetail.tsx
│   │
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── AISearchBar.tsx
│   │   └── SearchResults.tsx
│   │
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Skeleton.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   └── seo/
│       ├── JsonLd.tsx
│       └── OpenGraph.tsx
│
├── lib/                              # Utility functions
│   ├── crm.ts                        # CRM API client (server-side)
│   ├── ai-search.ts                  # AI Search abstraction
│   ├── search/
│   │   ├── requirement-model.ts      # RequirementModel types and utils
│   │   ├── candidate-retrieval.ts    # Query CRM for candidates
│   │   ├── matching-engine.ts        # Score and filter candidates
│   │   ├── ranking-engine.ts         # Sort by relevance
│   │   └── recommendation-engine.ts  # Related, nearby, recovery
│   ├── auth.ts                       # Authentication utilities
│   ├── utils.ts                      # General utilities
│   └── constants.ts                  # Brand constants, categories
│
├── types/                            # TypeScript types
│   ├── property.ts                   # Property types
│   ├── project.ts                    # Project types
│   ├── search.ts                     # Search/requirement types
│   ├── auth.ts                       # Auth types
│   └── api.ts                        # API response types
│
├── styles/                           # Additional styles
│   └── globals.css                   # Tailwind imports, custom CSS
│
├── public/                           # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   ├── og-image.png
│   └── manifest.json
│
├── tests/                            # Test files
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── seo/
│
├── .env.example                      # Environment variable template
├── .env.local                        # Local environment (gitignored)
├── next.config.js                    # Next.js configuration
├── tailwind.config.js                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies and scripts
└── README.md                         # Project documentation
```

---

## 17. Dependencies on CRM

### Required CRM API Endpoints

| Endpoint                               | Status     | Required for V1 |
| -------------------------------------- | ---------- | --------------- |
| `GET /public/sonthillu/properties`     | ✅ Exists  | ✅              |
| `GET /public/sonthillu/properties/:id` | ❌ Missing | ✅ Must add     |
| `POST /public/sonthillu/leads`         | ✅ Exists  | ✅              |
| `GET /public/sonthillu/projects`       | ❌ Missing | ✅ Must add     |
| `GET /public/sonthillu/projects/:id`   | ❌ Missing | ✅ Must add     |

### Required CRM Data

| Data                              | Status     | Notes                                   |
| --------------------------------- | ---------- | --------------------------------------- |
| Sonthillu company seeded          | ❌ Missing | Must create in CRM DB                   |
| Sonthillu API key                 | ❌ Missing | Must generate                           |
| PropertyPublication for Sonthillu | ⚠️ Partial | Schema exists, needs data               |
| Public-safe field filtering       | ⚠️ Partial | Current `public.ts` has explicit select |
| Image approval workflow           | ❌ Missing | Needed for public images                |

### CRM Changes Required Before Packet 0.3

| Change                                            | Priority | Effort |
| ------------------------------------------------- | -------- | ------ |
| Seed Sonthillu company                            | P0       | 5 min  |
| Generate Sonthillu API key                        | P0       | 5 min  |
| Add `GET /public/sonthillu/projects` endpoint     | P0       | 1 hour |
| Add `GET /public/sonthillu/projects/:id` endpoint | P0       | 1 hour |
| Add property `slug` field                         | P1       | 1 hour |
| Add property `listing_type` (NEW/RESALE)          | P1       | 1 hour |
| Add image `is_approved` flag                      | P1       | 1 hour |

---

## 18. Risks

| Risk                                          | Severity | Likelihood | Mitigation                                            |
| --------------------------------------------- | -------- | ---------- | ----------------------------------------------------- |
| Hostinger RAM insufficient for Next.js server | Medium   | Low        | Static export fallback (`next export`)                |
| ISR cache miss storm under high traffic       | Medium   | Low        | Warm cache at deploy time, use stale-while-revalidate |
| CRM API downtime affects website              | High     | Low        | Implement retry logic, cached fallback pages          |
| SEO not working as expected                   | High     | Low        | Validate with Google Search Console early             |
| AI Search accuracy insufficient               | Medium   | Medium     | Start with rule-based fallback, add LLM later         |
| Image optimization too slow for ISR           | Low      | Low        | Pre-optimize at build time, use CDN                   |
| Hostinger Node.js version too old             | Medium   | Medium     | Check Hostinger Node.js version support               |

---

## 19. Recommended Packet 0.2

### Packet 0.2 — Project Scaffolding + CRM Readiness

**Objective:** Have a runnable Next.js project connected to CRM API.

**Tasks:**

1. **Initialize Next.js project** in `D:\HYD\Sonthillu`
   - `npx create-next-app@latest . --typescript --tailwind --app --src-dir`
   - Configure TypeScript, Tailwind, ESLint

2. **Create environment configuration**
   - `.env.example` with all required variables
   - `.env.local` for local development (gitignored)

3. **Create CRM API client** (server-side only)
   - `lib/crm.ts` — typed fetch functions for CRM public API
   - API key in server environment, never exposed

4. **Create base layout**
   - Root layout with Header, Footer
   - Brand colors, typography
   - Responsive foundation

5. **Create homepage shell**
   - Hero section
   - Featured properties placeholder
   - Basic CTA sections

6. **CRM readiness tasks** (parallel)
   - Seed Sonthillu company in CRM DB
   - Generate Sonthillu API key
   - Add property detail endpoint to CRM API
   - Add project listing/detail endpoints

7. **Verification**
   - `npm run dev` starts successfully
   - Homepage renders with Sonthillu branding
   - CRM API call works from server-side (test with health endpoint)
   - API key not visible in browser DevTools

**Exit criteria:**

- Next.js project runs locally
- Sonthillu branding visible
- CRM API integration working (server-side)
- No secrets exposed to browser

---

**Status:** Architecture Decision Document Complete — Awaiting Review
**Decision:** Next.js + TypeScript + React + Tailwind CSS
**Rationale:** SEO, server-side secrets, BFF pattern, image optimization, AI Search integration
**Files created:** `docs/sonthillu/phase-0.1-architecture-decision.md`
**Commands executed:** None (documentation only)
**Tests/checks:** None (documentation only)
