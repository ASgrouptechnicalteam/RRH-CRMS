import Link from 'next/link';
import type { PublicPropertyDetail } from '@/types/search';

interface ProjectContextProps {
  property: PublicPropertyDetail;
}

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

export function ProjectContext({ property }: ProjectContextProps) {
  const project = property.project;

  if (!project) {
    return null;
  }

  const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status;
  const statusVariant = PROJECT_STATUS_VARIANTS[project.status] || 'default';

  const getStatusClass = (variant: string) => {
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
  };

  return (
    <section className="space-y-4">
      <h2
        className="text-xl font-semibold text-brand-navy"
        style={{ fontFamily: 'var(--font-family-display)' }}
      >
        Part of Project
      </h2>
      <div className="bg-surface-muted border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium uppercase tracking-wider text-brand-gold mb-1">
              Project
            </p>
            <h3
              className="text-xl font-semibold text-brand-navy mb-2"
              style={{ fontFamily: 'var(--font-family-display)' }}
            >
              {project.name}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(statusVariant)}`}
              >
                {statusLabel}
              </span>
              <span className="text-sm text-text-secondary flex items-center gap-1">
                <svg
                  className="h-3.5 w-3.5 text-text-muted"
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
              </span>
            </div>
          </div>
          <Link
            href={`/projects/${project.projectCode}`}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-brand-gold rounded-lg text-sm font-medium text-brand-gold hover:bg-brand-gold/5 transition-colors"
          >
            View Project
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
