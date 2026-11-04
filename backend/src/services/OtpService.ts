import crypto from 'crypto';
import { MoreThan } from 'typeorm';
import { repos, repos2 } from '../repositories';
import { User } from '../entities';
import { UserRole, UserStatus } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { hashToken } from '../utils/jwt';
import { AuthService } from './AuthService';
import { selfUser } from './serializers';

/** +963 9XX XXX XXX normalization (Syria first, other international numbers kept as-is). */
export const normalizePhone = (raw: string): string => {
  let p = (raw || '').replace(/[^\d+]/g, '');
  if (p.startsWith('00')) p = `+${p.slice(2)}`;
  if (/^09\d{8}$/.test(p)) p = `+963${p.slice(1)}`;
  if (/^9\d{8}$/.test(p)) p = `+963${p}`;
  if (/^963\d{9}$/.test(p)) p = `+${p}`;
  if (!/^\+\d{8,15}$/.test(p)) throw AppError.badRequest('Invalid phone number');
  return p;
};

export class SmsService {
  static async send(phone: string, message: string): Promise<boolean> {
    if (env.sms.provider !== 'http' || !env.sms.httpUrl) {
      logger.info(`[SMS:dev] ${phone}: ${message}`);
      return false;
    }
    const fill = (s: string) => s.replace('{phone}', encodeURIComponent(phone)).replace('{message}', encodeURIComponent(message));
    try {
      const res = await fetch(fill(env.sms.httpUrl), {
        method: env.sms.httpMethod,
        headers: env.sms.httpMethod === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: env.sms.httpMethod === 'POST' ? env.sms.httpBody.replace('{phone}', phone).replace('{message}', message) : undefined,
      });
      if (!res.ok) logger.error('[SMS] gateway error', { status: res.status });
      return res.ok;
    } catch (e) {
      logger.error('[SMS] send failed', { error: (e as Error).message });
      return false;
    }
  }
}

/** Phone login / sign-up / verification with one-time codes. */
export class OtpService {
  private auth = new AuthService();

  async request(rawPhone: string, ip?: string) {
    const phone = normalizePhone(rawPhone);
    const recent = await repos2.otps().count({ where: { phone, createdAt: MoreThan(new Date(Date.now() - 10 * 60 * 1000)) } });
    if (recent >= 3) throw new AppError('Too many codes requested, try again in 10 minutes', 429);
    const code = String(crypto.randomInt(100000, 999999));
    await repos2.otps().save(repos2.otps().create({ phone, codeHash: hashToken(`${phone}:${code}`), expiresAt: new Date(Date.now() + env.sms.otpTtlMinutes * 60 * 1000), ipAddress: ip }));
    const sent = await SmsService.send(phone, `رمز التحقق في دليلك: ${code}`);
    const exists = await repos.users().exist({ where: { phone } });
    return { phone, expiresInSeconds: env.sms.otpTtlMinutes * 60, isNewUser: !exists, ...(!sent && !env.isProduction && { devCode: code }) };
  }

  private async consume(phone: string, code: string) {
    const otp = await repos2.otps().findOne({ where: { phone, used: false, expiresAt: MoreThan(new Date()) }, order: { createdAt: 'DESC' } });
    if (!otp) throw AppError.badRequest('Code expired — request a new one');
    if (otp.attempts >= 5) throw AppError.badRequest('Too many attempts — request a new code');
    if (otp.codeHash !== hashToken(`${phone}:${code}`)) {
      await repos2.otps().increment({ id: otp.id }, 'attempts', 1);
      throw AppError.badRequest('Wrong code');
    }
    await repos2.otps().update(otp.id, { used: true });
  }

  /** Logs in (or creates) the account owning this phone. */
  async verify(data: { phone: string; code: string; firstName?: string; lastName?: string; cityId?: number }, client: { ip?: string; userAgent?: string }) {
    const phone = normalizePhone(data.phone);
    await this.consume(phone, data.code);
    let user = await repos.users().findOne({ where: { phone }, order: { isPhoneVerified: 'DESC', createdAt: 'ASC' } });
    if (!user) {
      if (!data.firstName || !data.lastName) throw new AppError('First and last name are required for new accounts', 422, [{ field: 'firstName', message: 'required' }], 'NAME_REQUIRED');
      user = await repos.users().save(repos.users().create({
        firstName: data.firstName, lastName: data.lastName, phone, cityId: data.cityId, isPhoneVerified: true, role: UserRole.USER,
        password: hashToken(crypto.randomBytes(24).toString('hex')), // random, unusable password
      }));
    } else {
      if (user.status !== UserStatus.ACTIVE) throw new AppError('Your account is suspended. Contact support.', 403);
      await repos.users().update(user.id, { isPhoneVerified: true, lastLoginAt: new Date() });
    }
    return this.auth.issueFor(user, client);
  }

  /** Signed-in user verifies / changes his phone number. */
  async verifyForUser(user: User, rawPhone: string, code: string) {
    const phone = normalizePhone(rawPhone);
    await this.consume(phone, code);
    const other = await repos.users().findOne({ where: { phone, isPhoneVerified: true } });
    if (other && other.id !== user.id) throw AppError.conflict('This phone is already linked to another account');
    await repos.users().update(user.id, { phone, isPhoneVerified: true });
    return selfUser((await repos.users().findOne({ where: { id: user.id } }))!);
  }
}
