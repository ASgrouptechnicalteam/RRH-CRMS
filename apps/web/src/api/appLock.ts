// § Phase 6 — App Lock (WebAuthn) client. Wraps @simplewebauthn/browser
// (which itself wraps navigator.credentials.create/get) plus the matching
// backend endpoints under /auth/app-lock.
import {
  startRegistration,
  startAuthentication,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';
import { API_BASE_URL } from '../config';

type FetchWithAuth = (url: string, options?: RequestInit) => Promise<Response>;

export interface AppLockCredential {
  id: number;
  device_label: string | null;
  created_at: string;
  last_used_at: string | null;
}

/** Whether THIS device even has a platform authenticator (Windows Hello,
 * Touch ID, Android fingerprint, or a PIN-capable equivalent) — app lock
 * should be hidden as an option entirely when this is false, rather than
 * offered and then failing. */
export async function deviceSupportsAppLock(): Promise<boolean> {
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

export async function getAppLockStatus(
  fetchWithAuth: FetchWithAuth,
): Promise<{ enabled: boolean; credentials: AppLockCredential[] }> {
  const res = await fetchWithAuth(`${API_BASE_URL}/auth/app-lock/status`);
  if (!res.ok) throw new Error('Failed to fetch app-lock status');
  return res.json();
}

/** Full registration ceremony: fetch options, prompt the platform
 * authenticator, verify server-side. Throws if the user cancels/fails. */
export async function registerAppLockDevice(
  fetchWithAuth: FetchWithAuth,
  deviceLabel?: string,
): Promise<void> {
  const optionsRes = await fetchWithAuth(`${API_BASE_URL}/auth/app-lock/register-options`, {
    method: 'POST',
  });
  if (!optionsRes.ok)
    throw new Error(
      (await optionsRes.json().catch(() => ({}))).error || 'Failed to start registration',
    );
  const options = await optionsRes.json();

  const response = await startRegistration({ optionsJSON: options });

  const verifyRes = await fetchWithAuth(`${API_BASE_URL}/auth/app-lock/register-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response, deviceLabel: deviceLabel || defaultDeviceLabel() }),
  });
  if (!verifyRes.ok)
    throw new Error(
      (await verifyRes.json().catch(() => ({}))).error || 'Failed to verify registration',
    );
}

export async function removeAppLockDevice(
  fetchWithAuth: FetchWithAuth,
  credentialRowId: number,
): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/auth/app-lock/credentials/${credentialRowId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove device');
}

/** Full unlock ceremony — deliberately does NOT use fetchWithAuth (no access
 * token exists while locked; see AuthContext.tsx). Returns true only on a
 * genuinely verified assertion. */
export async function unlockWithAppLock(employeeId: number): Promise<boolean> {
  const optionsRes = await fetch(`${API_BASE_URL}/auth/app-lock/unlock-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  if (!optionsRes.ok) return false;
  const options = await optionsRes.json();

  const response = await startAuthentication({ optionsJSON: options });

  const verifyRes = await fetch(`${API_BASE_URL}/auth/app-lock/unlock-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, response }),
  });
  if (!verifyRes.ok) return false;
  const data = await verifyRes.json();
  return !!data.verified;
}

export function defaultDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/windows/i.test(ua)) return 'Windows Hello';
  if (/iphone|ipad/i.test(ua)) return 'Face/Touch ID';
  if (/android/i.test(ua)) return 'Android device';
  if (/mac/i.test(ua)) return 'Touch ID';
  return 'This device';
}
