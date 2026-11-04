import { repos } from '../repositories';
import { AdStatus, BusinessStatus, ClaimStatus, PromotionStatus, ReportStatus, UserRole } from '../entities/enums';
import { CacheService } from './CacheService';
import { buildPaginationMeta } from '../utils/response';
import { serializeBusiness } from './serializers';

const monthsBack = (n: number) => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() - (n - 1));
  return d;
};

const fillMonths = (rows: { m: string; cnt: string }[], n = 12) => {
  const start = monthsBack(n);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start);
    d.setUTCMonth(start.getUTCMonth() + i);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    return { month: key, count: Number(rows.find((r) => r.m === key)?.cnt || 0) };
  });
};

export class DashboardService {
  async stats() {
    return CacheService.remember('dashboard:stats', 120, async () => {
      const b = repos.businesses();
      const since = monthsBack(12);
      const [
        users, owners, admins, businesses, pending, approved, rejected, reviews, searches,
        categories, cities, pendingReports, pendingClaims, pendingAds, pendingFeatured, activeAds, activeFeatured, unreadMessages,
        usersByMonth, businessesByMonth, reviewsByMonth, byCategory, byCity, recent, top,
      ] = await Promise.all([
        repos.users().count(),
        repos.users().count({ where: { role: UserRole.BUSINESS_OWNER } }),
        repos.users().count({ where: { role: UserRole.ADMIN } }),
        b.count(),
        b.count({ where: { status: BusinessStatus.PENDING } }),
        b.count({ where: { status: BusinessStatus.APPROVED } }),
        b.count({ where: { status: BusinessStatus.REJECTED } }),
        repos.reviews().count(),
        repos.searchLogs().count(),
        repos.categories().count(),
        repos.cities().count(),
        repos.reports().count({ where: { status: ReportStatus.PENDING } }),
        repos.claims().count({ where: { status: ClaimStatus.PENDING } }),
        repos.ads().count({ where: { status: AdStatus.PENDING } }),
        repos.featured().count({ where: { status: PromotionStatus.PENDING } }),
        repos.ads().count({ where: { status: AdStatus.ACTIVE } }),
        repos.featured().count({ where: { status: PromotionStatus.ACTIVE } }),
        repos.contact().count({ where: { isRead: false } }),
        repos.users().createQueryBuilder('u').select("DATE_FORMAT(u.createdAt, '%Y-%m')", 'm').addSelect('COUNT(*)', 'cnt').where('u.createdAt >= :since', { since }).groupBy('m').getRawMany(),
        b.createQueryBuilder('b').select("DATE_FORMAT(b.createdAt, '%Y-%m')", 'm').addSelect('COUNT(*)', 'cnt').where('b.createdAt >= :since', { since }).groupBy('m').getRawMany(),
        repos.reviews().createQueryBuilder('r').select("DATE_FORMAT(r.createdAt, '%Y-%m')", 'm').addSelect('COUNT(*)', 'cnt').where('r.createdAt >= :since', { since }).groupBy('m').getRawMany(),
        b.createQueryBuilder('b').leftJoin('b.category', 'c').select('c.name', 'name').addSelect('c.color', 'color').addSelect('COUNT(*)', 'count').where('b.status = :s', { s: BusinessStatus.APPROVED }).groupBy('c.id').orderBy('count', 'DESC').limit(10).getRawMany(),
        b.createQueryBuilder('b').leftJoin('b.city', 'c').select('c.name', 'name').addSelect('COUNT(*)', 'count').where('b.status = :s', { s: BusinessStatus.APPROVED }).groupBy('c.id').orderBy('count', 'DESC').limit(10).getRawMany(),
        b.find({ order: { createdAt: 'DESC' }, take: 6, relations: ['category', 'city'] }),
        b.find({ where: { status: BusinessStatus.APPROVED }, order: { reviewCount: 'DESC', averageRating: 'DESC' }, take: 6, relations: ['category', 'city'] }),
      ]);

      return {
        totals: { users, owners, admins, businesses, approved, pending, rejected, reviews, searches, categories, cities, activeAds, activeFeatured },
        pendingActions: { businesses: pending, reports: pendingReports, claims: pendingClaims, ads: pendingAds, featured: pendingFeatured, messages: unreadMessages },
        charts: {
          usersByMonth: fillMonths(usersByMonth),
          businessesByMonth: fillMonths(businessesByMonth),
          reviewsByMonth: fillMonths(reviewsByMonth),
          businessesByCategory: byCategory.map((r: { name: string; color: string; count: string }) => ({ name: r.name, color: r.color, count: Number(r.count) })),
          businessesByCity: byCity.map((r: { name: string; count: string }) => ({ name: r.name, count: Number(r.count) })),
        },
        recentBusinesses: recent.map((x) => serializeBusiness(x, { privileged: true })),
        topBusinesses: top.map((x) => serializeBusiness(x)),
      };
    });
  }

  /** What people search for — and what they search for but don't find (data to add!). */
  async searchInsights(days = 30) {
    const since = new Date(Date.now() - days * 864e5);
    const base = () => repos.searchLogs().createQueryBuilder('s').where('s.createdAt >= :since', { since });
    const [top, zero, daily] = await Promise.all([
      base().select('s.normalizedQuery', 'query').addSelect('COUNT(*)', 'count').addSelect('ROUND(AVG(s.resultsCount))', 'avgResults').groupBy('s.normalizedQuery').orderBy('count', 'DESC').limit(20).getRawMany(),
      base().andWhere('s.resultsCount = 0').select('s.normalizedQuery', 'query').addSelect('COUNT(*)', 'count').groupBy('s.normalizedQuery').orderBy('count', 'DESC').limit(20).getRawMany(),
      base().select('DATE(s.createdAt)', 'day').addSelect('COUNT(*)', 'count').groupBy('day').orderBy('day', 'ASC').getRawMany(),
    ]);
    const num = <T extends Record<string, unknown>>(rows: T[]) => rows.map((r) => ({ ...r, count: Number(r.count), ...(r.avgResults !== undefined && { avgResults: Number(r.avgResults) }) }));
    return { days, topSearches: num(top), zeroResultSearches: num(zero), daily: num(daily) };
  }

  async auditLogs(page: number, limit: number, filter: { action?: string; userId?: string }) {
    const qb = repos.auditLogs().createQueryBuilder('l');
    if (filter.action) qb.andWhere('l.action = :a', { a: filter.action });
    if (filter.userId) qb.andWhere('l.userId = :u', { u: filter.userId });
    const [items, total] = await qb.orderBy('l.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }
}
