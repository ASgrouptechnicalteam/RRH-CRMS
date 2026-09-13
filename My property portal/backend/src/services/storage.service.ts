import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageProvider {
  uploadFile(file: Express.Multer.File): Promise<{ safeFilename: string; path: string }>;
  getFileStream(safeFilename: string): Promise<fs.ReadStream>;
  deleteFile(safeFilename: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ safeFilename: string; path: string }> {
    const ext = path.extname(file.originalname);
    const safeFilename = crypto.randomUUID() + ext;
    const destPath = path.join(this.uploadDir, safeFilename);

    await fs.promises.writeFile(destPath, file.buffer);
    return { safeFilename, path: destPath };
  }

  async getFileStream(safeFilename: string): Promise<fs.ReadStream> {
    const filePath = path.join(this.uploadDir, safeFilename);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    return fs.createReadStream(filePath);
  }

  async deleteFile(safeFilename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, safeFilename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

class S3StorageProvider implements StorageProvider {
  async uploadFile(file: Express.Multer.File): Promise<{ safeFilename: string; path: string }> {
    throw new Error(
      'S3StorageProvider not fully implemented. Install aws-sdk and configure bucket.',
    );
  }

  async getFileStream(safeFilename: string): Promise<fs.ReadStream> {
    throw new Error('S3StorageProvider not fully implemented.');
  }

  async deleteFile(safeFilename: string): Promise<void> {
    throw new Error('S3StorageProvider not fully implemented.');
  }
}

let provider: StorageProvider;

if (process.env.STORAGE_PROVIDER === 's3') {
  provider = new S3StorageProvider();
} else {
  // Default to local
  provider = new LocalStorageProvider();
}

export default provider;
