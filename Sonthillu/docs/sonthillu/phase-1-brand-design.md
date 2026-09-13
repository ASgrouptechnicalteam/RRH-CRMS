# Phase 1 — Brand Identity & Design System: Sonthillu Constructions

**Date:** 15 August 2026
**Status:** Design System Established

---

## 1. Brand Interpretation

### Core Identity

Sonthillu Constructions is a residential real-estate brand focused on creating homes for families. The brand communicates:

- **Trust** — Reliable construction quality and transparent dealings
- **Home** — Family-centered living spaces
- **Quality** — Premium construction without excess
- **Modernity** — Contemporary design with timeless appeal

### Brand Personality

| Attribute   | Expression                                                         |
| ----------- | ------------------------------------------------------------------ |
| Warm        | Welcoming colors, friendly typography, approachable layout         |
| Trustworthy | Clean design, clear information hierarchy, professional execution  |
| Residential | Home imagery, family-oriented messaging, lifestyle focus           |
| Premium     | Refined spacing, quality materials feel, attention to detail       |
| Modern      | Contemporary layout patterns, subtle animations, fresh composition |

### What Sonthillu is NOT

| Not This               | Why                                                |
| ---------------------- | -------------------------------------------------- |
| Land investment portal | We sell homes, not investment plots                |
| Commercial marketplace | We are residential-only                            |
| Generic classifieds    | We are a branded developer, not a listing platform |
| Housing.com clone      | We have our own identity                           |
| 99acres clone          | We are not an aggregator                           |
| Magicbricks clone      | We are not a portal                                |
| RRH color swap         | We are a separate brand with distinct personality  |

---

## 2. Color System

### Primary Palette

| Token    | Hex       | Usage                               | Reasoning                                               |
| -------- | --------- | ----------------------------------- | ------------------------------------------------------- |
| **Navy** | `#1a2744` | Primary brand, headers, CTAs        | Communicates trust, stability, premium residential feel |
| **Gold** | `#c9952c` | Accent, highlights, premium touches | Warmth, quality, premium without excess                 |
| **Sage** | `#5a7a6a` | Secondary, nature, balance          | Connects to green spaces, gardens, natural living       |

### Neutral Palette

| Token        | Hex       | Usage                    |
| ------------ | --------- | ------------------------ |
| **Charcoal** | `#1f2937` | Primary text             |
| **Slate**    | `#475569` | Secondary text           |
| **Muted**    | `#94a3b8` | Meta text, placeholders  |
| **Border**   | `#e2e8f0` | Borders, dividers        |
| **Surface**  | `#f8fafc` | Page background          |
| **White**    | `#ffffff` | Cards, elevated surfaces |

### Semantic Palette

| Token       | Hex       | Usage                           |
| ----------- | --------- | ------------------------------- |
| **Success** | `#16a34a` | Available, confirmed, positive  |
| **Warning** | `#d97706` | Pending, attention needed       |
| **Error**   | `#dc2626` | Unavailable, rejected, critical |
| **Info**    | `#2563eb` | Informational, links            |

### Color Usage Rules

1. **Navy** is the dominant brand color — used for primary actions and headers
2. **Gold** is used sparingly for accents and premium highlights
3. **Sage** appears in secondary elements and nature-related contexts
4. **Neutrals** form the backbone of the interface
5. **Semantic colors** are used consistently for status indication

---

## 3. Typography System

### Font Stack

| Role        | Font             | Fallback              | Reasoning                          |
| ----------- | ---------------- | --------------------- | ---------------------------------- |
| **Display** | Playfair Display | Georgia, serif        | Elegant, premium, residential feel |
| **Body**    | Inter            | system-ui, sans-serif | Clean, readable, modern            |
| **Mono**    | JetBrains Mono   | monospace             | Code, property codes               |

### Type Scale

| Role           | Size            | Weight | Line Height | Usage                    |
| -------------- | --------------- | ------ | ----------- | ------------------------ |
| **Display XL** | 3.5rem (56px)   | 700    | 1.1         | Hero headlines           |
| **Display LG** | 2.5rem (40px)   | 700    | 1.2         | Section headlines        |
| **H1**         | 2rem (32px)     | 700    | 1.3         | Page titles              |
| **H2**         | 1.5rem (24px)   | 600    | 1.4         | Section titles           |
| **H3**         | 1.25rem (20px)  | 600    | 1.4         | Card titles, subsections |
| **Body LG**    | 1.125rem (18px) | 400    | 1.6         | Lead paragraphs          |
| **Body**       | 1rem (16px)     | 400    | 1.6         | Default text             |
| **Body SM**    | 0.875rem (14px) | 400    | 1.5         | Secondary text           |
| **Caption**    | 0.75rem (12px)  | 500    | 1.4         | Labels, metadata         |
| **Price**      | 1.5rem (24px)   | 700    | 1.2         | Property prices          |
| **Price SM**   | 1.125rem (18px) | 600    | 1.2         | Card prices              |

### Typography Rules

1. **Display fonts** are used for hero sections and major headlines only
2. **Body font** (Inter) is used for all readable content
3. **Price typography** is always bold and prominent
4. **Line height** increases with font size for readability
5. **Letter spacing** is slightly expanded for uppercase labels

---

## 4. Spacing System

### Base Unit: 4px

| Token       | Value | Usage                    |
| ----------- | ----- | ------------------------ |
| `space-0.5` | 2px   | Tight internal spacing   |
| `space-1`   | 4px   | Minimal spacing          |
| `space-2`   | 8px   | Small spacing            |
| `space-3`   | 12px  | Default internal spacing |
| `space-4`   | 16px  | Standard spacing         |
| `space-5`   | 20px  | Medium spacing           |
| `space-6`   | 24px  | Default card padding     |
| `space-8`   | 32px  | Section internal spacing |
| `space-10`  | 40px  | Large spacing            |
| `space-12`  | 48px  | Section gaps             |
| `space-16`  | 64px  | Major section spacing    |
| `space-20`  | 80px  | Hero section spacing     |
| `space-24`  | 96px  | Page section spacing     |

### Spacing Rules

1. **Consistent rhythm** — Multiples of 4px create visual harmony
2. **Generous padding** — Residential brands feel more spacious
3. **Clear hierarchy** — Larger spacing separates major sections
4. **Mobile-first** — Spacing scales down gracefully

---

## 5. Layout System

### Containers

| Name                  | Max Width | Padding            | Usage               |
| --------------------- | --------- | ------------------ | ------------------- |
| **Page Container**    | 1280px    | 16px / 24px / 32px | Main content area   |
| **Section Container** | 1280px    | 16px / 24px / 32px | Page sections       |
| **Card Container**    | Fluid     | 16px / 20px / 24px | Card content        |
| **Narrow**            | 768px     | 16px / 24px        | Forms, text content |
| **Wide**              | 1440px    | 16px / 24px / 32px | Full-width sections |

### Breakpoints

| Name        | Min Width | Columns | Gutter |
| ----------- | --------- | ------- | ------ |
| **Mobile**  | 0px       | 4       | 16px   |
| **Tablet**  | 640px     | 8       | 24px   |
| **Laptop**  | 1024px    | 12      | 24px   |
| **Desktop** | 1280px    | 12      | 32px   |

### Grid System

- **12-column grid** for flexible layouts
- **4-column grid** on mobile
- **8-column grid** on tablet
- **Consistent gutters** between columns

---

## 6. Component Philosophy

### Design Principles

1. **Clarity** — Every element has a clear purpose
2. **Consistency** — Similar elements look and behave similarly
3. **Hierarchy** — Visual weight guides the eye
4. **Whitespace** — Breathing room creates premium feel
5. **Subtlety** — Animations and effects enhance, not distract

### Component Patterns

| Pattern        | Approach                                                     |
| -------------- | ------------------------------------------------------------ |
| **Cards**      | Rounded corners, subtle shadow, generous padding             |
| **Buttons**    | Clear hierarchy (primary/secondary/ghost), consistent sizing |
| **Inputs**     | Clean borders, clear labels, helpful validation              |
| **Navigation** | Simple, predictable, responsive                              |
| **Modals**     | Focused content, clear actions, backdrop blur                |
| **Skeletons**  | Subtle pulse animation, matches content shape                |

---

## 7. Navigation Philosophy

### Structure

```
[Logo]  Properties  Projects  AI Search  Sell Property  About  Contact  [Login]
```

### Responsive Behavior

- **Desktop:** Full horizontal navigation
- **Tablet:** Condensed with hamburger menu
- **Mobile:** Bottom navigation bar with key actions

### Key Decisions

1. **No "Rent" tab** — Purchase-focused only
2. **AI Search prominent** — Differentiating feature
3. **Sell Property visible** — Lead generation
4. **Login accessible** — Customer account feature

---

## 8. Footer Philosophy

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Brand]  │  Properties  │  Company  │  Contact  │  Legal  │
│  Tagline  │  Categories  │  Links    │  Info     │  Links  │
│           │              │           │           │         │
│  [Social] │              │           │  [Phone]  │         │
│           │              │           │  [Email]  │         │
├─────────────────────────────────────────────────────────────┤
│  © 2026 Sonthillu Constructions. All rights reserved.       │
│  A Radha Real Homes venture.                                │
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions

1. **Subtle RRH reference** — "A Radha Real Homes venture" at bottom
2. **Contact prominent** — Phone and email easily accessible
3. **Property categories** — Quick access to popular searches
4. **Legal links** — Professional, trustworthy appearance

---

## 9. Card Philosophy

### Property Card Structure

```
┌─────────────────────────────┐
│  [Image]                    │
│  ┌─────────────────────┐    │
│  │  Available           │    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  3 BHK Apartment            │
│  Miyapur, Hyderabad         │
│                             │
│  ₹ 75 Lakh                  │
│  1,200 sq.ft.               │
│                             │
│  [View Details]             │
└─────────────────────────────┘
```

### Card Principles

1. **Image-first** — Property image is the hero
2. **Clear status** — Availability badge is prominent
3. **Price prominent** — Easy to scan pricing
4. **Location clear** — Always show location
5. **Action clear** — Single clear CTA

---

## 10. Image Philosophy

### Imagery Approach

| Type                | Usage                                               |
| ------------------- | --------------------------------------------------- |
| **Hero images**     | Lifestyle photography, happy families, modern homes |
| **Property images** | Actual property photos, high quality, well-lit      |
| **Icons**           | Line icons, consistent stroke width                 |
| **Illustrations**   | Minimal, used for empty states only                 |

### Image Rules

1. **Quality over quantity** — Fewer, better images
2. **Consistent style** — Similar lighting, composition
3. **Real photography** — Avoid stock photos when possible
4. **Optimized delivery** — WebP/AVIF formats, lazy loading

---

## 11. Mobile Philosophy

### Mobile-First Approach

1. **Touch-friendly** — Minimum 44px touch targets
2. **Bottom navigation** — Key actions accessible with thumb
3. **Swipeable content** — Image galleries, carousels
4. **Simplified forms** — Step-by-step input
5. **Fast loading** — Optimized images, minimal JavaScript

### Mobile-Specific Patterns

| Pattern             | Implementation                            |
| ------------------- | ----------------------------------------- |
| **Bottom nav**      | Properties, Search, AI Search, Sell, More |
| **Sticky headers**  | Brand + action button                     |
| **Pull to refresh** | Property listings                         |
| **Swipe cards**     | Property image galleries                  |

---

## 12. How Sonthillu Differs from RRH

| Aspect         | Sonthillu                         | RRH                       |
| -------------- | --------------------------------- | ------------------------- |
| **Focus**      | Residential homes                 | Commercial + Land         |
| **Color mood** | Warm navy + gold                  | Teal + sky                |
| **Typography** | Playfair Display + Inter          | Inter only                |
| **Layout**     | Lifestyle-oriented                | Data-dense                |
| **Card style** | Image-forward, spacious           | Compact, information-rich |
| **Navigation** | Simple, residential               | Complex, role-based       |
| **Footer**     | Brand-focused, subtle cross-brand | Company-focused           |

---

## 13. Competitor UX Patterns (Adopted Conceptually)

| Pattern                      | Source      | How We Adopt                  |
| ---------------------------- | ----------- | ----------------------------- |
| **Image-first cards**        | Housing.com | Property images are prominent |
| **Location-based discovery** | 99acres     | Location is a primary filter  |
| **Price transparency**       | Magicbricks | Prices always visible         |
| **Clean search**             | NoBroker    | Simple, focused search        |
| **Trust signals**            | PropTiger   | Verified badges, RERA info    |

---

## 14. What is Deliberately NOT Copied

| Not Copied        | Why                              |
| ----------------- | -------------------------------- |
| Aggregator layout | We are a developer, not a portal |
| Rental focus      | We are purchase-only             |
| Complex filters   | We keep it simple                |
| Data-heavy cards  | We are lifestyle-oriented        |
| Generic templates | We have our own identity         |

---

**Status:** Design System Established — Ready for Implementation
