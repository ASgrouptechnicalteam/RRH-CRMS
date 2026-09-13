import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function CTASection() {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={{ background: 'linear-gradient(135deg, #111d3e 0%, #1c2b5a 60%, #2a3d72 100%)' }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Gold rays — top right */}
        <svg
          className="absolute -top-10 -right-10 h-[200px] w-auto opacity-[0.12]"
          viewBox="0 0 200 200"
          fill="#c9a830"
        >
          <circle cx="150" cy="50" r="40" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1={150 + 40 * Math.cos((deg * Math.PI) / 180)}
              y1={50 + 40 * Math.sin((deg * Math.PI) / 180)}
              x2={150 + 65 * Math.cos((deg * Math.PI) / 180)}
              y2={50 + 65 * Math.sin((deg * Math.PI) / 180)}
              stroke="#c9a830"
              strokeWidth="5"
              strokeLinecap="round"
            />
          ))}
        </svg>
        {/* House silhouette — left side */}
        <svg
          className="absolute left-0 bottom-0 h-[260px] w-auto opacity-[0.06]"
          viewBox="0 0 320 280"
          fill="white"
        >
          <polygon points="160,20 20,130 50,130 50,260 270,260 270,130 300,130" />
          <rect x="115" y="180" width="70" height="80" fill="white" />
          <rect x="50" y="155" width="55" height="50" fill="white" />
          <rect x="215" y="155" width="55" height="50" fill="white" />
        </svg>
        {/* Brick line — bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-brick via-brand-gold to-brand-green opacity-50" />
        {/* Green grass strip */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-brand-green/20" />
      </div>

      <div className="container-page relative z-10 text-center">
        {/* Eyebrow */}
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-gold mb-4">
          Start Your Journey
        </span>

        <h2
          className="mb-5 text-3xl font-bold text-white md:text-4xl lg:text-5xl leading-tight"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Your Dream Home is <span className="text-brand-gold">One Step Away</span>
        </h2>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70 leading-relaxed">
          Whether you&apos;re looking to buy a family apartment, a luxury villa, or sell your
          independent house — we connect families with the perfect properties across Hyderabad.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/properties">
            <Button
              size="lg"
              className="bg-brand-gold text-brand-navy font-bold hover:bg-brand-gold-dark border-0 px-10 py-4 text-base shadow-gold rounded-xl"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Browse All Properties
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="ghost"
              size="lg"
              className="border border-white/30 text-white hover:bg-white/10 px-10 py-4 text-base rounded-xl backdrop-blur-sm"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              Talk to an Expert
            </Button>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          {['RERA Registered', 'Bank Approved', '10+ Years Trusted', 'No Hidden Charges'].map(
            (badge) => (
              <div key={badge} className="flex items-center gap-2 text-sm text-white/60">
                <svg
                  className="h-4 w-4 text-brand-green flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
