export const REDACTED = '[REDACTED]';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'token',
  'access_token',
  'refresh_token',
  'session',
  'sessiontoken',
  'session_token',
  'authorization',
  'cookie',
  'secret',
  'otp',
  'otpcode',
  'verificationcode',
  'apikey',
  'api_key',
]);

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

export function sanitizeForLog(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = isSensitiveKey(key) ? REDACTED : value;
  }
  return result;
}
