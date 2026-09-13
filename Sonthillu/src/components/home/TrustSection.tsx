const STATS = [
  { value: '500+', label: 'Happy Families', color: 'text-brand-gold' },
  { value: '10k+', label: 'Properties Sold', color: 'text-brand-sky' },
  { value: '12+', label: 'Hyderabad Locations', color: 'text-brand-green' },
  { value: '10+', label: 'Years of Excellence', color: 'text-brand-brick' },
];

const TRUST_ITEMS = [
  {
    title: 'Expert Mediation',
    description:
      'We connect the right buyers with the right sellers, ensuring fair deals, transparent negotiations, and seamless transactions for everyone.',
    accent: 'brick',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11.42 15.17l-5.384 3.18A1.5 1.5 0 014 16.99V7.01a1.5 1.5 0 012.036-1.36l5.384 3.18m0 0l5.384-3.18A1.5 1.5 0 0118.82 7.01v9.98a1.5 1.5 0 01-2.036 1.36l-5.384-3.18m0 0V7.01"
        />
      </svg>
    ),
  },
  {
    title: 'Best Value for Sellers',
    description:
      'Looking to sell? We leverage our extensive network and market insights to ensure your property gets the premium valuation it deserves.',
    accent: 'sky',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
    ),
  },
  {
    title: '100% Transparent Legal',
    description:
      'Clear documentation, RERA-compliant listings, and verified legal titles. We handle the paperwork so you can focus on moving in.',
    accent: 'green',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
  {
    title: 'Curated Properties',
    description:
      'From luxury villas to affordable apartments, every property we list is hand-verified to ensure it meets our family-first quality standards.',
    accent: 'gold',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    ),
  },
  {
    title: 'End-to-End Support',
    description:
      "Our relationship doesn't end at the sale. From site visits to registration and handing over the keys, we are with you every step.",
    accent: 'sky',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
        />
      </svg>
    ),
  },
  {
    title: 'Easy Home Loans',
    description:
      'We partner with leading banks to make your home dream a reality — providing simplified loan assistance and personalized EMI planning.',
    accent: 'navy',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
        />
      </svg>
    ),
  },
];

const ACCENT_MAP: Record<string, { bg: string; text: string }> = {
  brick: { bg: 'bg-brand-brick-light', text: 'text-brand-brick' },
  sky: { bg: 'bg-brand-sky-light', text: 'text-brand-sky' },
  green: { bg: 'bg-brand-green-light', text: 'text-brand-green' },
  gold: { bg: 'bg-brand-gold-pale', text: 'text-brand-gold-dark' },
  navy: { bg: 'bg-brand-sky-light', text: 'text-brand-navy' },
};

export function TrustSection() {
  return (
    <section className="py-16 md:py-24 bg-brand-navy relative overflow-hidden">
      {/* Decorative brick line at top */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-brick via-brand-gold to-brand-green opacity-60" />

      {/* Faint house silhouette background */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <svg
          className="absolute -right-20 bottom-0 h-[320px] w-auto opacity-[0.04]"
          viewBox="0 0 400 380"
          fill="white"
        >
          <polygon points="200,20 20,160 60,160 60,360 340,360 340,160 380,160" />
          <rect x="155" y="240" width="90" height="120" fill="white" />
          <rect x="80" y="200" width="70" height="70" fill="white" />
          <rect x="250" y="200" width="70" height="70" fill="white" />
        </svg>
      </div>

      <div className="container-page relative z-10">
        {/* Stats Row */}
        <div className="mb-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className={`text-5xl font-bold ${stat.color} mb-1`}
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                {stat.value}
              </div>
              <div className="text-sm text-white/60 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Section heading */}
        <div className="mb-12 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">
            Why Choose Sonthillu
          </span>
          <h2
            className="text-3xl font-bold text-white md:text-4xl"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            Your Trusted <span className="text-brand-gold">Real Estate Partner</span>
          </h2>
          <p className="mt-3 text-lg text-white/65 max-w-xl mx-auto">
            We connect sellers with the best value and help families find their dream homes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TRUST_ITEMS.map((item) => {
            const accent = ACCENT_MAP[item.accent] || ACCENT_MAP.navy;
            return (
              <div
                key={item.title}
                className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 transition-all duration-200 hover:bg-white/10 hover:border-brand-gold/30"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${accent.bg} ${accent.text}`}
                >
                  {item.icon}
                </div>
                <h3 className="mb-2 text-base font-bold text-white group-hover:text-brand-gold transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
