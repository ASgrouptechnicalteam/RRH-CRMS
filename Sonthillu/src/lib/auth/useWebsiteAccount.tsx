'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CRM_CONFIG } from '@/lib/constants';

// Client-side replacement for the old cookie-session `@/lib/auth/session`
// module, which depended on `cookies()`/`next/headers` and is incompatible
// with `output: 'export'` (consolidation plan, Decision 5). Talks directly
// to apps/api's `WebsiteAccount` endpoints (`/public/sonthillu/account/*`)
// — a deliberately separate, lower-trust account system from the CRM's real
// `Customer` model (see the plan's Decision 1 note on keeping these two
// token types apart). Token lives in localStorage since a static export has
// no server to hold a cookie session for.

export interface WebsiteAccount {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
}

interface WebsiteAccountContextValue {
  account: WebsiteAccount | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (data: {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
  }) => Promise<{ error?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const TOKEN_STORAGE_KEY = 'sonthillu_website_token';

const WebsiteAccountContext = createContext<WebsiteAccountContextValue | null>(null);

function getCrmUrl() {
  return process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'http://localhost:3000/api/v1';
}
function getCrmApiKey() {
  return process.env.NEXT_PUBLIC_CRM_API_KEY || '';
}
function accountUrl(path: string) {
  return `${getCrmUrl()}/public/${CRM_CONFIG.brandParameter}/account${path}`;
}

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage unavailable (private browsing, quota) — session just won't persist.
  }
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export function WebsiteAccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<WebsiteAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async (currentToken: string): Promise<WebsiteAccount | null> => {
    try {
      const res = await fetch(accountUrl('/me'), {
        headers: {
          'x-api-key': getCrmApiKey(),
          Authorization: `Bearer ${currentToken}`,
        },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { account: WebsiteAccount };
      return data.account;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const stored = readStoredToken();
    if (!stored) {
      setIsLoading(false);
      return;
    }
    setToken(stored);
    fetchMe(stored).then((resolved) => {
      if (resolved) {
        setAccount(resolved);
      } else {
        // Token expired/invalid — drop it rather than keep retrying.
        writeStoredToken(null);
        setToken(null);
      }
      setIsLoading(false);
    });
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(accountUrl('/login'), {
        method: 'POST',
        headers: {
          'x-api-key': getCrmApiKey(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      });
      if (!res.ok) {
        return { error: await parseErrorMessage(res, 'Invalid email or password') };
      }
      const data = (await res.json()) as { token: string; account: WebsiteAccount };
      writeStoredToken(data.token);
      setToken(data.token);
      setAccount(data.account);
      return {};
    } catch {
      return { error: 'We could not reach our team right now. Please try again shortly.' };
    }
  }, []);

  const register = useCallback(
    async (data: { full_name: string; email: string; phone?: string; password: string }) => {
      try {
        const res = await fetch(accountUrl('/register'), {
          method: 'POST',
          headers: {
            'x-api-key': getCrmApiKey(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          cache: 'no-store',
        });
        if (!res.ok) {
          return { error: await parseErrorMessage(res, 'Registration failed') };
        }
        const body = (await res.json()) as { token: string; account: WebsiteAccount };
        writeStoredToken(body.token);
        setToken(body.token);
        setAccount(body.account);
        return {};
      } catch {
        return { error: 'We could not reach our team right now. Please try again shortly.' };
      }
    },
    []
  );

  const logout = useCallback(() => {
    writeStoredToken(null);
    setToken(null);
    setAccount(null);
  }, []);

  const refresh = useCallback(async () => {
    const current = readStoredToken();
    if (!current) {
      setAccount(null);
      return;
    }
    const resolved = await fetchMe(current);
    setAccount(resolved);
  }, [fetchMe]);

  const value = useMemo<WebsiteAccountContextValue>(
    () => ({
      account,
      token,
      isLoading,
      isAuthenticated: account !== null,
      login,
      register,
      logout,
      refresh,
    }),
    [account, token, isLoading, login, register, logout, refresh]
  );

  return <WebsiteAccountContext.Provider value={value}>{children}</WebsiteAccountContext.Provider>;
}

/**
 * Standalone lookup for callers outside the React tree (e.g. `actions/leads.ts`,
 * which runs as a plain async function, not a component) that just need to
 * know "is there a logged-in website account right now, and who are they" —
 * without needing the full context/hook machinery.
 */
export async function fetchWebsiteAccountFromStorage(): Promise<WebsiteAccount | null> {
  const token = readStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(accountUrl('/me'), {
      headers: {
        'x-api-key': getCrmApiKey(),
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { account: WebsiteAccount };
    return data.account;
  } catch {
    return null;
  }
}

export function useWebsiteAccount(): WebsiteAccountContextValue {
  const context = useContext(WebsiteAccountContext);
  if (!context) {
    throw new Error('useWebsiteAccount must be used within WebsiteAccountProvider');
  }
  return context;
}
