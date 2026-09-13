import crypto from 'crypto';
import { encryptData, decryptData } from '../../apps/api/src/utils/crypto';

// Phase 1.4 (2026-09-06): AES-256-CBC -> AES-256-GCM upgrade.
// Mirrors crypto.ts's own key derivation to construct a legacy-format
// ciphertext for the backward-compatibility test, without needing to export
// an internal implementation detail just for testing.
function deriveTestKey(): Buffer {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_32_byte_secret_key_change_me_now!';
  return Buffer.from(
    crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32),
  );
}

function legacyCbcEncrypt(text: string): string {
  const key = deriveTestKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

describe('Phase 1.4 - KYC encryption (AES-256-CBC -> AES-256-GCM)', () => {
  it('1. encrypts and decrypts a round trip correctly', () => {
    const original = 'ABCDE1234F';
    const encrypted = encryptData(original);
    expect(encrypted).not.toBe(original);
    expect(decryptData(encrypted)).toBe(original);
  });

  it('2. new ciphertext is in the 3-part GCM format (iv:authTag:ciphertext)', () => {
    const encrypted = encryptData('123456789012')!;
    expect(encrypted.split(':')).toHaveLength(3);
  });

  it('3. is an authenticated cipher: tampering with the ciphertext is detected, not silently decrypted', () => {
    const encrypted = encryptData('5010023456789')!;
    const [iv, authTag, cipherHex] = encrypted.split(':');
    // Flip a byte in the ciphertext.
    const tamperedByte = (parseInt(cipherHex.substring(0, 2), 16) ^ 0xff)
      .toString(16)
      .padStart(2, '0');
    const tampered = `${iv}:${authTag}:${tamperedByte}${cipherHex.substring(2)}`;
    expect(decryptData(tampered)).toBeNull();
  });

  it('4. tampering with the auth tag itself is also detected', () => {
    const encrypted = encryptData('HDFC0001234')!;
    const [iv, authTag, cipherHex] = encrypted.split(':');
    const tamperedTag =
      (parseInt(authTag.substring(0, 2), 16) ^ 0xff).toString(16).padStart(2, '0') +
      authTag.substring(2);
    expect(decryptData(`${iv}:${tamperedTag}:${cipherHex}`)).toBeNull();
  });

  it('5. still decrypts values written under the old AES-256-CBC scheme (backward compatibility for un-migrated rows)', () => {
    const legacy = legacyCbcEncrypt('Miyapur Main');
    expect(legacy.split(':')).toHaveLength(2); // old 2-part format
    expect(decryptData(legacy)).toBe('Miyapur Main');
  });

  it('6. a plaintext value (from the pre-fix employees.ts update-route bug) passes through unchanged instead of being nulled out', () => {
    // No colons -> doesn't look like either encrypted shape.
    expect(decryptData('ABCDE1234F')).toBe('ABCDE1234F');
  });

  it('7. null/undefined/empty input stays null', () => {
    expect(encryptData(null)).toBeNull();
    expect(encryptData(undefined)).toBeNull();
    expect(encryptData('')).toBeNull();
    expect(decryptData(null)).toBeNull();
    expect(decryptData(undefined)).toBeNull();
  });
});
