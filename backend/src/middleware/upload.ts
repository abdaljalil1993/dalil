import multer from 'multer';
import { Request } from 'express';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  if (!ALLOWED.includes(file.mimetype)) return cb(new Error('INVALID_FILE'));
  cb(null, true);
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

/** Single file, form field name: "image" */
export const uploadSingle = upload.single('image');
/** Multiple files, form field name: "images" (max 10) */
export const uploadMultiple = upload.array('images', 10);
