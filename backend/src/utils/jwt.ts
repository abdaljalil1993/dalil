import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types/common';

export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string =>
  jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiry } as jwt.SignOptions);

export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string =>
  jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiry,
  } as jwt.SignOptions);

export const verifyAccessToken = (token: string): JwtPayload => jwt.verify(token, env.jwt.accessSecret) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload => jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;

export const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

export const expiryFromToken = (token: string): Date => {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  return decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 30 * 864e5);
};

export const randomToken = (bytes = 32): string => crypto.randomBytes(bytes).toString('hex');
