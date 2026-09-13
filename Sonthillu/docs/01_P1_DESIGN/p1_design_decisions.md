# P1 DESIGN DECISIONS

This document logs all the design system constraints, decisions, and patterns implemented in Phase P1.

## 1. Official Logo Source

- **Decision:** The official logo is the user-supplied JPEG (`sonthillu logo.jpeg`).
- **Reasoning:** Authoritative directive required exactly this JPEG to be used. No SVG variants or vector representations are permitted.
- **Implementation:** Deployed to `public/brand/sonthillu-logo.jpeg` and injected into the responsive `Header.tsx` and `Footer.tsx`. Added `alt="Sonthillu Constructions"` to fulfill accessibility guidelines.

## 2. Color Palette

- **Decision:** The existing Navy/Gold brand palette is retained and formalized.
- **Reasoning:** Validated that Navy (#1a2744) properly communicates trust and structure, and Gold (#c9952c) functions as an effective premium construction accent.
- **Implementation:** Centralized in `src/styles/globals.css` via Tailwind v4 `@theme` block. Semantic neutrals were normalized to `text-primary`, `text-secondary`, `text-muted`, `border`, `surface`, and `surface-muted`.

## 3. Typography

- **Decision:** Inter (Sans) and Playfair Display (Serif/Display).
- **Reasoning:** Balances modern readability for data-heavy scan-friendly layouts (Inter) with premium residential aesthetics for primary headings (Playfair Display).
- **Implementation:** Preserved the existing definitions mapped in `globals.css` under `--font-family-sans` and `--font-family-display`. No additional font dependencies were introduced, keeping performance tight.

## 4. Spacing & Containers

- **Decision:** Consolidate layout structure using utility classes.
- **Implementation:** `container-page` utility limits max width to 7xl (`1280px`) and ensures mobile-safe gutters (`px-4 sm:px-6`). Eliminates random `max-w-*` variants across page templates.

## 5. UI Primitives

### Buttons

- **Decision:** Strong visual hierarchy avoiding competing dominant CTAs.
- **Implementation:** Primary buttons are Navy (`bg-brand-navy`). Accent actions can use Gold.

### Forms

- **Decision:** Clean, high-contrast borders and unified focus rings.
- **Implementation:** Focus states standardized to `focus:border-brand-navy focus:ring-brand-navy/20` across Input and Select components.

### Cards

- **Decision:** Structured, scan-friendly layouts for properties and projects.
- **Implementation:** Re-mapped standard container backgrounds to `bg-surface` and structural lines to `border`.

### Badges

- **Decision:** Functional, accessible status labels.
- **Implementation:** Leveraged unified `success`, `warning`, `error`, `info`, and `border` tokens to explicitly define "New", "Resale", and "Verified" badges without arbitrary hardcoded hex strings.

## 6. Layout Composition

### Header

- Incorporates official JPEG logo.
- `Sell Property` is a main navigation action, but deliberately kept out of the hero to prevent competing with core search functionality.

### Footer

- Retains distinct identity with the official JPEG.
- Navy brand foundation.

## 7. Responsive Rules

- Layout breakpoints explicitly map to Tailwind standard thresholds: `375px`, `768px`, `1024px`, `1280px`, `1440px`.
- Mobile-first horizontal paddings (`px-4`) transition to desktop safe zones (`sm:px-6 lg:px-8`).
- Mobile navigation shifts gracefully into a hamburger Drawer/Accordion.

## 8. Image Rules

- Permitted to use stock imagery strictly for broad residential themes or lifestyle hero areas. Never for specific simulated property listings.

## 9. Animation Rules

- **Decision:** Animations are restrained and deliberate.
- **Implementation:** Transition states are limited to subtle color shifts on hover, active state expansions (drawer/modal), and `prefers-reduced-motion` fallbacks where applicable.

## 10. Accessibility Rules

- Semantic HTML tags are mandatory (`<header>`, `<footer>`, `<main>`, `<nav>`).
- Touch targets are 44px minimum for primary interactions.
- Input elements preserve `aria-invalid` and `aria-describedby` wiring initialized in P4.
