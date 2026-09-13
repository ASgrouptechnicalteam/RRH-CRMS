# P9 Performance and Asset Delivery Audit

This document summarizes the performance audits and optimizations applied during Phase P9.

## 1. Image Optimization

**Audit:**

- Checked `next.config.ts` for properly configured `remotePatterns`. Both `**.unsplash.com` and `**.cloudinary.com` are whitelisted using the correct `https` protocol.
- Audited `src/components/home/HeroCarousel.tsx` and `src/components/project/ProjectCard.tsx` and `src/components/search/PropertyCard.tsx`.
- Found `PropertyCard.tsx` using a standard `<img>` tag for property cover images instead of Next.js `<Image>`. In a grid view, this causes significant unoptimized LCP delays and layout shifts.

**Fixes:**

- Refactored `src/components/search/PropertyCard.tsx` to use `next/image` with the `fill` layout and explicit `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"` to ensure the correct image sizes are served on mobile, tablet, and desktop viewports.
- Confirmed `HeroCarousel.tsx` uses `priority={index === 0}` to preload the LCP element.

## 2. Server Action Payloads

**Audit:**

- Audited Server Actions in `src/app/actions` for large payloads or synchronous blocking behavior.
- Lead submissions use deterministic canonicalization (hashing) before interacting with Redis to keep memory footprints low and stable.
- Server Actions do not return large unneeded JSON blobs; they return mapped primitive DTOs (e.g., `LeadActionResult`).

## Status

Performance Audit is **COMPLETE** and verified. Image optimizations are correctly applied.
