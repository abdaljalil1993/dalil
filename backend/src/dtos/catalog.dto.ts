import { body } from 'express-validator';

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const categoryFields = (create: boolean) => [
  create ? body('name').trim().notEmpty().withMessage('Name is required').bail().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters') : body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('nameEn').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
  body('icon').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('color').optional({ values: 'falsy' }).matches(HEX).withMessage('Color must be a hex value e.g. #5B4BFF'),
  body('image').optional({ values: 'falsy' }).isURL(),
  body('keywords').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
  body('isActive').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt({ min: 0 }).toInt(),
];

export const createCategoryDto = categoryFields(true);
export const updateCategoryDto = categoryFields(false);

export const createSubCategoryDto = [
  ...categoryFields(true).filter((_, i) => i !== 4 && i !== 5),
  body('categoryId').isInt({ min: 1 }).withMessage('Parent category is required').toInt(),
];
export const updateSubCategoryDto = [
  ...categoryFields(false).filter((_, i) => i !== 4 && i !== 5),
  body('categoryId').optional().isInt({ min: 1 }).toInt(),
];

const cityFields = (create: boolean) => [
  create ? body('name').trim().notEmpty().withMessage('Name is required').bail().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters') : body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('nameEn').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('state').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('country').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('latitude').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }).toFloat(),
  body('longitude').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }).toFloat(),
  body('image').optional({ values: 'falsy' }).isURL(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt({ min: 0 }).toInt(),
];

export const createCityDto = cityFields(true);
export const updateCityDto = cityFields(false);
