import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UserStatus } from '../entities/enums';

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim() || null;
  return null;
};

const loadUser = async (token: string): Promise<User | null> => {
  const payload = verifyAccessToken(token);
  const user = await AppDataSource.getRepository(User).findOne({ where: { id: payload.userId } });
  if (!user || user.status !== UserStatus.ACTIVE) return null;
  return user;
};

/** Requires a valid access token. */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = extractToken(req);
  if (!token) return sendError(res, 'Authentication required', 401);
  try {
    const user = await loadUser(token);
    if (!user) return sendError(res, 'Account is inactive or not found', 401);
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};

/** Attaches the user if a valid token is present, otherwise continues as guest. */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const token = extractToken(req);
  if (token) {
    try {
      const user = await loadUser(token);
      if (user) {
        req.user = user;
        req.userId = user.id;
        req.userRole = user.role;
      }
    } catch {
      /* guest */
    }
  }
  next();
};
