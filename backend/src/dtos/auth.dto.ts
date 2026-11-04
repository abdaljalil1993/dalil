import { body } from 'express-validator';
import { emailField, passwordField, optionalPhone } from './common';

export const registerDto = [
  body('firstName').trim().notEmpty().withMessage('First name is required').bail().isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
  body('lastName').trim().notEmpty().withMessage('Last name is required').bail().isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters'),
  emailField(),
  passwordField(),
  optionalPhone('phone'),
  body('cityId').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
];

export const loginDto = [emailField(), body('password').isString().notEmpty().withMessage('Password is required')];

export const refreshDto = [body('refreshToken').isString().notEmpty().withMessage('Refresh token is required')];

export const logoutDto = [body('refreshToken').optional().isString()];

export const changePasswordDto = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  passwordField('newPassword'),
];

export const forgotPasswordDto = [emailField()];

export const resetPasswordDto = [body('token').isString().isLength({ min: 20 }).withMessage('Invalid token'), passwordField('newPassword')];
