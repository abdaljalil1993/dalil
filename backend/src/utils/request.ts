import { Request } from 'express';

export const clientIp = (req: Request): string => (req.ip || '').replace('::ffff:', '').substring(0, 45);
export const userAgent = (req: Request): string => (req.headers['user-agent'] || '').substring(0, 500);
