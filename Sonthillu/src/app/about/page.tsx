import type { Metadata } from 'next';
import { BRAND } from '@/lib/constants';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us — Sonthillu',
  description: `Learn about ${BRAND.name} — our mission, vision, experience, and commitment to quality residential real estate in Hyderabad.`,
  openGraph: {
    title: 'About Us — Sonthillu',
    description: `About ${BRAND.name}: A trusted Hyderabad real estate platform connecting buyers and sellers with quality properties.`,
    url: `${BRAND.domain}/about`,
    siteName: BRAND.name,
    type: 'website',
    locale: 'en_IN',
  },
};

const STATS = [
  { label: 'Years of Experience', value: `${BRAND.yearsOfExperience}+` },
  { label: 'Properties Facilitated', value: `${BRAND.propertiesFacilitated}+` },
  { label: 'Satisfied Customers', value: `${BRAND.satisfiedCustomers}+` },
  { label: 'Cities Covered', value: BRAND.citiesCovered.join(', ') },
];

export default function AboutPage() {
  return (
    <div className="bg-surface-muted min-h-screen">
      {/* Hero */}
      <div className="bg-brand-navy py-16 md:py-24">
        <div className="container-page">
          <div className="max-w-3xl">
            <h1
              className="text-4xl font-bold text-white"
              style={{ fontFamily: 'var(--font-family-display)' }}
            >
              About {BRAND.shortName}
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              Sonthillu Constructions is a trusted real estate platform based in Hyderabad,
              Telangana, India. We connect homebuyers with quality residential properties across the
              city&apos;s most sought-after neighborhoods.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-border">
        <div className="container-page py-10">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <p
                  className="text-3xl md:text-4xl font-bold text-brand-navy"
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="container-page py-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Our Story</h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>
              {BRAND.name} started with a simple vision — to make finding a home in Hyderabad
              easier, more transparent, and less stressful for everyone. What began as a small
              initiative to bridge the gap between property sellers and buyers has grown into a
              comprehensive real estate platform serving thousands of families.
            </p>
            <p>
              We believe that finding your dream home should be an exciting journey, not a
              frustrating one. That&apos;s why we have built tools, filters, and features that help
              you search, compare, and enquire with confidence.
            </p>
            <p>
              Our platform acts as a mediator between property sellers and buyers — we don&apos;t
              own the properties, but we help you discover them, verify listings, and connect with
              sellers directly. Every listing on Sonthillu goes through a verification process to
              ensure accuracy and trustworthiness.
            </p>
          </div>
        </div>
      </div>

      {/* What We Do */}
      <div className="bg-white py-12">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">What We Do</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-3">For Home Buyers</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Browse, filter, shortlist, and compare properties across Hyderabad. Use our
                AI-powered search to find homes that match your needs. Enquire directly with sellers
                and track your favorites.
              </p>
            </div>
            <div className="rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-3">For Property Sellers</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                List your property on Sonthillu and reach thousands of potential buyers. Our
                submission process is simple, and our seller dashboard helps you track your listing
                status and enquiries.
              </p>
            </div>
            <div className="rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-3">Verification & Trust</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                We verify listings before they go live. This includes confirming key property
                details and seller identity. We also provide RERA information so you can make
                informed decisions with confidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="container-page py-12">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Locations We Cover</h2>
        <div className="flex flex-wrap gap-3">
          {BRAND.citiesCovered.map((city) => (
            <span
              key={city}
              className="rounded-full bg-brand-navy/10 px-4 py-2 text-sm font-medium text-brand-navy"
            >
              {city}
            </span>
          ))}
          <span className="rounded-full border border-border px-4 py-2 text-sm text-text-secondary">
            + More areas being added
          </span>
        </div>
        <p className="mt-4 text-sm text-text-secondary">
          We primarily serve Hyderabad and its surrounding areas, with new neighborhoods being added
          regularly. Check back for updates.
        </p>
      </div>

      {/* CTA */}
      <div className="bg-brand-navy py-12">
        <div className="container-page text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Find Your Dream Home?</h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Browse hundreds of verified properties across Hyderabad. It&apos;s free to start.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/properties"
              className="inline-flex items-center rounded bg-white px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-navy/10"
            >
              Browse Properties
            </Link>
            <Link
              href="/sell-property"
              className="inline-flex items-center rounded border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Sell Your Property
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
