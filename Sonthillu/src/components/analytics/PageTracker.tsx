'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackClientActivity } from '@/lib/analytics/activity';

export function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track generic page_view if it's not a more specific event we track elsewhere.
    // E.g., property detail view fires 'property_view'. We track that specifically.
    if (pathname.startsWith('/properties/')) {
      return;
    }

    trackClientActivity({
      eventName: 'page_view',
      page: pathname,
    });
  }, [pathname, searchParams]);

  return null;
}
