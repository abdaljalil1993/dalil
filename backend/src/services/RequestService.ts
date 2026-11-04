import { In } from 'typeorm';
import { repos, repos2 } from '../repositories';
import { ServiceRequest, User } from '../entities';
import { BusinessStatus, NotificationType, QuoteStatus, ServiceRequestStatus, UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { buildPaginationMeta } from '../utils/response';
import { StorageService } from './StorageService';
import { EntitlementService, SettingsService } from './BillingService';
import { NotificationService } from './NotificationService';
import { publicUser } from './serializers';

export type RequestInput = Partial<Pick<ServiceRequest, 'categoryId' | 'subCategoryId' | 'cityId' | 'district' | 'title' | 'description' | 'budget' | 'preferredDate' | 'phone' | 'sharePhone'>>;

/**
 * "Request a service / get quotes": customer posts a need, matching businesses (same category,
 * sub-category if given, same city, acceptsQuotes=true) are notified and send quotes.
 */
export class RequestService {
  async create(user: User, data: RequestInput, files: Express.Multer.File[] = []) {
    if (!(await repos.categories().exist({ where: { id: data.categoryId } }))) throw AppError.badRequest('Category does not exist');
    if (!(await repos.cities().exist({ where: { id: data.cityId } }))) throw AppError.badRequest('City does not exist');
    const openCount = await repos2.requests().count({ where: { userId: user.id, status: ServiceRequestStatus.OPEN } });
    if (openCount >= 10) throw AppError.badRequest('You have too many open requests — close some first');
    const images = files.length ? (await Promise.all(files.slice(0, 6).map((f) => StorageService.upload(f, `requests/${user.id}`)))).map((s) => ({ url: s.url })) : null;
    const days = await SettingsService.get('serviceRequestDurationDays');
    const req = await repos2.requests().save(repos2.requests().create({ ...data, phone: data.phone || user.phone, images, userId: user.id, expiresAt: new Date(Date.now() + days * 864e5) }));

    const targets = await this.matchingBusinesses(req);
    await Promise.all(targets.map((b) => NotificationService.notify(b.ownerId, NotificationType.SERVICE_REQUEST, `طلب خدمة جديد: ${req.title}`, `${req.district || ''} — ${b.name}`, { requestId: req.id })));
    return { ...(await this.get(req.id, user)), notifiedBusinesses: targets.length };
  }

  private async matchingBusinesses(req: ServiceRequest) {
    const qb = repos.businesses().createQueryBuilder('b')
      .where('b.status = :ap AND b.isActive = true AND b.acceptsQuotes = true AND b.ownerId IS NOT NULL', { ap: BusinessStatus.APPROVED })
      .andWhere('b.categoryId = :c AND b.cityId = :city', { c: req.categoryId, city: req.cityId });
    if (req.subCategoryId) qb.andWhere('(b.subCategoryId = :s OR b.subCategoryId IS NULL)', { s: req.subCategoryId });
    return qb.select(['b.id', 'b.name', 'b.ownerId']).getMany();
  }

  async mine(userId: string, page: number, limit: number) {
    const [items, total] = await repos2.requests().findAndCount({ where: { userId }, relations: ['category', 'subCategory', 'city'], order: { createdAt: 'DESC' }, skip: (page - 1) * limit, take: limit });
    return { items: items.map((r) => this.serialize(r)), meta: buildPaginationMeta(total, page, limit) };
  }

  /** Owner inbox: open requests matching any of the owner's businesses */
  async inbox(user: User, page: number, limit: number) {
    const businesses = await repos.businesses().find({ where: { ownerId: user.id, status: BusinessStatus.APPROVED }, select: ['id', 'name', 'categoryId', 'subCategoryId', 'cityId', 'acceptsQuotes'] });
    const eligible = businesses.filter((b) => b.acceptsQuotes);
    if (!eligible.length) return { items: [], meta: buildPaginationMeta(0, page, limit), businesses };
    const qb = repos2.requests().createQueryBuilder('r').leftJoinAndSelect('r.category', 'category').leftJoinAndSelect('r.subCategory', 'sub').leftJoinAndSelect('r.city', 'city')
      .where('r.status = :open AND (r.expiresAt IS NULL OR r.expiresAt > :now)', { open: ServiceRequestStatus.OPEN, now: new Date() })
      .andWhere('r.userId <> :me', { me: user.id });
    qb.andWhere(`(${eligible.map((b, i) => `(r.categoryId = :c${i} AND r.cityId = :ci${i}${b.subCategoryId ? ` AND (r.subCategoryId IS NULL OR r.subCategoryId = :s${i})` : ''})`).join(' OR ')})`);
    eligible.forEach((b, i) => qb.setParameters({ [`c${i}`]: b.categoryId, [`ci${i}`]: b.cityId, [`s${i}`]: b.subCategoryId }));
    const [items, total] = await qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    const myQuotes = items.length ? await repos2.quotes().find({ where: { requestId: In(items.map((r) => r.id)), businessId: In(eligible.map((b) => b.id)) } }) : [];
    return {
      items: items.map((r) => ({ ...this.serialize(r, false), myQuote: myQuotes.find((q) => q.requestId === r.id) || null, matchingBusinesses: eligible.filter((b) => b.categoryId === r.categoryId && b.cityId === r.cityId).map((b) => ({ id: b.id, name: b.name })) })),
      meta: buildPaginationMeta(total, page, limit),
      businesses,
    };
  }

  async get(id: number, user: User) {
    const r = await repos2.requests().findOne({ where: { id }, relations: ['category', 'subCategory', 'city', 'user'] });
    if (!r) throw AppError.notFound('Request not found');
    const isOwner = r.userId === user.id || user.role === UserRole.ADMIN;
    if (!isOwner) {
      const mine = await repos.businesses().count({ where: { ownerId: user.id, categoryId: r.categoryId, cityId: r.cityId } });
      if (!mine) throw AppError.forbidden();
    }
    const quotes = await repos2.quotes().find({ where: { requestId: id }, relations: ['business'], order: { createdAt: 'ASC' } });
    return {
      ...this.serialize(r, isOwner),
      user: publicUser(r.user),
      quotes: (isOwner ? quotes : quotes.filter((q) => q.business?.ownerId === user.id)).map((q) => ({
        id: q.id, price: q.price, currency: q.currency, message: q.message, etaDays: q.etaDays, status: q.status, createdAt: q.createdAt,
        business: q.business ? { id: q.business.id, name: q.business.name, slug: q.business.slug, logoImage: q.business.logoImage, averageRating: Number(q.business.averageRating), reviewCount: q.business.reviewCount, phone: q.business.phone, whatsapp: q.business.whatsapp, isVerified: q.business.isVerified } : null,
      })),
    };
  }

  async setStatus(id: number, user: User, status: ServiceRequestStatus.CLOSED | ServiceRequestStatus.CANCELLED | ServiceRequestStatus.OPEN) {
    const r = await repos2.requests().findOne({ where: { id } });
    if (!r) throw AppError.notFound('Request not found');
    if (r.userId !== user.id && user.role !== UserRole.ADMIN) throw AppError.forbidden();
    r.status = status;
    await repos2.requests().save(r);
    return this.get(id, user);
  }

  async sendQuote(requestId: number, user: User, data: { businessId: string; price?: number; message: string; etaDays?: number }) {
    const r = await repos2.requests().findOne({ where: { id: requestId } });
    if (!r || r.status !== ServiceRequestStatus.OPEN) throw AppError.notFound('Request not found or closed');
    const b = await repos.businesses().findOne({ where: { id: data.businessId } });
    if (!b || (b.ownerId !== user.id && user.role !== UserRole.ADMIN)) throw AppError.forbidden('Send quotes from your own business');
    if (b.categoryId !== r.categoryId || b.cityId !== r.cityId) throw AppError.badRequest('Your business does not match this request (category/city)');
    await EntitlementService.assertFeature(b.id, 'quotes', user);
    const existing = await repos2.quotes().findOne({ where: { requestId, businessId: b.id } });
    if (existing) {
      Object.assign(existing, { price: data.price ?? null, message: data.message, etaDays: data.etaDays ?? null, status: QuoteStatus.PENDING });
      await repos2.quotes().save(existing);
    } else {
      await repos2.quotes().save(repos2.quotes().create({ requestId, businessId: b.id, price: data.price !== undefined ? String(data.price) : null, message: data.message, etaDays: data.etaDays ?? null }));
      await repos2.requests().increment({ id: requestId }, 'quotesCount', 1);
      await NotificationService.notify(r.userId, NotificationType.NEW_QUOTE, `عرض سعر جديد على "${r.title}"`, `${b.name}${data.price ? ` — ${data.price}` : ''}`, { requestId });
    }
    return this.get(requestId, user);
  }

  async decideQuote(quoteId: number, user: User, status: QuoteStatus.ACCEPTED | QuoteStatus.REJECTED) {
    const q = await repos2.quotes().findOne({ where: { id: quoteId }, relations: ['request', 'business'] });
    if (!q) throw AppError.notFound('Quote not found');
    if (q.request.userId !== user.id && user.role !== UserRole.ADMIN) throw AppError.forbidden();
    q.status = status;
    await repos2.quotes().save(q);
    if (status === QuoteStatus.ACCEPTED) {
      await repos2.requests().update(q.requestId, { status: ServiceRequestStatus.ASSIGNED, acceptedQuoteId: q.id });
      await repos2.quotes().createQueryBuilder().update().set({ status: QuoteStatus.REJECTED }).where('requestId = :r AND id <> :id AND status = :p', { r: q.requestId, id: q.id, p: QuoteStatus.PENDING }).execute();
      await NotificationService.notify(q.business.ownerId, NotificationType.QUOTE_ACCEPTED, `تم قبول عرضك على "${q.request.title}"`, q.request.sharePhone ? `هاتف الزبون: ${q.request.phone || ''}` : undefined, { requestId: q.requestId });
    }
    return this.get(q.requestId, user);
  }

  async withdrawQuote(quoteId: number, user: User) {
    const q = await repos2.quotes().findOne({ where: { id: quoteId }, relations: ['business'] });
    if (!q) throw AppError.notFound('Quote not found');
    if (q.business.ownerId !== user.id && user.role !== UserRole.ADMIN) throw AppError.forbidden();
    q.status = QuoteStatus.WITHDRAWN;
    await repos2.quotes().save(q);
  }

  async adminList(page: number, limit: number, status?: ServiceRequestStatus) {
    const [items, total] = await repos2.requests().findAndCount({ where: status ? { status } : {}, relations: ['category', 'city', 'user'], order: { createdAt: 'DESC' }, skip: (page - 1) * limit, take: limit });
    return { items: items.map((r) => ({ ...this.serialize(r, true), user: publicUser(r.user) })), meta: buildPaginationMeta(total, page, limit) };
  }

  private serialize(r: ServiceRequest, showPhone = true) {
    return {
      id: r.id, title: r.title, description: r.description, images: r.images || [], budget: r.budget, preferredDate: r.preferredDate,
      district: r.district, status: r.status, quotesCount: r.quotesCount, acceptedQuoteId: r.acceptedQuoteId, expiresAt: r.expiresAt, createdAt: r.createdAt,
      phone: showPhone || r.sharePhone ? r.phone : null, sharePhone: r.sharePhone,
      category: r.category ? { id: r.category.id, name: r.category.name, nameEn: r.category.nameEn, icon: r.category.icon, color: r.category.color } : null,
      subCategory: r.subCategory ? { id: r.subCategory.id, name: r.subCategory.name, nameEn: r.subCategory.nameEn } : null,
      city: r.city ? { id: r.city.id, name: r.city.name, nameEn: r.city.nameEn } : null,
      categoryId: r.categoryId, subCategoryId: r.subCategoryId, cityId: r.cityId,
    };
  }

  static async expire(): Promise<void> {
    await repos2.requests().createQueryBuilder().update().set({ status: ServiceRequestStatus.CLOSED }).where('status = :o AND expiresAt < :now', { o: ServiceRequestStatus.OPEN, now: new Date() }).execute();
  }
}
