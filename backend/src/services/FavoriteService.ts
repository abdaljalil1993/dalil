import { repos } from '../repositories';
import { BusinessStatus } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { buildPaginationMeta } from '../utils/response';
import { serializeBusiness } from './serializers';

export class FavoriteService {
  async list(userId: string, page: number, limit: number) {
    const [favs, total] = await repos.favorites()
      .createQueryBuilder('f')
      .innerJoinAndSelect('f.business', 'b')
      .leftJoinAndSelect('b.city', 'city')
      .leftJoinAndSelect('b.category', 'category')
      .leftJoinAndSelect('b.workingHours', 'wh')
      .leftJoinAndSelect('b.images', 'images')
      .where('f.userId = :userId', { userId })
      .orderBy('f.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      items: favs.map((f) => ({ id: f.id, createdAt: f.createdAt, business: serializeBusiness(f.business, { isFavorite: true }) })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async toggle(userId: string, businessId: string) {
    const exists = await repos.favorites().findOne({ where: { userId, businessId } });
    if (exists) return this.remove(userId, businessId);
    return this.add(userId, businessId);
  }

  async add(userId: string, businessId: string) {
    const business = await repos.businesses().findOne({ where: { id: businessId } });
    if (!business || business.status !== BusinessStatus.APPROVED) throw AppError.notFound('Business not found');
    if (!(await repos.favorites().exist({ where: { userId, businessId } }))) {
      await repos.favorites().insert({ userId, businessId });
      await repos.businesses().increment({ id: businessId }, 'favoriteCount', 1);
    }
    return { isFavorite: true };
  }

  async remove(userId: string, businessId: string) {
    const res = await repos.favorites().delete({ userId, businessId });
    if (res.affected) await repos.businesses().query('UPDATE businesses SET favoriteCount = GREATEST(favoriteCount - 1, 0) WHERE id = ?', [businessId]);
    return { isFavorite: false };
  }

  async check(userId: string, businessId: string) {
    return { isFavorite: await repos.favorites().exist({ where: { userId, businessId } }) };
  }
}
