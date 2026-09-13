import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Static export requires at least one generated route per dynamic segment.
// These are the same placeholder slugs listed on /blog (see POSTS in
// app/blog/page.tsx) — each currently renders this "Coming Soon" stub until
// real articles replace it.
const PLACEHOLDER_SLUGS = [
  'hyderabad-real-estate-trends-2026',
  'choosing-the-right-hyderabad-neighborhood',
  'home-buying-checklist',
  'apartment-vs-villa-hyderabad',
  'investment-potential-hyderabad',
  '-home-inspection-tips',
];

export async function generateStaticParams() {
  return PLACEHOLDER_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'Blog Post — Sonthillu',
    robots: 'noindex, nofollow',
  };
}

export default function BlogPostStubPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="container-page py-12">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Coming Soon</h1>
        <p className="text-text-secondary mb-6">
          This article is under development and will be published shortly. Check back soon for
          expert insights on Hyderabad real estate.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center rounded bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          Back to Blog
        </Link>
      </div>
    </div>
  );
}
