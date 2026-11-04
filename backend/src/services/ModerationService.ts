import { repos } from '../repositories';
import { User } from '../entities';
import { BusinessStatus, ClaimStatus, NotificationType, ReportStatus, ReportType, UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { buildPaginationMeta } from '../utils/response';
import { publicUser } from './serializers';
import { NotificationService } from './NotificationService';
import { CacheService } from './CacheService';

/** Reports (on businesses or reviews) and ownership claims. */
export class ModerationService {
  // ───────────── Reports ─────────────

  async createReport(user: User, businessId: string, data: { type: ReportType; description?: string; reviewId?: string }) {
    if (!(await repos.businesses().exist({ where: { id: businessId } }))) throw AppError.notFound('Business not found');
    if (data.reviewId && !(await repos.reviews().exist({ where: { id: data.reviewId, businessId } }))) throw AppError.notFound('Review not found');
    const dup = await repos.reports().exist({ where: { reporterId: user.id, businessId, reviewId: data.reviewId ?? undefined, status: ReportStatus.PENDING } });
    if (dup) throw AppError.conflict('You already reported this - our team is reviewing it');
    return repos.reports().save(repos.reports().create({ ...data, reviewId: data.reviewId || null, reporterId: user.id, businessId }));
  }

  async listReports(page: number, limit: number, status?: ReportStatus) {
    const qb = repos.reports().createQueryBuilder('r').leftJoinAndSelect('r.reporter', 'reporter').leftJoinAndSelect('r.business', 'business').leftJoinAndSelect('r.review', 'review');
    if (status) qb.where('r.status = :status', { status });
    const [items, total] = await qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return {
      items: items.map((r) => ({
        ...r,
        reporter: publicUser(r.reporter),
        business: r.business ? { id: r.business.id, name: r.business.name, slug: r.business.slug } : null,
        review: r.review ? { id: r.review.id, rating: r.review.rating, content: r.review.content, isHidden: r.review.isHidden } : null,
      })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async updateReport(id: number, status: ReportStatus, adminNote?: string) {
    const report = await repos.reports().findOne({ where: { id } });
    if (!report) throw AppError.notFound('Report not found');
    report.status = status;
    if (adminNote !== undefined) report.adminNote = adminNote;
    return repos.reports().save(report);
  }

  // ───────────── Claims ─────────────

  async createClaim(user: User, businessId: string, data: { message: string; phone?: string; proofUrl?: string }) {
    const business = await repos.businesses().findOne({ where: { id: businessId } });
    if (!business) throw AppError.notFound('Business not found');
    if (business.ownerId === user.id) throw AppError.badRequest('You already own this business');
    if (business.ownerId) throw AppError.conflict('This business is already managed by its owner. Contact support if this is wrong.');
    if (await repos.claims().exist({ where: { userId: user.id, businessId, status: ClaimStatus.PENDING } })) throw AppError.conflict('You already have a pending claim for this business');
    return repos.claims().save(repos.claims().create({ ...data, userId: user.id, businessId }));
  }

  async myClaims(userId: string) {
    return repos.claims().find({ where: { userId }, relations: ['business'], order: { createdAt: 'DESC' } });
  }

  async listClaims(page: number, limit: number, status?: ClaimStatus) {
    const qb = repos.claims().createQueryBuilder('c').leftJoinAndSelect('c.user', 'user').leftJoinAndSelect('c.business', 'business');
    if (status) qb.where('c.status = :status', { status });
    const [items, total] = await qb.orderBy('c.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return {
      items: items.map((c) => ({
        ...c,
        user: c.user ? { ...publicUser(c.user), email: c.user.email, phone: c.user.phone } : null,
        business: c.business ? { id: c.business.id, name: c.business.name, slug: c.business.slug, ownerId: c.business.ownerId } : null,
      })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async decideClaim(id: number, status: ClaimStatus.APPROVED | ClaimStatus.REJECTED, adminNote?: string) {
    const claim = await repos.claims().findOne({ where: { id }, relations: ['business', 'user'] });
    if (!claim) throw AppError.notFound('Claim not found');
    if (claim.status !== ClaimStatus.PENDING) throw AppError.badRequest('Claim was already processed');
    claim.status = status;
    claim.adminNote = adminNote || claim.adminNote;
    await repos.claims().save(claim);

    if (status === ClaimStatus.APPROVED) {
      await repos.businesses().update(claim.businessId, { ownerId: claim.userId, isVerified: true, ...(claim.business.status === BusinessStatus.PENDING && { status: BusinessStatus.APPROVED }) });
      if (claim.user.role === UserRole.USER) await repos.users().update(claim.userId, { role: UserRole.BUSINESS_OWNER });
      // auto-reject the other pending claims on the same business
      await repos.claims().createQueryBuilder().update().set({ status: ClaimStatus.REJECTED, adminNote: 'Another claim was approved' })
        .where('businessId = :bid AND status = :p AND id <> :id', { bid: claim.businessId, p: ClaimStatus.PENDING, id }).execute();
      await CacheService.invalidateCatalog();
    }
    await NotificationService.notify(
      claim.userId,
      status === ClaimStatus.APPROVED ? NotificationType.CLAIM_APPROVED : NotificationType.CLAIM_REJECTED,
      status === ClaimStatus.APPROVED ? `أصبحت مالك "${claim.business.name}"` : `تم رفض طلب ملكية "${claim.business.name}"`,
      adminNote,
      { businessId: claim.businessId, slug: claim.business.slug }
    );
    return claim;
  }
}
