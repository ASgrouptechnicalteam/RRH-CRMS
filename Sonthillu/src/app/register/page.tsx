import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import { Card, CardBody } from '@/components/ui/Card';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create your Sonthillu Constructions account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return (
    <div className="container-narrow section-spacing">
      <Card className="mx-auto max-w-md" hover={false}>
        <CardBody className="p-8">
          <h1 className="mb-2 text-center font-display text-2xl font-bold text-brand-navy">
            Create Account
          </h1>
          <p className="mb-6 text-center text-sm text-text-muted">
            Create your {BRAND.shortName} Constructions account.
          </p>

          <Suspense fallback={<div className="h-64 animate-pulse bg-surface-muted"></div>}>
            <RegisterForm />
          </Suspense>

          <div className="mt-6 border-t border-border pt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand-navy hover:underline">
              Login
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
