import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export for Hostinger file-manager hosting (consolidation plan,
  // Decision 5) — no Node server, so no next/image optimizer, no Server
  // Actions, no cookies(), no dynamic Route Handlers. `next build` now
  // writes a plain HTML/CSS/JS site to ./out.
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
      // Local CRM dev server — property/project images uploaded there are
      // served from its own origin (apps/api's express.static uploads
      // mounts), rewritten to an absolute URL by the BFF's resolveUploadUrls.
      // Port must be explicit: an omitted `port` matches only a URL with NO
      // port in it, not "any port".
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SITE_NAME: 'Sonthillu Constructions',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://sonthilluconstructions.com',
  },
};

export default nextConfig;
