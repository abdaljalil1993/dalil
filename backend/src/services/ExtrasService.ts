import { Brackets, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { repos, repos2 } from '../repositories';
import { BusinessItem, Offer, User, EmergencyContact } from '../entities';
import { BusinessStatus, UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { StorageService } from './StorageService';
import { EntitlementService } from './BillingService';
import { CacheService } from './CacheService';
import { serializeBusiness } from './serializers';
import { nowInAppTz } from '../utils/time';

const isAdmin = (u?: User) => u?.role === UserRole.ADMIN;

export const assertCanManage = async (businessId: string, user: User) => {
  const b = await repos.businesses().findOne({ where: { id: businessId } });
  if (!b) throw AppError.notFound('Business not found');
  if (!isAdmin(user) && b.ownerId !== user.id) throw AppError.forbidden('You can only manage your own businesses');
  return b;
};

const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Damascus' }).format(new Date());

export type ItemInput = Partial<Pick<BusinessItem, 'section' | 'name' | 'nameEn' | 'description' | 'price' | 'oldPrice' | 'currency' | 'unit' | 'image' | 'durationMinutes' | 'isAvailable' | 'isPopular' | 'sortOrder'>>;
export type OfferInput = Partial<Pick<Offer, 'title' | 'description' | 'image' | 'discountPercent' | 'price' | 'oldPrice' | 'currency' | 'couponCode' | 'terms' | 'startDate' | 'endDate' | 'isActive'>>;

/** Menu / products / services, offers, pharmacy duties, emergency numbers. */
export class ExtrasService {
  // ───────────── items (menu / products / services) ─────────────
  async listItems(businessId: string, includeHidden = false) {
    const items = await repos2.items().find({ where: includeHidden ? { businessId } : { businessId, isAvailable: true }, order: { sortOrder: 'ASC', id: 'ASC' } });
    const sections = Array.from(new Set(items.map((i) => i.section || '')));
    return { sections: sections.map((name) => ({ name, items: items.filter((i) => (i.section || '') === name) })), total: items.length };
  }

  async createItem(businessId: string, data: ItemInput, user: User, file?: Express.Multer.File) {
    await assertCanManage(businessId, user);
    await EntitlementService.assertLimit(businessId, 'maxItems', await repos2.items().count({ where: { businessId } }), 1, user);
    if (file) data.image = (await StorageService.upload(file, `businesses/${businessId}/items`)).url;
    return repos2.items().save(repos2.items().create({ ...data, businessId }));
  }

  async updateItem(id: number, data: ItemInput, user: User, file?: Express.Multer.File) {
    const item = await repos2.items().findOne({ where: { id } });
    if (!item) throw AppError.notFound('Item not found');
    await assertCanManage(item.businessId, user);
    if (file) data.image = (await StorageService.upload(file, `businesses/${item.businessId}/items`)).url;
    Object.assign(item, data);
    return repos2.items().save(item);
  }

  async deleteItem(id: number, user: User) {
    const item = await repos2.items().findOne({ where: { id } });
    if (!item) throw AppError.notFound('Item not found');
    await assertCanManage(item.businessId, user);
    await repos2.items().delete(id);
  }

  // ───────────── offers ─────────────
  /** Public offers feed (active now), optional city/category filter */
  async activeOffers(filter: { cityId?: number; categoryId?: number; businessId?: string; page?: number; limit?: number }) {
    const now = new Date();
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const qb = repos2.offers()
      .createQueryBuilder('o')
      .innerJoinAndSelect('o.business', 'b', 'b.status = :ap AND b.isActive = true', { ap: BusinessStatus.APPROVED })
      .leftJoinAndSelect('b.category', 'category')
      .leftJoinAndSelect('b.city', 'city')
      .where('o.isActive = true AND o.startDate <= :now AND o.endDate >= :now', { now });
    if (filter.cityId) qb.andWhere('b.cityId = :cityId', { cityId: filter.cityId });
    if (filter.categoryId) qb.andWhere('b.categoryId = :categoryId', { categoryId: filter.categoryId });
    if (filter.businessId) qb.andWhere('o.businessId = :bid', { bid: filter.businessId });
    const [items, total] = await qb.orderBy('b.isFeatured', 'DESC').addOrderBy('o.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return {
      items: items.map((o) => ({ ...o, business: { id: o.business.id, name: o.business.name, nameEn: o.business.nameEn, slug: o.business.slug, logoImage: o.business.logoImage, coverImage: o.business.coverImage, city: o.business.city ? { id: o.business.city.id, name: o.business.city.name, nameEn: o.business.city.nameEn } : null, category: o.business.category ? { id: o.business.category.id, name: o.business.category.name, nameEn: o.business.category.nameEn, icon: o.business.category.icon, color: o.business.category.color } : null } })),
      total,
      page,
      limit,
    };
  }

  async businessOffers(businessId: string, user?: User) {
    const b = await repos.businesses().findOne({ where: { id: businessId } });
    const manage = b && user && (isAdmin(user) || b.ownerId === user.id);
    if (manage) return repos2.offers().find({ where: { businessId }, order: { createdAt: 'DESC' } });
    const now = new Date();
    return repos2.offers().find({ where: { businessId, isActive: true, startDate: LessThanOrEqual(now), endDate: MoreThanOrEqual(now) }, order: { createdAt: 'DESC' } });
  }

  async createOffer(businessId: string, data: OfferInput, user: User, file?: Express.Multer.File) {
    const b = await assertCanManage(businessId, user);
    if (b.status !== BusinessStatus.APPROVED && !isAdmin(user)) throw AppError.badRequest('Business must be approved before publishing offers');
    const active = await repos2.offers().count({ where: { businessId, isActive: true, endDate: MoreThanOrEqual(new Date()) } });
    await EntitlementService.assertLimit(businessId, 'maxActiveOffers', active, 1, user);
    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) throw AppError.badRequest('End date must be after start date');
    if (file) data.image = (await StorageService.upload(file, `businesses/${businessId}/offers`)).url;
    const offer = await repos2.offers().save(repos2.offers().create({ ...data, businessId }));
    await CacheService.delByPattern('home:*');
    return offer;
  }

  async updateOffer(id: number, data: OfferInput, user: User, file?: Express.Multer.File) {
    const offer = await repos2.offers().findOne({ where: { id } });
    if (!offer) throw AppError.notFound('Offer not found');
    await assertCanManage(offer.businessId, user);
    if (file) data.image = (await StorageService.upload(file, `businesses/${offer.businessId}/offers`)).url;
    Object.assign(offer, data);
    await CacheService.delByPattern('home:*');
    return repos2.offers().save(offer);
  }

  async deleteOffer(id: number, user: User) {
    const offer = await repos2.offers().findOne({ where: { id } });
    if (!offer) throw AppError.notFound('Offer not found');
    await assertCanManage(offer.businessId, user);
    await repos2.offers().delete(id);
    await CacheService.delByPattern('home:*');
  }

  // ───────────── pharmacy duties ─────────────
  async onDuty(filter: { cityId?: number; date?: string }) {
    const date = filter.date || todayStr();
    const qb = repos2.duties()
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.business', 'b', 'b.status = :ap', { ap: BusinessStatus.APPROVED })
      .leftJoinAndSelect('b.city', 'city')
      .leftJoinAndSelect('b.category', 'category')
      .leftJoinAndSelect('b.workingHours', 'wh')
      .where('d.date = :date', { date });
    if (filter.cityId) qb.andWhere('b.cityId = :cityId', { cityId: filter.cityId });
    const rows = await qb.orderBy('b.district', 'ASC').getMany();
    return { date, items: rows.map((d) => ({ id: d.id, date: d.date, startTime: d.startTime?.slice(0, 5) || null, endTime: d.endTime?.slice(0, 5) || null, note: d.note, business: serializeBusiness(d.business) })) };
  }

  async businessDuties(businessId: string, from?: string) {
    return repos2.duties().find({ where: { businessId, date: MoreThanOrEqual(from || todayStr()) }, order: { date: 'ASC' } });
  }

  /** Replace upcoming duty dates for a pharmacy (owner or admin) */
  async setDuties(businessId: string, duties: { date: string; startTime?: string; endTime?: string; note?: string }[], user: User) {
    await assertCanManage(businessId, user);
    const from = todayStr();
    await repos2.duties().createQueryBuilder().delete().where('businessId = :businessId AND date >= :from', { businessId, from }).execute();
    const unique = new Map(duties.filter((d) => d.date >= from).map((d) => [d.date, d]));
    if (unique.size) await repos2.duties().save(Array.from(unique.values()).map((d) => repos2.duties().create({ ...d, businessId, startTime: d.startTime || null, endTime: d.endTime || null })));
    return this.businessDuties(businessId);
  }

  /** Admin bulk: assign duty to many pharmacies for one date */
  async setDutyForDate(date: string, businessIds: string[]) {
    await repos2.duties().delete({ date, businessId: In(businessIds.length ? businessIds : ['-']) });
    if (businessIds.length) await repos2.duties().save(businessIds.map((businessId) => repos2.duties().create({ businessId, date })));
    return this.onDuty({ date });
  }

  // ───────────── emergency numbers ─────────────
  async emergency(cityId?: number) {
    const qb = repos2.emergency().createQueryBuilder('e').leftJoinAndSelect('e.city', 'city').where('e.isActive = true');
    if (cityId) qb.andWhere(new Brackets((w) => w.where('e.cityId IS NULL').orWhere('e.cityId = :cityId', { cityId })));
    else qb.andWhere('e.cityId IS NULL');
    return qb.orderBy('e.cityId IS NULL', 'DESC').addOrderBy('e.sortOrder', 'ASC').addOrderBy('e.id', 'ASC').getMany();
  }

  adminEmergency() {
    return repos2.emergency().find({ relations: ['city'], order: { cityId: 'ASC', sortOrder: 'ASC' } });
  }

  async saveEmergency(id: number | null, data: Partial<EmergencyContact>) {
    const row = id ? await repos2.emergency().findOne({ where: { id } }) : repos2.emergency().create();
    if (!row) throw AppError.notFound('Not found');
    Object.assign(row, data);
    return repos2.emergency().save(row);
  }

  async deleteEmergency(id: number) {
    await repos2.emergency().delete(id);
  }
}

export const isOpenHour = () => nowInAppTz();
