import { Customer, CustomerAuthProvider, SessionWithCustomer } from '@/types/auth';

export class CrmCustomerAuthProvider implements CustomerAuthProvider {
  async login(
    email: string,
    password: string
  ): Promise<{ token: string; session: SessionWithCustomer }> {
    throw new Error(
      'CRM_AUTH_NOT_AVAILABLE: Production authentication is blocked pending RRH CRM implementation.'
    );
  }

  async register(data: {
    firstName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<Customer> {
    throw new Error(
      'CRM_AUTH_NOT_AVAILABLE: Production registration is blocked pending RRH CRM implementation.'
    );
  }

  async logout(token: string): Promise<void> {
    throw new Error(
      'CRM_AUTH_NOT_AVAILABLE: Production logout is blocked pending RRH CRM implementation.'
    );
  }

  async verifyEmail(token: string): Promise<boolean> {
    throw new Error(
      'CRM_AUTH_NOT_AVAILABLE: Production email verification is blocked pending RRH CRM implementation.'
    );
  }

  async requestPasswordReset(email: string): Promise<void> {
    throw new Error(
      'CRM_AUTH_NOT_AVAILABLE: Production password reset is blocked pending RRH CRM implementation.'
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    throw new Error(
      'CRM_AUTH_NOT_AVAILABLE: Production password reset is blocked pending RRH CRM implementation.'
    );
  }

  async getSessionByToken(token: string): Promise<SessionWithCustomer | null> {
    throw new Error(
      'CRM_AUTH_NOT_AVAILABLE: Production session management is blocked pending RRH CRM implementation.'
    );
  }

  async createSession(
    customerId: number | string,
    ttlMs?: number
  ): Promise<{ token: string; session: SessionWithCustomer }> {
    throw new Error(
      'CRM_AUTH_NOT_AVAILABLE: Production session management is blocked pending RRH CRM implementation.'
    );
  }

  async revokeSession(sessionId: string): Promise<void> {
    throw new Error(
      'CRM_AUTH_NOT_AVAILABLE: Production session management is blocked pending RRH CRM implementation.'
    );
  }

  async revokeAllSessionsForCustomer(customerId: number | string): Promise<void> {
    throw new Error(
      'CRM_AUTH_NOT_AVAILABLE: Production session management is blocked pending RRH CRM implementation.'
    );
  }
}
