import { body, query } from 'express-validator';
import {
  AppointmentStatus, ApplicationStatus, EmergencyType, ListingPurpose, ListingStatus, ListingType, PaymentMethod, PaymentPurpose,
  PaymentStatus, QuoteStatus, ServiceRequestStatus, SubscriptionStatus,
} from '../entities/enums';
import { isoDate, optionalPhone, TIME_RE } from './common';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const money = (f: string) => body(f).optional({ values: 'null' }).isFloat({ min: 0 }).withMessage(`${f} must be a positive number`);

// ───────────── billing ─────────────
const features = [
  body('features').optional().isObject(),
  ...['maxImages', 'maxItems', 'maxActiveOffers', 'maxActiveListings', 'priorityBoost', 'featuredDaysPerMonth'].map((k) => body(`features.${k}`).optional().isInt({ min: -1 }).toInt()),
  ...['bookings', 'quotes', 'advancedStats', 'verifiedBadge', 'socialLinks', 'whatsappButton'].map((k) => body(`features.${k}`).optional().isBoolean().toBoolean()),
];
export const planDto = (create: boolean) => [
  create ? body('code').trim().matches(/^[a-z0-9_-]{2,40}$/).withMessage('code: lowercase letters/numbers') : body('code').optional().trim().matches(/^[a-z0-9_-]{2,40}$/),
  create ? body('name').trim().isLength({ min: 2, max: 100 }) : body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('nameEn').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
  money('priceMonthly'), money('priceYearly'),
  body('currency').optional().trim().isLength({ min: 2, max: 10 }),
  body('color').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('isDefault').optional().isBoolean().toBoolean(),
  body('isRecommended').optional().isBoolean().toBoolean(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt({ min: 0 }).toInt(),
  ...features,
];
export const settingsDto = [
  body('billingEnabled').optional().isBoolean().toBoolean(),
  body('renewalReminderDays').optional().isInt({ min: 0, max: 60 }).toInt(),
  body('paymentInstructions').optional().isString().isLength({ max: 3000 }),
  body('listingsRequireApproval').optional().isBoolean().toBoolean(),
  body('listingDurationDays').optional().isInt({ min: 1, max: 365 }).toInt(),
  body('serviceRequestDurationDays').optional().isInt({ min: 1, max: 120 }).toInt(),
  body('supportPhone').optional().isString().isLength({ max: 30 }),
  body('supportWhatsapp').optional().isString().isLength({ max: 30 }),
];
export const subscriptionRequestDto = [
  body('businessId').isUUID(),
  body('planId').isInt({ min: 1 }).toInt(),
  body('period').isIn(['monthly', 'yearly']),
  body('method').isIn(Object.values(PaymentMethod)),
  body('reference').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('note').optional({ values: 'null' }).trim().isLength({ max: 1000 }),
];
export const grantDto = [
  body('businessId').isUUID(),
  body('planId').isInt({ min: 1 }).toInt(),
  body('period').isIn(['monthly', 'yearly']),
  isoDate('startDate', false), isoDate('endDate', false),
  body('note').optional({ values: 'null' }).trim(),
  body('amount').optional({ values: 'null' }).isFloat({ min: 0 }).toFloat(),
  body('method').optional().isIn(Object.values(PaymentMethod)),
  body('reference').optional({ values: 'null' }).trim(),
];
export const updateSubscriptionDto = [
  body('status').optional().isIn(Object.values(SubscriptionStatus)),
  isoDate('endDate', false),
  body('planId').optional().isInt({ min: 1 }).toInt(),
  body('note').optional({ values: 'null' }).trim(),
];
export const decidePaymentDto = [body('status').isIn([PaymentStatus.CONFIRMED, PaymentStatus.REJECTED]), body('adminNote').optional({ values: 'null' }).trim()];
export const recordPaymentDto = [
  body('userId').optional({ values: 'null' }).isUUID(),
  body('businessId').optional({ values: 'null' }).isUUID(),
  body('purpose').isIn(Object.values(PaymentPurpose)),
  body('amount').isFloat({ min: 0 }).toFloat(),
  body('method').isIn(Object.values(PaymentMethod)),
  body('reference').optional({ values: 'null' }).trim(),
  body('note').optional({ values: 'null' }).trim(),
];

// ───────────── items / offers / duty / emergency ─────────────
export const itemDto = (create: boolean) => [
  create ? body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name is required') : body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('section').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('nameEn').optional({ values: 'null' }).trim().isLength({ max: 200 }),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
  money('price'), money('oldPrice'),
  body('currency').optional().trim().isLength({ min: 2, max: 10 }),
  body('unit').optional({ values: 'null' }).trim().isLength({ max: 40 }),
  body('image').optional({ values: 'falsy' }).isURL(),
  body('durationMinutes').optional({ values: 'null' }).isInt({ min: 5, max: 1440 }).toInt(),
  body('isAvailable').optional().isBoolean().toBoolean(),
  body('isPopular').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt({ min: 0 }).toInt(),
];
export const offerDto = (create: boolean) => [
  create ? body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title is required') : body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 3000 }),
  body('image').optional({ values: 'falsy' }).isURL(),
  body('discountPercent').optional({ values: 'null' }).isInt({ min: 1, max: 100 }).toInt(),
  money('price'), money('oldPrice'),
  body('currency').optional().trim().isLength({ min: 2, max: 10 }),
  body('couponCode').optional({ values: 'null' }).trim().isLength({ max: 40 }),
  body('terms').optional({ values: 'null' }).trim().isLength({ max: 2000 }),
  isoDate('startDate', create), isoDate('endDate', create),
  body('isActive').optional().isBoolean().toBoolean(),
];
export const dutiesDto = [
  body('duties').isArray({ max: 120 }),
  body('duties.*.date').matches(DATE_RE).withMessage('date must be YYYY-MM-DD'),
  body('duties.*.startTime').optional({ values: 'null' }).matches(TIME_RE),
  body('duties.*.endTime').optional({ values: 'null' }).matches(TIME_RE),
  body('duties.*.note').optional({ values: 'null' }).isString().isLength({ max: 255 }),
];
export const dutyDateDto = [body('date').matches(DATE_RE), body('businessIds').isArray({ max: 200 }), body('businessIds.*').isUUID()];
export const emergencyDto = (create: boolean) => [
  body('cityId').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  body('type').optional().isIn(Object.values(EmergencyType)),
  create ? body('name').trim().isLength({ min: 2, max: 150 }) : body('name').optional().trim().isLength({ min: 2, max: 150 }),
  body('nameEn').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  create ? body('phone').trim().isLength({ min: 2, max: 30 }) : body('phone').optional().trim().isLength({ min: 2, max: 30 }),
  body('phone2').optional({ values: 'null' }).trim().isLength({ max: 30 }),
  body('note').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('isActive').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt({ min: 0 }).toInt(),
];

// ───────────── listings ─────────────
export const listingDto = (create: boolean) => [
  create ? body('type').isIn(Object.values(ListingType)) : body('type').optional().isIn(Object.values(ListingType)),
  create ? body('purpose').isIn(Object.values(ListingPurpose)) : body('purpose').optional().isIn(Object.values(ListingPurpose)),
  create ? body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters') : body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 8000 }),
  body('price').optional({ values: 'null' }).isFloat({ min: 0 }).toFloat(),
  body('currency').optional().trim().isLength({ min: 2, max: 10 }),
  body('priceNegotiable').optional().isBoolean().toBoolean(),
  body('pricePeriod').optional({ values: 'null' }).isIn(['daily', 'monthly', 'yearly', 'hourly']),
  create ? body('cityId').isInt({ min: 1 }).toInt() : body('cityId').optional().isInt({ min: 1 }).toInt(),
  body('district').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('address').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('latitude').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }).toFloat(),
  body('longitude').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }).toFloat(),
  body('attributes').optional({ values: 'null' }).isObject(),
  optionalPhone('contactPhone'), optionalPhone('whatsapp'),
  body('businessId').optional({ values: 'null' }).isUUID(),
];
export const listingQuery = [
  query('type').optional().isIn(Object.values(ListingType)),
  query('purpose').optional().isIn(Object.values(ListingPurpose)),
  query('cityId').optional().isInt({ min: 1 }).toInt(),
  query('district').optional().trim().isLength({ max: 150 }),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('q').optional().trim().isLength({ max: 120 }),
  query('hasPhotos').optional().isBoolean().toBoolean(),
  query('businessId').optional().isUUID(),
  query('sort').optional().isIn(['newest', 'price_asc', 'price_desc', 'popular']),
  query('status').optional().isIn([...Object.values(ListingStatus), 'all']),
  query('attr').optional().isObject(),
  query('attrMin').optional().isObject(),
  query('attrMax').optional().isObject(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
export const listingOwnerStatusDto = [body('status').isIn([ListingStatus.CLOSED, ListingStatus.ACTIVE])];
export const listingModerateDto = [body('status').isIn(Object.values(ListingStatus)), body('adminNote').optional({ values: 'null' }).trim(), body('isFeatured').optional().isBoolean().toBoolean()];
export const applyDto = [body('message').optional({ values: 'null' }).trim().isLength({ max: 3000 }), optionalPhone('phone'), body('cvUrl').optional({ values: 'falsy' }).isURL()];
export const applicationStatusDto = [body('status').isIn(Object.values(ApplicationStatus))];

// ───────────── service requests ─────────────
export const requestDto = [
  body('categoryId').isInt({ min: 1 }).withMessage('Category is required').toInt(),
  body('subCategoryId').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  body('cityId').isInt({ min: 1 }).withMessage('City is required').toInt(),
  body('district').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Describe what you need (min 10 characters)'),
  money('budget'),
  body('preferredDate').optional({ values: 'falsy' }).matches(DATE_RE),
  optionalPhone('phone'),
  body('sharePhone').optional().isBoolean().toBoolean(),
];
export const requestStatusDto = [body('status').isIn([ServiceRequestStatus.CLOSED, ServiceRequestStatus.CANCELLED, ServiceRequestStatus.OPEN])];
export const quoteDto = [body('businessId').isUUID(), body('price').optional({ values: 'null' }).isFloat({ min: 0 }).toFloat(), body('message').trim().isLength({ min: 5, max: 3000 }).withMessage('Message must be at least 5 characters'), body('etaDays').optional({ values: 'null' }).isInt({ min: 0, max: 365 }).toInt()];
export const quoteDecisionDto = [body('status').isIn([QuoteStatus.ACCEPTED, QuoteStatus.REJECTED])];

// ───────────── bookings ─────────────
export const bookingSettingsDto = [
  body('bookingEnabled').optional().isBoolean().toBoolean(),
  body('bookingMode').optional().isIn(['slot', 'day']),
  body('slotMinutes').optional().isInt({ min: 5, max: 480 }).toInt(),
  body('slotCapacity').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('bookingDaysAhead').optional().isInt({ min: 1, max: 365 }).toInt(),
  body('bookingAutoConfirm').optional().isBoolean().toBoolean(),
  body('bookingNote').optional({ values: 'null' }).trim().isLength({ max: 1000 }),
  body('acceptsQuotes').optional().isBoolean().toBoolean(),
];
export const availabilityQuery = [query('date').matches(DATE_RE).withMessage('date=YYYY-MM-DD is required')];
export const bookDto = [
  body('date').matches(DATE_RE).withMessage('date must be YYYY-MM-DD'),
  body('time').optional({ values: 'null' }).matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('itemId').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  body('partySize').optional().isInt({ min: 1, max: 500 }).toInt(),
  optionalPhone('phone'),
  body('note').optional({ values: 'null' }).trim().isLength({ max: 1000 }),
];
export const appointmentStatusDto = [body('status').isIn(Object.values(AppointmentStatus)), body('ownerNote').optional({ values: 'null' }).trim().isLength({ max: 1000 })];

// ───────────── OTP / devices ─────────────
export const otpRequestDto = [body('phone').trim().isLength({ min: 8, max: 20 }).withMessage('Phone is required')];
export const otpVerifyDto = [
  body('phone').trim().isLength({ min: 8, max: 20 }),
  body('code').trim().matches(/^\d{6}$/).withMessage('Code must be 6 digits'),
  body('firstName').optional().trim().isLength({ min: 2, max: 100 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 100 }),
  body('cityId').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
];
export const deviceDto = [body('token').isString().isLength({ min: 10, max: 300 }), body('platform').optional().isIn(['android', 'ios', 'web']), body('locale').optional().isIn(['ar', 'en'])];
