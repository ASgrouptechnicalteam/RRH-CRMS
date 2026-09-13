import type { Metadata } from 'next';
import { CompareView } from '@/components/customer/CompareView';

export const metadata: Metadata = {
  title: 'Compare Properties',
  description: 'Compare properties side by side.',
  robots: {
    index: false,
    follow: false,
  },
};

import { Suspense } from 'react';

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading comparison...</div>}>
      <CompareView />
    </Suspense>
  );
}
