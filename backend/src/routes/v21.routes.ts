import * as C from '../controllers/V21Controller';
import * as D from '../dtos/v21.dto';
import { intParam, paginationQuery, uuidParam } from '../dtos/common';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/authenticate';
import { isAdmin, isUser } from '../middleware/authorize';
import { upload, uploadMultiple, uploadSingle } from '../middleware/upload';
import { authRateLimiter, uploadRateLimiter, writeRateLimiter } from '../middleware/rateLimiter';
import { audit } from '../middleware/auditLogger';
import { createDocumentedRouter } from '../docs/registry';

// ───────────── settings / plans / subscriptions / payments ─────────────
const billing = createDocumentedRouter('/billing', 'Billing & plans');
billing.get('/settings/public', { summary: 'Public settings (billingEnabled, support contacts, payment instructions)', access: 'public' }, C.publicSettings);
billing.get('/settings', { summary: 'All platform settings', access: 'admin' }, authenticate, isAdmin, C.getSettings);
billing.put('/settings', { summary: 'Update settings — billingEnabled=true starts enforcing plan limits', access: 'admin', body: { billingEnabled: false, paymentInstructions: '...', listingsRequireApproval: true, listingDurationDays: 60 } }, authenticate, isAdmin, D.settingsDto, validate, audit('settings.update', 'settings'), C.updateSettings);
billing.get('/plans', { summary: 'Plans (all=true for admin to include inactive)', access: 'optional' }, optionalAuth, C.listPlans);
billing.post('/plans', { summary: 'Create plan', access: 'admin', body: { code: 'gold', name: 'الذهبية', priceMonthly: 100000, priceYearly: 1000000, features: { maxImages: 30, maxItems: -1, maxActiveOffers: 10, maxActiveListings: 20, bookings: true, quotes: true, advancedStats: true, verifiedBadge: true, priorityBoost: 20, featuredDaysPerMonth: 7, socialLinks: true, whatsappButton: true } } }, authenticate, isAdmin, D.planDto(true), validate, audit('plan.create', 'plan'), C.createPlan);
billing.put('/plans/:id', { summary: 'Update plan', access: 'admin' }, authenticate, isAdmin, intParam(), D.planDto(false), validate, audit('plan.update', 'plan'), C.updatePlan);
billing.delete('/plans/:id', { summary: 'Delete plan (only if unused)', access: 'admin' }, authenticate, isAdmin, intParam(), validate, C.deletePlan);
billing.get('/subscriptions/my', { summary: 'My subscription requests & history', access: 'user' }, authenticate, C.mySubscriptions);
billing.post('/subscriptions/request', { summary: 'Owner requests a plan (pending until payment confirmed)', access: 'user', body: { businessId: 'uuid', planId: 2, period: 'monthly', method: 'sham_cash', reference: 'TX123', note: '' } }, authenticate, isUser, writeRateLimiter, D.subscriptionRequestDto, validate, C.requestSubscription);
billing.get('/subscriptions', { summary: 'All subscriptions', access: 'admin', query: { status: 'pending|active|expired|cancelled', businessId: 'uuid' } }, authenticate, isAdmin, paginationQuery, validate, C.adminSubscriptions);
billing.post('/subscriptions', { summary: 'Grant a subscription directly', access: 'admin', body: { businessId: 'uuid', planId: 2, period: 'monthly', amount: 50000, method: 'cash' } }, authenticate, isAdmin, D.grantDto, validate, audit('subscription.grant', 'subscription'), C.grantSubscription);
billing.patch('/subscriptions/:id', { summary: 'Update subscription (status / endDate / plan)', access: 'admin' }, authenticate, isAdmin, intParam(), D.updateSubscriptionDto, validate, audit('subscription.update', 'subscription'), C.updateSubscription);
billing.get('/payments', { summary: 'Payments ledger', access: 'admin', query: { status: 'pending|confirmed|rejected' } }, authenticate, isAdmin, paginationQuery, validate, C.adminPayments);
billing.post('/payments', { summary: 'Record a manual payment (featured, ad, other)', access: 'admin', body: { businessId: 'uuid', purpose: 'featured', amount: 25000, method: 'sham_cash', reference: '' } }, authenticate, isAdmin, D.recordPaymentDto, validate, audit('payment.record', 'payment'), C.recordPayment);
billing.patch('/payments/:id', { summary: 'Confirm (activates subscription) / reject payment', access: 'admin', body: { status: 'confirmed', adminNote: '' } }, authenticate, isAdmin, intParam(), D.decidePaymentDto, validate, audit('payment.decide', 'payment'), C.decidePayment);

// ───────────── per-business extras ─────────────
const biz = createDocumentedRouter('/businesses', 'Business extras');
biz.get('/:id/entitlements', { summary: 'Current plan, features & usage of a business', access: 'owner' }, authenticate, uuidParam(), validate, C.entitlements);
biz.get('/:id/items', { summary: 'Menu / products / services grouped by section (all=true for owner incl. hidden)', access: 'optional' }, optionalAuth, uuidParam(), validate, C.listItems);
biz.post('/:id/items', { summary: 'Add item (JSON or multipart with "image")', access: 'owner', body: { section: 'مشاوي', name: 'شيش طاووق', description: '...', price: 45000, oldPrice: null, unit: 'للسيخ', durationMinutes: null, isPopular: true } }, authenticate, uuidParam(), validate, uploadSingle, D.itemDto(true), validate, C.createItem);
biz.put('/:id/items/:itemId', { summary: 'Update item', access: 'owner' }, authenticate, uuidParam(), intParam('itemId'), validate, uploadSingle, D.itemDto(false), validate, C.updateItem);
biz.delete('/:id/items/:itemId', { summary: 'Delete item', access: 'owner' }, authenticate, uuidParam(), intParam('itemId'), validate, C.deleteItem);
biz.get('/:id/offers', { summary: 'Business offers (owner sees all incl. expired)', access: 'optional' }, optionalAuth, uuidParam(), validate, C.businessOffers);
biz.post('/:id/offers', { summary: 'Publish offer (JSON or multipart with "image")', access: 'owner', body: { title: 'خصم 20%', description: '...', discountPercent: 20, startDate: '2026-11-01', endDate: '2026-11-30', couponCode: 'DALIL20' } }, authenticate, uuidParam(), validate, uploadSingle, D.offerDto(true), validate, C.createOffer);
biz.put('/:id/offers/:offerId', { summary: 'Update offer', access: 'owner' }, authenticate, uuidParam(), intParam('offerId'), validate, uploadSingle, D.offerDto(false), validate, C.updateOffer);
biz.delete('/:id/offers/:offerId', { summary: 'Delete offer', access: 'owner' }, authenticate, uuidParam(), intParam('offerId'), validate, C.deleteOffer);
biz.get('/:id/duties', { summary: 'Upcoming on-duty dates of a pharmacy', access: 'public' }, uuidParam(), validate, C.businessDuties);
biz.put('/:id/duties', { summary: 'Replace upcoming on-duty dates', access: 'owner', body: { duties: [{ date: '2026-11-07', startTime: '20:00', endTime: '08:00', note: '' }] } }, authenticate, uuidParam(), D.dutiesDto, validate, C.setDuties);
biz.put('/:id/booking-settings', { summary: 'Enable bookings / quotes and configure slots', access: 'owner', body: { bookingEnabled: true, bookingMode: 'slot', slotMinutes: 30, slotCapacity: 1, bookingDaysAhead: 30, bookingAutoConfirm: false, acceptsQuotes: true } }, authenticate, uuidParam(), D.bookingSettingsDto, validate, C.bookingSettings);
biz.get('/:id/availability', { summary: 'Free slots for a date', access: 'public', query: { date: 'YYYY-MM-DD' } }, uuidParam(), D.availabilityQuery, validate, C.availability);
biz.post('/:id/appointments', { summary: 'Book an appointment / day', access: 'user', body: { date: '2026-11-08', time: '10:30', itemId: null, partySize: 1, note: '' } }, authenticate, isUser, writeRateLimiter, uuidParam(), D.bookDto, validate, C.book);

// ───────────── offers feed ─────────────
const offers = createDocumentedRouter('/offers', 'Offers');
offers.get('/', { summary: 'Active offers & discounts', access: 'public', query: { cityId: '', categoryId: '', page: '', limit: '' } }, C.offersFeed);

// ───────────── pharmacies & emergency ─────────────
const pharm = createDocumentedRouter('/pharmacies', 'Pharmacies on duty');
pharm.get('/on-duty', { summary: 'On-duty pharmacies for a date (default today)', access: 'public', query: { cityId: '', date: 'YYYY-MM-DD' } }, C.onDuty);
pharm.put('/on-duty', { summary: 'Set on-duty pharmacies for a date (bulk)', access: 'admin', body: { date: '2026-11-07', businessIds: ['uuid'] } }, authenticate, isAdmin, D.dutyDateDto, validate, audit('duty.bulk', 'pharmacy'), C.setDutyForDate);

const emerg = createDocumentedRouter('/emergency', 'Emergency numbers');
emerg.get('/', { summary: 'Emergency & public service numbers (nationwide + city)', access: 'public', query: { cityId: '' } }, C.emergency);
emerg.get('/admin', { summary: 'All numbers', access: 'admin' }, authenticate, isAdmin, C.adminEmergency);
emerg.post('/', { summary: 'Add number', access: 'admin', body: { cityId: null, type: 'ambulance', name: 'الإسعاف', phone: '110' } }, authenticate, isAdmin, D.emergencyDto(true), validate, C.createEmergency);
emerg.put('/:id', { summary: 'Update number', access: 'admin' }, authenticate, isAdmin, intParam(), D.emergencyDto(false), validate, C.updateEmergency);
emerg.delete('/:id', { summary: 'Delete number', access: 'admin' }, authenticate, isAdmin, intParam(), validate, C.deleteEmergency);

// ───────────── listings: real estate, cars, jobs ─────────────
const L = createDocumentedRouter('/listings', 'Listings (real estate, cars, jobs)');
const LQ = { type: 'real_estate|car|job|other', purpose: 'sale|rent|hire|wanted', cityId: '', district: '', minPrice: '', maxPrice: '', q: 'text (signed-in only)', 'attr[rooms]': 'exact / contains', 'attrMin[year]': 'min', 'attrMax[mileageKm]': 'max', hasPhotos: 'true', sort: 'newest|price_asc|price_desc|popular', page: '', limit: '' };
L.get('/fields', { summary: 'Field definitions per type (build forms & filters from it)', access: 'public' }, C.listingFields);
L.get('/', { summary: 'Browse active listings with filters', access: 'optional', query: LQ }, optionalAuth, D.listingQuery, validate, C.searchListings);
L.get('/my', { summary: 'My listings (all statuses)', access: 'user', query: { type: '', status: '' } }, authenticate, D.listingQuery, validate, C.myListings);
L.get('/admin/all', { summary: 'All listings for moderation', access: 'admin', query: { ...LQ, status: 'pending|active|rejected|closed|expired|all' } }, authenticate, isAdmin, D.listingQuery, validate, C.adminListings);
L.get('/applications/my', { summary: 'My job applications', access: 'user' }, authenticate, C.myApplications);
L.patch('/applications/:id', { summary: 'Update applicant status (job owner)', access: 'user', body: { status: 'shortlisted' } }, authenticate, intParam(), D.applicationStatusDto, validate, C.applicationStatus);
L.get('/:slug', { summary: 'Listing details by slug or id', access: 'optional' }, optionalAuth, C.getListing);
L.post('/', { summary: 'Post a listing (pending review if enabled)', access: 'user', body: { type: 'real_estate', purpose: 'rent', title: 'شقة 3 غرف مفروشة', description: '...', price: 1500000, pricePeriod: 'monthly', cityId: 6, district: 'الزراعة', attributes: { propertyType: 'apartment', rooms: 3, bathrooms: 2, area: 140, floor: 2, furnished: true, ownership: 'green_deed', hasSolar: true }, contactPhone: '0944...', businessId: null } }, authenticate, isUser, writeRateLimiter, D.listingDto(true), validate, C.createListing);
L.put('/:id', { summary: 'Update my listing', access: 'user' }, authenticate, uuidParam(), D.listingDto(false), validate, C.updateListing);
L.patch('/:id/status', { summary: 'Close (sold/rented/filled) or re-open', access: 'user', body: { status: 'closed' } }, authenticate, uuidParam(), D.listingOwnerStatusDto, validate, C.listingOwnerStatus);
L.delete('/:id', { summary: 'Delete my listing', access: 'user' }, authenticate, uuidParam(), validate, C.deleteListing);
L.post('/:id/images', { summary: 'Upload images (field "images", max 15 total)', access: 'user', multipart: { images: 'image files' } }, authenticate, uuidParam(), validate, uploadRateLimiter, uploadMultiple, C.listingImages);
L.delete('/:id/images/:index', { summary: 'Remove image by index', access: 'user' }, authenticate, uuidParam(), validate, C.listingImageDelete);
L.patch('/:id/moderate', { summary: 'Approve / reject / feature', access: 'admin', body: { status: 'active', adminNote: '', isFeatured: false } }, authenticate, isAdmin, uuidParam(), D.listingModerateDto, validate, audit('listing.moderate', 'listing'), C.moderateListing);
L.post('/:id/apply', { summary: 'Apply to a job (JSON or multipart with "image" = CV image)', access: 'user', body: { message: 'أرغب بالتقدم...', phone: '0944...', cvUrl: null } }, authenticate, isUser, writeRateLimiter, uuidParam(), validate, upload.single('image'), D.applyDto, validate, C.applyJob);
L.get('/:id/applications', { summary: 'Applicants of my job post', access: 'user' }, authenticate, uuidParam(), validate, C.jobApplications);

// ───────────── service requests & quotes ─────────────
const R = createDocumentedRouter('/service-requests', 'Service requests & quotes');
R.post('/', { summary: 'Request a service — matching businesses are notified (multipart "images" optional)', access: 'user', body: { categoryId: 9, subCategoryId: 46, cityId: 6, district: 'الزراعة', title: 'تركيب منظومة طاقة شمسية', description: 'منزل 3 غرف، بدي ألواح وبطارية ليثيوم...', budget: 15000000, preferredDate: '2026-11-10', sharePhone: true } }, authenticate, isUser, writeRateLimiter, uploadMultiple, D.requestDto, validate, C.createRequest);
R.get('/my', { summary: 'My requests', access: 'user' }, authenticate, paginationQuery, validate, C.myRequests);
R.get('/inbox', { summary: 'Open requests matching my businesses', access: 'user' }, authenticate, paginationQuery, validate, C.requestsInbox);
R.get('/admin/all', { summary: 'All requests', access: 'admin', query: { status: '' } }, authenticate, isAdmin, paginationQuery, validate, C.adminRequests);
R.get('/:id', { summary: 'Request details + quotes', access: 'user' }, authenticate, intParam(), validate, C.getRequest);
R.patch('/:id/status', { summary: 'Close / cancel / re-open my request', access: 'user', body: { status: 'closed' } }, authenticate, intParam(), D.requestStatusDto, validate, C.requestStatus);
R.post('/:id/quotes', { summary: 'Send / update a quote from my business', access: 'owner', body: { businessId: 'uuid', price: 14000000, message: 'نركّب خلال يومين مع ضمان سنة', etaDays: 2 } }, authenticate, intParam(), D.quoteDto, validate, C.sendQuote);
R.patch('/quotes/:id', { summary: 'Accept / reject a quote (request owner)', access: 'user', body: { status: 'accepted' } }, authenticate, intParam(), D.quoteDecisionDto, validate, C.decideQuote);
R.delete('/quotes/:id', { summary: 'Withdraw my quote', access: 'owner' }, authenticate, intParam(), validate, C.withdrawQuote);

// ───────────── appointments ─────────────
const A = createDocumentedRouter('/appointments', 'Appointments');
A.get('/my', { summary: 'My bookings (upcoming; all=true for history)', access: 'user' }, authenticate, C.myAppointments);
A.get('/owner', { summary: 'Bookings of my businesses', access: 'owner', query: { businessId: '', date: 'YYYY-MM-DD', status: '' } }, authenticate, C.ownerAppointments);
A.patch('/:id/status', { summary: 'Owner: confirm/reject/complete/no_show · Customer: cancel', access: 'user', body: { status: 'confirmed', ownerNote: '' } }, authenticate, intParam(), D.appointmentStatusDto, validate, C.appointmentStatus);

// ───────────── OTP & devices ─────────────
const O = createDocumentedRouter('/auth/otp', 'Auth');
O.post('/request', { summary: 'Send a 6-digit code by SMS (dev: returned as devCode)', access: 'public', body: { phone: '0944123456' } }, authRateLimiter, D.otpRequestDto, validate, C.otpRequest);
O.post('/verify', { summary: 'Verify code → tokens (creates account if new: firstName/lastName required)', access: 'public', body: { phone: '0944123456', code: '123456', firstName: 'فادي', lastName: 'علي', cityId: 6 } }, authRateLimiter, D.otpVerifyDto, validate, C.otpVerify);
O.post('/verify-phone', { summary: 'Signed-in user verifies/changes phone', access: 'user', body: { phone: '0944123456', code: '123456' } }, authenticate, D.otpVerifyDto, validate, C.verifyMyPhone);

const DV = createDocumentedRouter('/devices', 'Notifications');
DV.post('/', { summary: 'Register FCM token for push notifications', access: 'user', body: { token: 'fcm-token', platform: 'android', locale: 'ar' } }, authenticate, D.deviceDto, validate, C.registerDevice);
DV.delete('/:token', { summary: 'Unregister FCM token (on logout)', access: 'user' }, authenticate, C.unregisterDevice);

export const v21Routers = { billing: billing.router, biz: biz.router, offers: offers.router, pharm: pharm.router, emerg: emerg.router, listings: L.router, requests: R.router, appointments: A.router, otp: O.router, devices: DV.router };
export const sitemapHandler = C.sitemap;
