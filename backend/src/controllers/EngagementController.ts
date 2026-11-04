import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/response';
import { body, queryData } from '../middleware/validate';
import { parsePagination, toBool, toInt } from '../utils/pagination';
import { ReviewService, ReviewSort } from '../services/ReviewService';
import { FavoriteService } from '../services/FavoriteService';
import { ModerationService } from '../services/ModerationService';
import { NotificationService } from '../services/NotificationService';
import { ContactService } from '../services/ContactService';
import { ClaimStatus, ReportStatus, ReportType } from '../entities/enums';

const reviews = new ReviewService();
const favorites = new FavoriteService();
const moderation = new ModerationService();
const contact = new ContactService();

// ───────────── Reviews ─────────────
export const businessReviews = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req, 10);
  const q = queryData<{ sort?: ReviewSort; rating?: number }>(req);
  const r = await reviews.listForBusiness(req.params.businessId, page, limit, q.sort, q.rating, req.user);
  sendSuccess(res, r.items, 'Reviews', 200, r.meta);
});
export const myReviews = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await reviews.listMine(req.userId!, page, limit);
  sendSuccess(res, r.items, 'My reviews', 200, r.meta);
});
export const ownerReviews = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await reviews.listForOwner(req.userId!, page, limit, {
    businessId: req.query.businessId as string | undefined,
    unanswered: toBool(req.query.unanswered),
  });
  sendSuccess(res, r.items, 'Reviews on my businesses', 200, r.meta);
});
export const adminReviews = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await reviews.adminList(page, limit, { hidden: toBool(req.query.hidden), businessId: req.query.businessId as string | undefined, rating: toInt(req.query.rating) });
  sendSuccess(res, r.items, 'Reviews', 200, r.meta);
});
export const createReview = asyncHandler(async (req, res) => sendCreated(res, await reviews.create(req.user!, req.params.businessId, body(req)), 'Review published'));
export const updateReview = asyncHandler(async (req, res) => sendSuccess(res, await reviews.update(req.params.id, req.user!, body(req)), 'Review updated'));
export const deleteReview = asyncHandler(async (req, res) => {
  await reviews.remove(req.params.id, req.user!);
  sendSuccess(res, null, 'Review deleted');
});
export const replyReview = asyncHandler(async (req, res) => sendSuccess(res, await reviews.reply(req.params.id, req.user!, body<{ reply: string }>(req).reply), 'Reply saved'));
export const deleteReply = asyncHandler(async (req, res) => sendSuccess(res, await reviews.reply(req.params.id, req.user!, null), 'Reply removed'));
export const likeReview = asyncHandler(async (req, res) => sendSuccess(res, await reviews.toggleLike(req.params.id, req.user!)));
export const setReviewVisibility = asyncHandler(async (req, res) => sendSuccess(res, await reviews.setHidden(req.params.id, body<{ isHidden: boolean }>(req).isHidden), 'Visibility updated'));

// ───────────── Favorites ─────────────
export const listFavorites = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await favorites.list(req.userId!, page, limit);
  sendSuccess(res, r.items, 'Favorites', 200, r.meta);
});
export const toggleFavorite = asyncHandler(async (req, res) => {
  const r = await favorites.toggle(req.userId!, req.params.businessId);
  sendSuccess(res, r, r.isFavorite ? 'Added to favorites' : 'Removed from favorites');
});
export const addFavorite = asyncHandler(async (req, res) => sendSuccess(res, await favorites.add(req.userId!, req.params.businessId), 'Added to favorites'));
export const removeFavorite = asyncHandler(async (req, res) => sendSuccess(res, await favorites.remove(req.userId!, req.params.businessId), 'Removed from favorites'));
export const checkFavorite = asyncHandler(async (req, res) => sendSuccess(res, await favorites.check(req.userId!, req.params.businessId)));

// ───────────── Reports & claims ─────────────
export const createReport = asyncHandler(async (req, res) =>
  sendCreated(res, await moderation.createReport(req.user!, req.params.businessId, body<{ type: ReportType; description?: string; reviewId?: string }>(req)), 'Report submitted - thank you'));
export const listReports = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await moderation.listReports(page, limit, req.query.status as ReportStatus | undefined);
  sendSuccess(res, r.items, 'Reports', 200, r.meta);
});
export const updateReport = asyncHandler(async (req, res) => {
  const { status, adminNote } = body<{ status: ReportStatus; adminNote?: string }>(req);
  sendSuccess(res, await moderation.updateReport(Number(req.params.id), status, adminNote), 'Report updated');
});
export const createClaim = asyncHandler(async (req, res) =>
  sendCreated(res, await moderation.createClaim(req.user!, req.params.businessId, body<{ message: string }>(req)), 'Claim submitted - we will contact you'));
export const myClaims = asyncHandler(async (req, res) => sendSuccess(res, await moderation.myClaims(req.userId!)));
export const listClaims = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await moderation.listClaims(page, limit, req.query.status as ClaimStatus | undefined);
  sendSuccess(res, r.items, 'Claims', 200, r.meta);
});
export const decideClaim = asyncHandler(async (req, res) => {
  const { status, adminNote } = body<{ status: ClaimStatus.APPROVED | ClaimStatus.REJECTED; adminNote?: string }>(req);
  sendSuccess(res, await moderation.decideClaim(Number(req.params.id), status, adminNote), `Claim ${status}`);
});

// ───────────── Notifications ─────────────
export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await NotificationService.list(req.userId!, page, limit, toBool(req.query.unread));
  sendSuccess(res, r.items, 'Notifications', 200, r.meta);
});
export const unreadCount = asyncHandler(async (req, res) => sendSuccess(res, { count: await NotificationService.unreadCount(req.userId!) }));
export const markNotificationRead = asyncHandler(async (req, res) => {
  await NotificationService.markRead(req.userId!, Number(req.params.id));
  sendSuccess(res, null, 'Marked as read');
});
export const markAllRead = asyncHandler(async (req, res) => {
  await NotificationService.markAllRead(req.userId!);
  sendSuccess(res, null, 'All marked as read');
});
export const deleteNotification = asyncHandler(async (req, res) => {
  await NotificationService.remove(req.userId!, Number(req.params.id));
  sendSuccess(res, null, 'Deleted');
});

// ───────────── Contact ─────────────
export const sendContact = asyncHandler(async (req, res) => sendCreated(res, await contact.create(body(req), req.userId), 'Message sent - we will get back to you soon'));
export const listContact = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await contact.list(page, limit, toBool(req.query.unread));
  sendSuccess(res, r.items, 'Messages', 200, r.meta);
});
export const markContact = asyncHandler(async (req, res) => {
  await contact.markRead(Number(req.params.id), req.body?.isRead !== false);
  sendSuccess(res, null, 'Updated');
});
export const deleteContact = asyncHandler(async (req, res) => {
  await contact.remove(Number(req.params.id));
  sendSuccess(res, null, 'Deleted');
});
