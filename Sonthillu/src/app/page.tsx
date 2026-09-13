import type { Metadata } from 'next';
import { BRAND, SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${BRAND.shortName} — Coming Soon`,
  description: `We are building something amazing for you. Stay tuned for premium residential properties in Hyderabad by ${BRAND.name}.`,
};

export default function ComingSoonPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-900 font-sans text-slate-100">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
          alt="Luxury Home"
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
      </div>

      {/* Animated Glowing Orbs */}
      <div className="absolute top-1/3 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/20 blur-[100px]" />
      <div className="absolute bottom-1/3 right-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-amber-500/20 blur-[100px]" />

      {/* Main Content Container */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
        {/* Brand Badge */}
        <div className="mb-8 inline-flex animate-bounce items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          <span className="tracking-wide text-orange-100">{BRAND.name}</span>
        </div>

        {/* Heading */}
        <h1 className="mb-6 max-w-4xl bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl md:text-7xl">
          Something Extraordinary <br className="hidden sm:block" /> is Coming Soon.
        </h1>

        {/* Description */}
        <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-400 sm:text-xl">
          We are crafting a new digital experience to help you find your dream home in Hyderabad.
          Premium residential properties, unparalleled trust, and modern living await.
        </p>

        {/* Contact / CTA Area */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-4">
          <a
            href={`mailto:${BRAND.email}`}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-orange-500 px-8 py-4 font-semibold text-white transition-all hover:scale-105 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <span className="relative flex items-center gap-2">
              Contact Us
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-1"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </a>
          <a
            href={`tel:${BRAND.phone}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-800/50 px-8 py-4 font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-700 hover:text-white"
          >
            Call {BRAND.phone}
          </a>
        </div>
      </main>

      {/* Footer / Copyright */}
      <footer className="absolute bottom-6 w-full text-center text-sm text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
