import type { Metadata } from 'next';
import { ShortlistView } from '@/components/customer/ShortlistView';

export const metadata: Metadata = {
  title: 'Shortlisted Properties',
  description: 'View your saved and shortlisted properties.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ShortlistPage() {
  return <ShortlistView />;
}
