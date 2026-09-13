import type { PublicPropertyDetail } from '@/types/search';

interface PropertyDetailsProps {
  property: PublicPropertyDetail;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Club House': (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  'Swimming Pool': (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  Gym: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
  Parking: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5 5h14M5 5a2 2 0 012-2h10a2 2 0 012 2v4M5 5v14a2 2 0 002 2h10a2 2 0 002-2V5"
      />
    </svg>
  ),
  Garden: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Security: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  Lift: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7h8m0 0v8m0-8l-4 4-4-4"
      />
    </svg>
  ),
  'Power Backup': (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
  'Play Area': (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
};

export function PropertyDetails({ property }: PropertyDetailsProps) {
  const amenities = property.amenities || [];

  return (
    <div className="space-y-8">
      {property.description && (
        <section>
          <h2
            className="text-xl font-semibold text-brand-navy mb-4"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            Overview
          </h2>
          <div className="prose prose-neutral max-w-none text-text-secondary leading-relaxed">
            <p className="whitespace-pre-wrap">{property.description}</p>
          </div>
        </section>
      )}

      {amenities.length > 0 && (
        <section>
          <h2
            className="text-xl font-semibold text-brand-navy mb-4"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            Amenities & Features
          </h2>
          <div className="flex flex-wrap gap-3">
            {amenities.map((amenity, index) => {
              const Icon = AMENITY_ICONS[amenity] || (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              );
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-muted border border-border rounded-lg"
                >
                  <span className="text-brand-navy">{Icon}</span>
                  <span className="text-sm font-medium text-text-primary">{amenity}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {property.details && Object.keys(property.details).length > 0 && (
        <section>
          <h2
            className="text-xl font-semibold text-brand-navy mb-4"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            Additional Details
          </h2>
          <dl className="divide-y divide-border">
            {Object.entries(property.details).map(([key, value]) => (
              <div key={key} className="py-3 flex items-center justify-between">
                <dt className="text-sm font-medium text-text-secondary">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </dt>
                <dd className="text-sm text-text-primary text-right max-w-[60%] break-words">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {property.seoKeywords && (
        <section>
          <h2
            className="text-xl font-semibold text-brand-navy mb-4"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            Key Highlights
          </h2>
          <div className="flex flex-wrap gap-2">
            {property.seoKeywords.split(',').map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-brand-gold/10 text-brand-gold rounded-full"
              >
                {keyword.trim()}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
