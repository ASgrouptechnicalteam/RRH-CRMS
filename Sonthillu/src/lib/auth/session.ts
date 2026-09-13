import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Customer, CustomerAuthProvider, SessionWithCustomer } from '@/types/auth';
import { SESSION_COOKIE_NAME } from './brand';
import { isSessionActive } from './session-core';

let configuredProvider: CustomerAuthProvider | null = null;

export function getAuthProvider(): CustomerAuthProvider {
  if (configuredProvider) return configuredProvider;

  const authProvider = process.env.AUTH_PROVIDER || 'db';

  if (authProvider === 'mock') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SECURITY VIOLATION: MockCustomerAuthProvider is prohibited in production configuration. Set AUTH_PROVIDER=db.'
      );
    }
    const { MockCustomerAuthProvider } = require('./mock-provider');
    configuredProvider = new MockCustomerAuthProvider();
    return configuredProvider!;
  }

  if (authProvider === 'crm') {
    const { CrmCustomerAuthProvider } = require('./crm-provider');
    configuredProvider = new CrmCustomerAuthProvider();
    return configuredProvider!;
  }

  if (authProvider === 'api') {
    const { ApiCustomerAuthProvider } = require('./api-provider');
    configuredProvider = new ApiCustomerAuthProvider();
    return configuredProvider!;
  }

  const { DbCustomerAuthProvider } = require('./db-provider');
  configuredProvider = new DbCustomerAuthProvider();
  return configuredProvider!;
}

export async function verifySession(): Promise<SessionWithCustomer | null> {
  const provider = getAuthProvider();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await provider.getSessionByToken(token);
  if (!session) {
    return null;
  }

  if (!isSessionActive(session, Date.now())) {
    await cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session;
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  const session = await verifySession();
  return session?.customer ?? null;
}

export async function requireCustomer(currentPath?: string): Promise<Customer> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    const redirectUrl = currentPath
      ? `/login?redirect=${encodeURIComponent(currentPath)}`
      : '/login';
    redirect(redirectUrl);
  }
  return customer;
}

export async function requireVerifiedEmail(currentPath?: string): Promise<Customer> {
  const customer = await requireCustomer(currentPath);
  if (!customer.emailVerified) {
    redirect('/verify-email');
  }
  return customer;
}

export async function requireSeller(currentPath?: string): Promise<Customer> {
  const customer = await requireVerifiedEmail(currentPath);

  if (customer.sellerStatus === 'SUSPENDED') {
    redirect('/seller/status');
  }

  if (customer.sellerStatus === 'PENDING_VERIFICATION') {
    redirect('/seller/status');
  }

  if (customer.sellerStatus === 'NONE') {
    redirect('/seller/onboard');
  }

  // If we get here, sellerStatus is VERIFIED
  return customer;
}

export async function logout(): Promise<void> {
  const provider = getAuthProvider();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token && provider) {
    const session = await provider.getSessionByToken(token);
    if (session) {
      await provider.revokeSession(session.id);
    }
  }

  await cookieStore.delete(SESSION_COOKIE_NAME);
}
