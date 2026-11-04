import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/response';
import { body, queryData } from '../middleware/validate';
import { parsePagination } from '../utils/pagination';
import { PromotionService, AdInput, FeaturedInput } from '../services/PromotionService';
import { DashboardService } from '../services/DashboardService';
import { AdPlacement, AdStatus, PromotionStatus } from '../entities/enums';

const promo = new PromotionService();
const dashboard = new DashboardService();

// Ads
export const activeAds = asyncHandler(async (req, res) => sendSuccess(res, await promo.activeAds(queryData<{ placement?: AdPlacement; cityId?: number; categoryId?: number }>(req))));
export const adminAds = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const q = queryData<{ status?: AdStatus; placement?: AdPlacement }>(req);
  const r = await promo.adminAds(page, limit, q);
  sendSuccess(res, r.items, 'Advertisements', 200, r.meta);
});
export const myAds = asyncHandler(async (req, res) => sendSuccess(res, await promo.myAdRequests(req.userId!)));
export const createAd = asyncHandler(async (req, res) => sendCreated(res, await promo.createAd(body<AdInput>(req), req.file), 'Advertisement created'));
export const requestAd = asyncHandler(async (req, res) => sendCreated(res, await promo.requestAd(req.user!, body<AdInput>(req), req.file), 'Ad request sent - our team will contact you'));
export const updateAd = asyncHandler(async (req, res) => sendSuccess(res, await promo.updateAd(Number(req.params.id), body<AdInput>(req), req.file), 'Advertisement updated'));
export const deleteAd = asyncHandler(async (req, res) => {
  await promo.deleteAd(Number(req.params.id));
  sendSuccess(res, null, 'Advertisement deleted');
});
export const adClick = asyncHandler(async (req, res) => {
  await promo.trackAd(Number(req.params.id), 'click');
  sendSuccess(res, null);
});
export const adImpression = asyncHandler(async (req, res) => {
  await promo.trackAd(Number(req.params.id), 'impression');
  sendSuccess(res, null);
});

// Featured
export const activeFeatured = asyncHandler(async (req, res) => sendSuccess(res, await promo.activeFeatured(queryData<{ cityId?: number; categoryId?: number }>(req))));
export const adminFeatured = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await promo.adminFeatured(page, limit, req.query.status as PromotionStatus | undefined);
  sendSuccess(res, r.items, 'Featured', 200, r.meta);
});
export const myFeatured = asyncHandler(async (req, res) => sendSuccess(res, await promo.myFeaturedRequests(req.userId!)));
export const addFeatured = asyncHandler(async (req, res) => sendCreated(res, await promo.addFeatured(body<FeaturedInput>(req)), 'Business featured'));
export const requestFeatured = asyncHandler(async (req, res) => sendCreated(res, await promo.requestFeatured(req.user!, body<FeaturedInput>(req)), 'Request sent - our team will contact you'));
export const updateFeatured = asyncHandler(async (req, res) => sendSuccess(res, await promo.updateFeatured(Number(req.params.id), body<FeaturedInput>(req)), 'Featured entry updated'));
export const removeFeatured = asyncHandler(async (req, res) => {
  await promo.removeFeatured(Number(req.params.id));
  sendSuccess(res, null, 'Featured entry removed');
});

// Admin dashboard
export const stats = asyncHandler(async (_req, res) => sendSuccess(res, await dashboard.stats()));
export const searchInsights = asyncHandler(async (req, res) => sendSuccess(res, await dashboard.searchInsights(Math.min(365, Number(req.query.days) || 30))));
export const auditLogs = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await dashboard.auditLogs(page, limit, { action: req.query.action as string | undefined, userId: req.query.userId as string | undefined });
  sendSuccess(res, r.items, 'Audit logs', 200, r.meta);
});
