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

/**
 * Validates, resizes, and saves the image to local storage using sharp.
 * @param buffer - File buffer from multer
 * @param propertyId - ID of the property
 * @returns Publicly accessible URL path
 */
export async function processAndStorePropertyImage(buffer: Buffer, propertyId: number): Promise<string> {
  const propertyImagesDir = path.join(UPLOAD_DIR, 'properties', String(propertyId), 'images');
  
  if (!fs.existsSync(propertyImagesDir)) {
    fs.mkdirSync(propertyImagesDir, { recursive: true });
  }

  const uuid = crypto.randomUUID();
  const filename = `${uuid}.webp`;
  const absolutePath = path.join(propertyImagesDir, filename);

  // Validate, resize (max 2560x2560), and convert to WebP using Sharp
  await sharp(buffer)
    .resize(2560, 2560, {
      fit: 'inside', // Preserves aspect ratio, only downsizes if larger than 2560x2560
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(absolutePath);

  // Return public URL path
  return `/uploads/properties/${propertyId}/images/${filename}`;
}

/**
 * Deletes a property image file from disk securely.
 */
export function deletePropertyImageFile(imageUrl: string): void {
  // Extract the part after /uploads/ to prevent path traversal
  // Matches new format: properties/123/images/uuid.webp
  // Matches legacy format: property-images/prop-xxx.jpg
  const match = imageUrl.match(/^\/uploads\/(properties\/\d+\/images\/[a-f0-9-]+\.webp|property-images\/prop-[0-9-]+\.[a-z]+)$/i);
  if (!match) {
    console.warn(`Invalid or unrecognizable image URL for deletion: ${imageUrl}`);
    return;
  }
  
  const relativeSafePath = match[1];
  const absolutePath = path.join(UPLOAD_DIR, relativeSafePath);
  
  // Extra safety check: ensure the resolved absolute path starts with UPLOAD_DIR
  if (absolutePath.startsWith(path.resolve(UPLOAD_DIR)) && fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (err) {
      console.error(`Failed to delete physical file: ${absolutePath}`, err);
    }
  }
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
