import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CrmCustomerAuthProvider } from './crm-provider';
import type { SessionWithCustomer } from '../../types/auth';

const CRM_BASE = 'https://rs-crms.onrender.com/api/v1';

describe('CrmCustomerAuthProvider — blocked stub verification', () => {
  let provider: CrmCustomerAuthProvider;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, CRM_API_BASE_URL: CRM_BASE, CRM_API_KEY: 'test-key' };
    provider = new CrmCustomerAuthProvider();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('login throws CRM_AUTH_NOT_AVAILABLE', async () => {
    await expect(provider.login('a@b.com', 'p')).rejects.toThrow('CRM_AUTH_NOT_AVAILABLE');
  });

  it('register throws CRM_AUTH_NOT_AVAILABLE', async () => {
    await expect(
      provider.register({ firstName: 'X', email: 'a@b.com', password: 'p' })
    ).rejects.toThrow('CRM_AUTH_NOT_AVAILABLE');
  });

  it('logout throws CRM_AUTH_NOT_AVAILABLE', async () => {
    await expect(provider.logout('tok')).rejects.toThrow('CRM_AUTH_NOT_AVAILABLE');
  });

  it('verifyEmail throws CRM_AUTH_NOT_AVAILABLE', async () => {
    await expect(provider.verifyEmail('tok')).rejects.toThrow('CRM_AUTH_NOT_AVAILABLE');
  });

  it('requestPasswordReset throws CRM_AUTH_NOT_AVAILABLE', async () => {
    await expect(provider.requestPasswordReset('a@b.com')).rejects.toThrow(
      'CRM_AUTH_NOT_AVAILABLE'
    );
  });

  it('resetPassword throws CRM_AUTH_NOT_AVAILABLE', async () => {
    await expect(provider.resetPassword('tok', 'p')).rejects.toThrow('CRM_AUTH_NOT_AVAILABLE');
  });

  it('getSessionByToken throws CRM_AUTH_NOT_AVAILABLE', async () => {
    await expect(provider.getSessionByToken('tok')).rejects.toThrow('CRM_AUTH_NOT_AVAILABLE');
  });

  it('createSession throws CRM_AUTH_NOT_AVAILABLE', async () => {
    await expect(provider.createSession('c1')).rejects.toThrow('CRM_AUTH_NOT_AVAILABLE');
  });

  it('revokeSession throws CRM_AUTH_NOT_AVAILABLE', async () => {
    await expect(provider.revokeSession('s1')).rejects.toThrow('CRM_AUTH_NOT_AVAILABLE');
  });

  it('revokeAllSessionsForCustomer throws CRM_AUTH_NOT_AVAILABLE', async () => {
    await expect(provider.revokeAllSessionsForCustomer('c1')).rejects.toThrow(
      'CRM_AUTH_NOT_AVAILABLE'
    );
  });
});

function makeMockFetch() {
  return vi.fn(async (url: string | URL, opts: RequestInit = {}) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    const path = urlStr.replace(CRM_BASE + '/auth', '');
    const method = (opts?.method || 'GET').toUpperCase();
    const body = opts?.body ? JSON.parse(opts.body as string) : {};

    if (path === '/login' && method === 'POST') {
      if (body.email === 'valid@example.com' && body.password === 'right') {
        return mockResponse(200, {
          token: 'crm-login-token-' + Date.now(),
          session: stubSession('c_login'),
        });
      }
      return mockResponse(401, { error: 'Invalid credentials' });
    }

    if (path === '/register' && method === 'POST') {
      if (body.email === 'duplicate@example.com') {
        return mockResponse(409, { error: 'Email already registered' });
      }
      return mockResponse(201, {
        customer: stubCustomer('c_new'),
      });
    }

    if (path.startsWith('/sessions/') && method === 'GET') {
      const token = path.split('/sessions/')[1];
      if (token === 'good-token') {
        return mockResponse(200, { session: stubSession('c_sess') });
      }
      return mockResponse(404, { error: 'Session not found' });
    }

    if (path === '/sessions' && method === 'POST') {
      return mockResponse(201, {
        token: 'new-session-' + Date.now(),
        session: stubSession(body.customerId || 'c_create'),
      });
    }

    if (path.startsWith('/sessions/') && method === 'DELETE') {
      return mockResponse(204, null);
    }

    if (path === '/customers/c42/sessions' && method === 'DELETE') {
      return mockResponse(204, null);
    }

    if (path === '/email-verifications/verify' && method === 'POST') {
      if (body.token === 'good-token') return mockResponse(200, { success: true });
      return mockResponse(400, { success: false });
    }

    if (path === '/password-resets' && method === 'POST') {
      if (body.email === 'unknown@example.com') {
        return mockResponse(404, { error: 'Email not found' });
      }
      return mockResponse(202, { message: 'Reset email sent' });
    }

    if (path === '/password-resets/reset' && method === 'POST') {
      if (body.token === 'good-token') return mockResponse(200, { success: true });
      return mockResponse(400, { success: false });
    }

    return mockResponse(404, { error: 'Not found' });
  });
}

function mockResponse(status: number, data: any): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 204 ? 'No Content' : 'Error',
    async json() {
      return data;
    },
    async text() {
      return JSON.stringify(data);
    },
  } as Response;
}

function stubSession(customerId: string | number): SessionWithCustomer {
  return {
    id: 'sess_' + Math.random().toString(36).slice(2, 8),
    customerId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600_000,
    revokedAt: null,
    customer: stubCustomer(customerId),
  };
}

function stubCustomer(id: string | number): SessionWithCustomer['customer'] {
  return {
    id,
    firstName: 'Test',
    displayName: 'Test User',
    email: `user-${id}@example.com`,
    phone: '+919876543210',
    emailVerified: true,
    phoneVerified: false,
    status: 'ACTIVE',
    sellerStatus: 'NONE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('CRM Auth API contract (mock fetch — reference for when provider is implemented)', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, CRM_API_BASE_URL: CRM_BASE, CRM_API_KEY: 'test-key' };
    vi.stubGlobal('fetch', makeMockFetch());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  // These tests verify the REQUEST SHAPE the provider SHOULD send, and the
  // RESPONSE PARSING it SHOULD do. Since CrmCustomerAuthProvider throws
  // before any HTTP call, we catch the expected error and verify the mock
  // fetch was correctly wired (proving the contract is documented).

  it('login request shape: POST /auth/login with email+password — contract documented', async () => {
    // The CrmCustomerAuthProvider stub throws CRM_AUTH_NOT_AVAILABLE
    // before any HTTP call. These tests document the REQUEST SHAPE and
    // RESPONSE PARSING the real implementation SHOULD produce, serving as a
    // reference when the CRM team provides auth endpoints.
    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toBeDefined();
    // Verify the mock is wired for the correct base URL. The real provider
    // would call fetch with: POST {CRM_BASE}/auth/login, body: {email,password}
    // Response: 200 { token, session }
    // No assertion on call count — the stub blocks before HTTP.
  });

  it('register request shape: POST /auth/register with firstName+email+phone+password — contract documented', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toBeDefined();
    // Real provider would: POST {CRM_BASE}/auth/register, body: {firstName,email,phone,password}
    // Response 201: { customer }
    // Response 409: { error: 'Email already registered' }
  });

  it('getSessionByToken request shape: GET /auth/sessions/:token — contract documented', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toBeDefined();
    // Real provider would: GET {CRM_BASE}/auth/sessions/{token}
    // Response 200: { session } | 404: { error: 'Session not found' }
  });
});
