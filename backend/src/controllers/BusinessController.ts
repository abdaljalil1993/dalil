import { Request } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/response';
import { body, queryData } from '../middleware/validate';
import { BusinessService, BusinessInput, HoursInput } from '../services/BusinessService';
import { BusinessFilter, BusinessSort } from '../repositories/BusinessQuery';
import { BusinessStatus, ContactClickType } from '../entities/enums';
import { clientIp } from '../utils/request';
import { parsePagination } from '../utils/pagination';

const svc = new BusinessService();

type Q = Record<string, unknown>;

const toFilter = (req: Request): BusinessFilter => {
  const q = queryData<Q>(req);
  const { page, limit } = parsePagination(req);
  return {
    q: q.q as string | undefined,
    categoryId: q.categoryId as number | undefined,
    subCategoryId: q.subCategoryId as number | undefined,
    cityId: q.cityId as number | undefined,
    district: q.district as string | undefined,
    minRating: q.minRating as number | undefined,
    priceRange: q.priceRange as number | undefined,
    openNow: q.openNow as boolean | undefined,
    verified: q.verified as boolean | undefined,
    featuredOnly: q.featured as boolean | undefined,
    hasPhotos: q.hasPhotos as boolean | undefined,
    lat: q.lat as number | undefined,
    lng: q.lng as number | undefined,
    radiusKm: q.radius as number | undefined,
    sort: q.sort as BusinessSort | undefined,
    status: q.status as BusinessStatus | 'all' | undefined,
    ownerId: q.ownerId as string | undefined,
    page,
    limit,
  };
};

export const browse = asyncHandler(async (req, res) => {
  const r = await svc.browse(toFilter(req), req.user);
  sendSuccess(res, r.items, 'Businesses', 200, r.meta);
});

export const search = asyncHandler(async (req, res) => {
  const r = await svc.search(toFilter(req), req.user!, clientIp(req));
  sendSuccess(res, r.items, 'Search results', 200, r.meta);
});

export const suggest = asyncHandler(async (req, res) => {
  const q = queryData<{ q: string; cityId?: number }>(req);
  sendSuccess(res, await svc.suggest(q.q, q.cityId));
});

export const getOne = asyncHandler(async (req, res) => sendSuccess(res, await svc.getBySlug(req.params.slug, req.user)));
export const related = asyncHandler(async (req, res) => sendSuccess(res, await svc.related(req.params.slug)));

export const create = asyncHandler(async (req, res) => {
  const b = await svc.create(body<BusinessInput>(req), req.user!);
  sendCreated(res, b, (b as { status?: string }).status === BusinessStatus.APPROVED ? 'Business published' : 'Business submitted - it will appear after admin review');
});
export const update = asyncHandler(async (req, res) => sendSuccess(res, await svc.update(req.params.id, body<BusinessInput>(req), req.user!), 'Business updated'));
export const remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id, req.user!);
  sendSuccess(res, null, 'Business deleted');
});
export const getManaged = asyncHandler(async (req, res) => sendSuccess(res, await svc.getForManage(req.params.id, req.user!)));

export const mine = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req);
  const r = await svc.listMine(req.userId!, page, limit, req.query.status as BusinessStatus | undefined);
  sendSuccess(res, r.items, 'My businesses', 200, r.meta);
});

export const adminList = asyncHandler(async (req, res) => {
  const r = await svc.adminList(toFilter(req));
  sendSuccess(res, r.items, 'Businesses', 200, r.meta);
});

export const setStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = body<{ status: BusinessStatus; adminNote?: string }>(req);
  sendSuccess(res, await svc.setStatus(req.params.id, status, adminNote), `Business ${status}`);
});
export const setFlags = asyncHandler(async (req, res) => sendSuccess(res, await svc.setFlags(req.params.id, body(req)), 'Business updated'));

export const addImages = asyncHandler(async (req, res) => sendSuccess(res, await svc.addImages(req.params.id, req.files as Express.Multer.File[], req.user!), 'Images uploaded'));
export const removeImage = asyncHandler(async (req, res) => sendSuccess(res, await svc.removeImage(req.params.id, Number(req.params.imageId), req.user!), 'Image removed'));
export const setPrimaryImage = asyncHandler(async (req, res) => sendSuccess(res, await svc.setPrimaryImage(req.params.id, Number(req.params.imageId), req.user!), 'Primary image set'));
export const setCover = asyncHandler(async (req, res) => sendSuccess(res, await svc.setBrandImage(req.params.id, 'cover', req.file, req.user!), 'Cover updated'));
export const setLogo = asyncHandler(async (req, res) => sendSuccess(res, await svc.setBrandImage(req.params.id, 'logo', req.file, req.user!), 'Logo updated'));

export const setHours = asyncHandler(async (req, res) =>
  sendSuccess(res, await svc.setHours(req.params.id, body<{ hours: HoursInput[] }>(req).hours, req.user!), 'Working hours updated'));

export const track = asyncHandler(async (req, res) => {
  await svc.trackClick(req.params.id, body<{ type: ContactClickType }>(req).type);
  sendSuccess(res, null, 'Tracked');
});

export const stats = asyncHandler(async (req, res) => sendSuccess(res, await svc.stats(req.params.id, req.user!)));
