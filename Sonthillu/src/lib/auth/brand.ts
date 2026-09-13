export const BRAND_AUTH_SCOPE = 'sonthillu';
export const SESSION_COOKIE_NAME = 'sonthillu_session';

export const SESSION_COOKIE_ATTRIBUTES = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
} as const;

export function brandSessionCookieName(scope: string): string {
  return `${scope}_session`;
}

export function isSonthilluSessionCookie(name: string): boolean {
  return name === SESSION_COOKIE_NAME;
}
