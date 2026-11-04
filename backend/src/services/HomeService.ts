import { repos } from '../repositories';
import { queryBusinesses } from '../repositories/BusinessQuery';
import { AdPlacement, BusinessStatus } from '../entities/enums';
import { CacheService } from './CacheService';
import { CategoryService } from './CategoryService';
import { CityService } from './CityService';
import { PromotionService } from './PromotionService';
import { serializeBusiness } from './serializers';
import { ExtrasService } from './ExtrasService';
import { FeatureService } from './FeatureService';

/** One request that feeds the whole home screen (web + mobile). Public. */
export class HomeService {
  private categories = new CategoryService();
  private cities = new CityService();
  private promotions = new PromotionService();
  private extras = new ExtrasService();

  async get(cityId?: number) {
    return CacheService.remember(`home:feed:${cityId || 0}`, 120, async () => {
      const on = (await FeatureService.resolved(cityId)).enabled;
      const none = <T,>(v: T) => Promise.resolve(v);
      const base = { status: BusinessStatus.APPROVED, isActive: true, cityId, limit: 8 } as const;
      const [categories, cities, slider, banners, featured, topRated, newest, totals, offers, duty] = await Promise.all([
        this.categories.list(),
        this.cities.list(),
        on.ads ? this.promotions.activeAds({ placement: AdPlacement.HOME_SLIDER, cityId }) : none([]),
        on.ads ? this.promotions.activeAds({ placement: AdPlacement.HOMEPAGE_BANNER, cityId }) : none([]),
        on.featured ? this.promotions.activeFeatured({ cityId, limit: 10 }) : none([]),
        queryBusinesses({ ...base, sort: 'rating', minRating: 3.5 }),
        queryBusinesses({ ...base, sort: 'newest' }),
        Promise.all([
          repos.businesses().count({ where: { status: BusinessStatus.APPROVED, isActive: true } }),
          repos.reviews().count({ where: { isHidden: false } }),
          repos.users().count(),
        ]),
        on.offers ? this.extras.activeOffers({ cityId, limit: 8 }) : none({ items: [] as never[] }),
        on.pharmacies ? this.extras.onDuty({ cityId }) : none({ items: [] as never[] }),
      ]);
      return {
        categories,
        cities,
        ads: { slider, banners },
        featured,
        topRated: topRated.items.map((b) => serializeBusiness(b)),
        newest: newest.items.map((b) => serializeBusiness(b)),
        offers: offers.items,
        onDutyPharmacies: duty.items.length,
        features: on,
        stats: { businesses: totals[0], reviews: totals[1], users: totals[2], cities: cities.length, categories: categories.length },
      };
    });
  }
}
