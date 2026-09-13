import { describe, it, expect, beforeEach } from 'vitest';
import { MockCustomerAuthProvider } from './mock-provider';

describe('MockCustomerAuthProvider', () => {
  let provider: MockCustomerAuthProvider;

  beforeEach(() => {
    provider = new MockCustomerAuthProvider();
    process.env.DEV_AUTH_PASSWORD = 'password123';
  });

  describe('login', () => {
    it('should successfully login a valid customer and return a token', async () => {
      const { token, session } = await provider.login('verified@example.com', 'password123');
      expect(token).toBeDefined();
      expect(session).toBeDefined();
      expect(session.customer.email).toBe('verified@example.com');
    });

    it('should throw an error for invalid email', async () => {
      await expect(provider.login('invalid@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw an error for invalid password', async () => {
      await expect(provider.login('verified@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('register', () => {
    it('should register a new customer', async () => {
      const customer = await provider.register({
        firstName: 'New',
        email: 'newuser@example.com',
        phone: '+910000000000',
        password: 'password123',
      });
      expect(customer).toBeDefined();
      expect(customer.email).toBe('newuser@example.com');
      expect(customer.emailVerified).toBe(false);
      expect(customer.sellerStatus).toBe('NONE');
    });

    it('should throw an error if email is already registered', async () => {
      await expect(
        provider.register({
          firstName: 'Test',
          email: 'verified@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email for existing mock user', async () => {
      const success = await provider.verifyEmail('unverified@example.com');
      expect(success).toBe(true);
    });

    it('should return false for invalid token', async () => {
      const success = await provider.verifyEmail('invalidtoken');
      expect(success).toBe(false);
    });
  });

  describe('session management', () => {
    it('should create and retrieve a session', async () => {
      const { token } = await provider.login('verified@example.com', 'password123');
      const session = await provider.getSessionByToken(token);
      expect(session).not.toBeNull();
      expect(session?.customer.email).toBe('verified@example.com');
    });

    it('should revoke a session', async () => {
      const { token } = await provider.login('verified@example.com', 'password123');
      await provider.logout(token);
      const session = await provider.getSessionByToken(token);
      expect(session?.revokedAt).not.toBeNull();
    });

    it('should revoke all sessions for a customer', async () => {
      const { token: t1 } = await provider.login('verified@example.com', 'password123');
      const { token: t2 } = await provider.login('verified@example.com', 'password123');

      await provider.revokeAllSessionsForCustomer('2');

      const session1 = await provider.getSessionByToken(t1);
      const session2 = await provider.getSessionByToken(t2);

      expect(session1).toBeNull();
      expect(session2).toBeNull();
    });
  });
});
