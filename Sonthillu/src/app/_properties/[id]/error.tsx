'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function PropertyDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page py-12 lg:py-24">
      <ErrorState
        title="Unable to load property details"
        message={
          error.message || 'We encountered an error while trying to fetch the property details.'
        }
        onRetry={reset}
      />
    </div>
  );
}
