import jwt from 'jsonwebtoken';

/**
 * Mocks the authentication for a given user in tests.
 * Instead of going through the POST /login route which might be rate-limited
 * or slow, this directly generates the JWT needed for API tests.
 * 
 * Note: This explicitly uses the insecure current state (Phase 0) where JWTs
 * are generated and we don't have session tracking yet.
 */
export function getAuthTokenForUser(user: { id?: string; employee_id: string; roles: string[] }): string {
  const secret = process.env.JWT_ACCESS_SECRET || 'test-secret-access';
  
  // Create a token matching what apps/api/src/utils/jwt.ts currently produces
  const token = jwt.sign(
    { 
      id: user.id || 1, // Mock DB ID
      employee_id: user.employee_id, 
      roles: user.roles 
    },
    secret,
    { expiresIn: '24h' }
  );

  return token;
}

/**
 * Attaches the auth header to a supertest request
 */
export function withAuth(req: any, token: string) {
  return req.set('Authorization', `Bearer ${token}`);
}
