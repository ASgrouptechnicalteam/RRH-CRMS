import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropertyDetailById, getPropertyDetailByCode, getPublishedProperties } from '@/lib/crm';
import { toPublicProperty, toPublicPropertyList } from '@/lib/dto';
import { BRAND, SITE_CONFIG } from '@/lib/constants';
import { PropertyDetailClient } from '@/components/property/PropertyDetailClient';
import type { PublicPropertyDetail, PublicProperty } from '@/types/search';

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

async function fetchProperty(idOrSlug: string): Promise<PublicPropertyDetail | null> {
  const asNumber = Number(idOrSlug);
  if (!isNaN(asNumber)) {
    return getPropertyDetailById(asNumber);
  }
  return getPropertyDetailByCode(idOrSlug);
}

async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await fetchProperty(id);

  if (!property) {
    return {
      title: 'Property Not Found',
      robots: 'noindex, nofollow',
    };
  }

  const title = `${property.title} — ${BRAND.shortName} Constructions`;
  const description = property.description
    ? property.description.slice(0, 160)
    : `View ${property.propertyType.toLowerCase()} for sale in ${property.location}. ${property.priceFormatted}. ${property.areaFormatted}. ${property.bedrooms ? `${property.bedrooms} BHK` : ''}.`;

  const canonicalUrl = `${SITE_CONFIG.url}/properties/${property.id}`;

  const images = property.images
    .filter((img) => img.url)
    .slice(0, 3)
    .map((img) => img.url);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description:
      property.description ||
      `Premium ${property.propertyType.toLowerCase()} in ${property.location}`,
    url: canonicalUrl,
    image: images,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.locality || property.city || 'Hyderabad',
      addressRegion: property.state || 'Telangana',
      addressCountry: 'IN',
      postalCode: property.pincode || '',
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.areaSqft,
      unitCode: 'FTK',
    },
    numberOfRooms: property.bedrooms || undefined,
  };

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: BRAND.name,
      type: 'website',
      locale: 'en_IN',
      images:
        images.length > 0
          ? images.map((url) => ({ url, width: 1200, height: 900 }))
          : [{ url: SITE_CONFIG.ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.length > 0 ? images[0] : SITE_CONFIG.ogImage,
    },
  };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const property = await fetchProperty(id);

  if (!property) {
    notFound();
  }

  const { data: allProperties } = await getPublishedProperties();

  const similarProperties = toPublicPropertyList(
    allProperties.filter((p) => p.id !== property.id).slice(0, 6)
  );

  // Recommendation engine was moved to backend; passing empty array for now.
  const recommendations: any = { groups: [] };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'RealEstateListing',
            name: property.title,
            description:
              property.description ||
              `Premium ${property.propertyType.toLowerCase()} in ${property.location}`,
            url: `${SITE_CONFIG.url}/properties/${property.id}`,
            image: property.images
              .filter((img) => img.url)
              .slice(0, 3)
              .map((img) => img.url),
            address: {
              '@type': 'PostalAddress',
              addressLocality: property.locality || property.city || 'Hyderabad',
              addressRegion: property.state || 'Telangana',
              addressCountry: 'IN',
              postalCode: property.pincode || '',
            },
            offers: {
              '@type': 'Offer',
              price: property.price,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
            },
            floorSize: {
              '@type': 'QuantitativeValue',
              value: property.areaSqft,
              unitCode: 'FTK',
            },
            numberOfRooms: property.bedrooms || undefined,
          }),
        }}
      />
      <PropertyDetailClient
        property={property}
        similarProperties={similarProperties}
        recommendations={recommendations.groups}
      />
    </>
  );
}

// Static export has no server to resolve an arbitrary id at request time —
// every published property needs its own pre-rendered page at build time,
// or it simply doesn't exist on the deployed site. Pages through the CRM's
// public listing endpoint (capped at 50 per page server-side) until a page
// comes back short, rather than assuming everything fits on page one.
export async function generateStaticParams() {
  const ids: { id: string }[] = [];
  let page = 1;
  const limit = 50;
  for (;;) {
    const { data, error } = await getPublishedProperties({ page, limit } as any);
    if (error || data.length === 0) break;
    ids.push(...data.map((p) => ({ id: String(p.id) })));
    if (data.length < limit) break;
    page += 1;
  }
  // output: 'export' requires at least one generated route per dynamic
  // segment, even genuinely zero-listing states (first deploy, or the CRM
  // being briefly unreachable at build time) — this id never matches a real
  // property, so the page component's own notFound() handles it correctly.
  if (ids.length === 0) return [{ id: '__none__' }];
  return ids;
}
