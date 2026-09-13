import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Search Properties',
  description: 'Search for residential properties in Hyderabad.',
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Redirect /search to /properties with same params
  redirect('/properties');
}
