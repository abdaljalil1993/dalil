import { repos } from '../repositories';
import { NotificationType } from '../entities/enums';
import { buildPaginationMeta } from '../utils/response';
import { PushService } from './PushService';

export class NotificationService {
  static async notify(
    userId: string | null | undefined,
    type: NotificationType,
    title: string,
    body?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (!userId) return;
    await repos.notifications().save({ userId, type, title, body, data: data ?? null }).catch(() => undefined);
    PushService.sendToUser(userId, title, body, { type, ...(data || {}) }).catch(() => undefined);
  }

  static async list(userId: string, page: number, limit: number, unreadOnly = false) {
    const qb = repos.notifications().createQueryBuilder('n').where('n.userId = :userId', { userId });
    if (unreadOnly) qb.andWhere('n.isRead = false');
    const [items, total] = await qb.orderBy('n.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  static unreadCount(userId: string): Promise<number> {
    return repos.notifications().count({ where: { userId, isRead: false } });
  }

  static async markRead(userId: string, id: number): Promise<void> {
    await repos.notifications().update({ id, userId }, { isRead: true });
  }

  static async markAllRead(userId: string): Promise<void> {
    await repos.notifications().update({ userId, isRead: false }, { isRead: true });
  }

  static async remove(userId: string, id: number): Promise<void> {
    await repos.notifications().delete({ id, userId });
  }
}
