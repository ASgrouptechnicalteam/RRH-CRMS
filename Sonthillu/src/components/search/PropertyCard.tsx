import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { PropertyCardActions } from '@/components/customer/PropertyCardActions';
import type { PublicProperty } from '@/types/search';

interface PropertyCardProps {
  property: PublicProperty;
  variant?: 'default' | 'recommendation';
  onRecommendationClick?: () => void;
}

export function PropertyCard({
  property,
  variant = 'default',
  onRecommendationClick,
}: PropertyCardProps) {
  return (
    <article
      className={`group overflow-hidden rounded-xl bg-white shadow-md transition-all duration-200 hover:shadow-lg ${variant === 'recommendation' ? 'ring-1 ring-brand-navy/10' : ''}`}
    >
      <Link
        href={`/properties/${property.id}`}
        className="block"
        onClick={variant === 'recommendation' ? onRecommendationClick : undefined}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-border">
          {property.primaryImage ? (
            <Image
              src={property.primaryImage}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-12 w-12 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {variant === 'recommendation' && (
              <Badge variant="navy" className="bg-brand-gold text-brand-navy">
                Recommended
              </Badge>
            )}
            <Badge variant="navy">
              {property.propertyType === 'APARTMENT' && 'Apartment'}
              {property.propertyType === 'VILLA' && 'Villa'}
              {property.propertyType === 'INDEPENDENT_HOUSE' && 'Independent House'}
            </Badge>
            {property.listingType === 'RESALE' && <Badge variant="gold">Resale</Badge>}
          </div>

          {property.possessionStatus === 'READY_TO_MOVE' && (
            <div className="absolute right-3 top-3">
              <Badge variant="success">Ready to Move</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <p className="mb-1 text-xl font-bold text-brand-navy">{property.priceFormatted}</p>

          {/* Title */}
          <h3 className="mb-1 text-base font-semibold text-text-primary line-clamp-1 group-hover:text-brand-navy transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <p className="mb-3 flex items-center gap-1 text-sm text-text-secondary">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            <span className="line-clamp-1">{property.location}</span>
          </p>

          {/* Specs */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-text-secondary">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
                {property.bedrooms} BHK
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {property.bathrooms} Bath
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
              {property.areaFormatted}
            </span>
            {property.facing && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                  />
                </svg>
                {property.facing}
              </span>
            )}
          </div>
        </div>
      </Link>
      <PropertyCardActions propertyId={property.id} propertyTitle={property.title} />
    </article>
  );
}
