import { Brackets } from 'typeorm';
import { repos } from '../repositories';
import { UserRole, UserStatus } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { buildPaginationMeta } from '../utils/response';
import { escapeLike } from '../utils/text';
import { selfUser } from './serializers';
import { StorageService } from './StorageService';

export interface ProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  cityId?: number;
}

export class UserService {
  async getProfile(userId: string) {
    const user = await repos.users().findOne({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');
    const [reviews, favorites, businesses, unread] = await Promise.all([
      repos.reviews().count({ where: { userId } }),
      repos.favorites().count({ where: { userId } }),
      repos.businesses().count({ where: { ownerId: userId } }),
      repos.notifications().count({ where: { userId, isRead: false } }),
    ]);
    return { ...selfUser(user), counts: { reviews, favorites, businesses, unreadNotifications: unread } };
  }

  async updateProfile(userId: string, data: ProfileInput) {
    const user = await repos.users().findOne({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');
    Object.assign(user, data);
    return selfUser(await repos.users().save(user));
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const stored = await StorageService.upload(file, `avatars/${userId}`);
    await repos.users().update(userId, { avatar: stored.url });
    return this.getProfile(userId);
  }

  async list(page: number, limit: number, filters: { search?: string; role?: UserRole; status?: UserStatus }) {
    const qb = repos.users().createQueryBuilder('u');
    if (filters.search) {
      const s = `%${escapeLike(filters.search)}%`;
      qb.andWhere(new Brackets((w) => w.where('u.firstName LIKE :s', { s }).orWhere('u.lastName LIKE :s', { s }).orWhere('u.email LIKE :s', { s }).orWhere('u.phone LIKE :s', { s })));
    }
    if (filters.role) qb.andWhere('u.role = :role', { role: filters.role });
    if (filters.status) qb.andWhere('u.status = :status', { status: filters.status });
    const [users, total] = await qb.orderBy('u.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items: users.map(selfUser), meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const user = await repos.users().findOne({ where: { id } });
    if (!user) throw AppError.notFound('User not found');
    const businesses = await repos.businesses().find({ where: { ownerId: id }, select: ['id', 'name', 'slug', 'status'] });
    return { ...selfUser(user), businesses };
  }

  async updateStatus(actorId: string, id: string, status: UserStatus) {
    if (actorId === id) throw AppError.badRequest('You cannot change your own status');
    const user = await repos.users().findOne({ where: { id } });
    if (!user) throw AppError.notFound('User not found');
    user.status = status;
    await repos.users().save(user);
    if (status !== UserStatus.ACTIVE) await repos.refreshTokens().update({ userId: id }, { isRevoked: true });
    return selfUser(user);
  }

  async updateRole(actorId: string, id: string, role: UserRole) {
    if (actorId === id) throw AppError.badRequest('You cannot change your own role');
    const user = await repos.users().findOne({ where: { id } });
    if (!user) throw AppError.notFound('User not found');
    user.role = role;
    return selfUser(await repos.users().save(user));
  }
}
