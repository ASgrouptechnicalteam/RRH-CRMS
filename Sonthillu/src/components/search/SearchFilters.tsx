'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { SearchFilters, PropertyType, ListingType, PossessionStatus } from '@/types/search';
import { PROPERTY_TYPE_OPTIONS, LISTING_TYPE_OPTIONS, BUDGET_PRESETS } from '@/types/search';
import { BHK_OPTIONS } from '@/types/property';
import { formatPrice } from '@/lib/dto';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: () => void;
  onReset: () => void;
  resultCount?: number;
}

export function SearchFiltersPanel({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  resultCount,
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.location ||
    filters.propertyType ||
    filters.listingType !== 'ANY' ||
    filters.minBudget ||
    filters.maxBudget ||
    filters.possessionStatus !== 'ANY';

  return (
    <div className="rounded-xl border border-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text-primary">Filters</h2>
          {hasActiveFilters && (
            <button onClick={onReset} className="text-xs text-brand-navy hover:underline">
              Clear all
            </button>
          )}
        </div>
        {resultCount !== undefined && (
          <p className="text-xs text-text-muted">
            {resultCount} {resultCount === 1 ? 'property' : 'properties'}
          </p>
        )}
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-5">
        {/* Location */}
        <div>
          <label
            htmlFor="filter-location"
            className="mb-2 block text-sm font-medium text-text-primary"
          >
            Location
          </label>
          <input
            id="filter-location"
            type="text"
            placeholder="e.g. Miyapur, Hyderabad"
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="w-full rounded-lg border border-border bg-neutral-50 px-3 py-2.5 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {/* Property Type */}
        <div>
          <label
            htmlFor="filter-property-type"
            className="mb-2 block text-sm font-medium text-text-primary"
          >
            Property Type
          </label>
          <select
            id="filter-property-type"
            value={filters.propertyType}
            onChange={(e) => updateFilter('propertyType', e.target.value as PropertyType | '')}
            className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy/20"
          >
            <option value="">All Types</option>
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bedrooms / BHK */}
        <div>
          <label
            htmlFor="filter-bedrooms"
            className="mb-2 block text-sm font-medium text-text-primary"
          >
            BHK
          </label>
          <select
            id="filter-bedrooms"
            value={filters.bedrooms}
            onChange={(e) => updateFilter('bedrooms', e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy/20"
          >
            <option value="">All</option>
            {BHK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Listing Type (New/Resale) */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">Listing Type</label>
          <div className="flex gap-2">
            {LISTING_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateFilter('listingType', opt.value)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  filters.listingType === opt.value
                    ? 'border-brand-navy bg-brand-navy text-white'
                    : 'border-border bg-white text-text-secondary hover:border-brand-navy/50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">Budget</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Min (e.g., 50L)"
              value={filters.minBudget}
              onChange={(e) => updateFilter('minBudget', e.target.value)}
              className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy/20"
            />
            <span className="flex items-center text-text-muted">–</span>
            <input
              type="text"
              placeholder="Max (e.g., 1Cr)"
              value={filters.maxBudget}
              onChange={(e) => updateFilter('maxBudget', e.target.value)}
              className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy/20"
            />
          </div>
          {/* Budget Presets */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onFiltersChange({
                    ...filters,
                    minBudget: preset.min ? formatPrice(preset.min).replace('₹', '') : '',
                    maxBudget: preset.max ? formatPrice(preset.max).replace('₹', '') : '',
                  });
                }}
                className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand-navy/50 hover:text-brand-navy"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Possession Status */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">Availability</label>
          <div className="flex gap-2">
            {(['ANY', 'READY_TO_MOVE', 'UNDER_CONSTRUCTION'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => updateFilter('possessionStatus', status)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  filters.possessionStatus === status
                    ? 'border-brand-navy bg-brand-navy text-white'
                    : 'border-border bg-white text-text-secondary hover:border-brand-navy/50'
                )}
              >
                {status === 'ANY' && 'Any'}
                {status === 'READY_TO_MOVE' && 'Ready'}
                {status === 'UNDER_CONSTRUCTION' && 'Under Construction'}
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <Button type="button" onClick={onApply} className="w-full" size="lg">
          Apply Filters
        </Button>
      </div>
    </div>
  );
}

/**
 * Compact mobile filter trigger bar.
 */
interface MobileFilterBarProps {
  resultCount?: number;
  onOpenFilters: () => void;
  onOpenSort: () => void;
  sortBy: string;
}

export function MobileFilterBar({
  resultCount,
  onOpenFilters,
  onOpenSort,
  sortBy,
}: MobileFilterBarProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 lg:hidden">
      <button
        type="button"
        onClick={onOpenFilters}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-brand-navy/50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
          />
        </svg>
        Filters
      </button>
      <button
        type="button"
        onClick={onOpenSort}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-brand-navy/50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13-6L16.5 19m0 0L12 14.5m4.5 4.5V7.5"
          />
        </svg>
        Sort
      </button>
      {resultCount !== undefined && <span className="text-xs text-text-muted">{resultCount}</span>}
    </div>
  );
}
