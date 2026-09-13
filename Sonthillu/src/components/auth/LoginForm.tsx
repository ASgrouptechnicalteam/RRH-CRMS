'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useWebsiteAccount } from '@/lib/auth/useWebsiteAccount';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '';
  const registered = searchParams.get('registered') === 'true';

  const { login } = useWebsiteAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setError('');
    const result = await login(email, password);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(redirectUrl && redirectUrl.startsWith('/') ? redirectUrl : '/account');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {registered && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          Registration successful. Please login.
        </div>
      )}
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <Input
        name="email"
        label="Email"
        type="email"
        placeholder="your@email.com"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        name="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
