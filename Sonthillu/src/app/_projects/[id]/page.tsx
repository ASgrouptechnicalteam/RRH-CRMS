import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjectDetailById, getPublishedProjects } from '@/lib/crm';
import { BRAND, SITE_CONFIG } from '@/lib/constants';
import { ProjectDetailClient } from '@/components/project/ProjectDetailClient';
import type { PublicProjectDetail, PublicProject } from '@/types/search';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectDetailById(Number(id));

  if (!project) {
    return {
      title: 'Project Not Found',
      robots: 'noindex, nofollow',
    };
  }

  const title = `${project.name} — ${BRAND.shortName} Constructions`;
  const description = project.description
    ? project.description.slice(0, 160)
    : `Explore ${project.name} in ${project.location}. ${project.inventorySummary?.available || 0} units available. ${project.status === 'COMPLETED' ? 'Ready to move.' : 'Under construction.'}`;

  const canonicalUrl = `${SITE_CONFIG.url}/projects/${project.id}`;

  const images = project.images
    .filter((img) => img.url)
    .slice(0, 3)
    .map((img) => img.url);

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

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: BRAND.name,
      type: 'website',
      locale: 'en_IN',
      images:
        images.length > 0 ? images.map((url) => ({ url, width: 1200, height: 900 })) : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.length > 0 ? images[0] : undefined,
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Residence',
        name: project.name,
        description: project.description || `Residential project in ${project.location}`,
        url: canonicalUrl,
        image: images,
        address: {
          '@type': 'PostalAddress',
          addressLocality: project.location.split(',')[0] || 'Hyderabad',
          addressRegion: 'Telangana',
          addressCountry: 'IN',
        },
        ...(priceRange &&
          priceRange.min !== Infinity && {
            offers: {
              '@type': 'Offer',
              price: priceRange.min,
              priceCurrency: 'INR',
              priceSpecification: {
                '@type': 'PriceSpecification',
                minPrice: priceRange.min,
                maxPrice: priceRange.max,
                priceCurrency: 'INR',
              },
            },
          }),
      }),
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const projectId = Number(id);

  if (isNaN(projectId)) {
    notFound();
  }

  const [project, allProjects] = await Promise.all([
    getProjectDetailById(projectId),
    getPublishedProjects(),
  ]);

  if (!project) {
    notFound();
  }

  const similarProjects = allProjects.filter((p) => p.id !== projectId).slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Residence',
            name: project.name,
            description: project.description || `Residential project in ${project.location}`,
            url: `${SITE_CONFIG.url}/projects/${project.id}`,
            image: project.images
              .filter((img) => img.url)
              .slice(0, 3)
              .map((img) => img.url),
            address: {
              '@type': 'PostalAddress',
              addressLocality: project.location.split(',')[0] || 'Hyderabad',
              addressRegion: 'Telangana',
              addressCountry: 'IN',
            },
          }),
        }}
      />
      <ProjectDetailClient project={project} similarProjects={similarProjects} />
    </>
  );
}

// Static export needs a pre-rendered page per published project at build
// time — see the matching comment on properties/[id]/page.tsx. Projects are
// a much smaller list than properties (tens, not hundreds), so no pagination
// loop is needed; getPublishedProjects() already returns everything.
export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  if (projects.length === 0) return [{ id: '__none__' }];
  return projects.map((p) => ({ id: String(p.id) }));
}
