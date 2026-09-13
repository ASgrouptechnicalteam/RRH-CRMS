import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-text-secondary">Page Not Found</h2>
        <p className="mb-8 text-text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="primary">Go Back Home</Button>
        </Link>
      </div>
    </div>
  );
}
