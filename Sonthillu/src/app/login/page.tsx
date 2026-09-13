import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import { Card, CardBody } from '@/components/ui/Card';
import { LoginForm } from '@/components/auth/LoginForm';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your Sonthillu Constructions account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <div className="container-narrow section-spacing">
      <Card className="mx-auto max-w-md" hover={false}>
        <CardBody className="p-8">
          <h1 className="mb-2 text-center font-display text-2xl font-bold text-brand-navy">
            Login
          </h1>
          <p className="mb-6 text-center text-sm text-text-muted">
            Welcome back to {BRAND.shortName} Constructions.
          </p>

          <Suspense fallback={<div className="h-64 animate-pulse bg-surface-muted"></div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 border-t border-border pt-6 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-brand-navy hover:underline">
              Register
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
