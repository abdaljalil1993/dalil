import bcrypt from 'bcryptjs';
import { MoreThan } from 'typeorm';
import { repos } from '../repositories';
import { User } from '../entities';
import { UserRole, UserStatus } from '../entities/enums';
import { AppError } from '../utils/AppError';
import {
  generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken, expiryFromToken, randomToken,
} from '../utils/jwt';
import { selfUser } from './serializers';
import { MailService } from './MailService';
import { env } from '../config/env';

const SALT_ROUNDS = 12;

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  cityId?: number;
}

interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

export class AuthService {
  async register(input: RegisterInput, client: ClientInfo = {}) {
    const email = input.email.toLowerCase().trim();
    const exists = await repos.users().findOne({ where: { email } });
    if (exists) throw AppError.conflict('Email already registered');

    const user = await repos.users().save(
      repos.users().create({
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        password: await bcrypt.hash(input.password, SALT_ROUNDS),
        phone: input.phone,
        cityId: input.cityId,
        role: UserRole.USER,
      })
    );
    return this.issueTokens(user, client);
  }

  async login(emailRaw: string, password: string, client: ClientInfo = {}) {
    const email = emailRaw.toLowerCase().trim();
    const user = await repos.users().createQueryBuilder('u').addSelect('u.password').where('u.email = :email', { email }).getOne();
    // same message for unknown email / wrong password (no user enumeration)
    if (!user || !(await bcrypt.compare(password, user.password))) throw new AppError('Invalid email or password', 401);
    if (user.status !== UserStatus.ACTIVE) throw new AppError('Your account is suspended. Contact support.', 403);

    await repos.users().update(user.id, { lastLoginAt: new Date() });
    return this.issueTokens(user, client);
  }

  /** Refresh-token rotation: the old token is revoked, a new pair is issued. Reuse of a revoked token revokes all sessions. */
  async refresh(refreshToken: string, client: ClientInfo = {}) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }
    const stored = await repos.refreshTokens().findOne({ where: { tokenHash: hashToken(refreshToken) } });
    if (!stored || stored.expiresAt < new Date()) throw new AppError('Invalid or expired refresh token', 401);
    if (stored.isRevoked) {
      await repos.refreshTokens().update({ userId: stored.userId }, { isRevoked: true });
      throw new AppError('Session expired, please sign in again', 401);
    }
    const user = await repos.users().findOne({ where: { id: payload.userId } });
    if (!user || user.status !== UserStatus.ACTIVE) throw new AppError('Account is inactive', 401);

    await repos.refreshTokens().update(stored.id, { isRevoked: true });
    return this.issueTokens(user, client);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    await repos.refreshTokens().update({ tokenHash: hashToken(refreshToken) }, { isRevoked: true });
  }

  async logoutAll(userId: string): Promise<void> {
    await repos.refreshTokens().update({ userId }, { isRevoked: true });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await repos.users().createQueryBuilder('u').addSelect('u.password').where('u.id = :userId', { userId }).getOne();
    if (!user) throw AppError.notFound('User not found');
    if (!(await bcrypt.compare(currentPassword, user.password))) throw AppError.badRequest('Current password is incorrect');
    await repos.users().update(userId, { password: await bcrypt.hash(newPassword, SALT_ROUNDS) });
    await this.logoutAll(userId);
  }

  /** Always responds OK (no user enumeration). Token valid for 1 hour. */
  async forgotPassword(emailRaw: string): Promise<{ devResetToken?: string }> {
    const email = emailRaw.toLowerCase().trim();
    const user = await repos.users().findOne({ where: { email } });
    if (!user) return {};
    const token = randomToken(32);
    await repos.users().update(user.id, {
      passwordResetToken: hashToken(token),
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    });
    const link = `${env.frontendUrl}/reset-password?token=${token}`;
    const sent = await MailService.send(
      user.email,
      'Reset your Dalilak password - إعادة تعيين كلمة المرور',
      `<div dir="rtl" style="font-family:Tahoma"><p>مرحباً ${user.firstName}،</p><p>لإعادة تعيين كلمة المرور اضغط الرابط التالي (صالح لمدة ساعة):</p><p><a href="${link}">${link}</a></p></div>`
    );
    // In development without SMTP, return the token so the flow can be tested end to end.
    return !sent && !env.isProduction ? { devResetToken: token } : {};
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await repos.users().findOne({
      where: { passwordResetToken: hashToken(token), passwordResetExpires: MoreThan(new Date()) },
    });
    if (!user) throw AppError.badRequest('Reset link is invalid or has expired');
    await repos.users().update(user.id, {
      password: await bcrypt.hash(newPassword, SALT_ROUNDS),
      passwordResetToken: null,
      passwordResetExpires: null,
    });
    await this.logoutAll(user.id);
  }

  async me(userId: string) {
    const user = await repos.users().findOne({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');
    return selfUser(user);
  }

  /** Used by OTP login */
  issueFor(user: User, client: ClientInfo) {
    return this.issueTokens(user, client);
  }

  private async issueTokens(user: User, client: ClientInfo) {
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
    await repos.refreshTokens().save({
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: expiryFromToken(refreshToken),
      ipAddress: client.ip,
      userAgent: client.userAgent,
    });
    return { accessToken, refreshToken, tokenType: 'Bearer', accessTokenExpiresIn: env.jwt.accessExpiry, user: selfUser(user) };
  }

  static async cleanupTokens(): Promise<void> {
    await repos.refreshTokens()
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now OR (isRevoked = true AND createdAt < :old)', { now: new Date(), old: new Date(Date.now() - 7 * 864e5) })
      .execute();
  }
}
