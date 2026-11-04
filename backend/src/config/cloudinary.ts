import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

export const isCloudinaryConfigured = (): boolean =>
  Boolean(
    env.cloudinary.cloudName &&
      env.cloudinary.apiKey &&
      env.cloudinary.apiSecret &&
      !env.cloudinary.cloudName.startsWith('your_')
  );

export const initCloudinary = (): boolean => {
  if (!isCloudinaryConfigured()) return false;
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  return true;
};

export { cloudinary };
