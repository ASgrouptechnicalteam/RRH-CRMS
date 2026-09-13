import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { PublicProject, PublicProperty } from '@/types/search';

const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  UNDER_CONSTRUCTION: 'Under Construction',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const PROJECT_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  PLANNING: 'warning',
  UNDER_CONSTRUCTION: 'default',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

function getStatusClass(variant: string) {
  switch (variant) {
    case 'success':
      return 'bg-brand-sage/10 text-brand-sage';
    case 'warning':
      return 'bg-amber-100 text-amber-700';
    case 'error':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-brand-navy/10 text-brand-navy';
  }
}

interface ProjectCardProps {
  project: PublicProject & { properties?: PublicProperty[] };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status;
  const statusVariant = PROJECT_STATUS_VARIANTS[project.status] || 'default';

  // Derive price range from inventory properties
  const priceRange =
    project.properties && project.properties.length > 0
      ? project.properties.reduce(
          (acc: { min: number; max: number }, p: PublicProperty) => {
            acc.min = Math.min(acc.min, p.price);
            acc.max = Math.max(acc.max, p.price);
            return acc;
          },
          { min: Infinity, max: 0 }
        )
      : null;

  const formatPriceRange = (min: number, max: number) => {
    if (min === Infinity || max === 0) return 'Price on request';
    if (min === max) return formatPrice(min);
    return `${formatPrice(min)} – ${formatPrice(max)}`;
  };

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

  // Derive configurations from properties
  const configurations =
    project.properties && project.properties.length > 0
      ? Array.from(
          new Set<string>(
            project.properties.map((p: PublicProperty) => {
              if (p.bedrooms) return `${p.bedrooms} BHK`;
              if (p.propertyType === 'VILLA') return 'Villa';
              if (p.propertyType === 'INDEPENDENT_HOUSE') return 'Independent House';
              return p.propertyType;
            })
          )
        ).filter(Boolean)
      : [];

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="group h-full overflow-hidden bg-white">
        <div className="relative aspect-[4/3] overflow-hidden bg-border">
          {project.primaryImage ? (
            <Image
              src={project.primaryImage}
              alt={project.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-navy/5 to-brand-sage/5">
              <svg
                className="h-16 w-16 text-brand-navy/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge
              variant={
                statusVariant === 'success'
                  ? 'success'
                  : statusVariant === 'warning'
                    ? 'warning'
                    : 'default'
              }
            >
              {statusLabel}
            </Badge>
            {project.inventorySummary?.available && project.inventorySummary.available > 0 && (
              <Badge variant="success" className="bg-brand-sage/90 text-white">
                {project.inventorySummary.available} Available
              </Badge>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3
              className="text-lg font-semibold text-brand-navy line-clamp-1 group-hover:text-brand-gold transition-colors"
              style={{ fontFamily: 'var(--font-family-display)' }}
            >
              {project.name}
            </h3>
            <p className="mt-1 text-sm text-text-secondary flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5 text-text-muted flex-shrink-0"
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

          {priceRange && (
            <p className="text-xl font-bold text-brand-navy">
              {formatPriceRange(priceRange.min, priceRange.max)}
            </p>
          )}

          {(configurations.length > 0 || project.inventorySummary) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              {configurations.slice(0, 3).map((config, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-surface-muted border border-border rounded-full text-text-primary"
                >
                  {config}
                </span>
              ))}
              {configurations.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-surface-muted border border-border rounded-full text-text-muted">
                  +{configurations.length - 3} more
                </span>
              )}
              {project.inventorySummary && (
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-text-muted">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  {project.inventorySummary.total} units
                </span>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {project.projectCode || `PRJ-${project.id}`}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-gold group-hover:gap-2 transition-all">
              View Project
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
