'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service securely without leaking to user
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-semibold text-text-primary">Something went wrong</h2>
        <p className="mb-8 text-text-muted">
          We encountered an unexpected error. Our team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="ghost">Go Back Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
