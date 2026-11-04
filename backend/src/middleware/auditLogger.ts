import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { AuditLog } from '../entities/AuditLog';
import { clientIp, userAgent } from '../utils/request';

const SENSITIVE = ['password', 'currentPassword', 'newPassword', 'token', 'refreshToken'];

const sanitize = (body: unknown): Record<string, unknown> | null => {
  if (!body || typeof body !== 'object') return null;
  const copy: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    copy[k] = SENSITIVE.includes(k) ? '***' : v;
  }
  return copy;
};

/** Records who did what (admin / owner write actions) after the response finishes. */
export const audit =
  (action: string, entityType?: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      AppDataSource.getRepository(AuditLog)
        .save({
          userId: req.userId,
          action,
          entityType,
          entityId: req.params.id || req.params.businessId,
          payload: sanitize(req.body),
          statusCode: res.statusCode,
          ipAddress: clientIp(req),
          userAgent: userAgent(req),
        })
        .catch(() => undefined);
    });
    next();
  };
