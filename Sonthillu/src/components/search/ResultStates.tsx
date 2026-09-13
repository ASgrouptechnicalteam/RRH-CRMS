import { Card } from '@/components/ui/Card';
import Link from 'next/link';

/**
 * Skeleton card for loading state.
 */
function PropertyCardSkeleton() {
  return (
    <Card hover={false}>
      <div className="aspect-[4/3] animate-pulse bg-border" />
      <div className="p-4 space-y-3">
        <div className="h-6 w-1/3 animate-pulse rounded bg-border" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-border" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-border" />
        <div className="flex gap-3 pt-2 border-t border-border">
          <div className="h-4 w-16 animate-pulse rounded bg-border" />
          <div className="h-4 w-16 animate-pulse rounded bg-border" />
          <div className="h-4 w-20 animate-pulse rounded bg-border" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Loading state: grid of skeleton cards.
 */
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Empty state: no properties found.
 */
export function PropertyGridEmpty({
  query,
  onClearFilters,
  isGlobalEmpty = false,
}: {
  query?: import('@/types/search').SearchQuery;
  onClearFilters?: () => void;
  isGlobalEmpty?: boolean;
}) {
  if (isGlobalEmpty) {
    return (
      <div className="py-16 text-center">
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary">No active properties available</h3>
        <p className="mt-2 max-w-md mx-auto text-text-secondary">
          We currently don't have any active property listings matching our published inventory.
          Please check back later or contact our sales team for upcoming opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="py-16 text-center">
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
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary">No exact matches found</h3>
      <p className="mt-2 max-w-md mx-auto text-text-secondary">
        We couldn't find properties matching all of your current preferences. Try widening your
        budget, location, property type, or BHK criteria.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        {onClearFilters ? (
          <button
            onClick={onClearFilters}
            className="rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark"
          >
            Clear all filters
          </button>
        ) : (
          <Link
            href="/properties"
            className="rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark"
          >
            View All Properties
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Error state: API or search failure.
 */
export function PropertyGridError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
        <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary">
        {message === 'CRM_UNAVAILABLE' ? 'System Temporarily Unavailable' : 'Something went wrong'}
      </h3>
      <p className="mt-2 max-w-md mx-auto text-text-secondary">
        {message === 'CRM_UNAVAILABLE'
          ? 'We are currently unable to reach the property inventory system. Please try again in a few moments.'
          : message || 'We encountered an error while fetching properties. Please try again.'}
      </p>
      {onRetry && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border-2 border-brand-navy px-5 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-navy hover:text-white"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
