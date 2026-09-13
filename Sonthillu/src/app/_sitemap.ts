import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/constants';

import { getPublishedProperties } from '@/lib/crm';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;

  const staticPages = ['', '/properties', '/projects', '/about', '/contact', '/sell-property'];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1.0 : 0.8,
  }));

  // Safely fetch inventory, falling back gracefully if CRM fails. The CRM's
  // public endpoint caps `limit` at 50 server-side regardless of what's
  // requested here, so a single request silently truncated past 50 listings
  // — paginate until a page comes back short, matching properties/[id]'s
  // generateStaticParams.
  let publishedProperties: any[] = [];
  try {
    let page = 1;
    const limit = 50;
    for (;;) {
      const response = await getPublishedProperties({ page, limit } as any);
      if (response?.error || !response?.data?.length) break;
      publishedProperties.push(...response.data);
      if (response.data.length < limit) break;
      page += 1;
    }
  } catch (error) {
    console.error('Failed to fetch properties for sitemap:', error);
  }

  const propertyEntries: MetadataRoute.Sitemap = publishedProperties.map((property: any) => ({
    url: `${baseUrl}/properties/${property.id}`,
    lastModified: property.created_at ? new Date(property.created_at) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...propertyEntries];
}
