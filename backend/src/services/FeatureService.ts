import { NextFunction, Request, Response } from 'express';
import { repos, repos2 } from '../repositories';
import { UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { CacheService } from './CacheService';

/**
 * Feature switches — the admin turns any service ON/OFF, for all governorates or only selected ones,
 * without releasing a new app version. Stored in app_settings under key "features".
 */
export const FEATURE_KEYS = [
  // directory core
  'search', 'reviews', 'favorites', 'addBusiness', 'claims', 'reports', 'otpLogin', 'register',
  // services
  'offers', 'pharmacies', 'emergency', 'menu', 'bookings', 'serviceRequests', 'realEstate', 'cars', 'jobs',
  // monetization & content
  'ads', 'featured', 'promote', 'subscriptions',
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_GROUPS: Record<string, FeatureKey[]> = {
  core: ['search', 'reviews', 'favorites', 'addBusiness', 'claims', 'reports', 'otpLogin', 'register'],
  services: ['offers', 'pharmacies', 'emergency', 'menu', 'bookings', 'serviceRequests', 'realEstate', 'cars', 'jobs'],
  business: ['ads', 'featured', 'promote', 'subscriptions'],
};

/** enabled=false → off everywhere. enabled=true + cityIds=[] → all governorates. enabled=true + cityIds=[..] → only those. */
export interface FeatureRule { enabled: boolean; cityIds: number[] }
export type FeatureConfig = Record<FeatureKey, FeatureRule>;

const DEFAULTS: FeatureConfig = Object.fromEntries(FEATURE_KEYS.map((k) => [k, { enabled: true, cityIds: [] }])) as unknown as FeatureConfig;

/** Listing type → feature key */
export const LISTING_FEATURE: Record<string, FeatureKey | null> = { real_estate: 'realEstate', car: 'cars', job: 'jobs', other: null };

const toInt = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export class FeatureService {
  static async config(): Promise<FeatureConfig> {
    return CacheService.remember('features:config', 60, async () => {
      const row = await repos2.settings().findOne({ where: { key: 'features' } });
      const saved = (row?.value || {}) as Partial<FeatureConfig>;
      const out = { ...DEFAULTS };
      for (const k of FEATURE_KEYS) {
        const r = saved[k];
        if (r) out[k] = { enabled: Boolean(r.enabled), cityIds: Array.isArray(r.cityIds) ? r.cityIds.map(Number).filter(Boolean) : [] };
      }
      return out;
    });
  }

  static async update(patch: Partial<Record<string, Partial<FeatureRule>>>): Promise<FeatureConfig> {
    const cur = await this.config();
    const next = { ...cur };
    for (const [k, r] of Object.entries(patch)) {
      if (!(FEATURE_KEYS as readonly string[]).includes(k) || !r) continue;
      const key = k as FeatureKey;
      next[key] = {
        enabled: r.enabled === undefined ? cur[key].enabled : Boolean(r.enabled),
        cityIds: r.cityIds === undefined ? cur[key].cityIds : [...new Set(r.cityIds.map(Number).filter((n) => Number.isInteger(n) && n > 0))],
      };
    }
    await repos2.settings().save({ key: 'features', value: next });
    await CacheService.del('features:config');
    await CacheService.delByPattern('home:feed:*');
    return next;
  }

  /** Is the feature on for this governorate? (no cityId → on if enabled anywhere) */
  static async isOn(key: FeatureKey, cityId?: number | null): Promise<boolean> {
    const r = (await this.config())[key];
    if (!r.enabled) return false;
    if (!r.cityIds.length || !cityId) return true;
    return r.cityIds.includes(cityId);
  }

  /** null = all governorates · [] = none · [ids] = only these. Use to filter "all cities" lists. */
  static async scope(key: FeatureKey): Promise<number[] | null> {
    const r = (await this.config())[key];
    if (!r.enabled) return [];
    return r.cityIds.length ? r.cityIds : null;
  }

  /** Resolved map for the apps: { offers: true, jobs: false, ... } for the given governorate. */
  static async resolved(cityId?: number | null) {
    const cfg = await this.config();
    const enabled = {} as Record<FeatureKey, boolean>;
    const cities = {} as Record<FeatureKey, number[] | null>;
    for (const k of FEATURE_KEYS) {
      const r = cfg[k];
      enabled[k] = r.enabled && (!r.cityIds.length || !cityId || r.cityIds.includes(cityId));
      cities[k] = r.enabled ? (r.cityIds.length ? r.cityIds : null) : [];
    }
    return { cityId: cityId || null, enabled, cities };
  }

  static async assert(key: FeatureKey, cityId?: number | null, user?: { role: string } | null) {
    if (user?.role === UserRole.ADMIN) return;
    if (!(await this.isOn(key, cityId))) throw new AppError('This service is not available in your area right now', 403, undefined, 'FEATURE_DISABLED');
  }
}

type CityFrom = 'query' | 'body' | 'business' | 'listing' | 'none';

/**
 * Express guard. cityFrom tells where to read the governorate:
 *  query/body → req.query.cityId / req.body.cityId · business → load business by :id/:businessId · none → global switch only.
 */
export const requireFeature = (key: FeatureKey | ((req: Request) => FeatureKey | null), cityFrom: CityFrom = 'query') =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const k = typeof key === 'function' ? key(req) : key;
      if (!k) return next();
      let cityId: number | undefined;
      if (cityFrom === 'query') cityId = toInt(req.query.cityId);
      else if (cityFrom === 'body') cityId = toInt(req.body?.cityId);
      else if (cityFrom === 'business') {
        const id = String(req.params.id || req.params.businessId || '');
        if (id) cityId = (await repos.businesses().findOne({ where: { id }, select: ['id', 'cityId'] }))?.cityId;
      } else if (cityFrom === 'listing') {
        const id = String(req.params.id || '');
        if (id) cityId = (await repos2.listings().findOne({ where: { id }, select: ['id', 'cityId'] }))?.cityId;
      }
      await FeatureService.assert(k, cityId, req.user || null);
      next();
    } catch (e) {
      next(e);
    }
  };
