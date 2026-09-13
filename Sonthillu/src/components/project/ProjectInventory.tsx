import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PublicProjectDetail } from '@/types/search';

interface ProjectInventoryProps {
  project: PublicProjectDetail;
}

function InventoryPropertyCard({ property }: { property: any }) {
  return (
    <Link href={`/properties/${property.id}`} className="block">
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
          {property.listingType === 'RESALE' && (
            <div className="absolute right-3 top-3">
              <Badge variant="default">Resale</Badge>
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
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-lg font-bold text-brand-navy">{property.priceFormatted}</p>
            <p className="text-xs text-text-muted">{property.areaFormatted}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
            {property.bedrooms != null && <span>{property.bedrooms} BHK</span>}
            {property.bathrooms != null && <span>{property.bathrooms} Bath</span>}
            {property.facing && (
              <span>
                {property.facing.charAt(0) +
                  property.facing.slice(1).toLowerCase().replace('_', ' ')}{' '}
                Facing
              </span>
            )}
            {property.possessionStatus && (
              <span
                className={
                  property.possessionStatus === 'READY_TO_MOVE'
                    ? 'text-brand-sage'
                    : 'text-amber-600'
                }
              >
                {property.possessionStatus === 'READY_TO_MOVE'
                  ? 'Ready to Move'
                  : 'Under Construction'}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ProjectInventory({ project }: ProjectInventoryProps) {
  const availableProperties =
    project.properties?.filter((p) => p.listingType === 'NEW' || p.listingType === 'RESALE') || [];

  if (availableProperties.length === 0) {
    return (
      <section className="space-y-4">
        <h2
          className="text-xl font-semibold text-brand-navy"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Available Inventory
        </h2>
        <div className="text-center py-12 bg-surface-muted border border-border rounded-xl">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            No units currently available
          </h3>
          <p className="text-text-secondary">
            Available units will appear here when released for sale.
          </p>
        </div>
      </section>
    );
  }

  // Group by property type
  const grouped = availableProperties.reduce(
    (acc, prop) => {
      const type = prop.propertyType || 'Other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(prop);
      return acc;
    },
    {} as Record<string, typeof availableProperties>
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-semibold text-brand-navy"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Available Inventory
        </h2>
        <Link
          href={`/properties?project=${project.id}`}
          className="text-sm font-medium text-brand-gold hover:text-brand-gold-dark transition-colors"
        >
          View All {availableProperties.length} Units
          <svg
            className="h-4 w-4 ml-1 inline"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {Object.entries(grouped).map(([type, properties]) => (
        <div key={type} className="space-y-4">
          <h3 className="text-lg font-medium text-brand-navy capitalize">{type.toLowerCase()}s</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((property) => (
              <InventoryPropertyCard key={property.id} property={property} />
            ))}
          </div>
          {properties.length > 6 && (
            <Link
              href={`/properties?project=${project.id}&propertyType=${type}`}
              className="text-sm font-medium text-brand-gold hover:text-brand-gold-dark transition-colors inline-flex items-center gap-1"
            >
              View all {properties.length} {type.toLowerCase()}s
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          )}
        </div>
      ))}
    </section>
  );
}
