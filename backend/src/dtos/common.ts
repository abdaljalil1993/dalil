import { body, param, query } from 'express-validator';

export const PHONE_RE = /^[+0-9][0-9\s()-]{5,19}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const emailField = (field = 'email') =>
  body(field).trim().notEmpty().withMessage('Email is required').bail().isEmail().withMessage('Invalid email address')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false, outlookdotcom_remove_subaddress: false, yahoo_remove_subaddress: false, icloud_remove_subaddress: false });

export const passwordField = (field = 'password') =>
  body(field)
    .isString().withMessage('Password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain letters and numbers');

export const optionalPhone = (field: string) =>
  body(field).optional({ values: 'falsy' }).trim().matches(PHONE_RE).withMessage(`Invalid phone number (${field})`);

export const uuidParam = (name = 'id') => param(name).isUUID().withMessage(`Invalid ${name}`);
export const intParam = (name = 'id') => param(name).isInt({ min: 1 }).withMessage(`Invalid ${name}`).toInt();

export const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const isoDate = (field: string, required = true) => {
  const chain = body(field);
  return (required ? chain.notEmpty().withMessage(`${field} is required`) : chain.optional()).isISO8601().withMessage(`${field} must be an ISO date`).toDate();
};
