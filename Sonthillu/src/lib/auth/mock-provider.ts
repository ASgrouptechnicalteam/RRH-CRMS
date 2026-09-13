import { Customer, CustomerAuthProvider, SessionWithCustomer } from '@/types/auth';

// Development-only fixtures
const mockCustomers = new Map<string | number, Customer>([
  [
    '1',
    {
      id: '1',
      firstName: 'Unverified',
      displayName: 'Unverified Buyer',
      email: 'unverified@example.com',
      phone: '+919876543210',
      emailVerified: false,
      phoneVerified: false,
      status: 'ACTIVE',
      sellerStatus: 'NONE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    '2',
    {
      id: '2',
      firstName: 'Verified',
      displayName: 'Verified Buyer',
      email: 'verified@example.com',
      phone: '+919876543211',
      emailVerified: true,
      phoneVerified: true,
      status: 'ACTIVE',
      sellerStatus: 'NONE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    '3',
    {
      id: '3',
      firstName: 'Pending',
      displayName: 'Pending Seller',
      email: 'pending@example.com',
      phone: '+919876543212',
      emailVerified: true,
      phoneVerified: true,
      status: 'ACTIVE',
      sellerStatus: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    '4',
    {
      id: '4',
      firstName: 'Verified Seller',
      displayName: 'Verified Seller',
      email: 'seller@example.com',
      phone: '+919876543213',
      emailVerified: true,
      phoneVerified: true,
      status: 'ACTIVE',
      sellerStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    '5',
    {
      id: '5',
      firstName: 'Suspended',
      displayName: 'Suspended Seller',
      email: 'suspended@example.com',
      phone: '+919876543214',
      emailVerified: true,
      phoneVerified: true,
      status: 'ACTIVE',
      sellerStatus: 'SUSPENDED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

// In-memory session store for local dev
const mockSessions = new Map<string, SessionWithCustomer>();

export class MockCustomerAuthProvider implements CustomerAuthProvider {
  private devPassword = process.env.DEV_AUTH_PASSWORD || 'password123';

  async login(email: string, password: string) {
    if (password !== this.devPassword) {
      throw new Error('Invalid credentials');
    }
    const customer = Array.from(mockCustomers.values()).find((c) => c.email === email);
    if (!customer) {
      throw new Error('Invalid credentials');
    }
    return this.createSession(customer.id);
  }

  async register(data: { firstName: string; email: string; phone?: string; password: string }) {
    if (Array.from(mockCustomers.values()).some((c) => c.email === data.email)) {
      throw new Error('Email already registered');
    }
    const id = String(mockCustomers.size + 1);
    const customer: Customer = {
      id,
      firstName: data.firstName,
      displayName: data.firstName,
      email: data.email,
      phone: data.phone || null,
      emailVerified: false,
      phoneVerified: false,
      status: 'ACTIVE',
      sellerStatus: 'NONE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCustomers.set(id, customer);
    return customer;
  }

  async logout(token: string) {
    await this.revokeSession(token);
  }

  async verifyEmail(token: string) {
    // Development-only mock behavior
    const customer = Array.from(mockCustomers.values()).find((c) => c.email === token); // Simple mock mapping
    if (customer) {
      customer.emailVerified = true;
      return true;
    }
    return false;
  }

  async requestPasswordReset(email: string) {
    // Pretend to send email
  }

  async resetPassword(token: string, newPassword: string) {
    return true; // Pretend it succeeded
  }

  async getSessionByToken(token: string) {
    return mockSessions.get(token) || null;
  }

  async createSession(customerId: number | string, ttlMs?: number) {
    const customer = mockCustomers.get(String(customerId));
    if (!customer) {
      throw new Error('Customer not found');
    }
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const session: SessionWithCustomer = {
      id: token,
      customerId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttlMs || 24 * 60 * 60 * 1000), // Default 24h
      revokedAt: null,
      customer,
    };
    mockSessions.set(token, session);
    return { token, session };
  }

  async revokeSession(sessionId: string) {
    const session = mockSessions.get(sessionId);
    if (session) {
      session.revokedAt = Date.now();
      mockSessions.delete(sessionId);
    }
  }

  async revokeAllSessionsForCustomer(customerId: number | string) {
    const tokensToRemove: string[] = [];
    mockSessions.forEach((session, token) => {
      if (String(session.customerId) === String(customerId)) {
        tokensToRemove.push(token);
      }
    });
    tokensToRemove.forEach((t) => mockSessions.delete(t));
  }
}
