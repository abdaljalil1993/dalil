import { Request } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/response';
import { body, queryData } from '../middleware/validate';
import { parsePagination, toBool, toInt } from '../utils/pagination';
import { clientIp, userAgent } from '../utils/request';
import { BillingService, EntitlementService, SettingsService } from '../services/BillingService';
import { ExtrasService, ItemInput, OfferInput, assertCanManage } from '../services/ExtrasService';
import { ListingService, ListingFilter, ListingInput } from '../services/ListingService';
import { RequestService, RequestInput } from '../services/RequestService';
import { AppointmentService, BookingSettingsInput } from '../services/AppointmentService';
import { OtpService } from '../services/OtpService';
import { PushService } from '../services/PushService';
import { SitemapService } from '../services/SitemapService';
import { Plan, EmergencyContact } from '../entities';
import { AppointmentStatus, ApplicationStatus, ListingStatus, PaymentStatus, QuoteStatus, ServiceRequestStatus, SubscriptionStatus } from '../entities/enums';

const billing = new BillingService();
const extras = new ExtrasService();
const listings = new ListingService();
const requests = new RequestService();
const appointments = new AppointmentService();
const otp = new OtpService();
const files = (req: Request) => (req.files as Express.Multer.File[]) || [];

// ───────────── settings & billing ─────────────
export const publicSettings = asyncHandler(async (_req, res) => sendSuccess(res, await SettingsService.publicSettings()));
export const getSettings = asyncHandler(async (_req, res) => sendSuccess(res, await SettingsService.all()));
export const updateSettings = asyncHandler(async (req, res) => sendSuccess(res, await SettingsService.update(body(req)), 'Settings saved'));
export const listPlans = asyncHandler(async (req, res) => sendSuccess(res, await billing.listPlans(req.query.all === 'true' && req.user?.role === 'admin')));
export const createPlan = asyncHandler(async (req, res) => sendCreated(res, await billing.savePlan(null, body<Partial<Plan>>(req)), 'Plan created'));
export const updatePlan = asyncHandler(async (req, res) => sendSuccess(res, await billing.savePlan(Number(req.params.id), body<Partial<Plan>>(req)), 'Plan updated'));
export const deletePlan = asyncHandler(async (req, res) => { await billing.deletePlan(Number(req.params.id)); sendSuccess(res, null, 'Plan deleted'); });
export const entitlements = asyncHandler(async (req, res) => { await assertCanManage(req.params.id, req.user!); sendSuccess(res, await EntitlementService.usage(req.params.id)); });
export const requestSubscription = asyncHandler(async (req, res) => sendCreated(res, await billing.requestSubscription(req.user!, body(req)), 'Request sent — we will activate it after confirming the payment'));
export const mySubscriptions = asyncHandler(async (req, res) => sendSuccess(res, await billing.mySubscriptions(req.userId!)));
export const adminSubscriptions = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await billing.listSubscriptions(page, limit, { status: req.query.status as SubscriptionStatus, businessId: req.query.businessId as string });
  sendSuccess(res, r.items, 'Subscriptions', 200, r.meta);
});
export const grantSubscription = asyncHandler(async (req, res) => sendCreated(res, await billing.grant(body(req)), 'Subscription activated'));
export const updateSubscription = asyncHandler(async (req, res) => sendSuccess(res, await billing.updateSubscription(Number(req.params.id), body(req)), 'Subscription updated'));
export const adminPayments = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await billing.listPayments(page, limit, req.query.status as PaymentStatus);
  sendSuccess(res, r.items, 'Payments', 200, r.meta);
});
export const recordPayment = asyncHandler(async (req, res) => sendCreated(res, await billing.recordPayment(body(req)), 'Payment recorded'));
export const decidePayment = asyncHandler(async (req, res) => {
  const { status, adminNote } = body<{ status: PaymentStatus.CONFIRMED | PaymentStatus.REJECTED; adminNote?: string }>(req);
  sendSuccess(res, await billing.decidePayment(Number(req.params.id), status, adminNote), `Payment ${status}`);
});

// ───────────── items & offers ─────────────
export const listItems = asyncHandler(async (req, res) => sendSuccess(res, await extras.listItems(req.params.id, toBool(req.query.all) && Boolean(req.user))));
export const createItem = asyncHandler(async (req, res) => sendCreated(res, await extras.createItem(req.params.id, body<ItemInput>(req), req.user!, req.file), 'Item added'));
export const updateItem = asyncHandler(async (req, res) => sendSuccess(res, await extras.updateItem(Number(req.params.itemId), body<ItemInput>(req), req.user!, req.file), 'Item updated'));
export const deleteItem = asyncHandler(async (req, res) => { await extras.deleteItem(Number(req.params.itemId), req.user!); sendSuccess(res, null, 'Item deleted'); });
export const offersFeed = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await extras.activeOffers({ cityId: toInt(req.query.cityId), categoryId: toInt(req.query.categoryId), page, limit });
  sendSuccess(res, r.items, 'Offers', 200, { total: r.total, page, limit, totalPages: Math.max(1, Math.ceil(r.total / limit)), hasNext: page * limit < r.total });
});
export const businessOffers = asyncHandler(async (req, res) => sendSuccess(res, await extras.businessOffers(req.params.id, req.user)));
export const createOffer = asyncHandler(async (req, res) => sendCreated(res, await extras.createOffer(req.params.id, body<OfferInput>(req), req.user!, req.file), 'Offer published'));
export const updateOffer = asyncHandler(async (req, res) => sendSuccess(res, await extras.updateOffer(Number(req.params.offerId), body<OfferInput>(req), req.user!, req.file), 'Offer updated'));
export const deleteOffer = asyncHandler(async (req, res) => { await extras.deleteOffer(Number(req.params.offerId), req.user!); sendSuccess(res, null, 'Offer deleted'); });

// ───────────── pharmacies & emergency ─────────────
export const onDuty = asyncHandler(async (req, res) => sendSuccess(res, await extras.onDuty({ cityId: toInt(req.query.cityId), date: req.query.date as string | undefined })));
export const businessDuties = asyncHandler(async (req, res) => sendSuccess(res, await extras.businessDuties(req.params.id)));
export const setDuties = asyncHandler(async (req, res) => sendSuccess(res, await extras.setDuties(req.params.id, body<{ duties: never[] }>(req).duties, req.user!), 'Duty schedule saved'));
export const setDutyForDate = asyncHandler(async (req, res) => { const b = body<{ date: string; businessIds: string[] }>(req); sendSuccess(res, await extras.setDutyForDate(b.date, b.businessIds), 'Saved'); });
export const emergency = asyncHandler(async (req, res) => sendSuccess(res, await extras.emergency(toInt(req.query.cityId))));
export const adminEmergency = asyncHandler(async (_req, res) => sendSuccess(res, await extras.adminEmergency()));
export const createEmergency = asyncHandler(async (req, res) => sendCreated(res, await extras.saveEmergency(null, body<Partial<EmergencyContact>>(req)), 'Saved'));
export const updateEmergency = asyncHandler(async (req, res) => sendSuccess(res, await extras.saveEmergency(Number(req.params.id), body<Partial<EmergencyContact>>(req)), 'Saved'));
export const deleteEmergency = asyncHandler(async (req, res) => { await extras.deleteEmergency(Number(req.params.id)); sendSuccess(res, null, 'Deleted'); });

// ───────────── listings ─────────────
const listingFilter = (req: Request): ListingFilter => {
  const q = queryData<ListingFilter>(req);
  const { page, limit } = parsePagination(req);
  return { ...q, page, limit };
};
export const listingFields = asyncHandler(async (_req, res) => sendSuccess(res, listings.fields()));
export const searchListings = asyncHandler(async (req, res) => { const r = await listings.search({ ...listingFilter(req), status: ListingStatus.ACTIVE }, req.user); sendSuccess(res, r.items, 'Listings', 200, r.meta); });
export const myListings = asyncHandler(async (req, res) => { const r = await listings.search({ ...listingFilter(req), userId: req.userId, status: (req.query.status as ListingStatus) || 'all' }, req.user); sendSuccess(res, r.items, 'My listings', 200, r.meta); });
export const adminListings = asyncHandler(async (req, res) => { const r = await listings.search({ ...listingFilter(req), status: (req.query.status as ListingStatus) || 'all' }, req.user); sendSuccess(res, r.items, 'Listings', 200, r.meta); });
export const getListing = asyncHandler(async (req, res) => sendSuccess(res, await listings.get(req.params.slug, req.user)));
export const createListing = asyncHandler(async (req, res) => sendCreated(res, await listings.create(req.user!, body<ListingInput>(req)), 'Listing submitted'));
export const updateListing = asyncHandler(async (req, res) => sendSuccess(res, await listings.update(req.params.id, req.user!, body<ListingInput>(req)), 'Listing updated'));
export const listingOwnerStatus = asyncHandler(async (req, res) => sendSuccess(res, await listings.setOwnerStatus(req.params.id, req.user!, body<{ status: ListingStatus.CLOSED | ListingStatus.ACTIVE }>(req).status), 'Status updated'));
export const deleteListing = asyncHandler(async (req, res) => { await listings.remove(req.params.id, req.user!); sendSuccess(res, null, 'Listing deleted'); });
export const listingImages = asyncHandler(async (req, res) => sendSuccess(res, await listings.addImages(req.params.id, req.user!, files(req)), 'Images uploaded'));
export const listingImageDelete = asyncHandler(async (req, res) => sendSuccess(res, await listings.removeImage(req.params.id, req.user!, Number(req.params.index)), 'Image removed'));
export const moderateListing = asyncHandler(async (req, res) => { const b = body<{ status: ListingStatus; adminNote?: string; isFeatured?: boolean }>(req); sendSuccess(res, await listings.moderate(req.params.id, b.status, b.adminNote, b.isFeatured), 'Listing updated'); });
export const applyJob = asyncHandler(async (req, res) => sendCreated(res, await listings.apply(req.params.id, req.user!, body(req), req.file), 'Application sent'));
export const jobApplications = asyncHandler(async (req, res) => sendSuccess(res, await listings.applicationsFor(req.params.id, req.user!)));
export const myApplications = asyncHandler(async (req, res) => sendSuccess(res, await listings.myApplications(req.userId!)));
export const applicationStatus = asyncHandler(async (req, res) => sendSuccess(res, await listings.setApplicationStatus(Number(req.params.id), req.user!, body<{ status: ApplicationStatus }>(req).status), 'Updated'));

// ───────────── service requests ─────────────
export const createRequest = asyncHandler(async (req, res) => sendCreated(res, await requests.create(req.user!, body<RequestInput>(req), files(req)), 'Request published — matching businesses were notified'));
export const myRequests = asyncHandler(async (req, res) => { const { page, limit } = parsePagination(req); const r = await requests.mine(req.userId!, page, limit); sendSuccess(res, r.items, 'My requests', 200, r.meta); });
export const requestsInbox = asyncHandler(async (req, res) => { const { page, limit } = parsePagination(req); const r = await requests.inbox(req.user!, page, limit); sendSuccess(res, r.items, 'Requests for my businesses', 200, { ...r.meta, businesses: r.businesses } as never); });
export const getRequest = asyncHandler(async (req, res) => sendSuccess(res, await requests.get(Number(req.params.id), req.user!)));
export const requestStatus = asyncHandler(async (req, res) => sendSuccess(res, await requests.setStatus(Number(req.params.id), req.user!, body<{ status: ServiceRequestStatus.CLOSED }>(req).status), 'Updated'));
export const sendQuote = asyncHandler(async (req, res) => sendCreated(res, await requests.sendQuote(Number(req.params.id), req.user!, body(req)), 'Quote sent'));
export const decideQuote = asyncHandler(async (req, res) => sendSuccess(res, await requests.decideQuote(Number(req.params.id), req.user!, body<{ status: QuoteStatus.ACCEPTED }>(req).status), 'Updated'));
export const withdrawQuote = asyncHandler(async (req, res) => { await requests.withdrawQuote(Number(req.params.id), req.user!); sendSuccess(res, null, 'Quote withdrawn'); });
export const adminRequests = asyncHandler(async (req, res) => { const { page, limit } = parsePagination(req); const r = await requests.adminList(page, limit, req.query.status as ServiceRequestStatus); sendSuccess(res, r.items, 'Requests', 200, r.meta); });

// ───────────── bookings ─────────────
export const bookingSettings = asyncHandler(async (req, res) => sendSuccess(res, await appointments.updateSettings(req.params.id, req.user!, body<BookingSettingsInput>(req)), 'Settings saved'));
export const availability = asyncHandler(async (req, res) => sendSuccess(res, await appointments.availability(req.params.id, req.query.date as string)));
export const book = asyncHandler(async (req, res) => sendCreated(res, await appointments.book(req.params.id, req.user!, body(req)), 'Booking sent'));
export const myAppointments = asyncHandler(async (req, res) => sendSuccess(res, await appointments.mine(req.userId!, req.query.all !== 'true')));
export const ownerAppointments = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req, 50);
  const r = await appointments.forOwner(req.user!, { businessId: req.query.businessId as string, date: req.query.date as string, status: req.query.status as AppointmentStatus, page, limit });
  sendSuccess(res, r.items, 'Appointments', 200, r.meta);
});
export const appointmentStatus = asyncHandler(async (req, res) => { const b = body<{ status: AppointmentStatus; ownerNote?: string }>(req); sendSuccess(res, await appointments.setStatus(Number(req.params.id), req.user!, b.status, b.ownerNote), 'Updated'); });

// ───────────── OTP / devices / sitemap ─────────────
export const otpRequest = asyncHandler(async (req, res) => sendSuccess(res, await otp.request(body<{ phone: string }>(req).phone, clientIp(req)), 'Code sent'));
export const otpVerify = asyncHandler(async (req, res) => sendSuccess(res, await otp.verify(body(req), { ip: clientIp(req), userAgent: userAgent(req) }), 'Signed in'));
export const verifyMyPhone = asyncHandler(async (req, res) => { const b = body<{ phone: string; code: string }>(req); sendSuccess(res, await otp.verifyForUser(req.user!, b.phone, b.code), 'Phone verified'); });
export const registerDevice = asyncHandler(async (req, res) => { const b = body<{ token: string; platform?: string; locale?: string }>(req); await PushService.register(req.userId!, b.token, b.platform, b.locale); sendSuccess(res, null, 'Device registered'); });
export const unregisterDevice = asyncHandler(async (req, res) => { await PushService.unregister(req.params.token); sendSuccess(res, null, 'Device removed'); });
export const sitemap = asyncHandler(async (_req, res) => { res.type('application/xml').send(await SitemapService.xml()); });
