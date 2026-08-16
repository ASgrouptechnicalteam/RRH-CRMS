import multer from 'multer';
import path from 'path';
import fs from 'fs';

const PROPERTY_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'property-images');

if (!fs.existsSync(PROPERTY_UPLOAD_DIR)) {
  fs.mkdirSync(PROPERTY_UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PROPERTY_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `prop-${uniqueSuffix}${ext}`);
  },
});

export const propertyImageUpload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.includes(ext) && ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed (max 10MB).'));
    }
  },
});

/**
 * Returns a public-safe relative path for stored file.
 * Never exposes full server filesystem path.
 */
export function getPublicPath(filename: string): string {
  return `/uploads/property-images/${filename}`;
}

/**
 * Deletes a property image file from disk.
 */
export function deleteFile(filename: string): void {
  const filepath = path.join(PROPERTY_UPLOAD_DIR, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

/**
 * Extracts the filename from a public path for deletion.
 */
export function extractFilename(publicPath: string): string | null {
  const match = publicPath.match(/\/uploads\/property-images\/(.+)$/);
  return match ? match[1] : null;
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
