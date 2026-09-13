import Link from 'next/link';

const BUDGETS = [
  {
    label: 'Under ₹1 Cr',
    description: 'Affordable & Premium Options',
    href: '/properties?maxBudget=10000000',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    label: '₹1 Cr – ₹2 Cr',
    description: 'Luxury Apartments & Villas',
    href: '/properties?minBudget=10000000&maxBudget=20000000',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
        />
      </svg>
    ),
  },
  {
    label: 'Above ₹2 Cr',
    description: 'Ultra Luxury & Independent Homes',
    href: '/properties?minBudget=20000000',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    ),
  },
] as const;

export function BudgetPresets() {
  return (
    <section className="section-spacing bg-surface-muted">
      <div className="container-page">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">Browse by Budget</h2>
          <p className="mt-3 text-lg text-text-secondary">
            Discover homes that perfectly match your financial goals
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {BUDGETS.map((budget) => (
            <Link
              key={budget.href}
              href={budget.href}
              className="group rounded-xl border border-border bg-white p-6 transition-all duration-200 hover:border-brand-navy/30 hover:shadow-md"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-brand-navy">
                {budget.icon}
              </div>
              <h3 className="mb-1 text-base font-semibold text-text-primary">{budget.label}</h3>
              <p className="text-sm text-text-secondary">{budget.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
