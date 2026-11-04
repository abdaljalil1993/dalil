import { In } from 'typeorm';
import { repos } from '../repositories';
import { User, Review, ReviewLike } from '../entities';
import { BusinessStatus, NotificationType, UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { buildPaginationMeta } from '../utils/response';
import { serializeReview } from './serializers';
import { CacheService } from './CacheService';
import { NotificationService } from './NotificationService';
import { AppDataSource } from '../config/database';

export type ReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

const ORDER: Record<ReviewSort, [string, 'ASC' | 'DESC']> = {
  newest: ['r.createdAt', 'DESC'],
  oldest: ['r.createdAt', 'ASC'],
  highest: ['r.rating', 'DESC'],
  lowest: ['r.rating', 'ASC'],
  helpful: ['r.likesCount', 'DESC'],
};

export class ReviewService {
  async listForBusiness(businessId: string, page: number, limit: number, sort: ReviewSort = 'newest', rating?: number, viewer?: User) {
    const qb = repos.reviews()
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .where('r.businessId = :businessId AND r.isHidden = false', { businessId });
    if (rating) qb.andWhere('r.rating = :rating', { rating });
    const [order, dir] = ORDER[sort] || ORDER.newest;
    const [reviews, total] = await qb.orderBy(order, dir).addOrderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();

    let liked = new Set<string>();
    if (viewer && reviews.length) {
      const likes = await repos.reviewLikes().find({ where: { userId: viewer.id, reviewId: In(reviews.map((r) => r.id)) } });
      liked = new Set(likes.map((l) => l.reviewId));
    }
    return {
      items: reviews.map((r) => serializeReview(r, viewer ? { likedByMe: liked.has(r.id) } : {})),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async listMine(userId: string, page: number, limit: number) {
    const [reviews, total] = await repos.reviews()
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.business', 'business')
      .leftJoinAndSelect('r.user', 'user')
      .where('r.userId = :userId', { userId })
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items: reviews.map((r) => serializeReview(r)), meta: buildPaginationMeta(total, page, limit) };
  }

  /** Reviews on all businesses owned by the user (owner inbox). */
  async listForOwner(ownerId: string, page: number, limit: number, filter: { businessId?: string; unanswered?: boolean }) {
    const qb = repos.reviews()
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.business', 'business', 'business.ownerId = :ownerId', { ownerId })
      .leftJoinAndSelect('r.user', 'user');
    if (filter.businessId) qb.andWhere('r.businessId = :bid', { bid: filter.businessId });
    if (filter.unanswered) qb.andWhere('r.ownerReply IS NULL');
    const [reviews, total] = await qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items: reviews.map((r) => serializeReview(r)), meta: buildPaginationMeta(total, page, limit) };
  }

  async adminList(page: number, limit: number, filter: { hidden?: boolean; businessId?: string; rating?: number }) {
    const qb = repos.reviews().createQueryBuilder('r').leftJoinAndSelect('r.user', 'user').leftJoinAndSelect('r.business', 'business');
    if (filter.hidden !== undefined) qb.andWhere('r.isHidden = :h', { h: filter.hidden });
    if (filter.businessId) qb.andWhere('r.businessId = :bid', { bid: filter.businessId });
    if (filter.rating) qb.andWhere('r.rating = :rating', { rating: filter.rating });
    const [reviews, total] = await qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items: reviews.map((r) => serializeReview(r)), meta: buildPaginationMeta(total, page, limit) };
  }

  async create(user: User, businessId: string, data: { rating: number; content?: string }) {
    const business = await repos.businesses().findOne({ where: { id: businessId } });
    if (!business || business.status !== BusinessStatus.APPROVED) throw AppError.notFound('Business not found');
    if (business.ownerId === user.id) throw AppError.forbidden('You cannot review your own business');
    if (await repos.reviews().exist({ where: { userId: user.id, businessId } })) {
      throw AppError.conflict('You have already reviewed this business - edit your existing review instead');
    }
    const review = await repos.reviews().save(repos.reviews().create({ userId: user.id, businessId, rating: data.rating, content: data.content || null }));
    await this.recalculate(businessId);
    await NotificationService.notify(business.ownerId, NotificationType.NEW_REVIEW, `تقييم جديد (${data.rating}★) على "${business.name}"`, data.content?.slice(0, 140), {
      businessId, slug: business.slug, reviewId: review.id,
    });
    return this.getOne(review.id);
  }

  async update(id: string, user: User, data: { rating?: number; content?: string }) {
    const review = await repos.reviews().findOne({ where: { id } });
    if (!review) throw AppError.notFound('Review not found');
    if (review.userId !== user.id) throw AppError.forbidden('You can only edit your own review');
    if (data.rating !== undefined) review.rating = data.rating;
    if (data.content !== undefined) review.content = data.content;
    await repos.reviews().save(review);
    await this.recalculate(review.businessId);
    return this.getOne(id);
  }

  async remove(id: string, user: User) {
    const review = await repos.reviews().findOne({ where: { id } });
    if (!review) throw AppError.notFound('Review not found');
    if (user.role !== UserRole.ADMIN && review.userId !== user.id) throw AppError.forbidden();
    await repos.reviews().delete(id);
    await this.recalculate(review.businessId);
  }

  async reply(id: string, user: User, reply: string | null) {
    const review = await repos.reviews().findOne({ where: { id }, relations: ['business'] });
    if (!review) throw AppError.notFound('Review not found');
    if (user.role !== UserRole.ADMIN && review.business.ownerId !== user.id) throw AppError.forbidden('Only the business owner can reply');
    review.ownerReply = reply;
    review.ownerRepliedAt = reply ? new Date() : null;
    await repos.reviews().save(review);
    if (reply) {
      await NotificationService.notify(review.userId, NotificationType.REVIEW_REPLY, `رد "${review.business.name}" على تقييمك`, reply.slice(0, 140), {
        businessId: review.businessId, slug: review.business.slug, reviewId: review.id,
      });
    }
    await CacheService.delByPattern('business:*');
    return this.getOne(id);
  }

  async setHidden(id: string, isHidden: boolean) {
    const review = await repos.reviews().findOne({ where: { id } });
    if (!review) throw AppError.notFound('Review not found');
    review.isHidden = isHidden;
    await repos.reviews().save(review);
    await this.recalculate(review.businessId);
    return this.getOne(id);
  }

  /** Atomic like toggle (transaction + counter update in SQL). */
  async toggleLike(id: string, user: User) {
    const review = await repos.reviews().findOne({ where: { id } });
    if (!review) throw AppError.notFound('Review not found');
    if (review.userId === user.id) throw AppError.badRequest('You cannot like your own review');
    return AppDataSource.transaction(async (m) => {
      const existing = await m.findOne(ReviewLike, { where: { reviewId: id, userId: user.id } });
      if (existing) {
        await m.delete(ReviewLike, { reviewId: id, userId: user.id });
        await m.query('UPDATE reviews SET likesCount = GREATEST(likesCount - 1, 0) WHERE id = ?', [id]);
      } else {
        await m.insert(ReviewLike, { reviewId: id, userId: user.id });
        await m.query('UPDATE reviews SET likesCount = likesCount + 1 WHERE id = ?', [id]);
      }
      const fresh = await m.findOne(Review, { where: { id } });
      return { liked: !existing, likesCount: fresh?.likesCount ?? 0 };
    });
  }

  private async getOne(id: string) {
    const r = await repos.reviews().findOne({ where: { id }, relations: ['user', 'business'] });
    if (!r) throw AppError.notFound('Review not found');
    return serializeReview(r);
  }

  private async recalculate(businessId: string) {
    const raw = await repos.reviews()
      .createQueryBuilder('r')
      .select('COALESCE(AVG(r.rating), 0)', 'avg')
      .addSelect('COUNT(r.id)', 'cnt')
      .where('r.businessId = :businessId AND r.isHidden = false', { businessId })
      .getRawOne<{ avg: string; cnt: string }>();
    await repos.businesses().update(businessId, {
      averageRating: Math.round(parseFloat(raw?.avg || '0') * 100) / 100,
      reviewCount: parseInt(raw?.cnt || '0', 10),
    });
    await CacheService.invalidateCatalog();
  }
}
