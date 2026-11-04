import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  let status = 500;
  let message = 'Internal Server Error';
  let errors: unknown[] | undefined;
  let code: string | undefined;

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
    code = err.code;
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5MB)' : err.message;
  } else if (err instanceof EntityNotFoundError) {
    status = 404;
    message = 'Resource not found';
  } else if (err instanceof QueryFailedError) {
    const code = (err as QueryFailedError & { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      status = 409;
      message = 'Duplicate entry - this record already exists';
    } else if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED') {
      status = 409;
      message = 'This record is in use and cannot be deleted';
    } else if (code === 'ER_NO_REFERENCED_ROW_2') {
      status = 422;
      message = 'Related record does not exist';
    }
  } else if ((err as { type?: string }).type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  } else if (err.message?.startsWith('INVALID_FILE')) {
    status = 400;
    message = 'Only JPEG, PNG and WebP images are allowed';
  }

  if (status >= 500) {
    logger.error(err.message, { stack: err.stack, url: req.originalUrl, method: req.method });
  }

  res.status(status).json({
    success: false,
    message,
    ...(code && { code }),
    ...(errors && { errors }),
    ...(!env.isProduction && status >= 500 && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
};
