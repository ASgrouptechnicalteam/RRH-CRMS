import type { Metadata } from 'next';
import { AISearchInterface } from '@/components/search/AISearchInterface';
import { BRAND } from '@/lib/constants';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: `AI Property Search | ${BRAND.name}`,
  description: 'Search for properties using natural language with Sonthillu AI.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AISearchPage() {
  return (
    <div className="bg-surface-muted">
      <div className="container-page py-6 lg:py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 flex space-x-4">
          <Link href="/properties">
            <Button
              variant="secondary"
              className="text-text-muted hover:text-brand-navy border-transparent hover:border-border"
            >
              Normal Search
            </Button>
          </Link>
          <Button variant="primary" className="shadow-md">
            AI Search
          </Button>
        </div>

        <div className="mx-auto max-w-4xl">
          <AISearchInterface />
        </div>
      </div>
    </div>
  );
}
