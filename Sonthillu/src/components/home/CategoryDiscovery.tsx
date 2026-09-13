import Link from 'next/link';

const CATEGORIES = [
  {
    label: 'Apartments',
    description: 'Modern flats in premium gated communities',
    href: '/properties?propertyType=APARTMENT',
    accent: 'navy',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
        />
      </svg>
    ),
  },
  {
    label: 'Villas',
    description: 'Luxury independent villas with private gardens',
    href: '/properties?propertyType=VILLA',
    accent: 'brick',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
        />
      </svg>
    ),
  },
  {
    label: 'Independent Houses',
    description: 'Standalone homes in established neighborhoods',
    href: '/properties?propertyType=INDEPENDENT_HOUSE',
    accent: 'green',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    ),
  },
  {
    label: 'Ready to Move',
    description: 'Immediate possession — move in today',
    href: '/properties?possessionStatus=READY_TO_MOVE',
    accent: 'gold',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
] as const;

const ACCENT_STYLES = {
  navy: {
    icon: 'bg-brand-sky-light text-brand-navy group-hover:bg-brand-navy group-hover:text-white',
    border: 'group-hover:border-brand-navy/40',
    label: 'text-brand-navy',
  },
  brick: {
    icon: 'bg-brand-brick-light text-brand-brick group-hover:bg-brand-brick group-hover:text-white',
    border: 'group-hover:border-brand-brick/40',
    label: 'text-brand-brick',
  },
  green: {
    icon: 'bg-brand-green-light text-brand-green group-hover:bg-brand-green group-hover:text-white',
    border: 'group-hover:border-brand-green/40',
    label: 'text-brand-green',
  },
  gold: {
    icon: 'bg-brand-gold-pale text-brand-gold-dark group-hover:bg-brand-gold group-hover:text-brand-navy',
    border: 'group-hover:border-brand-gold/60',
    label: 'text-brand-gold-dark',
  },
};

export function CategoryDiscovery() {
  return (
    <section className="py-16 md:py-20 bg-cream">
      <div className="container-page">
        <div className="mb-12 text-center">
          {/* Section eyebrow */}
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">
            Browse by Type
          </span>
          <h2
            className="text-3xl font-bold text-brand-navy md:text-4xl"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            Find Your Perfect Home
          </h2>
          <p className="mt-3 text-lg text-text-secondary max-w-xl mx-auto">
            From cozy apartments to spacious villas — discover handpicked properties perfect for
            families like yours.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const styles = ACCENT_STYLES[cat.accent];
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className={`group relative rounded-2xl border-2 border-border bg-white p-6 transition-all duration-250 hover:shadow-card hover:-translate-y-1 ${styles.border}`}
              >
                {/* Icon */}
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-250 ${styles.icon}`}
                >
                  {cat.icon}
                </div>

                <h3 className={`mb-1.5 text-base font-bold transition-colors ${styles.label}`}>
                  {cat.label}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{cat.description}</p>

                {/* Arrow */}
                <div className="mt-4 flex items-center text-xs font-semibold text-text-muted group-hover:text-brand-navy transition-colors">
                  Explore
                  <svg
                    className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
