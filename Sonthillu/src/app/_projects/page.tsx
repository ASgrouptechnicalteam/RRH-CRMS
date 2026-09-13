import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectCard } from '@/components/project/ProjectCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getPublishedProjects } from '@/lib/crm';
import { BRAND, SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Residential Projects — ${BRAND.shortName} Constructions`,
  description: `Explore premium residential projects by ${BRAND.name} in Hyderabad. Discover apartments, villas, and independent homes in thoughtfully planned communities.`,
  alternates: {
    canonical: '/projects',
  },
  openGraph: {
    title: `Residential Projects — ${BRAND.shortName} Constructions`,
    description: `Explore premium residential projects in Hyderabad. Apartments, villas, and independent houses from a trusted developer.`,
    url: `${SITE_CONFIG.url}/projects`,
    siteName: BRAND.name,
    type: 'website',
    locale: 'en_IN',
  },
};

function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-border" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-1/4 animate-pulse rounded bg-border" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-border" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-border" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-border" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-20 animate-pulse rounded bg-border" />
          <div className="h-6 w-20 animate-pulse rounded bg-border" />
        </div>
      </div>
    </div>
  );
}

async function ProjectsContent() {
  const projects = await getPublishedProjects();

  if (projects.length === 0) {
    return (
      <div className="py-6 lg:py-8 text-center">
        <SectionHeading
          title="Our Projects"
          subtitle="Thoughtfully designed residential communities in prime Hyderabad locations"
          align="center"
        />
        <div className="mt-12 text-center py-16">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-text-muted"
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
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No projects available yet
          </h3>
          <p className="text-text-secondary">
            We're developing exciting new communities. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 lg:py-8">
      <SectionHeading
        title="Our Projects"
        subtitle="Thoughtfully designed residential communities in prime Hyderabad locations"
        align="center"
      />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div className="bg-surface-muted min-h-screen">
      <div className="container-page">
        <Suspense
          fallback={
            <div className="py-6 lg:py-8">
              <ProjectCardSkeleton />
            </div>
          }
        >
          <ProjectsContent />
        </Suspense>
      </div>
    </div>
  );
}
