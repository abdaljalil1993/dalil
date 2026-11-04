import { Request, Response, NextFunction } from 'express';
import { validationResult, matchedData } from 'express-validator';
import { sendError } from '../utils/response';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true }).map((e) => ({
      field: e.type === 'field' ? e.path : undefined,
      message: e.msg,
    }));
    return sendError(res, errors[0]?.message || 'Validation failed', 422, errors);
  }
  next();
};

/**
 * Returns ONLY the body fields that were declared in the validation chain.
 * This is the mass-assignment guard: users can never set status/isFeatured/rating... by sending extra fields.
 */
export const body = <T = Record<string, unknown>>(req: Request): T =>
  matchedData(req, { locations: ['body'], includeOptionals: false }) as T;

/** Validated + sanitized query params only. */
export const queryData = <T = Record<string, unknown>>(req: Request): T =>
  matchedData(req, { locations: ['query'], includeOptionals: false }) as T;
