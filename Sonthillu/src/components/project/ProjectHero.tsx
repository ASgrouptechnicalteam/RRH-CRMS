import Image from 'next/image';
import { ImageGallery } from '@/components/property/ImageGallery';
import type { PublicProjectDetail } from '@/types/search';

interface ProjectHeroProps {
  project: PublicProjectDetail;
}

export function ProjectHero({ project }: ProjectHeroProps) {
  const statusLabel = getStatusLabel(project.status);
  const statusClass = getStatusClass(project.status);

  return (
    <section className="relative overflow-hidden">
      <div className="relative aspect-[16/9] md:aspect-[21/9] bg-border">
        {project.primaryImage ? (
          <Image
            src={project.primaryImage}
            alt={project.name}
            fill
            className="h-full w-full object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-navy/10 to-brand-sage/10">
            <svg
              className="h-24 w-24 text-brand-navy/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-brand-navy/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container-page">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClass}`}
                >
                  {statusLabel}
                </span>
                {project.inventorySummary?.available && project.inventorySummary.available > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-sage/90 text-white">
                    {project.inventorySummary.available} Units Available
                  </span>
                )}
              </div>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                {project.name}
              </h1>
              <p className="text-lg text-white/90 flex items-center gap-2">
                <svg
                  className="h-5 w-5 flex-shrink-0"
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
          </div>
        </div>
      </div>

      {project.images && project.images.length > 1 && (
        <div className="container-page -mt-6 md:-mt-8 mb-6 md:mb-10">
          <ImageGallery images={project.images} title={project.name} />
        </div>
      )}
    </section>
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
