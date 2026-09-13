'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useWebsiteAccount } from '@/lib/auth/useWebsiteAccount';

export default function AccountProfilePage() {
  const router = useRouter();
  const { account, isLoading, isAuthenticated } = useWebsiteAccount();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !account) {
    return <div className="container-narrow section-spacing text-sm text-text-muted">Loading…</div>;
  }

  return (
    <div className="container-narrow section-spacing">
      <h1 className="mb-6 font-display text-2xl font-bold text-brand-navy">Account Profile</h1>
      <Card hover={false}>
        <CardHeader>
          <h2 className="font-semibold text-brand-navy">Your details</h2>
        </CardHeader>
        <CardBody>
          <form className="space-y-4">
            <Input
              label="Name"
              type="text"
              defaultValue={account.full_name}
              placeholder="Your name"
            />
            <Input
              label="Email"
              type="email"
              defaultValue={account.email}
              placeholder="your@email.com"
            />
            <Input
              label="Phone"
              type="tel"
              defaultValue={account.phone ?? ''}
              placeholder="+91 98765 43210"
            />
            <Button type="submit" variant="primary" size="md" disabled>
              Save Changes
            </Button>
          </form>
          <p className="mt-4 text-xs text-text-muted">Profile editing is coming soon.</p>
        </CardBody>
        <CardFooter>
          <Button variant="ghost" size="sm">
            <Link href="/account" className="flex items-center gap-2">
              Back to Account
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
