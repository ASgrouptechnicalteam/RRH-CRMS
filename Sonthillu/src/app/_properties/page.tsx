import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/constants';
import { PropertiesPageClient } from '@/components/search/PropertiesPageClient';

// Was an async Server Component reading `searchParams` and calling
// executeSearch() at request time — incompatible with `output: 'export'`
// (no server exists at request time to re-render per query string; a static
// export always sees an empty searchParams at build time). The filter/search
// experience now runs entirely client-side (see PropertiesPageClient +
// lib/searchClient.ts), same as the AI search interface already does.
// Per-filter dynamic metadata is lost as a result — a static export can't
// vary metadata by a query string it never sees at build time — so this
// page now canonicalizes to the unfiltered listing.

export const metadata: Metadata = {
  title: 'Properties for Sale',
  description:
    'Browse residential properties for sale in Hyderabad. Find apartments, villas, and independent houses from Sonthillu Constructions.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/properties`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PropertiesPage() {
  return (
    <div className="bg-surface-muted">
      <div className="container-page py-6 lg:py-8">
        <PropertiesPageClient />
      </div>
    </div>
  );
}
