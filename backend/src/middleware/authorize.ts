import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { UserRole } from '../entities/enums';

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (!roles.includes(req.user.role)) return sendError(res, 'Insufficient permissions', 403);
    next();
  };

export const isAdmin = authorize(UserRole.ADMIN);
export const isBusinessOwner = authorize(UserRole.BUSINESS_OWNER, UserRole.ADMIN);
/** Any signed-in user (user, owner, admin) */
export const isUser = authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN);
