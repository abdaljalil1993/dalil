import { Request } from 'express';

export const parsePagination = (req: Request, defaultLimit = 20): { page: number; limit: number } => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || defaultLimit));
  return { page, limit };
};

export const parseSortOrder = (value: unknown, def: 'ASC' | 'DESC' = 'DESC'): 'ASC' | 'DESC' => {
  const v = String(value || '').toUpperCase();
  return v === 'ASC' || v === 'DESC' ? v : def;
};

export const toInt = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
};

export const toFloat = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
};

export const toBool = (v: unknown): boolean | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  return ['true', '1', 'yes'].includes(String(v).toLowerCase());
};
