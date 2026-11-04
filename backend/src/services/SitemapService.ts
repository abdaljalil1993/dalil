import { repos, repos2 } from '../repositories';
import { BusinessStatus, ListingStatus } from '../entities/enums';
import { env } from '../config/env';
import { CacheService } from './CacheService';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** sitemap.xml for search engines (served at /sitemap.xml), cached 1h. */
export class SitemapService {
  static async xml(): Promise<string> {
    return CacheService.remember('sitemap:xml', 3600, async () => {
      const base = env.frontendUrl;
      const [biz, cats, listings] = await Promise.all([
        repos.businesses().find({ where: { status: BusinessStatus.APPROVED, isActive: true }, select: ['slug', 'updatedAt'] }),
        repos.categories().find({ where: { isActive: true }, select: ['slug', 'updatedAt'] }),
        repos2.listings().find({ where: { status: ListingStatus.ACTIVE }, select: ['slug', 'updatedAt'] }),
      ]);
      const url = (loc: string, lastmod?: Date, priority = '0.6') => `<url><loc>${esc(base + loc)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}<priority>${priority}</priority></url>`;
      const statics = ['/', '/categories', '/offers', '/real-estate', '/cars', '/jobs', '/pharmacies', '/emergency', '/featured', '/about', '/contact'].map((p) => url(p, undefined, p === '/' ? '1.0' : '0.8'));
      return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[
        ...statics,
        ...cats.map((c) => url(`/c/${encodeURIComponent(c.slug)}`, c.updatedAt, '0.8')),
        ...biz.map((b) => url(`/b/${encodeURIComponent(b.slug)}`, b.updatedAt, '0.7')),
        ...listings.map((l) => url(`/l/${encodeURIComponent(l.slug)}`, l.updatedAt, '0.5')),
      ].join('')}</urlset>`;
    });
  }
}
