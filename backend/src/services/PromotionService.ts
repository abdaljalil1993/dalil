import { Brackets, LessThan } from 'typeorm';
import { repos } from '../repositories';
import { Advertisement, FeaturedBusiness, User } from '../entities';
import { AdPlacement, AdStatus, NotificationType, PromotionStatus, UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { buildPaginationMeta } from '../utils/response';
import { CacheService } from './CacheService';
import { NotificationService } from './NotificationService';
import { StorageService } from './StorageService';
import { serializeBusiness } from './serializers';

export type AdInput = Partial<Pick<Advertisement,
  'title' | 'description' | 'imageUrl' | 'targetUrl' | 'placement' | 'status' | 'startDate' | 'endDate' | 'priority' |
  'price' | 'contactPhone' | 'adminNote' | 'cityId' | 'categoryId' | 'businessId'>>;

export type FeaturedInput = Partial<Pick<FeaturedBusiness, 'businessId' | 'startDate' | 'endDate' | 'status' | 'priority' | 'price' | 'note'>>;

const serializeAd = (a: Advertisement) => ({
  id: a.id,
  title: a.title,
  description: a.description,
  imageUrl: a.imageUrl,
  targetUrl: a.targetUrl,
  placement: a.placement,
  status: a.status,
  startDate: a.startDate,
  endDate: a.endDate,
  priority: a.priority,
  cityId: a.cityId,
  categoryId: a.categoryId,
  businessId: a.businessId,
  business: a.business ? { id: a.business.id, name: a.business.name, slug: a.business.slug } : null,
});

/**
 * Monetization:
 *  - Advertisements: banners/sliders by placement, optionally targeted by city/category.
 *  - Featured (paid placement): business appears first in lists & search while active.
 * Owners can REQUEST both (status=pending); admin approves after payment.
 */
export class PromotionService {
  // ───────────── Advertisements ─────────────

  async activeAds(filter: { placement?: AdPlacement; cityId?: number; categoryId?: number; limit?: number }) {
    const key = `home:ads:${filter.placement || 'all'}:${filter.cityId || 0}:${filter.categoryId || 0}`;
    return CacheService.remember(key, 120, async () => {
      const now = new Date();
      const qb = repos.ads()
        .createQueryBuilder('a')
        .leftJoinAndSelect('a.business', 'business')
        .where('a.status = :st AND a.startDate <= :now AND a.endDate >= :now', { st: AdStatus.ACTIVE, now });
      if (filter.placement) qb.andWhere('a.placement = :p', { p: filter.placement });
      if (filter.cityId) qb.andWhere(new Brackets((w) => w.where('a.cityId IS NULL').orWhere('a.cityId = :cityId', { cityId: filter.cityId })));
      if (filter.categoryId) qb.andWhere(new Brackets((w) => w.where('a.categoryId IS NULL').orWhere('a.categoryId = :catId', { catId: filter.categoryId })));
      const ads = await qb.orderBy('a.priority', 'DESC').addOrderBy('a.id', 'DESC').take(filter.limit || 10).getMany();
      return ads.map(serializeAd);
    });
  }

  async adminAds(page: number, limit: number, filter: { status?: AdStatus; placement?: AdPlacement }) {
    const qb = repos.ads().createQueryBuilder('a').leftJoinAndSelect('a.business', 'business').leftJoinAndSelect('a.city', 'city').leftJoinAndSelect('a.category', 'category');
    if (filter.status) qb.andWhere('a.status = :s', { s: filter.status });
    if (filter.placement) qb.andWhere('a.placement = :p', { p: filter.placement });
    const [items, total] = await qb.orderBy('a.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async myAdRequests(userId: string) {
    return repos.ads().find({ where: { requestedById: userId }, relations: ['business'], order: { createdAt: 'DESC' } });
  }

  async createAd(data: AdInput, file?: Express.Multer.File) {
    this.assertDates(data.startDate, data.endDate);
    if (file) data.imageUrl = (await StorageService.upload(file, 'ads')).url;
    const ad = await repos.ads().save(repos.ads().create({ ...data, status: data.status || AdStatus.ACTIVE }));
    await CacheService.delByPattern('home:*');
    return ad;
  }

  /** Owner self-service: request an ad for his business (pending until admin activates it). */
  async requestAd(user: User, data: AdInput, file?: Express.Multer.File) {
    if (data.businessId) await this.assertOwner(user, data.businessId);
    this.assertDates(data.startDate, data.endDate);
    if (file) data.imageUrl = (await StorageService.upload(file, 'ads')).url;
    return repos.ads().save(repos.ads().create({ ...data, status: AdStatus.PENDING, requestedById: user.id }));
  }

  async updateAd(id: number, data: AdInput, file?: Express.Multer.File) {
    const ad = await repos.ads().findOne({ where: { id } });
    if (!ad) throw AppError.notFound('Advertisement not found');
    if (file) data.imageUrl = (await StorageService.upload(file, 'ads')).url;
    const wasPending = ad.status === AdStatus.PENDING;
    Object.assign(ad, data);
    this.assertDates(ad.startDate, ad.endDate);
    await repos.ads().save(ad);
    if (wasPending && ad.requestedById && (ad.status === AdStatus.ACTIVE || ad.status === AdStatus.REJECTED)) {
      await NotificationService.notify(
        ad.requestedById,
        ad.status === AdStatus.ACTIVE ? NotificationType.PROMOTION_APPROVED : NotificationType.PROMOTION_REJECTED,
        ad.status === AdStatus.ACTIVE ? `تم تفعيل إعلانك "${ad.title}"` : `تم رفض طلب الإعلان "${ad.title}"`,
        ad.adminNote
      );
    }
    await CacheService.delByPattern('home:*');
    return ad;
  }

  async deleteAd(id: number) {
    const res = await repos.ads().delete(id);
    if (!res.affected) throw AppError.notFound('Advertisement not found');
    await CacheService.delByPattern('home:*');
  }

  async trackAd(id: number, kind: 'click' | 'impression') {
    await repos.ads().increment({ id }, kind === 'click' ? 'clickCount' : 'impressionCount', 1);
  }

  // ───────────── Featured (paid placement) ─────────────

  async activeFeatured(filter: { cityId?: number; categoryId?: number; limit?: number }) {
    const now = new Date();
    const qb = repos.featured()
      .createQueryBuilder('f')
      .innerJoinAndSelect('f.business', 'b', 'b.status = :ap AND b.isActive = true', { ap: 'approved' })
      .leftJoinAndSelect('b.category', 'category')
      .leftJoinAndSelect('b.city', 'city')
      .leftJoinAndSelect('b.images', 'images')
      .leftJoinAndSelect('b.workingHours', 'wh')
      .where('f.status = :st AND f.startDate <= :now AND f.endDate >= :now', { st: PromotionStatus.ACTIVE, now });
    if (filter.cityId) qb.andWhere('b.cityId = :cityId', { cityId: filter.cityId });
    if (filter.categoryId) qb.andWhere('b.categoryId = :categoryId', { categoryId: filter.categoryId });
    const rows = await qb.orderBy('f.priority', 'DESC').addOrderBy('f.startDate', 'DESC').take(filter.limit || 20).getMany();
    const seen = new Set<string>();
    return rows.filter((r) => (seen.has(r.businessId) ? false : (seen.add(r.businessId), true))).map((r) => serializeBusiness(r.business));
  }

  async adminFeatured(page: number, limit: number, status?: PromotionStatus) {
    const qb = repos.featured().createQueryBuilder('f').leftJoinAndSelect('f.business', 'b').leftJoinAndSelect('b.city', 'city');
    if (status) qb.where('f.status = :status', { status });
    const [items, total] = await qb.orderBy('f.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return {
      items: items.map((f) => ({ ...f, business: f.business ? { id: f.business.id, name: f.business.name, slug: f.business.slug, city: f.business.city?.name } : null })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async myFeaturedRequests(userId: string) {
    return repos.featured().find({ where: { requestedById: userId }, relations: ['business'], order: { createdAt: 'DESC' } });
  }

  async addFeatured(data: FeaturedInput) {
    this.assertDates(data.startDate, data.endDate);
    if (!(await repos.businesses().exist({ where: { id: data.businessId } }))) throw AppError.notFound('Business not found');
    const saved = await repos.featured().save(repos.featured().create({ ...data, status: data.status || PromotionStatus.ACTIVE }));
    await PromotionService.syncFeaturedFlags();
    return saved;
  }

  async requestFeatured(user: User, data: FeaturedInput) {
    await this.assertOwner(user, data.businessId!);
    this.assertDates(data.startDate, data.endDate);
    return repos.featured().save(repos.featured().create({ ...data, status: PromotionStatus.PENDING, requestedById: user.id, price: null }));
  }

  async updateFeatured(id: number, data: FeaturedInput) {
    const item = await repos.featured().findOne({ where: { id }, relations: ['business'] });
    if (!item) throw AppError.notFound('Featured entry not found');
    const wasPending = item.status === PromotionStatus.PENDING;
    Object.assign(item, data);
    this.assertDates(item.startDate, item.endDate);
    await repos.featured().save(item);
    if (wasPending && item.requestedById && item.status !== PromotionStatus.PENDING) {
      const ok = item.status === PromotionStatus.ACTIVE;
      await NotificationService.notify(
        item.requestedById,
        ok ? NotificationType.PROMOTION_APPROVED : NotificationType.PROMOTION_REJECTED,
        ok ? `تم تمييز "${item.business?.name}"` : `تم رفض طلب تمييز "${item.business?.name}"`,
        item.note,
        { businessId: item.businessId }
      );
    }
    await PromotionService.syncFeaturedFlags();
    return item;
  }

  async removeFeatured(id: number) {
    const res = await repos.featured().delete(id);
    if (!res.affected) throw AppError.notFound('Featured entry not found');
    await PromotionService.syncFeaturedFlags();
  }

  /** Keeps businesses.isFeatured / featuredPriority in sync with active promotions; expires old ads. Runs every few minutes. */
  static async syncFeaturedFlags(): Promise<void> {
    const now = new Date();
    await repos.featured().update({ status: PromotionStatus.ACTIVE, endDate: LessThan(now) }, { status: PromotionStatus.EXPIRED });
    await repos.ads().update({ status: AdStatus.ACTIVE, endDate: LessThan(now) }, { status: AdStatus.EXPIRED });
    await repos.businesses().query('UPDATE businesses SET isFeatured = false, featuredPriority = 0 WHERE isFeatured = true');
    await repos.businesses().query(
      `UPDATE businesses b JOIN (
         SELECT businessId, MAX(priority) AS p FROM featured_businesses
         WHERE status = 'active' AND startDate <= ? AND endDate >= ? GROUP BY businessId
       ) f ON f.businessId = b.id SET b.isFeatured = true, b.featuredPriority = f.p + 1`,
      [now, now]
    );
    await CacheService.invalidateCatalog();
  }

  private async assertOwner(user: User, businessId: string) {
    const b = await repos.businesses().findOne({ where: { id: businessId } });
    if (!b) throw AppError.notFound('Business not found');
    if (user.role !== UserRole.ADMIN && b.ownerId !== user.id) throw AppError.forbidden('You can only promote your own businesses');
  }

  private assertDates(start?: Date, end?: Date) {
    if (start && end && new Date(end) <= new Date(start)) throw AppError.badRequest('End date must be after start date');
  }
}
