export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'PENDING_VERIFICATION';

export type SellerStatus = 'NONE' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUSPENDED';

export interface Customer {
  id: number | string;
  firstName: string;
  displayName: string | null;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  status: AccountStatus;
  sellerStatus: SellerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  customerId: number | string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}

export interface SessionWithCustomer extends Session {
  customer: Customer;
}

export interface CustomerAuthProvider {
  login(email: string, password: string): Promise<{ token: string; session: SessionWithCustomer }>;
  register(data: {
    firstName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<Customer>;
  logout(token: string): Promise<void>;
  verifyEmail(token: string): Promise<boolean>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;

  getSessionByToken(token: string): Promise<SessionWithCustomer | null>;
  createSession(
    customerId: number | string,
    ttlMs?: number
  ): Promise<{ token: string; session: SessionWithCustomer }>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllSessionsForCustomer(customerId: number | string): Promise<void>;
}
