import { BRAND } from '@/lib/constants';

export function CompanyProfileSection() {
  return (
    <section className="section-spacing bg-surface-muted">
      <div className="container-page">
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary">About Sonthillu Constructions</h2>
              <p className="mt-2 text-text-secondary leading-relaxed">
                Sonthillu Constructions is a premier real estate platform based in Hyderabad,
                Telangana, India. We specialize in connecting homebuyers with quality residential
                properties across the city&apos;s most sought-after neighborhoods.
              </p>
              <p className="mt-2 text-text-secondary leading-relaxed">
                With a focus on transparency, quality, and customer satisfaction, we have built a
                reputation for delivering exceptional residential experiences. Our portfolio spans
                apartments, villas, and independent houses across diverse budgets and lifestyles.
              </p>
            </div>
            <div className="lg:w-80">
              <div className="rounded-lg bg-brand-navy p-5 text-white">
                <h3 className="text-sm font-semibold uppercase tracking-wider">Contact</h3>
                <p className="mt-2 font-semibold">{BRAND.phone}</p>
                <p className="mt-1 text-white/80">{BRAND.email}</p>
                <p className="mt-1 text-white/80">Hyderabad, Telangana, India</p>
                <div className="mt-4 flex gap-3">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
