import * as E from '../controllers/EngagementController';
import * as ED from '../dtos/engagement.dto';
import { uuidParam, intParam, paginationQuery } from '../dtos/common';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/authenticate';
import { isAdmin, isUser } from '../middleware/authorize';
import { writeRateLimiter } from '../middleware/rateLimiter';
import { audit } from '../middleware/auditLogger';
import { createDocumentedRouter } from '../docs/registry';
import { requireFeature as RF, LISTING_FEATURE } from '../services/FeatureService';

const reviews = createDocumentedRouter('/reviews', 'Reviews');
reviews.get('/my', { summary: 'My reviews', access: 'user' }, authenticate, paginationQuery, validate, E.myReviews);
reviews.get('/owner', { summary: 'Reviews on my businesses (owner inbox)', access: 'user', query: { businessId: 'uuid', unanswered: 'true' } }, authenticate, paginationQuery, validate, E.ownerReviews);
reviews.get('/admin/all', { summary: 'All reviews (moderation)', access: 'admin', query: { hidden: 'true|false', businessId: 'uuid', rating: '1-5' } }, authenticate, isAdmin, paginationQuery, validate, E.adminReviews);
reviews.put('/:id', { summary: 'Edit my review', access: 'user', body: { rating: 4, content: '...' } }, authenticate, isUser, uuidParam(), ED.updateReviewDto, validate, E.updateReview);
reviews.delete('/:id', { summary: 'Delete my review (admin: any)', access: 'user' }, authenticate, uuidParam(), validate, audit('review.delete', 'review'), E.deleteReview);
reviews.post('/:id/reply', { summary: 'Owner reply (create/replace)', access: 'owner', body: { reply: 'شكراً لك' } }, authenticate, uuidParam(), ED.replyDto, validate, E.replyReview);
reviews.delete('/:id/reply', { summary: 'Remove owner reply', access: 'owner' }, authenticate, uuidParam(), validate, E.deleteReply);
reviews.post('/:id/like', { summary: 'Toggle "helpful"', access: 'user' }, authenticate, isUser, uuidParam(), validate, E.likeReview);
reviews.patch('/:id/visibility', { summary: 'Hide / show review', access: 'admin', body: { isHidden: true } }, authenticate, isAdmin, uuidParam(), ED.visibilityDto, validate, audit('review.visibility', 'review'), E.setReviewVisibility);

const fav = createDocumentedRouter('/favorites', 'Favorites');
fav.get('/', { summary: 'My favorites', access: 'user' }, authenticate, isUser, paginationQuery, validate, E.listFavorites);
fav.post('/:businessId', { summary: 'Toggle favorite', access: 'user' }, authenticate, isUser, uuidParam('businessId'), validate, RF('favorites', 'business'), E.toggleFavorite);
fav.put('/:businessId', { summary: 'Add favorite (idempotent)', access: 'user' }, authenticate, isUser, uuidParam('businessId'), validate, E.addFavorite);
fav.delete('/:businessId', { summary: 'Remove favorite', access: 'user' }, authenticate, isUser, uuidParam('businessId'), validate, E.removeFavorite);
fav.get('/:businessId/check', { summary: 'Is favorite?', access: 'user' }, authenticate, isUser, uuidParam('businessId'), validate, E.checkFavorite);

const reports = createDocumentedRouter('/reports', 'Reports');
reports.get('/', { summary: 'All reports', access: 'admin', query: { status: 'pending|reviewed|resolved|dismissed' } }, authenticate, isAdmin, paginationQuery, validate, E.listReports);
reports.patch('/:id/status', { summary: 'Update report status', access: 'admin', body: { status: 'resolved', adminNote: '...' } }, authenticate, isAdmin, intParam(), ED.updateReportDto, validate, audit('report.status', 'report'), E.updateReport);

const claims = createDocumentedRouter('/claims', 'Claims');
claims.get('/my', { summary: 'My ownership claims', access: 'user' }, authenticate, E.myClaims);
claims.get('/', { summary: 'All claims', access: 'admin', query: { status: 'pending|approved|rejected' } }, authenticate, isAdmin, paginationQuery, validate, E.listClaims);
claims.patch('/:id', { summary: 'Approve / reject claim (approve → user becomes owner)', access: 'admin', body: { status: 'approved', adminNote: '' } }, authenticate, isAdmin, intParam(), ED.decideClaimDto, validate, audit('claim.decide', 'claim'), E.decideClaim);

const notif = createDocumentedRouter('/notifications', 'Notifications');
notif.get('/', { summary: 'My notifications', access: 'user', query: { unread: 'true' } }, authenticate, paginationQuery, validate, E.listNotifications);
notif.get('/unread-count', { summary: 'Unread badge count', access: 'user' }, authenticate, E.unreadCount);
notif.patch('/read-all', { summary: 'Mark all as read', access: 'user' }, authenticate, E.markAllRead);
notif.patch('/:id/read', { summary: 'Mark one as read', access: 'user' }, authenticate, intParam(), validate, E.markNotificationRead);
notif.delete('/:id', { summary: 'Delete notification', access: 'user' }, authenticate, intParam(), validate, E.deleteNotification);

const contact = createDocumentedRouter('/contact', 'Contact');
contact.post('/', { summary: 'Send a message to the platform team', access: 'optional', body: { name: 'Fadi', email: 'a@b.com', phone: '', subject: 'اقتراح', message: 'نص الرسالة...' } }, optionalAuth, writeRateLimiter, ED.contactDto, validate, E.sendContact);
contact.get('/', { summary: 'Inbox', access: 'admin', query: { unread: 'true' } }, authenticate, isAdmin, paginationQuery, validate, E.listContact);
contact.patch('/:id', { summary: 'Mark read/unread', access: 'admin', body: { isRead: true } }, authenticate, isAdmin, intParam(), validate, E.markContact);
contact.delete('/:id', { summary: 'Delete message', access: 'admin' }, authenticate, isAdmin, intParam(), validate, E.deleteContact);

export const reviewRouter = reviews.router;
export const favoriteRouter = fav.router;
export const reportRouter = reports.router;
export const claimRouter = claims.router;
export const notificationRouter = notif.router;
export const contactRouter = contact.router;
