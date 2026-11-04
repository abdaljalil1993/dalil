import { In } from 'typeorm';
import { repos } from '../repositories';
import { queryBusinesses, BusinessFilter } from '../repositories/BusinessQuery';
import { Business, BusinessWorkingHours, User } from '../entities';
import { BusinessSource, BusinessStatus, ClaimStatus, ContactClickType, NotificationType, UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { buildPaginationMeta } from '../utils/response';
import { normalizeText, slugify, tokenize, escapeLike } from '../utils/text';
import { serializeBusiness, serializeReview } from './serializers';
import { CacheService } from './CacheService';
import { StorageService } from './StorageService';
import { SearchIndexService } from './SearchIndexService';
import { NotificationService } from './NotificationService';
import { EntitlementService } from './BillingService';

export interface HoursInput {
  dayOfWeek: number;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed?: boolean;
  isOpen24Hours?: boolean;
}

export type BusinessInput = Partial<Pick<Business,
  'name' | 'nameEn' | 'shortDescription' | 'description' | 'address' | 'district' | 'latitude' | 'longitude' |
  'phone' | 'phone2' | 'whatsapp' | 'website' | 'email' | 'socialLinks' | 'priceRange' | 'attributes' | 'amenities' |
  'categoryId' | 'subCategoryId' | 'cityId'>> & {
  tags?: string | string[];
  workingHours?: HoursInput[];
  /** false = the user is suggesting a place he does not own */
  isOwner?: boolean;
};

const isAdmin = (u?: User) => u?.role === UserRole.ADMIN;

export class BusinessService {
  // ───────────── Public listing / search ─────────────

  async browse(filter: BusinessFilter, viewer?: User) {
    const result = await queryBusinesses({ ...filter, status: BusinessStatus.APPROVED, isActive: true, q: undefined });
    return this.toPage(result, filter, viewer);
  }

  async search(filter: BusinessFilter, viewer: User, ip?: string) {
    const result = await queryBusinesses({ ...filter, status: BusinessStatus.APPROVED, isActive: true });
    if (filter.q && (filter.page || 1) === 1) {
      repos.searchLogs()
        .save({
          query: filter.q.slice(0, 255),
          normalizedQuery: normalizeText(filter.q).slice(0, 255),
          userId: viewer.id,
          categoryId: filter.categoryId,
          cityId: filter.cityId,
          ipAddress: ip,
          resultsCount: result.total,
        })
        .catch(() => undefined);
    }
    return this.toPage(result, filter, viewer);
  }

  /** Autocomplete: matching businesses + categories + sub-categories. */
  async suggest(q: string, cityId?: number) {
    const tokens = tokenize(q);
    if (!tokens.length) return { businesses: [], categories: [], subCategories: [] };
    const like = `%${escapeLike(tokens[0])}%`;
    const bqb = repos.businesses()
      .createQueryBuilder('b')
      .leftJoin('b.city', 'city')
      .leftJoin('b.category', 'category')
      .select(['b.id', 'b.name', 'b.slug', 'b.logoImage', 'b.averageRating', 'b.isFeatured', 'city.id', 'city.name', 'category.id', 'category.name'])
      .where('b.status = :st AND b.isActive = true', { st: BusinessStatus.APPROVED })
      .andWhere('b.searchText LIKE :like', { like });
    if (cityId) bqb.andWhere('b.cityId = :cityId', { cityId });
    const [businesses, categories, subCategories] = await Promise.all([
      bqb.orderBy('b.isFeatured', 'DESC').addOrderBy('b.averageRating', 'DESC').limit(6).getMany(),
      repos.categories().createQueryBuilder('c').where('c.isActive = true').andWhere('(c.name LIKE :raw OR c.nameEn LIKE :raw OR c.keywords LIKE :raw)', { raw: `%${escapeLike(q.trim())}%` }).take(4).getMany(),
      repos.subCategories().createQueryBuilder('s').leftJoinAndSelect('s.category', 'c').where('s.isActive = true').andWhere('(s.name LIKE :raw OR s.nameEn LIKE :raw OR s.keywords LIKE :raw)', { raw: `%${escapeLike(q.trim())}%` }).take(6).getMany(),
    ]);
    return {
      businesses: businesses.map((b) => ({ id: b.id, name: b.name, slug: b.slug, logoImage: b.logoImage, averageRating: Number(b.averageRating), city: b.city?.name, category: b.category?.name })),
      categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, color: c.color })),
      subCategories: subCategories.map((s) => ({ id: s.id, name: s.name, slug: s.slug, categoryId: s.categoryId, categorySlug: s.category?.slug })),
    };
  }

  async getBySlug(slug: string, viewer?: User) {
    const business = await repos.businesses().findOne({
      where: /^[0-9a-f-]{36}$/i.test(slug) ? { id: slug } : { slug },
      relations: ['category', 'subCategory', 'city', 'images', 'workingHours', 'owner'],
    });
    if (!business) throw AppError.notFound('Business not found');
    const privileged = this.canManage(business, viewer);
    if (!privileged && (business.status !== BusinessStatus.APPROVED || !business.isActive)) throw AppError.notFound('Business not found');

    if (!privileged) repos.businesses().increment({ id: business.id }, 'viewCount', 1).catch(() => undefined);

    const [isFavorite, myReview, ratingBreakdown, pendingClaim] = await Promise.all([
      viewer ? repos.favorites().exist({ where: { userId: viewer.id, businessId: business.id } }) : Promise.resolve(false),
      viewer ? repos.reviews().findOne({ where: { userId: viewer.id, businessId: business.id }, relations: ['user'] }) : Promise.resolve(null),
      this.ratingBreakdown(business.id),
      viewer ? repos.claims().exist({ where: { userId: viewer.id, businessId: business.id, status: ClaimStatus.PENDING } }) : Promise.resolve(false),
    ]);

    return {
      ...serializeBusiness(business, { privileged, isFavorite }),
      ratingBreakdown,
      viewer: viewer
        ? {
            isFavorite,
            canManage: privileged,
            myReview: myReview ? serializeReview(myReview) : null,
            hasPendingClaim: pendingClaim,
          }
        : null,
    };
  }

  async related(idOrSlug: string, limit = 8) {
    const b = await repos.businesses().findOne({ where: /^[0-9a-f-]{36}$/i.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug } });
    if (!b) throw AppError.notFound('Business not found');
    let result = await queryBusinesses({
      status: BusinessStatus.APPROVED, isActive: true, cityId: b.cityId,
      ...(b.subCategoryId ? { subCategoryId: b.subCategoryId } : { categoryId: b.categoryId }),
      excludeId: b.id, sort: 'popular', limit,
    });
    if (result.items.length < 3) {
      result = await queryBusinesses({ status: BusinessStatus.APPROVED, isActive: true, categoryId: b.categoryId, excludeId: b.id, sort: 'popular', limit });
    }
    return result.items.map((x) => serializeBusiness(x));
  }

  async ratingBreakdown(businessId: string) {
    const rows = await repos.reviews()
      .createQueryBuilder('r')
      .select('r.rating', 'rating')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.businessId = :businessId AND r.isHidden = false', { businessId })
      .groupBy('r.rating')
      .getRawMany<{ rating: number; cnt: string }>();
    const out: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    rows.forEach((r) => (out[String(r.rating)] = Number(r.cnt)));
    return out;
  }

  // ───────────── Owner / admin management ─────────────

  async create(input: BusinessInput, user: User) {
    await this.assertRefs(input);
    const admin = isAdmin(user);
    const suggestion = input.isOwner === false && !admin;
    const { workingHours, tags, isOwner: _ignored, ...data } = input;

    const business = repos.businesses().create({
      ...data,
      tags: this.normalizeTags(tags),
      slug: await this.uniqueSlug(input.nameEn || input.name!),
      ownerId: admin || suggestion ? null : user.id,
      status: admin ? BusinessStatus.APPROVED : BusinessStatus.PENDING,
      source: admin ? BusinessSource.ADMIN : suggestion ? BusinessSource.SUGGESTION : BusinessSource.OWNER,
      approvedAt: admin ? new Date() : null,
    });
    const saved = await repos.businesses().save(business);
    if (workingHours?.length) await this.replaceHours(saved.id, workingHours);
    await SearchIndexService.reindex(saved.id);
    if (admin) await CacheService.invalidateCatalog();
    return this.getManaged(saved.id);
  }

  async update(id: string, input: BusinessInput, user: User) {
    const business = await this.findManageable(id, user);
    if (input.categoryId || input.cityId || input.subCategoryId) await this.assertRefs({ ...business, ...input });
    const { workingHours, tags, isOwner: _ignored, ...data } = input;

    if (data.name && data.name !== business.name) business.slug = await this.uniqueSlug(data.nameEn || data.name, business.id);
    Object.assign(business, data);
    if (tags !== undefined) business.tags = this.normalizeTags(tags) ?? '';
    // An owner editing a rejected listing re-submits it for review
    if (!isAdmin(user) && business.status === BusinessStatus.REJECTED) business.status = BusinessStatus.PENDING;

    await repos.businesses().save(business);
    if (workingHours) await this.replaceHours(business.id, workingHours);
    await SearchIndexService.reindex(business.id);
    await CacheService.invalidateCatalog();
    return this.getManaged(business.id);
  }

  async remove(id: string, user: User) {
    const business = await this.findManageable(id, user, ['images']);
    await Promise.all((business.images || []).map((img) => StorageService.remove(img.publicId)));
    await repos.businesses().delete(business.id);
    await CacheService.invalidateCatalog();
  }

  async setStatus(id: string, status: BusinessStatus, adminNote?: string) {
    const business = await repos.businesses().findOne({ where: { id }, relations: ['owner'] });
    if (!business) throw AppError.notFound('Business not found');
    business.status = status;
    if (adminNote !== undefined) business.adminNote = adminNote;
    if (status === BusinessStatus.APPROVED) {
      business.approvedAt = business.approvedAt || new Date();
      // A normal user becomes a business owner when his first listing is approved
      if (business.owner && business.owner.role === UserRole.USER) {
        await repos.users().update(business.owner.id, { role: UserRole.BUSINESS_OWNER });
      }
    }
    await repos.businesses().save(business);
    await CacheService.invalidateCatalog();

    if (status === BusinessStatus.APPROVED || status === BusinessStatus.REJECTED) {
      await NotificationService.notify(
        business.ownerId,
        status === BusinessStatus.APPROVED ? NotificationType.BUSINESS_APPROVED : NotificationType.BUSINESS_REJECTED,
        status === BusinessStatus.APPROVED ? `تمت الموافقة على "${business.name}"` : `تم رفض "${business.name}"`,
        adminNote,
        { businessId: business.id, slug: business.slug }
      );
    }
    return this.getManaged(business.id);
  }

  async setFlags(id: string, flags: { isVerified?: boolean; isActive?: boolean; ownerId?: string | null }) {
    const business = await repos.businesses().findOne({ where: { id } });
    if (!business) throw AppError.notFound('Business not found');
    if (flags.ownerId) {
      const owner = await repos.users().findOne({ where: { id: flags.ownerId } });
      if (!owner) throw AppError.notFound('Owner user not found');
      if (owner.role === UserRole.USER) await repos.users().update(owner.id, { role: UserRole.BUSINESS_OWNER });
    }
    Object.assign(business, flags);
    await repos.businesses().save(business);
    await CacheService.invalidateCatalog();
    return this.getManaged(id);
  }

  async listMine(userId: string, page: number, limit: number, status?: BusinessStatus) {
    const result = await queryBusinesses({ ownerId: userId, status: status || 'all', sort: 'newest', page, limit });
    return {
      items: result.items.map((b) => serializeBusiness(b, { privileged: true })),
      meta: buildPaginationMeta(result.total, page, limit),
    };
  }

  async adminList(filter: BusinessFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const result = await queryBusinesses({ ...filter, status: filter.status || 'all', sort: filter.sort || 'newest' });
    return { items: result.items.map((b) => serializeBusiness(b, { privileged: true })), meta: buildPaginationMeta(result.total, page, limit) };
  }

  async getManaged(id: string) {
    const b = await repos.businesses().findOne({ where: { id }, relations: ['category', 'subCategory', 'city', 'images', 'workingHours', 'owner'] });
    if (!b) throw AppError.notFound('Business not found');
    return serializeBusiness(b, { privileged: true });
  }

  async getForManage(id: string, user: User) {
    await this.findManageable(id, user);
    return this.getManaged(id);
  }

  // ───────────── Media ─────────────

  async addImages(id: string, files: Express.Multer.File[], user: User) {
    const business = await this.findManageable(id, user, ['images']);
    if (!files?.length) throw AppError.badRequest('No images uploaded (use form field "images")');
    const existing = business.images?.length || 0;
    if (existing + files.length > 30) throw AppError.badRequest('Maximum 30 images per business');
    await EntitlementService.assertLimit(id, 'maxImages', existing, files.length, user);
    const stored = await Promise.all(files.map((f) => StorageService.upload(f, `businesses/${id}`)));
    await repos.images().save(
      stored.map((s, i) => repos.images().create({ businessId: id, url: s.url, publicId: s.publicId, sortOrder: existing + i, isPrimary: existing === 0 && i === 0 }))
    );
    await CacheService.invalidateCatalog();
    return this.getManaged(id);
  }

  async removeImage(id: string, imageId: number, user: User) {
    await this.findManageable(id, user);
    const img = await repos.images().findOne({ where: { id: imageId, businessId: id } });
    if (!img) throw AppError.notFound('Image not found');
    await StorageService.remove(img.publicId);
    await repos.images().delete(img.id);
    if (img.isPrimary) {
      const next = await repos.images().findOne({ where: { businessId: id }, order: { sortOrder: 'ASC' } });
      if (next) await repos.images().update(next.id, { isPrimary: true });
    }
    return this.getManaged(id);
  }

  async setPrimaryImage(id: string, imageId: number, user: User) {
    await this.findManageable(id, user);
    const img = await repos.images().findOne({ where: { id: imageId, businessId: id } });
    if (!img) throw AppError.notFound('Image not found');
    await repos.images().update({ businessId: id }, { isPrimary: false });
    await repos.images().update(img.id, { isPrimary: true });
    return this.getManaged(id);
  }

  async setBrandImage(id: string, kind: 'cover' | 'logo', file: Express.Multer.File | undefined, user: User) {
    await this.findManageable(id, user);
    if (!file) throw AppError.badRequest('No image uploaded (use form field "image")');
    const stored = await StorageService.upload(file, `businesses/${id}`);
    await repos.businesses().update(id, kind === 'cover' ? { coverImage: stored.url } : { logoImage: stored.url });
    await CacheService.invalidateCatalog();
    return this.getManaged(id);
  }

  // ───────────── Hours / tracking / stats ─────────────

  async setHours(id: string, hours: HoursInput[], user: User) {
    await this.findManageable(id, user);
    await this.replaceHours(id, hours);
    await CacheService.invalidateCatalog();
    return this.getManaged(id);
  }

  async trackClick(id: string, type: ContactClickType) {
    const column = { phone: 'phoneClicks', whatsapp: 'whatsappClicks', directions: 'directionClicks', website: 'websiteClicks' }[type];
    await repos.businesses().increment({ id }, column, 1);
  }

  async stats(id: string, user: User) {
    const b = await this.findManageable(id, user);
    const [ratingBreakdown, favorites, last30] = await Promise.all([
      this.ratingBreakdown(id),
      repos.favorites().count({ where: { businessId: id } }),
      repos.reviews().createQueryBuilder('r').where('r.businessId = :id AND r.createdAt >= :since', { id, since: new Date(Date.now() - 30 * 864e5) }).getCount(),
    ]);
    return {
      views: b.viewCount,
      favorites,
      reviews: b.reviewCount,
      averageRating: Number(b.averageRating),
      reviewsLast30Days: last30,
      ratingBreakdown,
      clicks: { phone: b.phoneClicks, whatsapp: b.whatsappClicks, directions: b.directionClicks, website: b.websiteClicks },
    };
  }

  // ───────────── helpers ─────────────

  canManage(b: Business, user?: User): boolean {
    if (!user) return false;
    return isAdmin(user) || (!!b.ownerId && b.ownerId === user.id);
  }

  private async findManageable(id: string, user: User, relations: string[] = []): Promise<Business> {
    const business = await repos.businesses().findOne({ where: { id }, relations });
    if (!business) throw AppError.notFound('Business not found');
    if (!this.canManage(business, user)) throw AppError.forbidden('You can only manage your own businesses');
    return business;
  }

  private async replaceHours(businessId: string, hours: HoursInput[]) {
    const unique = new Map<number, HoursInput>();
    hours.forEach((h) => unique.set(Number(h.dayOfWeek), h));
    await repos.hours().delete({ businessId });
    const rows: Partial<BusinessWorkingHours>[] = Array.from(unique.values()).map((h) => ({
      businessId,
      dayOfWeek: Number(h.dayOfWeek),
      isClosed: Boolean(h.isClosed),
      isOpen24Hours: Boolean(h.isOpen24Hours),
      openTime: h.isClosed || h.isOpen24Hours ? null : h.openTime || null,
      closeTime: h.isClosed || h.isOpen24Hours ? null : h.closeTime || null,
    }));
    if (rows.length) await repos.hours().save(rows);
  }

  private async assertRefs(input: Partial<BusinessInput>) {
    if (input.categoryId && !(await repos.categories().exist({ where: { id: input.categoryId } }))) throw AppError.badRequest('Category does not exist');
    if (input.cityId && !(await repos.cities().exist({ where: { id: input.cityId } }))) throw AppError.badRequest('City does not exist');
    if (input.subCategoryId) {
      const sub = await repos.subCategories().findOne({ where: { id: input.subCategoryId } });
      if (!sub) throw AppError.badRequest('Sub-category does not exist');
      if (input.categoryId && sub.categoryId !== Number(input.categoryId)) throw AppError.badRequest('Sub-category does not belong to the selected category');
    }
  }

  private normalizeTags(tags?: string | string[]): string | undefined {
    if (tags === undefined) return undefined;
    const list = Array.isArray(tags) ? tags : tags.split(',');
    return list.map((t) => t.trim()).filter(Boolean).slice(0, 30).join(',');
  }

  private async uniqueSlug(name: string, ignoreId?: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    for (let i = 2; ; i++) {
      const found = await repos.businesses().findOne({ where: { slug }, select: ['id'] });
      if (!found || found.id === ignoreId) return slug;
      slug = `${base}-${i}`;
    }
  }

  private async toPage(result: Awaited<ReturnType<typeof queryBusinesses>>, filter: BusinessFilter, viewer?: User) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    let favIds = new Set<string>();
    if (viewer && result.items.length) {
      const favs = await repos.favorites().find({ where: { userId: viewer.id, businessId: In(result.items.map((b) => b.id)) }, select: ['businessId'] });
      favIds = new Set(favs.map((f) => f.businessId));
    }
    return {
      items: result.items.map((b) =>
        serializeBusiness(b, {
          distanceKm: filter.lat !== undefined ? result.distances.get(b.id) ?? null : undefined,
          isFavorite: viewer ? favIds.has(b.id) : undefined,
        })
      ),
      meta: buildPaginationMeta(result.total, page, limit),
    };
  }
}
