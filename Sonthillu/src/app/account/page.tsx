'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWebsiteAccount } from '@/lib/auth/useWebsiteAccount';

// Was an async Server Component using requireCustomer() (cookie session,
// Sonthillu's own retiring local Customer DB) — replaced with the
// WebsiteAccount system, read client-side from localStorage.
export default function AccountPage() {
  const router = useRouter();
  const { account, isLoading, isAuthenticated, logout } = useWebsiteAccount();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !account) {
    return <div className="container-narrow section-spacing text-sm text-text-muted">Loading…</div>;
  }

  return (
    <div className="container-narrow section-spacing">
      <h1 className="mb-6 font-display text-2xl font-bold text-brand-navy">My Account</h1>
      <Card hover={false}>
        <CardHeader className="flex justify-between items-center">
          <h2 className="font-semibold text-brand-navy">{account.full_name}</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              logout();
              router.push('/');
            }}
          >
            Logout
          </Button>
        </CardHeader>
        <CardBody className="space-y-4 text-sm text-text-secondary">
          <div>
            <span className="font-medium">Email:</span> {account.email}
          </div>
          {account.phone && (
            <div>
              <span className="font-medium">Phone:</span> {account.phone}
            </div>
          )}
        </CardBody>
        <CardFooter>
          <Button variant="ghost" size="sm">
            <a href="/account/profile">View Profile</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
