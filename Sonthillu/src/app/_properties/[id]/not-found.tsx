import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function PropertyNotFound() {
  return (
    <div className="container-page py-12 lg:py-24">
      <EmptyState
        title="Property Not Found"
        description="This property may no longer be available or the link may be incorrect."
        action={
          <Link href="/properties">
            <Button variant="primary">Browse Available Properties</Button>
          </Link>
        }
      />
    </div>
  );
}
