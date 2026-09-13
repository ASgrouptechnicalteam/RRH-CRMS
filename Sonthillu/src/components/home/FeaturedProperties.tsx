import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { PublicProperty } from '@/types/search';

interface FeaturedPropertiesProps {
  properties?: PublicProperty[];
  loading?: boolean;
}

function PropertyCardSkeleton() {
  return (
    <Card hover={false}>
      <div className="aspect-[4/3] animate-pulse bg-border" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-1/4 animate-pulse rounded-full bg-border" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-border" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-border" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-1/3 animate-pulse rounded bg-border" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-border" />
        </div>
      </div>
    </Card>
  );
}

function PropertyCard({ property }: { property: PublicProperty }) {
  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="group h-full flex flex-col border-border transition-all duration-300 hover:border-brand-gold/40 hover:shadow-card hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-dark">
          {property.primaryImage ? (
            <img
              src={property.primaryImage}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-12 w-12 text-brand-navy/20"
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
          {property.possessionStatus === 'READY_TO_MOVE' && (
            <div className="absolute left-3 top-3">
              <Badge className="bg-brand-gold text-brand-navy border-0 font-bold shadow-md">
                Ready to Move
              </Badge>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5 bg-white">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-gold-dark">
            {property.propertyType === 'APARTMENT' && 'Apartment'}
            {property.propertyType === 'VILLA' && 'Villa'}
            {property.propertyType === 'INDEPENDENT_HOUSE' && 'Independent House'}
          </p>
          <h3 className="mb-2 text-lg font-bold text-brand-navy line-clamp-1 group-hover:text-brand-gold-dark transition-colors">
            {property.title}
          </h3>
          <div className="mb-4 flex items-center text-sm text-text-secondary">
            <svg
              className="mr-1.5 h-4 w-4 text-brand-navy/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-1">{property.location}</span>
          </div>

          <div className="mt-auto pt-4 border-t border-cream-dark">
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-xl font-bold text-brand-navy"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                {property.priceFormatted}
              </p>
              <p className="text-xs font-semibold text-text-muted bg-cream px-2 py-1 rounded">
                {property.areaFormatted}
              </p>
            </div>
            {(property.bedrooms || property.bathrooms) && (
              <div className="flex gap-4 text-sm font-medium text-text-secondary">
                {property.bedrooms != null && (
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 text-brand-gold-dark"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span>{property.bedrooms} BHK</span>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 text-brand-gold-dark"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <span>{property.bathrooms} Bath</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-navy/10">
        <svg
          className="h-8 w-8 text-brand-navy"
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
      <h3 className="text-lg font-semibold text-text-primary">No properties available yet</h3>
      <p className="mt-2 text-text-secondary">
        We&apos;re curating the best homes for you. Check back soon.
      </p>
    </div>
  );
}

export function FeaturedProperties({ properties, loading = false }: FeaturedPropertiesProps) {
  if (loading) {
    return (
      <section className="section-spacing">
        <div className="container-page">
          <SectionHeading
            title="Latest Properties"
            subtitle="Explore our newest published residential properties"
            align="center"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <section className="section-spacing">
        <div className="container-page">
          <SectionHeading
            title="Latest Properties"
            subtitle="Explore our newest published residential properties"
            align="center"
          />
          <EmptyState />
        </div>
      </section>
    );
  }

  return (
    <section className="section-spacing">
      <div className="container-page">
        <SectionHeading
          title="Latest Properties"
          subtitle="Explore our newest published residential properties"
          align="center"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.slice(0, 6).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button variant="secondary" size="lg">
            <Link href="/properties" className="flex items-center gap-2">
              View All Properties
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
