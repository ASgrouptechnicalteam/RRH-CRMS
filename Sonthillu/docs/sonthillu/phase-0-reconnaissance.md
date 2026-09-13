# Phase 0 — Reconnaissance Report: Sonthillu Constructions Website

**Date:** 15 August 2026
**Scope:** Full workspace inspection for Sonthillu public website implementation readiness

---

## 1. Repository Overview

### A. Workspace State

The workspace `D:\HYD\Sonthillu` is **near-empty** — it contains only:

```
D:\HYD\Sonthillu\
└── docs/
    └── sonthillu/
        ├── RRH_Sonthillu_CRM_Requirements_for_Websites_v1.pdf
        └── RRH_Sonthillu_Websites_PRD_Blueprint_v1.pdf
```

There is **no code, no frontend, no backend, no package.json, no config files** in the Sonthillu workspace itself. The Sonthillu website is a greenfield project.

### B. Sister Workspace: RRH PWA (`D:\HYD\RRH PWA`)

The RRH PWA is a **mature, production-grade monorepo** containing the CRM/EMS system that Sonthillu's website must integrate with. This is the source of truth for all property data, lead management, and business rules.

**RRH PWA Structure:**

```
RRH PWA/
├── apps/
│   ├── api/          # Express + Prisma backend (26 route files, 17 services)
│   └── web/          # React + Vite + Tailwind frontend (internal EMS dashboard)
├── packages/
│   └── shared/       # Zod schemas, types, constants (1104 lines)
├── prisma/
│   ├── schema.prisma # 1082 lines, 30+ models
│   ├── migrations/
│   ├── seed.ts
│   └── dev.db        # SQLite dev database
├── tests/            # Playwright + Jest test suites
├── docs/
├── scripts/
└── package.json      # npm workspaces monorepo
```

### C. Other Reference Materials

| Path                                                            | Content                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| `D:\HYD\RRH\`                                                   | Earlier RRH prototype (Express server + React client, pre-monorepo) |
| `D:\HYD\RRH_Sonthillu_EMS_CRM_Final_SDD_v1.0.md`                | Complete SDD — 589 lines covering all CRM workflows                 |
| `D:\HYD\RRH_Technical_Implementation_Guide_v1.0.md`             | Step-by-step implementation guide — 312 lines                       |
| `D:\HYD\REAL ESTATE CRM + EMS — MASTER IMPLEMENTATION PLAN.pdf` | Master plan PDF                                                     |
| `D:\HYD\Radha_Real_Homes_Complete_App_Documentation.md`         | Full app documentation                                              |

---

## 2. Environment Summary

| Item                   | Value                                      |
| ---------------------- | ------------------------------------------ |
| **Node.js**            | v24.14.0                                   |
| **npm**                | 11.9.0                                     |
| **TypeScript**         | 5.4.5 (monorepo-wide)                      |
| **Package Manager**    | npm workspaces (NOT pnpm/yarn/bun)         |
| **Build Tool (Web)**   | Vite 5.2.8                                 |
| **Build Tool (API)**   | TypeScript compiler (`tsc`)                |
| **Frontend Framework** | React 18.2.0                               |
| **Backend Framework**  | Express 4.22.2                             |
| **CSS**                | Tailwind CSS 3.4.3                         |
| **ORM**                | Prisma 5.22.0 (client) / 5.12.1 (CLI)      |
| **Database**           | MySQL 8 (Hostinger cloud: `82.25.121.145`) |
| **Validation**         | Zod 3.22.4                                 |
| **State Management**   | Zustand 4.5.2                              |
| **Data Fetching**      | TanStack React Query 5.29.2                |
| **Icons**              | Lucide React 0.368.0                       |
| **Testing**            | Jest 29.7 + Playwright 1.62                |
| **Linting**            | ESLint 9.0.0                               |
| **Formatting**         | Prettier 3.2.5                             |

---

## 3. Current Architecture

### What Already Exists (RRH PWA — NOT in Sonthillu workspace)

**Backend (apps/api):**

- Express server with 26 route modules
- Prisma ORM with MySQL
- JWT auth (access + refresh cookies) + API key auth for public routes
- RBAC with 50+ permissions, 11 roles
- 17 service modules covering leads, properties, bookings, payments, customers, documents, site visits, projects
- Property approval pipeline: PM Verification → DM Polish → MD Approval
- Public API routes (`/api/v1/public/:brand/properties`, `/api/v1/public/:brand/leads`)
- Integration layer for Customer Portal (CRM↔Portal bridge)
- Web Push notifications (VAPID)
- File uploads (multer)

**Frontend (apps/web):**

- React 18 + Vite SPA
- Role-based dashboard routing (MD, Telecaller, PM, Staff)
- Property management with brand-type tabs (Sonthillu/RRH)
- Lead management, sales pipeline, customer management
- Site visit management, booking management
- Document management, HR hub, analytics
- PWA with service worker, offline caching
- Mobile-responsive with bottom navigation

**Shared (packages/shared):**

- Zod validation schemas for all create/update operations
- Property brand constants: `SONTHILLU` | `RADHA_REAL_HOMES`
- Property categories: APARTMENT, VILLA, INDEPENDENT_HOUSE, etc.
- Permission matrix, role constants, employee code regex
- Portal integration schemas (KYC, payments, installments)

### What Does NOT Exist

1. **No Sonthillu website code** — the workspace is empty
2. **No Sonthillu-specific frontend** — the RRH web app is the internal EMS dashboard, not a public website
3. **No Sonthillu public-facing design** — no brand assets, no color scheme, no logo
4. **No Sonthillu domain/subdomain configuration**
5. **No Sonthillu company seed in CRM** — only RRH company exists in the bootstrap

---

## 4. Current Dependencies

### Already Installed (RRH PWA root)

| Package              | Version | Purpose               |
| -------------------- | ------- | --------------------- |
| `@openrouter/sdk`    | 1.2.17  | AI/LLM integration    |
| `openai`             | 7.4.0   | AI Search foundation  |
| `sharp`              | 0.35.3  | Image optimization    |
| `express-rate-limit` | 8.6.2   | Rate limiting         |
| `dotenv`             | 17.4.2  | Environment variables |

### Available via Workspaces

All packages in `apps/api/package.json` and `apps/web/package.json` are accessible within the monorepo.

---

## 5. Existing Reusable Components

### From RRH PWA That Can Be Safely Reused

| Component                     | Location                                                      | Reuse Safety                        |
| ----------------------------- | ------------------------------------------------------------- | ----------------------------------- |
| `ErrorBoundary`               | `apps/web/src/components/common/ErrorBoundary.tsx`            | Safe — generic                      |
| `PWAInstallPrompt`            | `apps/web/src/components/common/PWAInstallPrompt.tsx`         | Safe — generic                      |
| `GlobalAnnouncementBanner`    | `apps/web/src/components/common/GlobalAnnouncementBanner.tsx` | Safe — generic                      |
| `ISTClock`                    | `apps/web/src/components/common/ISTClock.tsx`                 | Safe — generic                      |
| Auth context/hook patterns    | `apps/web/src/context/AuthContext.tsx`                        | Safe — pattern reference            |
| Toast context pattern         | `apps/web/src/context/ToastContext.tsx`                       | Safe — pattern reference            |
| Tailwind config tokens        | `apps/web/tailwind.config.js`                                 | Safe — brand colors will differ     |
| Vite + React + Tailwind setup | `apps/web/vite.config.ts`, `apps/web/tsconfig.json`           | Safe — config reference             |
| API config pattern            | `apps/web/src/config.ts`                                      | Safe — will need different base URL |

### From packages/shared That Are Directly Relevant

| Export                                           | Purpose                              |
| ------------------------------------------------ | ------------------------------------ |
| `PropertyBrand.SONTHILLU`                        | Brand constant                       |
| `PropertyStatus.*`                               | Property workflow states             |
| `PropertyCategory.*`                             | Property type enums                  |
| `PropertyCreateSchema`                           | Zod validation for property creation |
| `LeadCreateSchema`                               | Zod validation for lead capture      |
| `PUBLIC_PROPERTIES_READ` / `PUBLIC_LEADS_CREATE` | Public API permissions               |
| `Permissions` object                             | Full permission definitions          |

### From RRH PWA API Routes

| Route           | Purpose for Sonthillu                                 |
| --------------- | ----------------------------------------------------- |
| `public.ts`     | Foundation for public property listing + lead capture |
| `properties.ts` | Reference for property CRUD patterns                  |
| `customers.ts`  | Reference for customer management                     |
| `leads.ts`      | Reference for lead workflows                          |

---

## 6. Existing Integrations

| Integration             | Status            | Notes                                                    |
| ----------------------- | ----------------- | -------------------------------------------------------- |
| **CRM Database**        | Active            | MySQL at `82.25.121.145:3306`                            |
| **Public Property API** | Foundation exists | `GET /api/v1/public/:brand/properties` — needs hardening |
| **Public Lead API**     | Foundation exists | `POST /api/v1/public/:brand/leads` — needs extension     |
| **API Key Auth**        | Active            | `x-api-key` header for public routes                     |
| **JWT Auth**            | Active            | Access + refresh cookie for internal EMS                 |
| **Portal Integration**  | Scaffolded        | CRM↔Portal bridge (currently disabled)                   |
| **Web Push**            | Active            | VAPID-based push notifications                           |
| **OpenAI**              | Available         | SDK installed, not yet wired to website                  |
| **Image Processing**    | Available         | Sharp installed for optimization                         |

---

## 7. CRM Integration Findings

### Public API — Property Listing

**Current endpoint:** `GET /api/v1/public/:brand/properties`

**What it does:**

- Filters by `PropertyPublication` junction table (per-brand publication control)
- Returns only `LIVE` properties (or `LOCKED` with expired locks)
- Behind API key authentication

**Gaps identified (from VALIDATED gap matrix):**

1. **No field-level filtering** — returns full Prisma result with internal fields exposed
2. **No single-property detail endpoint** — website needs `GET /:brand/properties/:id`
3. **Image approval workflow missing** — all images returned regardless of approval status
4. **No rate limiting** on public routes
5. **`faqs: true` include references non-existent model** — runtime crash risk (already fixed in current `public.ts` — uses explicit `select`)

### Public API — Lead Capture

**Current endpoint:** `POST /api/v1/public/:brand/leads`

**What it does:**

- Creates lead with source `'WEBSITE'`
- Captures: customer_name, phone, email, property_type_preference, preferred_location, budget_max, notes
- Auto-generates lead code

**Gaps:**

1. No UTM parameter capture from request body
2. No seller-specific intake path
3. No multi-property enquiry support
4. No `preferred_call_time` field

### Property Publication Model

**CRITICAL FINDING:** The `PropertyPublication` junction table **already exists** in the schema and is wired to the public API. This means dual-brand publication control is partially implemented:

```prisma
model PropertyPublication {
  id           Int      @id @default(autoincrement())
  property_id  Int
  company_id   Int
  is_published Boolean  @default(false)
  published_at DateTime?
  // ... relations
  @@unique([property_id, company_id])
}
```

The public API already queries this table. However, only the RRH company is seeded — Sonthillu company needs to be created.

### Property Availability

The `deriveAvailability()` function in `property.service.ts` already maps internal states to public availability:

- `LIVE` → `AVAILABLE`
- `LOCKED` (active) → `RESERVED`
- `BOOKED`/`SOLD` → `SOLD`

**Gap:** The `availability_status` field is not yet a first-class DB column — it's derived at runtime. This may be sufficient for V1.

---

## 8. Deployment Findings

### Hostinger Configuration (from Deployment Guide)

| Component    | Configuration                                          |
| ------------ | ------------------------------------------------------ |
| **Platform** | Hostinger Business Shared Hosting                      |
| **Node.js**  | Managed Node.js app                                    |
| **Database** | MySQL 8 at `82.25.121.145:3306`                        |
| **Frontend** | Static site in `public_html`                           |
| **Backend**  | Node.js app via PM2 or Hostinger runner                |
| **SSL**      | AutoSSL / Let's Encrypt                                |
| **Domain**   | TBD for Sonthillu (e.g., `sonthillu.com` or subdomain) |

### Production Database Credentials (from .env)

```
DATABASE_URL="mysql://u988844918_crms:RadhaRealHomes%402026%21@82.25.121.145/u988844918_crms"
```

### Production API Base URL

```
https://rrh-api.onrender.com/api/v1  (commented out in config.ts)
```

---

## 9. Risks

| Risk                                              | Severity | Mitigation                           |
| ------------------------------------------------- | -------- | ------------------------------------ |
| Sonthillu company not seeded in CRM               | High     | Seed before website development      |
| Public API leaks internal fields                  | High     | Implement field-level select/filter  |
| No Sonthillu brand assets (logo, favicon, colors) | Medium   | Placeholder assets, design later     |
| PDF documents unreadable by AI                    | Low      | Human must extract requirements      |
| Shared hosting resource limits (3GB RAM, 2 CPU)   | Medium   | Keep Sonthillu website lightweight   |
| `faqs: true` crash risk in public API             | Medium   | Already fixed in current public.ts   |
| SOLD status never triggered programmatically      | Low      | Wire to booking completion if needed |
| Expired property locks stay LOCKED forever        | Low      | Add reversion job for V1.1           |

---

## 10. Missing Prerequisites

### Before Sonthillu Website Development Can Start

| #   | Prerequisite                                    | Status                                                   | Owner          |
| --- | ----------------------------------------------- | -------------------------------------------------------- | -------------- |
| 1   | Sonthillu company seeded in CRM DB              | **MISSING**                                              | CRM team       |
| 2   | Sonthillu company has API key for public routes | **MISSING**                                              | CRM team       |
| 3   | Sonthillu logo/brand assets                     | **MISSING**                                              | Design team    |
| 4   | Sonthillu domain/subdomain configured           | **MISSING**                                              | Infrastructure |
| 5   | Hostinger hosting plan for Sonthillu website    | **MISSING**                                              | Infrastructure |
| 6   | CRM public API field-level filtering (P0-2)     | **PARTIAL** — current `public.ts` uses explicit `select` | CRM team       |
| 7   | PropertyPublication wired for Sonthillu company | **PARTIAL** — schema exists, data missing                | CRM team       |
| 8   | CRM SDD/PRD documents human-read                | **IN PROGRESS** — PDFs need manual extraction            | Product        |

---

## 11. Recommended Implementation Architecture

### Option A: Standalone Sonthillu Website (Recommended)

Create a **new, independent frontend application** within the `D:\HYD\Sonthillu` workspace that:

- Has its own Vite + React + Tailwind setup
- Is NOT part of the RRH PWA monorepo
- Calls the existing RRH-CRMS public API endpoints
- Can be deployed independently to Hostinger
- Maintains complete brand separation from RRH

**Rationale:**

- Sonthillu and RRH are separate public brands (Rule #8)
- Different domains, different customer experiences
- Independent deployment lifecycle
- No risk of accidentally exposing internal EMS UI
- Matches the requirement: "Do not build Sonthillu as a recolored copy of RRH"

### Option B: Add to RRH PWA Monorepo as New App

Add `apps/sonthillu-web/` inside the RRH PWA monorepo.

**Pros:** Code sharing, shared types
**Cons:** Blurs brand separation, couples deployments, risks accidental cross-contamination

**Verdict: NOT recommended** — violates Rule #8 (separate brands) and Rule #9 (not a recolored copy)

### Recommended Tech Stack for Sonthillu Website

| Layer             | Choice                   | Reason                                |
| ----------------- | ------------------------ | ------------------------------------- |
| **Runtime**       | Node.js 20+              | Consistent with Hostinger             |
| **Frontend**      | React 18 + Vite          | Matches existing skill set            |
| **Styling**       | Tailwind CSS 3           | Matches existing skill set            |
| **Routing**       | React Router 6           | Matches existing pattern              |
| **Data Fetching** | TanStack React Query     | Matches existing pattern              |
| **State**         | Zustand (if needed)      | Matches existing pattern              |
| **Validation**    | Zod                      | Shared schemas from `@rrh-ems/shared` |
| **Icons**         | Lucide React             | Matches existing pattern              |
| **Testing**       | Vitest + Playwright      | Vite-native alternative to Jest       |
| **Deployment**    | Hostinger static hosting | Matches existing deployment           |

### API Integration Pattern

```
Sonthillu Website (Frontend)
    ↓ API Key header (x-api-key)
RRH-CRMS Public API (existing backend)
    ↓ Prisma queries
MySQL Database (existing)
```

The website should:

1. Use `GET /api/v1/public/sonthillu/properties` for property listings
2. Use `GET /api/v1/public/sonthillu/properties/:id` for property details (to be added)
3. Use `POST /api/v1/public/sonthillu/leads` for enquiries
4. Never call internal CRM endpoints
5. Never expose API keys in client-side code (use BFF or proxy)

---

## 12. Questions/Blockers

| #   | Question                                                           | Impact                               | Blocker?                               |
| --- | ------------------------------------------------------------------ | ------------------------------------ | -------------------------------------- |
| 1   | What is the Sonthillu domain name?                                 | Affects deployment, CORS, API config | Yes — blocks deployment                |
| 2   | What are the Sonthillu brand colors/font/logo?                     | Affects design system                | No — can use placeholders              |
| 3   | Is the Hostinger plan already purchased for Sonthillu?             | Affects deployment target            | Yes — blocks production                |
| 4   | Should the website use the same API key as RRH or a separate one?  | Affects API key management           | No — can generate new key              |
| 5   | Should the Sonthillu website be SSR (Next.js) or SPA (Vite React)? | Affects SEO, performance             | Decision needed before implementation  |
| 6   | Should AI Search be in V1 or deferred?                             | Affects scope                        | No — explicitly deferred per Rule #15  |
| 7   | What specific Sonthillu property types are in the CRM?             | Affects category filtering           | No — can inspect DB                    |
| 8   | Is there a customer login requirement for V1?                      | Affects scope                        | No — explicitly listed in requirements |

---

## 13. Proposed Next Implementation Packet

### Packet 0.1 — Project Scaffolding (Do First)

1. Initialize Sonthillu workspace with Vite + React + TypeScript + Tailwind
2. Set up project structure, routing shell, base layout
3. Configure environment variables (API base URL, API key)
4. Create placeholder brand assets (logo, favicon, colors)
5. Set up ESLint + Prettier + TypeScript strict mode
6. Verify: `npm run dev` starts the dev server

### Packet 0.2 — CRM Readiness (Parallel)

1. Seed Sonthillu company in CRM database
2. Generate API key for Sonthillu company
3. Verify public property endpoint returns Sonthillu properties
4. Add `GET /:brand/properties/:id` detail endpoint to CRM API
5. Add rate limiting to public API routes
6. Verify: API calls return expected data

### Packet 0.3 — Brand Foundation

1. Define Sonthillu color palette, typography, spacing
2. Create Tailwind config with brand tokens
3. Build header, footer, layout components
4. Create homepage shell
5. Verify: Design system renders correctly

### Packet 0.4 — Property Listing (V1 Core)

1. Property listing page with search/filter
2. Property card component
3. Property detail page
4. Integration with public API
5. Verify: Properties display from CRM data

### Packet 0.5 — Lead Capture (V1 Core)

1. Enquiry form component
2. Request a Call component
3. Call Now button
4. Sell Property form
5. Verify: Leads appear in CRM

---

## 14. Completion Summary

### What I Inspected

| Area                | Files/Directories Examined                                              |
| ------------------- | ----------------------------------------------------------------------- |
| Sonthillu workspace | `D:\HYD\Sonthillu` (all contents)                                       |
| RRH PWA monorepo    | `package.json`, `apps/api/`, `apps/web/`, `packages/shared/`, `prisma/` |
| CRM schema          | `prisma/schema.prisma` (1082 lines)                                     |
| API routes          | `public.ts`, `properties.ts`, `integration.routes.ts`, `server.ts`      |
| Services            | `property.service.ts`                                                   |
| Shared types        | `packages/shared/src/index.ts` (1104 lines)                             |
| Frontend            | `App.tsx`, `config.ts`, `tailwind.config.js`, `vite.config.ts`          |
| Components          | `common/`, `auth/`, `properties/`                                       |
| Environment         | `.env`, `.env.example`, `.gitignore`                                    |
| Documentation       | SDD, Technical Guide, Hostinger Guide, Gap Matrix                       |
| System              | Node.js version, npm version                                            |

### What Already Exists

- Complete CRM/EMS monorepo with 30+ database models
- Public API foundation for property listing and lead capture
- PropertyPublication junction table for dual-brand publication control
- Property approval pipeline (PM→DM→MD)
- Property availability derivation logic
- API key authentication for public routes
- Shared Zod schemas including Sonthillu brand constants
- Hostinger deployment documentation
- Comprehensive test suite (371 tests)

### What Is Missing

- **Sonthillu website code** (empty workspace)
- **Sonthillu company seed** in CRM database
- **Sonthillu brand assets** (logo, favicon, colors)
- **Sonthillu domain/hosting** configuration
- **Public API hardening** (field filtering, rate limiting, detail endpoint)
- **Customer login** for public website

### What I Created

| File                                       | Purpose     |
| ------------------------------------------ | ----------- |
| `docs/sonthillu/phase-0-reconnaissance.md` | This report |

### What I Did NOT Change

- Did NOT modify any files in `D:\HYD\RRH PWA`
- Did NOT create any application code
- Did NOT create fake CRM data
- Did NOT invent brand assets
- Did NOT implement any features
- Did NOT modify CRM database
- Did NOT create rental features
- Did NOT create AI Search

### Commands/Tests I Ran

| Command                                       | Result                        |
| --------------------------------------------- | ----------------------------- |
| `node --version`                              | v24.14.0                      |
| `npm --version`                               | 11.9.0                        |
| `npm ls --depth=0` (in RRH PWA)               | Listed all installed packages |
| `Test-Path "D:\HYD\Sonthillu\docs\sonthillu"` | True                          |
| Directory listings                            | All directories explored      |
| Grep for "sonthillu" in RRH PWA               | 67 matches found              |

---

**Status:** Phase 0 Reconnaissance Complete — Awaiting Review
**Next Step:** Wait for stakeholder approval before proceeding to Packet 0.1
