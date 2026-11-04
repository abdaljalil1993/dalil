import { body, query } from 'express-validator';
import { UserRole, UserStatus } from '../entities/enums';
import { optionalPhone } from './common';

export const updateProfileDto = [
  body('firstName').optional().trim().isLength({ min: 2, max: 100 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 100 }),
  optionalPhone('phone'),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('cityId').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
];

export const userListQuery = [
  query('search').optional().trim().isLength({ max: 100 }),
  query('role').optional().isIn(Object.values(UserRole)),
  query('status').optional().isIn(Object.values(UserStatus)),
];

export const updateStatusDto = [body('status').isIn(Object.values(UserStatus)).withMessage('Invalid status')];
export const updateRoleDto = [body('role').isIn(Object.values(UserRole)).withMessage('Invalid role')];
