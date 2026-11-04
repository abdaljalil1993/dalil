import { repos } from '../repositories';
import { ContactMessage } from '../entities';
import { buildPaginationMeta } from '../utils/response';
import { AppError } from '../utils/AppError';

export class ContactService {
  create(data: Partial<ContactMessage>, userId?: string) {
    return repos.contact().save(repos.contact().create({ ...data, userId }));
  }

  async list(page: number, limit: number, unreadOnly?: boolean) {
    const qb = repos.contact().createQueryBuilder('m');
    if (unreadOnly) qb.where('m.isRead = false');
    const [items, total] = await qb.orderBy('m.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async markRead(id: number, isRead = true) {
    const res = await repos.contact().update(id, { isRead });
    if (!res.affected) throw AppError.notFound('Message not found');
  }

  async remove(id: number) {
    await repos.contact().delete(id);
  }
}
