import { body, query } from 'express-validator';
import { BusinessStatus, ContactClickType } from '../entities/enums';
import { optionalPhone, TIME_RE } from './common';

const hoursRules = (prefix: string) => [
  body(prefix).optional().isArray({ max: 7 }).withMessage('workingHours must be an array (max 7 days)'),
  body(`${prefix}.*.dayOfWeek`).isInt({ min: 0, max: 6 }).withMessage('dayOfWeek must be 0 (Sunday) .. 6 (Saturday)').toInt(),
  body(`${prefix}.*.openTime`).optional({ values: 'null' }).matches(TIME_RE).withMessage('openTime must be HH:MM'),
  body(`${prefix}.*.closeTime`).optional({ values: 'null' }).matches(TIME_RE).withMessage('closeTime must be HH:MM'),
  body(`${prefix}.*.isClosed`).optional().isBoolean().toBoolean(),
  body(`${prefix}.*.isOpen24Hours`).optional().isBoolean().toBoolean(),
];

const businessFields = (create: boolean) => [
  create
    ? body('name').trim().notEmpty().withMessage('Business name is required').bail().isLength({ min: 2, max: 255 }).withMessage('Name must be 2-255 characters')
    : body('name').optional().trim().isLength({ min: 2, max: 255 }),
  body('nameEn').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('shortDescription').optional({ values: 'null' }).trim().isLength({ max: 300 }),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 8000 }),
  body('address').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('district').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('latitude').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude').toFloat(),
  body('longitude').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude').toFloat(),
  optionalPhone('phone'),
  optionalPhone('phone2'),
  optionalPhone('whatsapp'),
  body('website').optional({ values: 'falsy' }).trim().isURL().withMessage('Invalid website URL'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Invalid email'),
  body('socialLinks').optional({ values: 'null' }).isObject().withMessage('socialLinks must be an object'),
  body('socialLinks.*').optional({ values: 'falsy' }).isURL().withMessage('Social links must be URLs'),
  body('priceRange').optional({ values: 'null' }).isInt({ min: 1, max: 4 }).toInt(),
  body('attributes').optional({ values: 'null' }).isObject(),
  body('amenities').optional({ values: 'null' }).isArray({ max: 50 }),
  body('amenities.*').optional().isString().isLength({ max: 60 }),
  body('tags').optional({ values: 'null' }).custom((v) => typeof v === 'string' || Array.isArray(v)).withMessage('tags must be a string or array'),
  create ? body('categoryId').isInt({ min: 1 }).withMessage('Category is required').toInt() : body('categoryId').optional().isInt({ min: 1 }).toInt(),
  body('subCategoryId').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  create ? body('cityId').isInt({ min: 1 }).withMessage('City is required').toInt() : body('cityId').optional().isInt({ min: 1 }).toInt(),
  body('isOwner').optional().isBoolean().toBoolean(),
  ...hoursRules('workingHours'),
];

export const createBusinessDto = businessFields(true);
export const updateBusinessDto = businessFields(false);

export const setHoursDto = [
  body('hours').isArray({ min: 1, max: 7 }).withMessage('hours array is required'),
  body('hours.*.dayOfWeek').isInt({ min: 0, max: 6 }).toInt(),
  body('hours.*.openTime').optional({ values: 'null' }).matches(TIME_RE),
  body('hours.*.closeTime').optional({ values: 'null' }).matches(TIME_RE),
  body('hours.*.isClosed').optional().isBoolean().toBoolean(),
  body('hours.*.isOpen24Hours').optional().isBoolean().toBoolean(),
];

export const setStatusDto = [
  body('status').isIn(Object.values(BusinessStatus)).withMessage('Invalid status'),
  body('adminNote').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
];

export const setFlagsDto = [
  body('isVerified').optional().isBoolean().toBoolean(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('ownerId').optional({ values: 'null' }).isUUID(),
];

export const trackDto = [body('type').isIn(Object.values(ContactClickType)).withMessage('type must be phone|whatsapp|directions|website')];

const SORTS = ['relevance', 'rating', 'reviews', 'newest', 'distance', 'name', 'popular'];

export const listQuery = [
  query('categoryId').optional().isInt({ min: 1 }).toInt(),
  query('subCategoryId').optional().isInt({ min: 1 }).toInt(),
  query('cityId').optional().isInt({ min: 1 }).toInt(),
  query('district').optional().trim().isLength({ max: 150 }),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).toFloat(),
  query('priceRange').optional().isInt({ min: 1, max: 4 }).toInt(),
  query('openNow').optional().isBoolean().toBoolean(),
  query('verified').optional().isBoolean().toBoolean(),
  query('featured').optional().isBoolean().toBoolean(),
  query('hasPhotos').optional().isBoolean().toBoolean(),
  query('lat').optional().isFloat({ min: -90, max: 90 }).toFloat(),
  query('lng').optional().isFloat({ min: -180, max: 180 }).toFloat(),
  query('radius').optional().isFloat({ min: 0.1, max: 500 }).toFloat(),
  query('sort').optional().isIn(SORTS).withMessage(`sort must be one of ${SORTS.join(', ')}`),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const searchQuery = [query('q').optional().trim().isLength({ max: 120 }).withMessage('Query too long'), ...listQuery];
export const suggestQuery = [query('q').trim().isLength({ min: 1, max: 120 }).withMessage('q is required'), query('cityId').optional().isInt({ min: 1 }).toInt()];
export const adminListQuery = [query('status').optional().isIn([...Object.values(BusinessStatus), 'all']), query('ownerId').optional().isUUID(), ...searchQuery];
