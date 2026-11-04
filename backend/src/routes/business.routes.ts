import * as B from '../controllers/BusinessController';
import * as E from '../controllers/EngagementController';
import * as D from '../dtos/business.dto';
import * as ED from '../dtos/engagement.dto';
import { uuidParam, intParam, paginationQuery } from '../dtos/common';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/authenticate';
import { isAdmin, isUser } from '../middleware/authorize';
import { uploadMultiple, uploadSingle } from '../middleware/upload';
import { uploadRateLimiter, writeRateLimiter } from '../middleware/rateLimiter';
import { audit } from '../middleware/auditLogger';
import { createDocumentedRouter } from '../docs/registry';

const r = createDocumentedRouter('/businesses', 'Businesses');

const FILTERS = {
  categoryId: 'number', subCategoryId: 'number', cityId: 'number', district: 'text', minRating: '0-5', priceRange: '1-4',
  openNow: 'true', verified: 'true', featured: 'true', hasPhotos: 'true', lat: 'user latitude', lng: 'user longitude', radius: 'km',
  sort: 'relevance|rating|reviews|newest|distance|name|popular', page: '1..', limit: '1..100',
};

const SAMPLE = {
  name: 'عيادة د. أحمد للعيون', nameEn: 'Dr. Ahmad Eye Clinic', categoryId: 1, subCategoryId: 3, cityId: 1,
  shortDescription: 'استشاري طب وجراحة العيون', description: '...', address: 'شارع بغداد، بناء 12', district: 'الزراعة',
  latitude: 35.5317, longitude: 35.7915, phone: '041 123 456', whatsapp: '+963991234567', website: 'https://example.com',
  socialLinks: { facebook: 'https://facebook.com/...' }, priceRange: 2, attributes: { specialty: 'جراحة الشبكية', experienceYears: 15 },
  amenities: ['parking', 'card_payment'], tags: ['عيون', 'ليزر'], isOwner: true,
  workingHours: [{ dayOfWeek: 0, openTime: '09:00', closeTime: '17:00' }, { dayOfWeek: 5, isClosed: true }],
};

// Discovery
r.get('/', { summary: 'Browse approved businesses (filters, no text search)', access: 'optional', query: FILTERS, notes: 'Paid (featured) businesses are listed first except when sort=distance.' }, optionalAuth, D.listQuery, validate, B.browse);
r.get('/search', { summary: 'Search (text + filters + geo) - logs the query', access: 'user', query: { q: 'e.g. "طبيب عيون"', ...FILTERS }, notes: 'Arabic-normalized, matches name, description, tags, category/sub-category synonyms, district, city.' }, authenticate, isUser, D.searchQuery, validate, B.search);
r.get('/suggest', { summary: 'Autocomplete (businesses, categories, sub-categories)', access: 'user', query: { q: 'text', cityId: 'number' } }, authenticate, isUser, D.suggestQuery, validate, B.suggest);

// Owner & admin lists (must be declared before /:slug)
r.get('/my', { summary: 'My businesses (all statuses)', access: 'user', query: { status: 'pending|approved|rejected|suspended' } }, authenticate, isUser, paginationQuery, validate, B.mine);
r.get('/admin/all', { summary: 'All businesses for moderation', access: 'admin', query: { status: 'pending|approved|rejected|suspended|all', q: 'text', ownerId: 'uuid', ...FILTERS } }, authenticate, isAdmin, D.adminListQuery, validate, B.adminList);
r.get('/manage/:id', { summary: 'Full business record for editing (owner/admin)', access: 'owner' }, authenticate, uuidParam(), validate, B.getManaged);

// Details
r.get('/:slug', { summary: 'Business details by slug or id (+ ratingBreakdown, viewer.isFavorite, viewer.myReview)', access: 'optional' }, optionalAuth, B.getOne);
r.get('/:slug/related', { summary: 'Similar businesses', access: 'public' }, B.related);
r.post('/:id/track', { summary: 'Track contact click (phone/whatsapp/directions/website)', access: 'public', body: { type: 'phone' } }, uuidParam(), D.trackDto, validate, B.track);

// Create / update
r.post('/', { summary: 'Submit a business (pending review). Admin → published directly. isOwner=false → suggestion', access: 'user', body: SAMPLE }, authenticate, isUser, writeRateLimiter, D.createBusinessDto, validate, audit('business.create', 'business'), B.create);
r.put('/:id', { summary: 'Update business (owner/admin)', access: 'owner', body: { ...SAMPLE, isOwner: undefined } }, authenticate, uuidParam(), D.updateBusinessDto, validate, audit('business.update', 'business'), B.update);
r.delete('/:id', { summary: 'Delete business (owner/admin)', access: 'owner' }, authenticate, uuidParam(), validate, audit('business.delete', 'business'), B.remove);
r.get('/:id/stats', { summary: 'Business analytics (views, clicks, ratings)', access: 'owner' }, authenticate, uuidParam(), validate, B.stats);

// Admin moderation
r.patch('/:id/status', { summary: 'Approve / reject / suspend', access: 'admin', body: { status: 'approved', adminNote: 'optional reason' } }, authenticate, isAdmin, uuidParam(), D.setStatusDto, validate, audit('business.status', 'business'), B.setStatus);
r.patch('/:id/approve', { summary: 'Alias of /status (backward compatible)', access: 'admin', body: { status: 'approved' } }, authenticate, isAdmin, uuidParam(), D.setStatusDto, validate, audit('business.status', 'business'), B.setStatus);
r.patch('/:id/flags', { summary: 'Set verified / active / owner', access: 'admin', body: { isVerified: true, isActive: true, ownerId: 'uuid' } }, authenticate, isAdmin, uuidParam(), D.setFlagsDto, validate, audit('business.flags', 'business'), B.setFlags);

// Media
r.post('/:id/images', { summary: 'Upload gallery images', access: 'owner', multipart: { images: 'Up to 10 image files per request' } }, authenticate, uuidParam(), validate, uploadRateLimiter, uploadMultiple, B.addImages);
r.delete('/:id/images/:imageId', { summary: 'Delete gallery image', access: 'owner' }, authenticate, uuidParam(), intParam('imageId'), validate, B.removeImage);
r.patch('/:id/images/:imageId/primary', { summary: 'Set primary image', access: 'owner' }, authenticate, uuidParam(), intParam('imageId'), validate, B.setPrimaryImage);
r.post('/:id/cover', { summary: 'Upload cover image', access: 'owner', multipart: { image: 'Image file' } }, authenticate, uuidParam(), validate, uploadRateLimiter, uploadSingle, B.setCover);
r.post('/:id/logo', { summary: 'Upload logo', access: 'owner', multipart: { image: 'Image file' } }, authenticate, uuidParam(), validate, uploadRateLimiter, uploadSingle, B.setLogo);

// Working hours
r.put('/:id/hours', { summary: 'Replace working hours (dayOfWeek 0=Sunday)', access: 'owner', body: { hours: SAMPLE.workingHours } }, authenticate, uuidParam(), D.setHoursDto, validate, B.setHours);
r.post('/:id/hours', { summary: 'Alias of PUT /hours', access: 'owner', body: { hours: SAMPLE.workingHours } }, authenticate, uuidParam(), D.setHoursDto, validate, B.setHours);

// Reviews / reports / claims on a business
r.get('/:businessId/reviews', { summary: 'Business reviews', access: 'optional', query: { sort: 'newest|oldest|highest|lowest|helpful', rating: '1-5', page: '', limit: '' } }, optionalAuth, uuidParam('businessId'), ED.reviewListQuery, paginationQuery, validate, E.businessReviews);
r.post('/:businessId/reviews', { summary: 'Rate & review (one per user, edit via PUT /reviews/:id)', access: 'user', body: { rating: 5, content: 'خدمة ممتازة' } }, authenticate, isUser, writeRateLimiter, uuidParam('businessId'), ED.createReviewDto, validate, E.createReview);
r.post('/:businessId/reports', { summary: 'Report wrong info / spam / fake review', access: 'user', body: { type: 'wrong_info', description: 'رقم الهاتف خاطئ', reviewId: null } }, authenticate, isUser, writeRateLimiter, uuidParam('businessId'), ED.createReportDto, validate, E.createReport);
r.post('/:businessId/claim', { summary: 'Claim ownership of a listing added by admin', access: 'user', body: { message: 'أنا صاحب العيادة', phone: '+963...', proofUrl: null } }, authenticate, isUser, writeRateLimiter, uuidParam('businessId'), ED.createClaimDto, validate, E.createClaim);

export default r.router;
