import { Response } from 'express';
import { PaginationMeta } from '../types/common';

export const sendSuccess = <T>(res: Response, data: T, message = 'Success', statusCode = 200, meta?: PaginationMeta | Record<string, unknown>): void => {
  res.status(statusCode).json({ success: true, message, data, ...(meta && { meta }) });
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully'): void =>
  sendSuccess(res, data, message, 201);

export const sendError = (res: Response, message: string, statusCode = 400, errors?: unknown[]): void => {
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
};

export const buildPaginationMeta = (total: number, page: number, limit: number): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { total, page, limit, totalPages, hasNext: page < totalPages };
};
