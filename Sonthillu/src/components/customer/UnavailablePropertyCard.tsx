'use client';

import { useCustomerActivity } from './CustomerActivityProvider';
import { Badge } from '@/components/ui/Badge';

interface UnavailablePropertyCardProps {
  propertyId: number;
}

/**
 * Renders a stored property reference that is no longer publicly available
 * (reserved/sold/unpublished/deleted). It is clearly NOT presented as
 * purchasable and offers an explicit removal action.
 */
export function UnavailablePropertyCard({ propertyId }: UnavailablePropertyCardProps) {
  const { removeFromShortlist } = useCustomerActivity();

  return (
    <article className="overflow-hidden rounded-xl bg-surface-muted shadow-md">
      <div className="flex aspect-[4/3] items-center justify-center bg-border">
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
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>
      <div className="p-4">
        <Badge variant="error">No Longer Available</Badge>
        <p className="mt-3 text-sm text-text-secondary">
          This property is no longer listed and is not available for purchase.
        </p>
        <button
          type="button"
          onClick={() => removeFromShortlist(propertyId, 'shortlist_page')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-border px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-text-muted hover:text-white"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Remove from shortlist
        </button>
      </div>
    </article>
  );
}
