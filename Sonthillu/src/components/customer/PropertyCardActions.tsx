'use client';

import { useCustomerActivity } from './CustomerActivityProvider';
import { cn } from '@/lib/utils';
import type { CustomerActivitySurface } from '@/lib/customer/activity';

interface PropertyCardActionsProps {
  propertyId: number;
  propertyTitle: string;
  surface?: CustomerActivitySurface;
}

/**
 * Compact shortlist/compare actions for property cards.
 * Uses accessible text labels (never icons alone) and aria-pressed state.
 */
export function PropertyCardActions({
  propertyId,
  propertyTitle,
  surface = 'property_card',
}: PropertyCardActionsProps) {
  const { isShortlisted, toggleShortlist, isCompared, addCompare, compare, compareLimit } =
    useCustomerActivity();

  const shortlisted = isShortlisted(propertyId);
  const compared = isCompared(propertyId);

  const handleCompare = () => {
    if (compared) return;
    addCompare(propertyId, surface);
  };

  return (
    <div className="flex items-center gap-2 border-t border-border px-4 py-3">
      <button
        type="button"
        onClick={() => toggleShortlist(propertyId, surface)}
        aria-pressed={shortlisted}
        aria-label={
          shortlisted
            ? `Remove ${propertyTitle} from shortlist`
            : `Add ${propertyTitle} to shortlist`
        }
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
          shortlisted
            ? 'bg-brand-gold/15 text-brand-gold-dark'
            : 'bg-surface-muted text-text-secondary hover:bg-border'
        )}
      >
        <svg
          className="h-4 w-4"
          fill={shortlisted ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {shortlisted ? 'Shortlisted' : 'Shortlist'}
      </button>

      <button
        type="button"
        onClick={handleCompare}
        disabled={compared}
        aria-pressed={compared}
        aria-label={
          compared ? `${propertyTitle} already added to compare` : `Add ${propertyTitle} to compare`
        }
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
          compared
            ? 'bg-brand-navy text-white'
            : 'bg-surface-muted text-text-secondary hover:bg-border'
        )}
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        {compared ? 'Compared' : 'Compare'}
      </button>

      {compared && (
        <span className="ml-auto text-xs text-text-muted">
          {compare.length}/{compareLimit}
        </span>
      )}
    </div>
  );
}
