'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useWebsiteAccount } from '@/lib/auth/useWebsiteAccount';

export function RegisterForm() {
  const router = useRouter();
  const { register } = useWebsiteAccount();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsPending(true);
    setError('');
    const full_name = [firstName, lastName].filter(Boolean).join(' ').trim();
    const result = await register({ full_name, email, phone: phone || undefined, password });
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push('/account');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="firstName"
          label="First Name"
          type="text"
          placeholder="John"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          name="lastName"
          label="Last Name"
          type="text"
          placeholder="Doe"
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <Input
        name="phone"
        label="Phone Number"
        type="tel"
        placeholder="+91 98765 43210"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
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
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <div className="text-xs text-text-muted">
        By registering, you agree to our Terms of Service and Privacy Policy.
      </div>

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={isPending}>
        {isPending ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
}
