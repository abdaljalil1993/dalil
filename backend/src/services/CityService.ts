import { repos } from '../repositories';
import { City } from '../entities';
import { BusinessStatus } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { slugify } from '../utils/text';
import { CacheService } from './CacheService';
import { SearchIndexService } from './SearchIndexService';

export type CityInput = Partial<Pick<City, 'name' | 'nameEn' | 'state' | 'country' | 'latitude' | 'longitude' | 'image' | 'isActive' | 'sortOrder'>>;

export class CityService {
  async list(includeInactive = false) {
    return CacheService.remember(`cities:list:${includeInactive}`, 600, async () => {
      const cities = await repos.cities().find({
        where: includeInactive ? {} : { isActive: true },
        order: { sortOrder: 'ASC', name: 'ASC' },
      });
      const counts = await repos.businesses()
        .createQueryBuilder('b')
        .select('b.cityId', 'cityId')
        .addSelect('COUNT(*)', 'cnt')
        .where('b.status = :st AND b.isActive = true', { st: BusinessStatus.APPROVED })
        .groupBy('b.cityId')
        .getRawMany<{ cityId: number; cnt: string }>();
      return cities.map((c) => ({ ...c, businessCount: Number(counts.find((r) => Number(r.cityId) === c.id)?.cnt || 0) }));
    });
  }

  async getBySlugOrId(key: string) {
    const where = /^\d+$/.test(key) ? { id: Number(key) } : { slug: key };
    const city = await repos.cities().findOne({ where });
    if (!city) throw AppError.notFound('City not found');
    return city;
  }

  async create(data: CityInput) {
    const saved = await repos.cities().save(repos.cities().create({ ...data, slug: slugify(data.nameEn || data.name!) }));
    await CacheService.invalidateCatalog();
    return saved;
  }

  async update(id: number, data: CityInput) {
    const city = await repos.cities().findOne({ where: { id } });
    if (!city) throw AppError.notFound('City not found');
    Object.assign(city, data);
    if (data.name || data.nameEn) city.slug = slugify(city.nameEn || city.name);
    const saved = await repos.cities().save(city);
    if (data.name || data.nameEn) await SearchIndexService.reindexWhere({ cityId: id });
    await CacheService.invalidateCatalog();
    return saved;
  }

  async remove(id: number) {
    const inUse = await repos.businesses().count({ where: { cityId: id } });
    if (inUse > 0) throw AppError.conflict(`City has ${inUse} businesses. Deactivate it instead.`);
    const res = await repos.cities().delete(id);
    if (!res.affected) throw AppError.notFound('City not found');
    await CacheService.invalidateCatalog();
  }
}
