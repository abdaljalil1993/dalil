import { Brackets, In, SelectQueryBuilder } from 'typeorm';
import { repos } from './index';
import { Business } from '../entities';
import { BusinessStatus } from '../entities/enums';
import { escapeLike, normalizeText, tokenize } from '../utils/text';
import { nowInAppTz } from '../utils/time';

export type BusinessSort = 'relevance' | 'rating' | 'reviews' | 'newest' | 'distance' | 'name' | 'popular';

export interface BusinessFilter {
  q?: string;
  categoryId?: number;
  subCategoryId?: number;
  cityId?: number;
  district?: string;
  minRating?: number;
  priceRange?: number;
  openNow?: boolean;
  verified?: boolean;
  featuredOnly?: boolean;
  hasPhotos?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  ownerId?: string;
  status?: BusinessStatus | 'all';
  isActive?: boolean;
  excludeId?: string;
  sort?: BusinessSort;
  page?: number;
  limit?: number;
}

export interface BusinessQueryResult {
  items: Business[];
  total: number;
  distances: Map<string, number | null>;
}

const DIST = `(6371 * ACOS(LEAST(1, GREATEST(-1,
  COS(RADIANS(:lat)) * COS(RADIANS(b.latitude)) * COS(RADIANS(b.longitude) - RADIANS(:lng))
  + SIN(RADIANS(:lat)) * SIN(RADIANS(b.latitude))))))`;

const applyFilters = (qb: SelectQueryBuilder<Business>, f: BusinessFilter, tokens: string[]): void => {
  if (f.status && f.status !== 'all') qb.andWhere('b.status = :status', { status: f.status });
  if (f.isActive !== undefined) qb.andWhere('b.isActive = :isActive', { isActive: f.isActive });
  if (f.categoryId) qb.andWhere('b.categoryId = :categoryId', { categoryId: f.categoryId });
  if (f.subCategoryId) qb.andWhere('b.subCategoryId = :subCategoryId', { subCategoryId: f.subCategoryId });
  if (f.cityId) qb.andWhere('b.cityId = :cityId', { cityId: f.cityId });
  if (f.district) qb.andWhere('b.district LIKE :district', { district: `%${escapeLike(f.district)}%` });
  if (f.ownerId) qb.andWhere('b.ownerId = :ownerId', { ownerId: f.ownerId });
  if (f.excludeId) qb.andWhere('b.id <> :excludeId', { excludeId: f.excludeId });
  if (f.minRating) qb.andWhere('b.averageRating >= :minRating', { minRating: f.minRating });
  if (f.priceRange) qb.andWhere('b.priceRange <= :priceRange', { priceRange: f.priceRange });
  if (f.verified) qb.andWhere('b.isVerified = true');
  if (f.featuredOnly) qb.andWhere('b.isFeatured = true');
  if (f.hasPhotos) qb.andWhere('(b.coverImage IS NOT NULL OR EXISTS (SELECT 1 FROM business_images bi WHERE bi.businessId = b.id))');

  if (tokens.length) {
    qb.andWhere(
      new Brackets((w) => {
        tokens.forEach((_, i) => w.orWhere(`b.searchText LIKE :tok${i}`));
      })
    );
    tokens.forEach((t, i) => qb.setParameter(`tok${i}`, `%${escapeLike(t)}%`));
  }

  if (f.lat !== undefined && f.lng !== undefined) {
    qb.setParameters({ lat: f.lat, lng: f.lng });
    if (f.radiusKm) {
      qb.andWhere('b.latitude IS NOT NULL AND b.longitude IS NOT NULL');
      qb.andWhere(`${DIST} <= :radius`, { radius: f.radiusKm });
    }
  }

  if (f.openNow) {
    const { dow, time } = nowInAppTz();
    qb.andWhere(
      `EXISTS (SELECT 1 FROM business_working_hours wh WHERE wh.businessId = b.id AND (
        (wh.dayOfWeek = :dow AND wh.isClosed = false AND (
          wh.isOpen24Hours = true
          OR (wh.openTime <= wh.closeTime AND :nowTime >= wh.openTime AND :nowTime < wh.closeTime)
          OR (wh.openTime > wh.closeTime AND :nowTime >= wh.openTime)))
        OR (wh.dayOfWeek = :ydow AND wh.isClosed = false AND wh.isOpen24Hours = false
          AND wh.openTime > wh.closeTime AND :nowTime < wh.closeTime)))`,
      { dow, ydow: (dow + 6) % 7, nowTime: time }
    );
  }
};

/**
 * Two-step query (ids first, then entities with relations).
 * This avoids TypeORM's skip/take + join + computed ORDER BY limitations and keeps pagination exact.
 */
export const queryBusinesses = async (f: BusinessFilter): Promise<BusinessQueryResult> => {
  const page = f.page || 1;
  const limit = f.limit || 20;
  const tokens = f.q ? tokenize(f.q) : [];
  const hasGeo = f.lat !== undefined && f.lng !== undefined;

  const countQb = repos.businesses().createQueryBuilder('b');
  applyFilters(countQb, f, tokens);
  const total = await countQb.getCount();
  if (total === 0) return { items: [], total, distances: new Map() };

  const idQb = repos.businesses().createQueryBuilder('b').select('b.id', 'id');
  applyFilters(idQb, f, tokens);

  if (hasGeo) idQb.addSelect(`CASE WHEN b.latitude IS NULL THEN NULL ELSE ${DIST} END`, 'distance');

  if (tokens.length) {
    const phrase = normalizeText(f.q);
    const parts = tokens.map((_, i) => `(CASE WHEN b.searchText LIKE :tok${i} THEN 2 ELSE 0 END) + (CASE WHEN b.name LIKE :tok${i} THEN 3 ELSE 0 END)`);
    idQb.addSelect(`(${parts.join(' + ')} + (CASE WHEN b.searchText LIKE :phrase THEN 4 ELSE 0 END))`, 'score');
    idQb.setParameter('phrase', `%${escapeLike(phrase)}%`);
  }

  const sort: BusinessSort = f.sort || (tokens.length ? 'relevance' : 'popular');
  const paidFirst = sort !== 'distance';
  if (paidFirst) idQb.orderBy('b.isFeatured', 'DESC').addOrderBy('b.featuredPriority', 'DESC');

  switch (sort) {
    case 'distance':
      if (hasGeo) idQb.addOrderBy('distance IS NULL', 'ASC').addOrderBy('distance', 'ASC');
      else idQb.addOrderBy('b.averageRating', 'DESC');
      break;
    case 'rating':
      idQb.addOrderBy('b.averageRating', 'DESC').addOrderBy('b.reviewCount', 'DESC');
      break;
    case 'reviews':
      idQb.addOrderBy('b.reviewCount', 'DESC');
      break;
    case 'newest':
      idQb.addOrderBy('b.createdAt', 'DESC');
      break;
    case 'name':
      idQb.addOrderBy('b.name', 'ASC');
      break;
    case 'relevance':
      if (tokens.length) idQb.addOrderBy('score', 'DESC');
      idQb.addOrderBy('b.averageRating', 'DESC');
      break;
    case 'popular':
    default:
      idQb.addOrderBy('b.isVerified', 'DESC').addOrderBy('b.averageRating', 'DESC').addOrderBy('b.reviewCount', 'DESC').addOrderBy('b.viewCount', 'DESC');
  }
  idQb.addOrderBy('b.id', 'ASC').offset((page - 1) * limit).limit(limit);

  const rows = await idQb.getRawMany<{ id: string; distance?: string | number | null }>();
  const ids = rows.map((r) => r.id);
  const distances = new Map<string, number | null>(
    rows.map((r) => [r.id, r.distance === undefined || r.distance === null ? null : Math.round(Number(r.distance) * 100) / 100])
  );

  const entities = ids.length
    ? await repos.businesses().find({
        where: { id: In(ids) },
        relations: ['category', 'subCategory', 'city', 'images', 'workingHours', 'owner'],
      })
    : [];
  const byId = new Map(entities.map((e) => [e.id, e]));
  return { items: ids.map((id) => byId.get(id)).filter((x): x is Business => Boolean(x)), total, distances };
};
