import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { env } from '../config/env';
import { logger } from '../config/logger';

export interface StoredFile {
  url: string;
  publicId: string;
}

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Uploads to Cloudinary when configured; otherwise stores files locally in /uploads
 * (served at /uploads/*). This keeps development working without a Cloudinary account.
 */
export class StorageService {
  static async upload(file: Express.Multer.File, folder: string): Promise<StoredFile> {
    if (isCloudinaryConfigured()) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `dalilak/${folder}`, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
          (error, result) => {
            if (error || !result) {
              logger.error('[Storage] Cloudinary upload failed', { error });
              return reject(error || new Error('Upload failed'));
            }
            resolve({ url: result.secure_url, publicId: `cld:${result.public_id}` });
          }
        );
        stream.end(file.buffer);
      });
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '');
    const dir = path.join(UPLOADS_DIR, safeFolder);
    await fs.mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT[file.mimetype] || '.jpg'}`;
    await fs.writeFile(path.join(dir, name), file.buffer);
    const rel = `${safeFolder}/${name}`;
    return { url: `${env.publicUrl}/uploads/${rel}`, publicId: `local:${rel}` };
  }

  static async remove(publicId?: string | null): Promise<void> {
    if (!publicId) return;
    try {
      if (publicId.startsWith('cld:') && isCloudinaryConfigured()) {
        await cloudinary.uploader.destroy(publicId.slice(4));
      } else if (publicId.startsWith('local:')) {
        const target = path.join(UPLOADS_DIR, publicId.slice(6));
        if (target.startsWith(UPLOADS_DIR)) await fs.unlink(target).catch(() => undefined);
      }
    } catch (err) {
      logger.warn('[Storage] delete failed', { publicId });
    }
  }
}
