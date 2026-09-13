const TESTIMONIALS = [
  {
    name: 'Rajesh Kumar',
    location: 'Banjarahills',
    propertyType: '3 BHK Apartment',
    quote:
      'The process was seamless from start to finish. Found our dream home in Gachibowli within two weeks. The team was professional and responsive throughout.',
    rating: 5,
    accent: 'navy',
  },
  {
    name: 'Priya Sharma',
    location: 'Jubilee Hills',
    propertyType: '2 BHK Villa',
    quote:
      'We were first-time buyers and nervous about the process. The guidance we received made everything clear — from search to negotiation to possession.',
    rating: 5,
    accent: 'brick',
  },
  {
    name: 'Suresh Reddy',
    location: 'HITEC City',
    propertyType: '4 BHK Independent House',
    quote:
      'After years of renting, we finally invested in our own home through Sonthillu. The property verification gave us complete confidence in our decision.',
    rating: 5,
    accent: 'green',
  },
  {
    name: 'Anjali Patel',
    location: 'Madhapur',
    propertyType: '1 BHK Apartment',
    quote:
      'As a working professional, I needed something compact and close to my office. The filter options made it easy to narrow down exactly what I wanted.',
    rating: 4,
    accent: 'gold',
  },
];

const AVATAR_COLORS: Record<string, string> = {
  navy: 'bg-brand-navy text-white',
  brick: 'bg-brand-brick text-white',
  green: 'bg-brand-green text-white',
  gold: 'bg-brand-gold text-brand-navy',
};

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-20 bg-cream-dark">
      <div className="container-page">
        <div className="mb-12 text-center">
          {/* Large opening quote mark */}
          <div className="text-6xl text-brand-gold leading-none font-serif mb-2 opacity-60">"</div>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">
            Customer Stories
          </span>
          <h2
            className="text-3xl font-bold text-brand-navy md:text-4xl"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            Families Who Found Their Home
          </h2>
          <p className="mt-3 text-lg text-text-secondary max-w-xl mx-auto">
            Real stories from real families across Hyderabad
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="group rounded-2xl border-2 border-border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-card hover:-translate-y-1 hover:border-brand-gold/30"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${i < t.rating ? 'fill-brand-gold' : 'fill-border'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-text-secondary text-sm leading-relaxed italic mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm ${AVATAR_COLORS[t.accent]}`}
                >
                  {t.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">{t.name}</p>
                  <p className="text-xs text-text-muted">
                    {t.location} · {t.propertyType}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-text-muted">
          Testimonials represent customer experiences. Individual results may vary.
        </p>
      </div>
    </section>
  );
}
