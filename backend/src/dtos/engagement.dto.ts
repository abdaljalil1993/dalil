import { body, query } from 'express-validator';
import { AdPlacement, AdStatus, ClaimStatus, PromotionStatus, ReportStatus, ReportType } from '../entities/enums';
import { isoDate, optionalPhone } from './common';

export const createReviewDto = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
  body('content').optional({ values: 'null' }).trim().isLength({ max: 2000 }).withMessage('Review must be at most 2000 characters'),
];
export const updateReviewDto = [
  body('rating').optional().isInt({ min: 1, max: 5 }).toInt(),
  body('content').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
];
export const replyDto = [body('reply').trim().isLength({ min: 2, max: 1000 }).withMessage('Reply must be 2-1000 characters')];
export const visibilityDto = [body('isHidden').isBoolean().toBoolean()];
export const reviewListQuery = [
  query('sort').optional().isIn(['newest', 'oldest', 'highest', 'lowest', 'helpful']),
  query('rating').optional().isInt({ min: 1, max: 5 }).toInt(),
];

export const createReportDto = [
  body('type').isIn(Object.values(ReportType)).withMessage('Invalid report type'),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 1000 }),
  body('reviewId').optional({ values: 'null' }).isUUID(),
];
export const updateReportDto = [body('status').isIn(Object.values(ReportStatus)), body('adminNote').optional({ values: 'null' }).trim().isLength({ max: 2000 })];

export const createClaimDto = [
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Please explain how you are related to this business (min 10 chars)'),
  optionalPhone('phone'),
  body('proofUrl').optional({ values: 'falsy' }).isURL(),
];
export const decideClaimDto = [body('status').isIn([ClaimStatus.APPROVED, ClaimStatus.REJECTED]), body('adminNote').optional({ values: 'null' }).trim().isLength({ max: 2000 })];

const adFields = (create: boolean, admin: boolean) => [
  create ? body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }) : body('title').optional().trim().isLength({ max: 255 }),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
  body('imageUrl').optional({ values: 'falsy' }).isURL(),
  body('targetUrl').optional({ values: 'falsy' }).isURL(),
  create ? body('placement').isIn(Object.values(AdPlacement)).withMessage('Invalid placement') : body('placement').optional().isIn(Object.values(AdPlacement)),
  isoDate('startDate', create),
  isoDate('endDate', create),
  body('cityId').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  body('categoryId').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  body('businessId').optional({ values: 'null' }).isUUID(),
  optionalPhone('contactPhone'),
  ...(admin
    ? [
        body('status').optional().isIn(Object.values(AdStatus)),
        body('priority').optional().isInt({ min: 0, max: 1000 }).toInt(),
        body('price').optional({ values: 'null' }).isFloat({ min: 0 }),
        body('adminNote').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
      ]
    : []),
];
export const createAdDto = adFields(true, true);
export const updateAdDto = adFields(false, true);
export const requestAdDto = adFields(true, false);
export const adsQuery = [
  query('placement').optional().isIn(Object.values(AdPlacement)),
  query('status').optional().isIn(Object.values(AdStatus)),
  query('cityId').optional().isInt({ min: 1 }).toInt(),
  query('categoryId').optional().isInt({ min: 1 }).toInt(),
];

const featuredFields = (create: boolean, admin: boolean) => [
  create ? body('businessId').isUUID().withMessage('businessId is required') : body('businessId').optional().isUUID(),
  isoDate('startDate', create),
  isoDate('endDate', create),
  body('note').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
  ...(admin
    ? [
        body('status').optional().isIn(Object.values(PromotionStatus)),
        body('priority').optional().isInt({ min: 0, max: 1000 }).toInt(),
        body('price').optional({ values: 'null' }).isFloat({ min: 0 }),
      ]
    : []),
];
export const createFeaturedDto = featuredFields(true, true);
export const updateFeaturedDto = featuredFields(false, true);
export const requestFeaturedDto = featuredFields(true, false);

export const contactDto = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Name is required'),
  body('email').optional({ values: 'falsy' }).isEmail(),
  optionalPhone('phone'),
  body('subject').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be at least 10 characters'),
];
