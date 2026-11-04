import * as P from '../controllers/PromotionController';
import * as ED from '../dtos/engagement.dto';
import { intParam, paginationQuery } from '../dtos/common';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { isAdmin, isUser } from '../middleware/authorize';
import { uploadSingle } from '../middleware/upload';
import { writeRateLimiter } from '../middleware/rateLimiter';
import { audit } from '../middleware/auditLogger';
import { createDocumentedRouter } from '../docs/registry';

const ads = createDocumentedRouter('/advertisements', 'Advertisements');
ads.get('/active', { summary: 'Active ads', access: 'public', query: { placement: 'home_slider|homepage_banner|search_results|category_page|business_details|sidebar', cityId: '', categoryId: '' } }, ED.adsQuery, validate, P.activeAds);
ads.post('/:id/click', { summary: 'Track click', access: 'public' }, intParam(), validate, P.adClick);
ads.post('/:id/impression', { summary: 'Track impression', access: 'public' }, intParam(), validate, P.adImpression);
ads.get('/my', { summary: 'My ad requests', access: 'user' }, authenticate, P.myAds);
ads.post('/request', { summary: 'Request an ad (owner) - pending until admin activates', access: 'user', multipart: { image: 'banner image file', title: 'text', placement: 'home_slider', startDate: 'ISO', endDate: 'ISO', businessId: 'uuid', contactPhone: '' } }, authenticate, isUser, writeRateLimiter, uploadSingle, ED.requestAdDto, validate, P.requestAd);
ads.get('/', { summary: 'All ads', access: 'admin', query: { status: '', placement: '' } }, authenticate, isAdmin, ED.adsQuery, paginationQuery, validate, P.adminAds);
ads.post('/', { summary: 'Create ad (JSON or multipart with "image")', access: 'admin', body: { title: 'عرض خاص', placement: 'home_slider', startDate: '2026-11-01', endDate: '2026-12-01', targetUrl: 'https://...', imageUrl: 'https://...', priority: 10, cityId: null, categoryId: null, businessId: null, status: 'active' } }, authenticate, isAdmin, uploadSingle, ED.createAdDto, validate, audit('ad.create', 'advertisement'), P.createAd);
ads.put('/:id', { summary: 'Update ad / approve request (status=active)', access: 'admin' }, authenticate, isAdmin, intParam(), uploadSingle, ED.updateAdDto, validate, audit('ad.update', 'advertisement'), P.updateAd);
ads.delete('/:id', { summary: 'Delete ad', access: 'admin' }, authenticate, isAdmin, intParam(), validate, audit('ad.delete', 'advertisement'), P.deleteAd);

const featured = createDocumentedRouter('/featured', 'Featured (paid placement)');
featured.get('/active', { summary: 'Currently featured businesses', access: 'public', query: { cityId: '', categoryId: '' } }, ED.adsQuery, validate, P.activeFeatured);
featured.get('/my', { summary: 'My featured requests', access: 'user' }, authenticate, P.myFeatured);
featured.post('/request', { summary: 'Request featuring my business', access: 'user', body: { businessId: 'uuid', startDate: '2026-11-01', endDate: '2026-12-01', note: 'أرغب بباقة شهر' } }, authenticate, isUser, writeRateLimiter, ED.requestFeaturedDto, validate, P.requestFeatured);
featured.get('/', { summary: 'All featured entries', access: 'admin', query: { status: 'pending|active|rejected|expired' } }, authenticate, isAdmin, paginationQuery, validate, P.adminFeatured);
featured.post('/', { summary: 'Feature a business', access: 'admin', body: { businessId: 'uuid', startDate: '2026-11-01', endDate: '2026-12-01', priority: 5, price: 50000 } }, authenticate, isAdmin, ED.createFeaturedDto, validate, audit('featured.create', 'featured'), P.addFeatured);
featured.put('/:id', { summary: 'Update / approve request', access: 'admin', body: { status: 'active' } }, authenticate, isAdmin, intParam(), ED.updateFeaturedDto, validate, audit('featured.update', 'featured'), P.updateFeatured);
featured.delete('/:id', { summary: 'Remove featured entry', access: 'admin' }, authenticate, isAdmin, intParam(), validate, audit('featured.delete', 'featured'), P.removeFeatured);

const admin = createDocumentedRouter('/admin', 'Admin dashboard');
admin.get('/dashboard/stats', { summary: 'Totals, pending actions, 12-month charts, top/recent businesses', access: 'admin' }, authenticate, isAdmin, P.stats);
admin.get('/dashboard/searches', { summary: 'Top searches & zero-result searches', access: 'admin', query: { days: '30' } }, authenticate, isAdmin, P.searchInsights);
admin.get('/audit-logs', { summary: 'Audit trail of write actions', access: 'admin', query: { action: '', userId: '' } }, authenticate, isAdmin, paginationQuery, validate, P.auditLogs);

export const adRouter = ads.router;
export const featuredRouter = featured.router;
export const adminRouter = admin.router;
