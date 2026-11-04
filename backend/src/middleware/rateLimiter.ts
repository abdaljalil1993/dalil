import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { sendError } from '../utils/response';
import { env } from '../config/env';

const handler = (msg: string) => (_req: Request, res: Response) => sendError(res, msg, 429);

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimit.globalPer15Min,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Too many requests, please try again later'),
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimit.authPer15Min,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: handler('Too many authentication attempts, please try again later'),
});

export const writeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Too many submissions, please try again later'),
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Upload limit exceeded, please try again later'),
});
