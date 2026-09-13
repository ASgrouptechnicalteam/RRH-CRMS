import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { PublicProperty } from '@/types/search';

interface SimilarPropertiesProps {
  properties: PublicProperty[];
  currentPropertyId: number;
}

function SimilarPropertyCard({ property }: { property: PublicProperty }) {
  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="group h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-border">
          {property.primaryImage ? (
            <img
              src={property.primaryImage}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-12 w-12 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
            </div>
          )}
          {property.possessionStatus === 'READY_TO_MOVE' && (
            <div className="absolute left-3 top-3">
              <Badge variant="success">Ready to Move</Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-brand-gold">
            {property.propertyType === 'APARTMENT' && 'Apartment'}
            {property.propertyType === 'VILLA' && 'Villa'}
            {property.propertyType === 'INDEPENDENT_HOUSE' && 'Independent House'}
          </p>
          <h3 className="mb-1 text-base font-semibold text-text-primary line-clamp-1">
            {property.title}
          </h3>
          <p className="mb-3 text-sm text-text-secondary line-clamp-1">{property.location}</p>
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-bold text-brand-navy">{property.priceFormatted}</p>
            <p className="text-xs text-text-muted">{property.areaFormatted}</p>
          </div>
          {(property.bedrooms || property.bathrooms) && (
            <div className="mt-2 flex gap-3 text-xs text-text-secondary">
              {property.bedrooms != null && <span>{property.bedrooms} BHK</span>}
              {property.bathrooms != null && <span>{property.bathrooms} Bath</span>}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function SimilarProperties({ properties, currentPropertyId }: SimilarPropertiesProps) {
  const filteredProperties = properties.filter((p) => p.id !== currentPropertyId).slice(0, 3);

  if (filteredProperties.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-semibold text-brand-navy"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Similar Properties
        </h2>
        <Link
          href="/properties"
          className="text-sm font-medium text-brand-gold hover:text-brand-gold-dark transition-colors"
        >
          View All
          <svg
            className="h-4 w-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => (
          <SimilarPropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
