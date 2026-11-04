import { Request, Response, NextFunction, RequestHandler } from 'express';

/** Wraps async controllers so thrown errors go to the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
