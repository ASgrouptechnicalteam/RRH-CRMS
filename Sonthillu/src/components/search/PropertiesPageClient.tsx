'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchResults } from './SearchResults';
import { PropertyGridSkeleton } from './ResultStates';
import { searchParamsToQuery } from '@/lib/dto';

function PropertiesPageInner() {
  const searchParams = useSearchParams();
  const query = searchParamsToQuery(searchParams);
  return <SearchResults initialQuery={query} />;
}

export function PropertiesPageClient() {
  return (
    <Suspense fallback={<PropertyGridSkeleton />}>
      <PropertiesPageInner />
    </Suspense>
  );
}
