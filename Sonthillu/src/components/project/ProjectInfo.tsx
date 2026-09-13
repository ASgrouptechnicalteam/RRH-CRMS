import type { PublicProjectDetail } from '@/types/search';

interface ProjectInfoProps {
  project: PublicProjectDetail;
}

export function ProjectInfo({ project }: ProjectInfoProps) {
  const configs =
    project.properties?.length > 0
      ? Array.from(
          new Set(
            project.properties.map((p) => {
              if (p.bedrooms) return `${p.bedrooms} BHK`;
              if (p.propertyType === 'VILLA') return 'Villa';
              if (p.propertyType === 'INDEPENDENT_HOUSE') return 'Independent House';
              return p.propertyType;
            })
          )
        ).filter(Boolean)
      : [];

  const priceRange =
    project.properties?.length > 0
      ? project.properties.reduce(
          (acc, p) => {
            acc.min = Math.min(acc.min, p.price);
            acc.max = Math.max(acc.max, p.price);
            return acc;
          },
          { min: Infinity, max: 0 }
        )
      : null;

  function formatPrice(price: number): string {
    if (price >= 10000000) {
      const cr = price / 10000000;
      return cr % 1 === 0 ? `₹${cr} Cr` : `₹${cr.toFixed(2)} Cr`;
    }
    if (price >= 100000) {
      const l = price / 100000;
      return l % 1 === 0 ? `₹${l} L` : `₹${l.toFixed(2)} L`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  }

  const specs = [
    { label: 'Project Status', value: getStatusLabel(project.status) },
    { label: 'Total Area', value: project.totalArea || '—' },
    ...(project.launchDate
      ? [
          {
            label: 'Launch Date',
            value: new Date(project.launchDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
            }),
          },
        ]
      : []),
    { label: 'Configurations', value: configs.length > 0 ? configs.join(', ') : '—' },
    ...(priceRange && priceRange.min !== Infinity
      ? [
          {
            label: 'Price Range',
            value:
              priceRange.min === priceRange.max
                ? formatPrice(priceRange.min)
                : `${formatPrice(priceRange.min)} – ${formatPrice(priceRange.max)}`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-brand-gold mb-1">
            Residential Project
          </p>
          <h2
            className="text-2xl md:text-3xl font-bold text-brand-navy"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            {project.name}
          </h2>
          <p className="mt-2 text-text-secondary flex items-center gap-2">
            <svg
              className="h-5 w-5 text-text-muted flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {project.location}
          </p>
        </div>
        <span
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${getStatusClass(project.status)}`}
        >
          {getStatusLabel(project.status)}
        </span>
      </div>

      {project.inventorySummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-muted rounded-xl border border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-navy">{project.inventorySummary.total}</p>
            <p className="text-xs text-text-muted mt-1">Total Units</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-sage">
              {project.inventorySummary.available}
            </p>
            <p className="text-xs text-text-muted mt-1">Available</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{project.inventorySummary.reserved}</p>
            <p className="text-xs text-text-muted mt-1">Reserved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{project.inventorySummary.sold}</p>
            <p className="text-xs text-text-muted mt-1">Sold</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-muted rounded-xl border border-border">
        {specs.map((spec, index) => (
          <div key={index} className="flex flex-col">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
              {spec.label}
            </p>
            <p className="text-base font-medium text-text-primary">{spec.value}</p>
          </div>
        ))}
      </div>

      {project.projectCode && (
        <p className="text-xs text-text-muted">
          Project ID: <span className="font-mono text-text-secondary">{project.projectCode}</span>
        </p>
      )}
    </div>
  );
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PLANNING':
      return 'Planning';
    case 'UNDER_CONSTRUCTION':
      return 'Under Construction';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'PLANNING':
      return 'bg-amber-100 text-amber-700';
    case 'UNDER_CONSTRUCTION':
      return 'bg-brand-navy/10 text-brand-navy';
    case 'COMPLETED':
      return 'bg-brand-sage/10 text-brand-sage';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-brand-navy/10 text-brand-navy';
  }
}
