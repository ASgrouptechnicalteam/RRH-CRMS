import type { PublicPropertyDetail } from '@/types/search';

interface LocationContextProps {
  property: PublicPropertyDetail;
}

export function LocationContext({ property }: LocationContextProps) {
  const locationParts = [property.locality, property.city, property.state, property.pincode].filter(
    Boolean
  );

  const fullAddress = locationParts.join(', ');

  if (!fullAddress) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2
        className="text-xl font-semibold text-brand-navy"
        style={{ fontFamily: 'var(--font-family-display)' }}
      >
        Location
      </h2>
      <div className="bg-surface-muted border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-gold/10 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-brand-gold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
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
          </div>
          <div className="flex-1 min-w-0">
            {property.address && (
              <p className="text-text-primary font-medium">{property.address}</p>
            )}
            <p className="text-text-secondary mt-1">{fullAddress}</p>
            <p className="text-xs text-text-muted mt-2">
              Exact location will be shared after site visit scheduling.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-3">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-muted transition-colors"
          >
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            View on Google Maps
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-muted transition-colors"
          >
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            Get Directions
          </a>
        </div>
      </div>
    </section>
  );
}
