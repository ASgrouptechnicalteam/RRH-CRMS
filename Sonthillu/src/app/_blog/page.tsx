import type { Metadata } from 'next';
import { BRAND, SITE_CONFIG } from '@/lib/constants';
import { BlogCard } from '@/components/blog/BlogCard';

export const metadata: Metadata = {
  title: `Blog — ${BRAND.shortName}`,
  description: `Market insights, neighborhood guides, and home buying tips from ${BRAND.name}. Stay informed about Hyderabad real estate.`,
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: `Blog — ${BRAND.shortName}`,
    description: `Expert insights on Hyderabad real estate, home buying tips, and market trends.`,
    url: `${SITE_CONFIG.url}/blog`,
    siteName: BRAND.name,
    type: 'website',
    locale: 'en_IN',
  },
};

const POSTS = [
  {
    slug: 'hyderabad-real-estate-trends-2026',
    category: 'Market Insights',
    title: 'Hyderabad Real Estate Trends to Watch in 2026',
    excerpt:
      'From Gachibowli to Banjarahills, here is what the latest market data tells us about property values, demand shifts, and where smart buyers are looking.',
    readTime: '5 min read',
    date: 'January 15, 2026',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
  },
  {
    slug: 'choosing-the-right-hyderabad-neighborhood',
    category: 'Neighborhood Guide',
    title: 'Choosing the Right Hyderabad Neighborhood for Your Family',
    excerpt:
      'Every family has different priorities — schools, commute, amenities, safety. This guide breaks down what to consider when picking your perfect Hyderabad location.',
    readTime: '7 min read',
    date: 'January 8, 2026',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop',
  },
  {
    slug: 'home-buying-checklist',
    category: 'Home Buying Tips',
    title: 'The Complete Home Buying Checklist for First-Time Buyers',
    excerpt:
      'Buying your first home can feel overwhelming. This step-by-step checklist covers everything from budgeting to documentation to the final handover.',
    readTime: '6 min read',
    date: 'December 28, 2025',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop',
  },
  {
    slug: 'apartment-vs-villa-hyderabad',
    category: 'Property Comparison',
    title: 'Apartment vs Villa in Hyderabad: Which is Right for You?',
    excerpt:
      'Both have their advantages. We compare maintenance costs, space, privacy, security, and resale value to help you decide between an apartment and a villa.',
    readTime: '5 min read',
    date: 'December 15, 2025',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop',
  },
  {
    slug: 'investment-potential-hyderabad',
    category: 'Investment',
    title: 'Understanding Investment Potential in Hyderabad Real Estate',
    excerpt:
      'Hyderabad is one of India&apos;s fastest-growing cities. Learn which areas show the strongest appreciation potential and what factors drive long-term value.',
    readTime: '8 min read',
    date: 'November 30, 2025',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop',
  },
  {
    slug: '-home-inspection-tips',
    category: 'Home Buying Tips',
    title: 'Home Inspection Tips: What to Look for Before You Buy',
    excerpt:
      'A thorough inspection can save you from costly surprises. Here is a practical guide to checking structure, plumbing, electrical, and more before you commit.',
    readTime: '6 min read',
    date: 'November 15, 2025',
    image: 'https://images.unsplash.com/photo-1582268355757-087233796275?w=600&h=400&fit=crop',
  },
];

export default function BlogPage() {
  return (
    <div className="bg-surface-muted min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="container-page py-12">
          <h1 className="text-3xl font-bold text-text-primary">Blog & Resources</h1>
          <p className="mt-3 text-lg text-text-secondary max-w-2xl">
            Expert insights, market analysis, and practical guides to help you make informed real
            estate decisions in Hyderabad.
          </p>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="container-page py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>

      {/* Coming Soon Note */}
      <div className="border-t border-border bg-white">
        <div className="container-page py-8 text-center">
          <p className="text-text-secondary">
            This blog is under development. More articles, expert interviews, and neighborhood
            deep-dives coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
