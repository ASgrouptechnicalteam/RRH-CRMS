import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const propertyImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
});

export interface PropertyImageStorage {
  upload(buffer: Buffer, propertyId: number): Promise<string>;
  delete(imageUrl: string): Promise<void>;
}

async function processImageBuffer(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(2560, 2560, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
}

class LocalPropertyImageStorage implements PropertyImageStorage {
  async upload(buffer: Buffer, propertyId: number): Promise<string> {
    const propertyImagesDir = path.join(UPLOAD_DIR, 'properties', String(propertyId), 'images');
    
    if (!fs.existsSync(propertyImagesDir)) {
      fs.mkdirSync(propertyImagesDir, { recursive: true });
    }

    const uuid = crypto.randomUUID();
    const filename = `${uuid}.webp`;
    const absolutePath = path.join(propertyImagesDir, filename);

    const processedBuffer = await processImageBuffer(buffer);
    await fs.promises.writeFile(absolutePath, processedBuffer);

    return `/uploads/properties/${propertyId}/images/${filename}`;
  }

  async delete(imageUrl: string): Promise<void> {
    const match = imageUrl.match(/^\/uploads\/(properties\/\d+\/images\/[a-f0-9-]+\.webp|property-images\/prop-[0-9-]+\.[a-z]+)$/i);
    if (!match) {
      console.warn(`Invalid or unrecognizable image URL for deletion: ${imageUrl}`);
      return;
    }
    
    const relativeSafePath = match[1];
    const absolutePath = path.join(UPLOAD_DIR, relativeSafePath);
    
    if (absolutePath.startsWith(path.resolve(UPLOAD_DIR)) && fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.error(`Failed to delete physical file: ${absolutePath}`, err);
      }
    }
  }
}

class SftpPropertyImageStorage implements PropertyImageStorage {
  private async connect() {
    // Dynamically import to avoid loading it when running locally
    const Client = (await import('ssh2-sftp-client')).default;
    const sftp = new Client();
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: parseInt(process.env.SFTP_PORT || '22', 10),
      username: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD,
    });
    return sftp;
  }

  async upload(buffer: Buffer, propertyId: number): Promise<string> {
    const processedBuffer = await processImageBuffer(buffer);
    const uuid = crypto.randomUUID();
    const filename = `${uuid}.webp`;
    
    const remoteBasePath = process.env.SFTP_REMOTE_BASE_PATH || '';
    const remoteDir = `${remoteBasePath}/${propertyId}/images`;
    const remotePath = `${remoteDir}/${filename}`;

    const sftp = await this.connect();
    try {
      const dirExists = await sftp.exists(remoteDir);
      if (!dirExists) {
        await sftp.mkdir(remoteDir, true);
      }
      await sftp.put(processedBuffer, remotePath);
      
      const publicBaseUrl = process.env.SFTP_PUBLIC_BASE_URL || '';
      return `${publicBaseUrl}/${propertyId}/images/${filename}`;
    } finally {
      await sftp.end();
    }
  }

  async delete(imageUrl: string): Promise<void> {
    const publicBaseUrl = process.env.SFTP_PUBLIC_BASE_URL || '';
    if (!imageUrl.startsWith(publicBaseUrl)) {
      console.warn(`SFTP delete skipped: Image URL does not match public base URL: ${imageUrl}`);
      return;
    }

    const relativePath = imageUrl.substring(publicBaseUrl.length);
    const match = relativePath.match(/^\/(\d+\/images\/[a-f0-9-]+\.webp)$/i);
    
    if (!match) {
      console.warn(`Invalid SFTP image URL for deletion: ${imageUrl}`);
      return;
    }

    const remoteBasePath = process.env.SFTP_REMOTE_BASE_PATH || '';
    const remotePath = `${remoteBasePath}/${match[1]}`;

    const sftp = await this.connect();
    try {
      const exists = await sftp.exists(remotePath);
      if (exists) {
        await sftp.delete(remotePath);
      }
    } catch (err) {
      console.error(`Failed to delete SFTP file: ${remotePath}`, err);
    } finally {
      await sftp.end();
    }
  }
}

export function getPropertyImageStorage(): PropertyImageStorage {
  return process.env.STORAGE_DRIVER === 'sftp' 
    ? new SftpPropertyImageStorage() 
    : new LocalPropertyImageStorage();
}

/**
 * Storage abstraction used by the document module.
 * Implementations must return relative, public-safe storage paths and must
 * never expose full server filesystem paths.
 */
export interface StorageService {
  upload(buffer: Buffer, originalName: string, mimeType: string): Promise<string>;
  download(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
}

/**
 * Minimal local-disk implementation of StorageService.
 * Files are written under the configured base directory and addressed by
 * relative paths (e.g. "documents/...") so stored paths stay public-safe.
 * Path traversal outside the base directory is rejected.
 */
export class LocalStorageService implements StorageService {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = path.resolve(baseDir);
  }

  private resolveSafe(storagePath: string): string {
    const resolved = path.resolve(this.baseDir, storagePath);
    if (!resolved.startsWith(this.baseDir + path.sep)) {
      throw new Error('Invalid storage path');
    }
    return resolved;
  }

  async upload(buffer: Buffer, originalName: string, _mimeType: string): Promise<string> {
    const ext = path.extname(originalName).toLowerCase() || '.bin';
    const filename = `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const relativePath = path.posix.join('documents', filename);
    const dir = path.join(this.baseDir, 'documents');
    fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, filename), buffer);
    return relativePath;
  }

  async download(storagePath: string): Promise<Buffer> {
    return fs.promises.readFile(this.resolveSafe(storagePath));
  }

  async delete(storagePath: string): Promise<void> {
    const filepath = this.resolveSafe(storagePath);
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
    }
  }
}
