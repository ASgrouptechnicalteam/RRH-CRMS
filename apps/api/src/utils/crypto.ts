import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_32_byte_secret_key_change_me_now!'; // Must be 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

export function encryptData(text: string | null | undefined): string | null {
  if (!text) return null;
  
  // Create a 32-byte key from the env variable (pad or truncate if necessary)
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptData(text: string | null | undefined): string | null {
  if (!text) return null;
  
  try {
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
    
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed, returning null or masked data', error);
    return null; // Return null if decryption fails so we don't break the app
  }
}
