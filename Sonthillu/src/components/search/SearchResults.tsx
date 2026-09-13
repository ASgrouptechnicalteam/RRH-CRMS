'use client';

import { useState, useCallback, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyCard } from './PropertyCard';
import { SearchFiltersPanel, MobileFilterBar } from './SearchFilters';
import { SortDropdown, MobileSortSheet } from './SortDropdown';
import { PropertyGridSkeleton, PropertyGridEmpty, PropertyGridError } from './ResultStates';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import type { PublicProperty, SearchQuery, SearchFilters, SortOption } from '@/types/search';
import { filtersToQuery, queryToSearchParams, queryToFilters } from '@/lib/dto';
import type { RecommendationGroup } from '@/lib/recommendations/types';
import { trackClientActivity } from '@/lib/analytics/activity';
import { executeSearch } from '@/lib/searchClient';

interface SearchResultsProps {
  initialQuery: SearchQuery;
}

// Was a Server Component prop shape (initialProperties/initialTotal/etc.
// pushed down from an async parent that re-fetched on every server render
// triggered by a URL change). Static export has no server to re-render on
// navigation, so this component now owns its own client-side fetch —
// re-running whenever the query (URL-driven) or sort changes.
export function SearchResults({ initialQuery }: SearchResultsProps) {
  const router = useRouter();

  // Navigation transition state
  const [isPending, startTransition] = useTransition();

  // Local interactive state
  const [filters, setFilters] = useState<SearchFilters>(() => queryToFilters(initialQuery));
  const [sortBy, setSortBy] = useState<SortOption>(initialQuery.sortBy || 'relevance');
  const [activeQuery, setActiveQuery] = useState<SearchQuery>(initialQuery);

  // Search results (now fetched client-side, not passed down from a server parent)
  const [properties, setProperties] = useState<PublicProperty[]>([]);
  const [total, setTotal] = useState(0);
  const [recommendations, setRecommendations] = useState<RecommendationGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGlobalEmpty, setIsGlobalEmpty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mobile UI state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Re-sync when the URL-driven query changes (e.g. browser back/forward)
  useEffect(() => {
    setFilters(queryToFilters(initialQuery));
    setSortBy(initialQuery.sortBy || 'relevance');
    setActiveQuery(initialQuery);
  }, [initialQuery]);

  // Fetch results whenever the active query changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    executeSearch(activeQuery).then((result) => {
      if (cancelled) return;
      setProperties(result.properties);
      setTotal(result.total);
      setRecommendations(result.recommendations);
      setError(result.error);
      setIsGlobalEmpty(result.isGlobalEmpty);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeQuery]);

  // Update the URL (for shareable/bookmarkable state) and re-run the search
  const updateUrl = useCallback(
    (newQuery: SearchQuery) => {
      const params = queryToSearchParams(newQuery);
      const searchString = params.toString();
      startTransition(() => {
        router.push(`/properties${searchString ? `?${searchString}` : ''}`, { scroll: false });
      });
      setActiveQuery(newQuery);
    },
    [router]
  );

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    const newQuery = {
      ...filtersToQuery(filters),
      sortBy,
      page: 1,
      limit: 12,
    };
    updateUrl(newQuery);
    setIsFiltersOpen(false);

    trackClientActivity({
      eventName: 'search_submitted',
      searchContext: newQuery,
    });
  }, [filters, sortBy, updateUrl]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    const newQuery: SearchQuery = { sortBy: 'relevance', page: 1, limit: 12 };
    updateUrl(newQuery);
  }, [updateUrl]);

  // Sort change
  const handleSortChange = useCallback(
    (newSort: SortOption) => {
      setSortBy(newSort);
      const newQuery = { ...activeQuery, sortBy: newSort, page: 1 };
      updateUrl(newQuery);
    },
    [activeQuery, updateUrl]
  );

  // Build active filter count
  const activeFilterCount = [
    filters.location,
    filters.propertyType,
    filters.listingType !== 'ANY' ? filters.listingType : null,
    filters.minBudget,
    filters.maxBudget,
    filters.possessionStatus !== 'ANY' ? filters.possessionStatus : null,
  ].filter(Boolean).length;

  const showSkeleton = isLoading || isPending;

  return (
    <div className="min-h-[60vh]">
      {/* Mobile Filter Bar */}
      <MobileFilterBar
        resultCount={properties.length}
        onOpenFilters={() => setIsFiltersOpen(true)}
        onOpenSort={() => setIsSortOpen(true)}
        sortBy={sortBy}
      />

      <div className="flex gap-6">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24">
            <SearchFiltersPanel
              filters={filters}
              onFiltersChange={setFilters}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              resultCount={properties.length}
            />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Desktop Header */}
          <div className="mb-6 hidden items-center justify-between lg:flex">
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                {activeQuery.location ? `Properties in ${activeQuery.location}` : 'All Properties'}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {total} {total === 1 ? 'property' : 'properties'} found
                {activeQuery.propertyType && ` · ${activeQuery.propertyType}`}
                {activeQuery.listingType &&
                  activeQuery.listingType !== 'ANY' &&
                  ` · ${activeQuery.listingType}`}
              </p>
            </div>
            <SortDropdown value={sortBy} onChange={handleSortChange} />
          </div>

          {/* Results */}
          {error ? (
            <PropertyGridError message={error} onRetry={() => setActiveQuery({ ...activeQuery })} />
          ) : showSkeleton ? (
            <PropertyGridSkeleton />
          ) : properties.length === 0 ? (
            <PropertyGridEmpty
              query={activeQuery}
              onClearFilters={handleResetFilters}
              isGlobalEmpty={isGlobalEmpty}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          {/* Pagination placeholder */}
          {!showSkeleton &&
            !error &&
            properties.length > 0 &&
            properties.length === (activeQuery.limit || 12) && (
              <div className="mt-8 flex justify-center">
                <p className="text-sm text-text-muted">
                  More properties may be available. Pagination will be implemented in a future
                  update.
                </p>
              </div>
            )}

          {/* Recommendations */}
          {!showSkeleton && !error && recommendations && recommendations.length > 0 && (
            <div
              className={properties.length === 0 ? 'mt-4' : 'mt-12 pt-12 border-t border-border'}
            >
              <RecommendationsSection groups={recommendations} surface="search" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-text-primary/50"
            onClick={() => setIsFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-full max-w-sm overflow-y-auto bg-white">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-lg font-semibold text-text-primary">Filters</h2>
              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className="rounded-lg p-1 text-text-muted hover:bg-border"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <SearchFiltersPanel
                filters={filters}
                onFiltersChange={setFilters}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                resultCount={properties.length}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Sheet */}
      <MobileSortSheet
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        value={sortBy}
        onChange={handleSortChange}
      />
    </div>
  );
}
