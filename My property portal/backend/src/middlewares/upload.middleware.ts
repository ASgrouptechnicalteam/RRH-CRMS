import multer from 'multer';
import { Request } from 'express';
import path from 'path';

// Use memory storage so we can validate files before passing to the StorageService
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Executables and scripts are forbidden.'));
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file extension.'));
  }

  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB absolute max for memory buffering
  },
});
