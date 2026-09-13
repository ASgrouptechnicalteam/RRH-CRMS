'use client';

import Link from 'next/link';

import { ProjectHero } from './ProjectHero';
import { ProjectInfo } from './ProjectInfo';
import { ProjectActions } from './ProjectActions';
import { ProjectAmenities } from './ProjectAmenities';
import { ProjectInventory } from './ProjectInventory';
import { ProjectLocation } from './ProjectLocation';
import { CallNowButton } from '@/components/leads/CallNowButton';
import { SITE_CONFIG } from '@/lib/constants';
import type { PublicProjectDetail, PublicProject, PublicProperty } from '@/types/search';

interface ProjectDetailClientProps {
  project: PublicProjectDetail;
  similarProjects: PublicProject[];
}

export function ProjectDetailClient({ project, similarProjects }: ProjectDetailClientProps) {
  return (
    <div className="bg-white">
      <ProjectHero project={project} />
      <div className="container-page py-6 lg:py-8">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-8">
            <ProjectInfo project={project} />
            <ProjectActions projectId={project.id} projectName={project.name} />
            <ProjectAmenities project={project} />
            <ProjectInventory project={project} />
            <ProjectLocation project={project} />
            <SimilarProjects projects={similarProjects} currentProjectId={project.id} />
          </div>

          <div className="lg:col-span-4">
            <StickyActions project={project} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StickyActions({ project }: { project: PublicProjectDetail }) {
  // Was `window.location.href` — reads at render time, which under
  // `output: 'export'` also happens once during `next build` (no `window`
  // there) to produce the static HTML, not just in the browser.
  const shareUrl = `${SITE_CONFIG.url}/projects/${project.id}`;
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

  return (
    <div className="sticky top-24 space-y-4">
      <div className="bg-surface-muted border border-border rounded-xl p-6">
        <h3
          className="text-lg font-semibold text-brand-navy mb-4"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Price Range
        </h3>
        {priceRange && priceRange.min !== Infinity ? (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Starting From</dt>
              <dd className="font-semibold text-brand-navy">{formatPrice(priceRange.min)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Up To</dt>
              <dd className="font-semibold text-brand-navy">{formatPrice(priceRange.max)}</dd>
            </div>
            <div className="pt-3 border-t border-border flex justify-between">
              <dt className="font-medium text-text-primary">Configurations</dt>
              <dd className="font-bold text-brand-navy text-lg">
                {project.properties?.length > 0
                  ? Array.from(
                      new Set(
                        project.properties.map((p) => {
                          if (p.bedrooms) return `${p.bedrooms} BHK`;
                          if (p.propertyType === 'VILLA') return 'Villa';
                          if (p.propertyType === 'INDEPENDENT_HOUSE') return 'Independent House';
                          return p.propertyType;
                        })
                      )
                    )
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(', ')
                  : '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-text-secondary">Price on request</p>
        )}
        <p className="mt-4 text-xs text-text-muted">
          Additional charges (registration, stamp duty, GST, maintenance deposit) apply as per
          actuals.
        </p>
      </div>

      <div className="bg-brand-navy rounded-xl p-6 text-white">
        <h3
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Ready to Visit?
        </h3>
        <p className="text-brand-gold-light text-sm mb-4">
          Schedule a site visit at your convenience.
        </p>
        <CallNowButton
          surface="project_detail"
          projectId={project.id}
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-brand-gold text-brand-navy font-semibold rounded-lg hover:bg-brand-gold-dark transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          Call to Book Visit
        </CallNowButton>
      </div>

      <div className="bg-surface-muted border border-border rounded-xl p-6">
        <h3
          className="text-lg font-semibold text-brand-navy mb-4"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Share This Project
        </h3>
        <div className="flex gap-3">
          <ShareButton
            icon={
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.77,7.46H14.5v-5.28c0-1.42-.79-2.64-2-2.64c-1.09,0-2,1.02-2,2.22v5.28H7.59v5.28h2.55v11.98h4.95V17.74h3.42l0.63-5.28h-4.05v-2.81c0-1.17.55-2.03,1.74-2.03h2.79V7.46z" />
              </svg>
            }
            label="Facebook"
            url={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          />
          <ShareButton
            icon={
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              </svg>
            }
            label="Twitter"
            url={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(project.name)}`}
          />
          <ShareButton
            icon={
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            }
            label="LinkedIn"
            url={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
          />
          <ShareButton
            icon={
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            }
            label="Email"
            url={`mailto:?subject=${encodeURIComponent(project.name)}&body=${encodeURIComponent(shareUrl)}`}
          />
        </div>
      </div>
    </div>
  );
}

function ShareButton({ icon, label, url }: { icon: React.ReactNode; label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-border transition-colors"
      aria-label={`Share on ${label}`}
    >
      {icon}
    </a>
  );
}

function SimilarProjects({
  projects,
  currentProjectId,
}: {
  projects: PublicProject[];
  currentProjectId: number;
}) {
  const filteredProjects = projects.filter((p) => p.id !== currentProjectId).slice(0, 3);

  if (filteredProjects.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-semibold text-brand-navy"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Similar Projects
        </h2>
        <Link
          href="/projects"
          className="text-sm font-medium text-brand-gold hover:text-brand-gold-dark transition-colors"
        >
          View All
          <svg
            className="h-4 w-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredProjects.map((project) => (
          <SimilarProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

function SimilarProjectCard({ project }: { project: PublicProject }) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div className="bg-surface-muted border border-border rounded-xl overflow-hidden hover:border-brand-gold/50 transition-colors">
        <div className="aspect-[4/3] overflow-hidden bg-border relative">
          {project.primaryImage ? (
            <img
              src={project.primaryImage}
              alt={project.name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-navy/5 to-brand-sage/5">
              <svg
                className="h-12 w-12 text-brand-navy/20"
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
          <div className="absolute top-3 left-3 flex gap-1">
            {project.inventorySummary?.available && project.inventorySummary.available > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-brand-sage/90 text-white rounded">
                {project.inventorySummary.available} Available
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3
            className="mb-1 text-base font-semibold text-brand-navy line-clamp-1"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            {project.name}
          </h3>
          <p className="mb-2 text-sm text-text-secondary flex items-center gap-1">
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
          </p>
          <p className="text-lg font-bold text-brand-navy">
            {project.inventorySummary && project.inventorySummary.total > 0
              ? `${project.inventorySummary.total} Units`
              : 'Price on request'}
          </p>
        </div>
      </div>
    </Link>
  );
}
