import { FeatureService, LISTING_FEATURE } from './FeatureService';
import { Brackets, In, IsNull } from 'typeorm';
import { repos, repos2 } from '../repositories';
import { Listing, User } from '../entities';
import { ApplicationStatus, ListingPurpose, ListingStatus, ListingType, NotificationType, UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { buildPaginationMeta } from '../utils/response';
import { escapeLike, normalizeText, slugify, tokenize } from '../utils/text';
import { StorageService } from './StorageService';
import { EntitlementService, SettingsService } from './BillingService';
import { NotificationService } from './NotificationService';
import { publicUser } from './serializers';

/**
 * Type-specific fields. `kind` drives validation & filtering:
 *  num → numeric (filters attrMin[x] / attrMax[x]),  enum → one of options (attr[x]=v),  bool, text.
 * The web & mobile apps render forms and filters from GET /listings/fields.
 */
export const LISTING_FIELDS: Record<ListingType, { key: string; kind: 'num' | 'enum' | 'bool' | 'text'; options?: string[]; filter?: boolean }[]> = {
  real_estate: [
    { key: 'propertyType', kind: 'enum', options: ['apartment', 'house', 'villa', 'land', 'shop', 'office', 'warehouse', 'farm', 'chalet', 'building'], filter: true },
    { key: 'rooms', kind: 'num', filter: true },
    { key: 'bathrooms', kind: 'num', filter: true },
    { key: 'area', kind: 'num', filter: true },
    { key: 'floor', kind: 'num' },
    { key: 'furnished', kind: 'bool', filter: true },
    { key: 'ownership', kind: 'enum', options: ['green_deed', 'court_ruling', 'notary', 'cooperative', 'other'], filter: true },
    { key: 'direction', kind: 'enum', options: ['north', 'south', 'east', 'west', 'corner'] },
    { key: 'hasSolar', kind: 'bool', filter: true },
    { key: 'hasElevator', kind: 'bool' },
    { key: 'hasParking', kind: 'bool' },
  ],
  car: [
    { key: 'make', kind: 'text', filter: true },
    { key: 'model', kind: 'text', filter: true },
    { key: 'year', kind: 'num', filter: true },
    { key: 'mileageKm', kind: 'num', filter: true },
    { key: 'fuel', kind: 'enum', options: ['petrol', 'diesel', 'hybrid', 'electric', 'gas'], filter: true },
    { key: 'transmission', kind: 'enum', options: ['manual', 'automatic'], filter: true },
    { key: 'condition', kind: 'enum', options: ['new', 'used'], filter: true },
    { key: 'bodyType', kind: 'enum', options: ['sedan', 'suv', 'hatchback', 'pickup', 'van', 'truck', 'bus', 'motorcycle', 'coupe'], filter: true },
    { key: 'color', kind: 'text' },
    { key: 'customsCleared', kind: 'bool', filter: true },
  ],
  job: [
    { key: 'jobType', kind: 'enum', options: ['full_time', 'part_time', 'remote', 'freelance', 'internship', 'daily'], filter: true },
    { key: 'field', kind: 'text', filter: true },
    { key: 'experienceYears', kind: 'num', filter: true },
    { key: 'education', kind: 'enum', options: ['none', 'secondary', 'institute', 'bachelor', 'master', 'phd'], filter: true },
    { key: 'gender', kind: 'enum', options: ['any', 'male', 'female'], filter: true },
    { key: 'salaryMax', kind: 'num' },
    { key: 'workHours', kind: 'text' },
    { key: 'companyName', kind: 'text' },
  ],
  other: [{ key: 'condition', kind: 'enum', options: ['new', 'used'], filter: true }],
};

const PURPOSES: Record<ListingType, ListingPurpose[]> = {
  real_estate: [ListingPurpose.SALE, ListingPurpose.RENT, ListingPurpose.WANTED],
  car: [ListingPurpose.SALE, ListingPurpose.RENT, ListingPurpose.WANTED],
  job: [ListingPurpose.HIRE, ListingPurpose.WANTED],
  other: [ListingPurpose.SALE, ListingPurpose.RENT, ListingPurpose.WANTED],
};

export interface ListingFilter {
  /** apply feature switches (public browse only) */
  publicScope?: boolean;
  type?: ListingType;
  purpose?: ListingPurpose;
  cityId?: number;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  attr?: Record<string, string>;
  attrMin?: Record<string, string>;
  attrMax?: Record<string, string>;
  userId?: string;
  businessId?: string;
  status?: ListingStatus | 'all';
  hasPhotos?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  limit?: number;
}

export type ListingInput = Partial<Pick<Listing, 'type' | 'purpose' | 'title' | 'description' | 'price' | 'currency' | 'priceNegotiable' | 'pricePeriod' | 'cityId' | 'district' | 'address' | 'latitude' | 'longitude' | 'attributes' | 'contactPhone' | 'whatsapp' | 'businessId'>>;

const sanitizeAttributes = (type: ListingType, attrs: Record<string, unknown> = {}) => {
  const out: Record<string, string | number | boolean> = {};
  for (const f of LISTING_FIELDS[type] || []) {
    const v = attrs[f.key];
    if (v === undefined || v === null || v === '') continue;
    if (f.kind === 'num') {
      const n = Number(v);
      if (Number.isFinite(n)) out[f.key] = n;
    } else if (f.kind === 'bool') out[f.key] = v === true || v === 'true' || v === 1 || v === '1';
    else if (f.kind === 'enum') {
      if (f.options?.includes(String(v))) out[f.key] = String(v);
    } else out[f.key] = String(v).slice(0, 120);
  }
  return out;
};

const serialize = (l: Listing, privileged = false) => ({
  id: l.id,
  slug: l.slug,
  type: l.type,
  purpose: l.purpose,
  title: l.title,
  description: l.description,
  price: l.price,
  currency: l.currency,
  priceNegotiable: l.priceNegotiable,
  pricePeriod: l.pricePeriod,
  cityId: l.cityId,
  city: l.city ? { id: l.city.id, name: l.city.name, nameEn: l.city.nameEn } : null,
  district: l.district,
  address: l.address,
  latitude: l.latitude,
  longitude: l.longitude,
  attributes: l.attributes || {},
  images: l.images || [],
  contactPhone: l.contactPhone,
  whatsapp: l.whatsapp,
  status: l.status,
  isFeatured: l.isFeatured,
  viewCount: l.viewCount,
  applicationsCount: privileged ? l.applicationsCount : undefined,
  adminNote: privileged ? l.adminNote : undefined,
  expiresAt: l.expiresAt,
  user: publicUser(l.user),
  business: l.business ? { id: l.business.id, name: l.business.name, slug: l.business.slug, logoImage: l.business.logoImage, isVerified: l.business.isVerified } : null,
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
});

const KEY_RE = /^[a-zA-Z]{1,30}$/;

export class ListingService {
  fields() {
    return { fields: LISTING_FIELDS, purposes: PURPOSES };
  }

  async search(f: ListingFilter, viewer?: User) {
    const page = f.page || 1;
    const limit = f.limit || 20;
    const qb = repos2.listings().createQueryBuilder('l').leftJoinAndSelect('l.city', 'city').leftJoinAndSelect('l.user', 'user').leftJoinAndSelect('l.business', 'business');
    const status = f.status || ListingStatus.ACTIVE;
    if (status !== 'all') qb.andWhere('l.status = :status', { status });
    if (f.type) qb.andWhere('l.type = :type', { type: f.type });
    if (f.purpose) qb.andWhere('l.purpose = :purpose', { purpose: f.purpose });
    if (f.cityId) qb.andWhere('l.cityId = :cityId', { cityId: f.cityId });
    if (f.publicScope) {
      // respect the admin's feature switches (type off everywhere / only some governorates)
      const types = f.type ? [f.type] : (Object.keys(LISTING_FEATURE) as ListingType[]);
      const parts: string[] = [];
      for (const ty of types) {
        const key = LISTING_FEATURE[ty];
        const sc = key ? await FeatureService.scope(key) : null;
        if (sc && !sc.length) continue;
        parts.push(sc && !f.cityId ? `(l.type = '${ty}' AND l.cityId IN (${sc.map(Number).join(',')}))` : `l.type = '${ty}'`);
      }
      qb.andWhere(parts.length ? `(${parts.join(' OR ')})` : '1 = 0');
    }
    if (f.district) qb.andWhere('l.district LIKE :district', { district: `%${escapeLike(f.district)}%` });
    if (f.minPrice !== undefined) qb.andWhere('l.price >= :minPrice', { minPrice: f.minPrice });
    if (f.maxPrice !== undefined) qb.andWhere('l.price <= :maxPrice', { maxPrice: f.maxPrice });
    if (f.userId) qb.andWhere('l.userId = :userId', { userId: f.userId });
    if (f.businessId) qb.andWhere('l.businessId = :businessId', { businessId: f.businessId });
    if (f.hasPhotos) qb.andWhere("JSON_LENGTH(l.images) > 0");
    if (f.q) {
      if (!viewer) throw AppError.unauthorized('Sign in to search');
      const tokens = tokenize(f.q);
      if (tokens.length) {
        qb.andWhere(new Brackets((w) => tokens.forEach((_, i) => w.orWhere(`l.searchText LIKE :lt${i}`))));
        tokens.forEach((t, i) => qb.setParameter(`lt${i}`, `%${escapeLike(t)}%`));
      }
    }
    const allowed = new Set((f.type ? LISTING_FIELDS[f.type] : Object.values(LISTING_FIELDS).flat()).filter((x) => x.filter).map((x) => x.key));
    let n = 0;
    for (const [k, v] of Object.entries(f.attr || {})) {
      if (!KEY_RE.test(k) || !allowed.has(k) || v === '') continue;
      const p = `a${n++}`;
      const isBool = ['true', 'false'].includes(String(v));
      const field = LISTING_FIELDS[f.type || ListingType.OTHER]?.find((x) => x.key === k) || Object.values(LISTING_FIELDS).flat().find((x) => x.key === k);
      if (isBool || field?.kind === 'enum' || field?.kind === 'num') {
        qb.andWhere(`LOWER(CAST(JSON_UNQUOTE(JSON_EXTRACT(l.attributes, '$.${k}')) AS CHAR CHARACTER SET utf8mb4)) = LOWER(:${p})`, { [p]: String(v) });
      } else {
        qb.andWhere(`LOWER(CAST(JSON_UNQUOTE(JSON_EXTRACT(l.attributes, '$.${k}')) AS CHAR CHARACTER SET utf8mb4)) LIKE LOWER(:${p})`, { [p]: `%${escapeLike(String(v))}%` });
      }
    }
    for (const [k, v] of Object.entries(f.attrMin || {})) {
      if (!KEY_RE.test(k) || !allowed.has(k) || !Number.isFinite(Number(v))) continue;
      const p = `a${n++}`;
      qb.andWhere(`CAST(JSON_EXTRACT(l.attributes, '$.${k}') AS DECIMAL(16,2)) >= :${p}`, { [p]: Number(v) });
    }
    for (const [k, v] of Object.entries(f.attrMax || {})) {
      if (!KEY_RE.test(k) || !allowed.has(k) || !Number.isFinite(Number(v))) continue;
      const p = `a${n++}`;
      qb.andWhere(`CAST(JSON_EXTRACT(l.attributes, '$.${k}') AS DECIMAL(16,2)) <= :${p}`, { [p]: Number(v) });
    }
    qb.orderBy('l.isFeatured', 'DESC');
    if (f.sort === 'price_asc') qb.addOrderBy('l.price IS NULL', 'ASC').addOrderBy('l.price', 'ASC');
    else if (f.sort === 'price_desc') qb.addOrderBy('l.price', 'DESC');
    else if (f.sort === 'popular') qb.addOrderBy('l.viewCount', 'DESC');
    else qb.addOrderBy('l.createdAt', 'DESC');
    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    const privileged = viewer?.role === UserRole.ADMIN || (f.userId && f.userId === viewer?.id);
    return { items: items.map((l) => serialize(l, Boolean(privileged))), meta: buildPaginationMeta(total, page, limit) };
  }

  async get(idOrSlug: string, viewer?: User) {
    const l = await repos2.listings().findOne({ where: /^[0-9a-f-]{36}$/i.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug }, relations: ['city', 'user', 'business'] });
    if (!l) throw AppError.notFound('Listing not found');
    const owner = viewer && (viewer.role === UserRole.ADMIN || viewer.id === l.userId);
    if (!owner && l.status !== ListingStatus.ACTIVE && l.status !== ListingStatus.CLOSED) throw AppError.notFound('Listing not found');
    if (!owner) repos2.listings().increment({ id: l.id }, 'viewCount', 1).catch(() => undefined);
    const applied = viewer && l.type === ListingType.JOB ? await repos2.applications().exist({ where: { listingId: l.id, userId: viewer.id } }) : false;
    return { ...serialize(l, Boolean(owner)), viewer: viewer ? { canManage: Boolean(owner), hasApplied: applied } : null };
  }

  async create(user: User, data: ListingInput) {
    if (!data.type || !PURPOSES[data.type]?.includes(data.purpose as ListingPurpose)) throw AppError.badRequest('Invalid purpose for this listing type');
    if (!(await repos.cities().exist({ where: { id: data.cityId } }))) throw AppError.badRequest('City does not exist');
    if (data.businessId) {
      const b = await repos.businesses().findOne({ where: { id: data.businessId } });
      if (!b || (b.ownerId !== user.id && user.role !== UserRole.ADMIN)) throw AppError.forbidden('You can only post on behalf of your own business');
      const active = await repos2.listings().count({ where: { businessId: b.id, status: In([ListingStatus.PENDING, ListingStatus.ACTIVE]) } });
      await EntitlementService.assertLimit(b.id, 'maxActiveListings', active, 1, user);
    } else {
      const mine = await repos2.listings().count({ where: { userId: user.id, businessId: IsNull(), status: In([ListingStatus.PENDING, ListingStatus.ACTIVE]) } });
      if (mine >= 20 && user.role !== UserRole.ADMIN) throw AppError.badRequest('Maximum 20 active listings per person');
    }
    const s = await SettingsService.all();
    const listing = repos2.listings().create({
      ...data,
      attributes: sanitizeAttributes(data.type, data.attributes as Record<string, unknown>),
      userId: user.id,
      slug: await this.uniqueSlug(data.title!),
      status: s.listingsRequireApproval && user.role !== UserRole.ADMIN ? ListingStatus.PENDING : ListingStatus.ACTIVE,
      expiresAt: new Date(Date.now() + s.listingDurationDays * 864e5),
    });
    const saved = await repos2.listings().save(listing);
    await this.reindex(saved.id);
    return this.get(saved.id, user);
  }

  async update(id: string, user: User, data: ListingInput) {
    const l = await this.ownListing(id, user);
    const type = data.type || l.type;
    if (data.purpose && !PURPOSES[type].includes(data.purpose)) throw AppError.badRequest('Invalid purpose for this listing type');
    Object.assign(l, data);
    if (data.attributes) l.attributes = sanitizeAttributes(type, data.attributes as Record<string, unknown>);
    if (l.status === ListingStatus.REJECTED) l.status = ListingStatus.PENDING;
    await repos2.listings().save(l);
    await this.reindex(l.id);
    return this.get(l.id, user);
  }

  async setOwnerStatus(id: string, user: User, status: ListingStatus.CLOSED | ListingStatus.ACTIVE) {
    const l = await this.ownListing(id, user);
    if (status === ListingStatus.ACTIVE && l.status !== ListingStatus.CLOSED && l.status !== ListingStatus.EXPIRED) throw AppError.badRequest('Only closed/expired listings can be re-opened');
    l.status = status;
    if (status === ListingStatus.ACTIVE) l.expiresAt = new Date(Date.now() + (await SettingsService.get('listingDurationDays')) * 864e5);
    await repos2.listings().save(l);
    return this.get(id, user);
  }

  async remove(id: string, user: User) {
    const l = await this.ownListing(id, user);
    await Promise.all((l.images || []).map((i) => StorageService.remove(i.publicId)));
    await repos2.listings().delete(l.id);
  }

  async addImages(id: string, user: User, files: Express.Multer.File[]) {
    const l = await this.ownListing(id, user);
    if (!files?.length) throw AppError.badRequest('No images uploaded (field "images")');
    const current = l.images || [];
    if (current.length + files.length > 15) throw AppError.badRequest('Maximum 15 images per listing');
    const stored = await Promise.all(files.map((f) => StorageService.upload(f, `listings/${id}`)));
    l.images = [...current, ...stored.map((s) => ({ url: s.url, publicId: s.publicId }))];
    await repos2.listings().save(l);
    return this.get(id, user);
  }

  async removeImage(id: string, user: User, index: number) {
    const l = await this.ownListing(id, user);
    const img = (l.images || [])[index];
    if (!img) throw AppError.notFound('Image not found');
    await StorageService.remove(img.publicId);
    l.images = (l.images || []).filter((_, i) => i !== index);
    await repos2.listings().save(l);
    return this.get(id, user);
  }

  async moderate(id: string, status: ListingStatus, adminNote?: string, isFeatured?: boolean) {
    const l = await repos2.listings().findOne({ where: { id } });
    if (!l) throw AppError.notFound('Listing not found');
    const prev = l.status;
    l.status = status;
    if (adminNote !== undefined) l.adminNote = adminNote;
    if (isFeatured !== undefined) l.isFeatured = isFeatured;
    await repos2.listings().save(l);
    if (prev !== status && (status === ListingStatus.ACTIVE || status === ListingStatus.REJECTED)) {
      await NotificationService.notify(l.userId, status === ListingStatus.ACTIVE ? NotificationType.LISTING_APPROVED : NotificationType.LISTING_REJECTED, status === ListingStatus.ACTIVE ? `تم نشر إعلانك "${l.title}"` : `تم رفض إعلانك "${l.title}"`, adminNote, { listingId: l.id, listingSlug: l.slug });
    }
    return l;
  }

  // ───────────── job applications ─────────────
  async apply(listingId: string, user: User, data: { message?: string; phone?: string; cvUrl?: string }, cv?: Express.Multer.File) {
    const l = await repos2.listings().findOne({ where: { id: listingId } });
    if (!l || l.type !== ListingType.JOB || l.purpose !== ListingPurpose.HIRE || l.status !== ListingStatus.ACTIVE) throw AppError.notFound('Job not found or closed');
    if (l.userId === user.id) throw AppError.badRequest('You cannot apply to your own job post');
    if (await repos2.applications().exist({ where: { listingId, userId: user.id } })) throw AppError.conflict('You already applied to this job');
    if (cv) data.cvUrl = (await StorageService.upload(cv, `cv/${user.id}`)).url;
    const app = await repos2.applications().save(repos2.applications().create({ ...data, phone: data.phone || user.phone, listingId, userId: user.id }));
    await repos2.listings().increment({ id: listingId }, 'applicationsCount', 1);
    await NotificationService.notify(l.userId, NotificationType.JOB_APPLICATION, `متقدّم جديد لوظيفة "${l.title}"`, `${user.firstName} ${user.lastName}`, { listingId, listingSlug: l.slug });
    return app;
  }

  async applicationsFor(listingId: string, user: User) {
    await this.ownListing(listingId, user);
    const apps = await repos2.applications().find({ where: { listingId }, relations: ['user'], order: { createdAt: 'DESC' } });
    return apps.map((a) => ({ ...a, user: a.user ? { ...publicUser(a.user), email: a.user.email, phone: a.user.phone } : null }));
  }

  async myApplications(userId: string) {
    const apps = await repos2.applications().find({ where: { userId }, relations: ['listing', 'listing.city'], order: { createdAt: 'DESC' } });
    return apps.map((a) => ({ ...a, listing: a.listing ? { id: a.listing.id, slug: a.listing.slug, title: a.listing.title, status: a.listing.status, city: a.listing.city?.name } : null }));
  }

  async setApplicationStatus(id: number, user: User, status: ApplicationStatus) {
    const app = await repos2.applications().findOne({ where: { id }, relations: ['listing'] });
    if (!app) throw AppError.notFound('Application not found');
    if (app.listing.userId !== user.id && user.role !== UserRole.ADMIN) throw AppError.forbidden();
    app.status = status;
    await repos2.applications().save(app);
    if (status !== ApplicationStatus.VIEWED) {
      await NotificationService.notify(app.userId, NotificationType.APPLICATION_UPDATE, `تحديث على طلبك لوظيفة "${app.listing.title}"`, status, { listingId: app.listingId, listingSlug: app.listing.slug });
    }
    return app;
  }

  // ───────────── helpers ─────────────
  private async ownListing(id: string, user: User) {
    const l = await repos2.listings().findOne({ where: { id } });
    if (!l) throw AppError.notFound('Listing not found');
    if (l.userId !== user.id && user.role !== UserRole.ADMIN) throw AppError.forbidden('You can only manage your own listings');
    return l;
  }

  private async reindex(id: string) {
    const l = await repos2.listings().findOne({ where: { id }, relations: ['city'] });
    if (!l) return;
    const text = normalizeText([l.title, l.description, l.district, l.address, l.city?.name, l.city?.nameEn, ...Object.values(l.attributes || {}).map(String)].filter(Boolean).join(' '));
    await repos2.listings().update(id, { searchText: text.slice(0, 60000) });
  }

  private async uniqueSlug(title: string) {
    const base = slugify(title);
    let slug = base;
    for (let i = 2; await repos2.listings().exist({ where: { slug } }); i++) slug = `${base}-${i}`;
    return slug;
  }

  static async expire(): Promise<void> {
    await repos2.listings().createQueryBuilder().update().set({ status: ListingStatus.EXPIRED }).where('status = :a AND expiresAt < :now', { a: ListingStatus.ACTIVE, now: new Date() }).execute();
  }
}
