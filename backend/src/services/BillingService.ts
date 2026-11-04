import { In, LessThan, MoreThan } from 'typeorm';
import { repos } from '../repositories';
import { repos2 } from '../repositories';
import { Plan, PlanFeatures, User } from '../entities';
import { NotificationType, PaymentMethod, PaymentPurpose, PaymentStatus, SubscriptionStatus, UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { buildPaginationMeta } from '../utils/response';
import { CacheService } from './CacheService';
import { NotificationService } from './NotificationService';

/** All features, unlimited — used for every business while billing is OFF. */
export const UNLIMITED: PlanFeatures = {
  maxImages: -1, maxItems: -1, maxActiveOffers: -1, maxActiveListings: -1, bookings: true, quotes: true,
  advancedStats: true, verifiedBadge: false, priorityBoost: 0, featuredDaysPerMonth: 0, socialLinks: true, whatsappButton: true,
};

export const LAUNCH_PLAN = { id: 0, code: 'launch', name: 'باقة الإطلاق (مجانية)', nameEn: 'Launch (free)', priceMonthly: '0', priceYearly: '0', currency: 'SYP', features: UNLIMITED, color: '#12B76A' };

export type LimitKey = 'maxImages' | 'maxItems' | 'maxActiveOffers' | 'maxActiveListings';
export type FlagKey = 'bookings' | 'quotes' | 'advancedStats' | 'socialLinks' | 'whatsappButton';

export interface Settings {
  billingEnabled: boolean;
  /** Days before a subscription ends to notify the owner */
  renewalReminderDays: number;
  /** Payment instructions shown to owners (numbers for Sham Cash etc.) */
  paymentInstructions: string;
  /** Listings (real estate/cars/jobs) need admin approval before going public */
  listingsRequireApproval: boolean;
  listingDurationDays: number;
  serviceRequestDurationDays: number;
  supportPhone: string;
  supportWhatsapp: string;
}

export const DEFAULT_SETTINGS: Settings = {
  billingEnabled: false,
  renewalReminderDays: 5,
  paymentInstructions: 'ادفع عبر شام كاش أو سيريتل كاش أو MTN كاش ثم أدخل رقم العملية، وسيتم التفعيل خلال 24 ساعة.',
  listingsRequireApproval: true,
  listingDurationDays: 60,
  serviceRequestDurationDays: 14,
  supportPhone: '',
  supportWhatsapp: '',
};

export class SettingsService {
  static async all(): Promise<Settings> {
    return CacheService.remember('settings:all', 60, async () => {
      const rows = await repos2.settings().find();
      const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
      rows.forEach((r) => (out[r.key] = r.value));
      return out as unknown as Settings;
    });
  }

  static async get<K extends keyof Settings>(key: K): Promise<Settings[K]> {
    return (await this.all())[key];
  }

  static async update(patch: Partial<Settings>): Promise<Settings> {
    for (const [key, value] of Object.entries(patch)) {
      if (!(key in DEFAULT_SETTINGS)) continue;
      await repos2.settings().save({ key, value });
    }
    await CacheService.del('settings:all');
    await CacheService.delByPattern('ent:*');
    return this.all();
  }

  /** Public subset (for the web/mobile apps) */
  static async publicSettings() {
    const s = await this.all();
    return { billingEnabled: s.billingEnabled, supportPhone: s.supportPhone, supportWhatsapp: s.supportWhatsapp, paymentInstructions: s.paymentInstructions };
  }
}

const addPeriod = (from: Date, period: 'monthly' | 'yearly') => {
  const d = new Date(from);
  if (period === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
};

/**
 * Single gate for every paid feature.
 *  - billing OFF → launch plan (everything unlimited & free)
 *  - billing ON  → active subscription plan, otherwise the default (free) plan
 * Limit errors use HTTP 402 + code PLAN_LIMIT so the apps can show "upgrade your plan".
 */
export class EntitlementService {
  static async planFor(businessId: string): Promise<{ plan: Pick<Plan, 'id' | 'code' | 'name' | 'nameEn' | 'features' | 'color'>; subscription: unknown; billingEnabled: boolean }> {
    const billingEnabled = await SettingsService.get('billingEnabled');
    if (!billingEnabled) return { plan: LAUNCH_PLAN, subscription: null, billingEnabled };
    const now = new Date();
    const sub = await repos2.subscriptions().findOne({
      where: { businessId, status: SubscriptionStatus.ACTIVE, endDate: MoreThan(now) },
      relations: ['plan'],
      order: { endDate: 'DESC' },
    });
    if (sub?.plan) return { plan: sub.plan, subscription: sub, billingEnabled };
    const def = await repos2.plans().findOne({ where: { isDefault: true, isActive: true } });
    return { plan: def || { ...LAUNCH_PLAN, features: { ...UNLIMITED, maxItems: 10, maxImages: 5, maxActiveOffers: 1, maxActiveListings: 1, bookings: false, quotes: false, advancedStats: false } }, subscription: null, billingEnabled };
  }

  static async features(businessId: string): Promise<PlanFeatures> {
    return { ...UNLIMITED, ...(await this.planFor(businessId)).plan.features };
  }

  /** Throws 402 when `current + adding` would exceed the plan limit. */
  static async assertLimit(businessId: string, key: LimitKey, current: number, adding = 1, user?: User) {
    if (user?.role === UserRole.ADMIN) return;
    const f = await this.features(businessId);
    const max = f[key];
    if (max === -1 || max === undefined) return;
    if (current + adding > max) {
      throw new AppError(`Your plan allows up to ${max} (${key}). Upgrade your plan to add more.`, 402, [{ field: key, message: `limit:${max}` }], 'PLAN_LIMIT');
    }
  }

  static async assertFeature(businessId: string, key: FlagKey, user?: User) {
    if (user?.role === UserRole.ADMIN) return;
    const f = await this.features(businessId);
    if (!f[key]) throw new AppError(`This feature (${key}) is not included in your plan. Upgrade to enable it.`, 402, [{ field: key, message: 'feature' }], 'PLAN_FEATURE');
  }

  /** Owner view: plan + usage */
  static async usage(businessId: string) {
    const now = new Date();
    const [p, images, items, offers, listings] = await Promise.all([
      this.planFor(businessId),
      repos.images().count({ where: { businessId } }),
      repos2.items().count({ where: { businessId } }),
      repos2.offers().count({ where: { businessId, isActive: true, endDate: MoreThan(now) } }),
      repos2.listings().count({ where: { businessId, status: In(['pending', 'active']) as never } }),
    ]);
    return { ...p, features: { ...UNLIMITED, ...p.plan.features }, usage: { images, items, activeOffers: offers, activeListings: listings } };
  }
}

export class BillingService {
  // ───── plans ─────
  listPlans(all = false) {
    return repos2.plans().find({ where: all ? {} : { isActive: true }, order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async savePlan(id: number | null, data: Partial<Plan>) {
    if (data.isDefault) await repos2.plans().update({ isDefault: true }, { isDefault: false });
    const plan = id ? await repos2.plans().findOne({ where: { id } }) : repos2.plans().create();
    if (!plan) throw AppError.notFound('Plan not found');
    Object.assign(plan, data);
    if (data.features) plan.features = { ...UNLIMITED, ...(id ? plan.features : {}), ...data.features };
    await CacheService.delByPattern('ent:*');
    return repos2.plans().save(plan);
  }

  async deletePlan(id: number) {
    if (await repos2.subscriptions().exist({ where: { planId: id } })) throw AppError.conflict('Plan has subscriptions — deactivate it instead');
    await repos2.plans().delete(id);
  }

  // ───── owner self-service ─────
  async requestSubscription(user: User, data: { businessId: string; planId: number; period: 'monthly' | 'yearly'; method: PaymentMethod; reference?: string; note?: string }) {
    const business = await repos.businesses().findOne({ where: { id: data.businessId } });
    if (!business) throw AppError.notFound('Business not found');
    if (user.role !== UserRole.ADMIN && business.ownerId !== user.id) throw AppError.forbidden();
    const plan = await repos2.plans().findOne({ where: { id: data.planId, isActive: true } });
    if (!plan) throw AppError.notFound('Plan not found');
    const sub = await repos2.subscriptions().save(repos2.subscriptions().create({ businessId: business.id, userId: user.id, planId: plan.id, period: data.period, status: SubscriptionStatus.PENDING, note: data.note }));
    const amount = data.period === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    const payment = await repos2.payments().save(repos2.payments().create({
      userId: user.id, businessId: business.id, subscriptionId: sub.id, purpose: PaymentPurpose.SUBSCRIPTION, amount, currency: plan.currency,
      method: data.method, reference: data.reference, note: data.note, status: Number(amount) === 0 ? PaymentStatus.CONFIRMED : PaymentStatus.PENDING,
    }));
    if (Number(amount) === 0) await this.activate(sub.id);
    return { subscription: sub, payment };
  }

  async mySubscriptions(userId: string) {
    return repos2.subscriptions().find({ where: { userId }, relations: ['plan', 'business'], order: { createdAt: 'DESC' } });
  }

  // ───── admin ─────
  async listSubscriptions(page: number, limit: number, filter: { status?: SubscriptionStatus; businessId?: string }) {
    const qb = repos2.subscriptions().createQueryBuilder('s').leftJoinAndSelect('s.plan', 'plan').leftJoinAndSelect('s.business', 'b');
    if (filter.status) qb.andWhere('s.status = :st', { st: filter.status });
    if (filter.businessId) qb.andWhere('s.businessId = :bid', { bid: filter.businessId });
    const [items, total] = await qb.orderBy('s.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items: items.map((s) => ({ ...s, business: s.business ? { id: s.business.id, name: s.business.name, slug: s.business.slug } : null })), meta: buildPaginationMeta(total, page, limit) };
  }

  /** Admin grants a plan directly (e.g. paid in cash at the office) */
  async grant(data: { businessId: string; planId: number; period: 'monthly' | 'yearly'; startDate?: Date; endDate?: Date; note?: string; amount?: number; method?: PaymentMethod; reference?: string }) {
    const business = await repos.businesses().findOne({ where: { id: data.businessId } });
    if (!business) throw AppError.notFound('Business not found');
    const start = data.startDate ? new Date(data.startDate) : new Date();
    const sub = await repos2.subscriptions().save(repos2.subscriptions().create({
      businessId: business.id, userId: business.ownerId, planId: data.planId, period: data.period, status: SubscriptionStatus.ACTIVE,
      startDate: start, endDate: data.endDate ? new Date(data.endDate) : addPeriod(start, data.period), note: data.note,
    }));
    if (data.amount !== undefined) {
      await repos2.payments().save(repos2.payments().create({ userId: business.ownerId, businessId: business.id, subscriptionId: sub.id, amount: String(data.amount), method: data.method || PaymentMethod.CASH, reference: data.reference, status: PaymentStatus.CONFIRMED }));
    }
    await this.afterActivation(sub.id);
    return sub;
  }

  async updateSubscription(id: number, data: { status?: SubscriptionStatus; endDate?: Date; planId?: number; note?: string }) {
    const sub = await repos2.subscriptions().findOne({ where: { id } });
    if (!sub) throw AppError.notFound('Subscription not found');
    const activating = data.status === SubscriptionStatus.ACTIVE && sub.status !== SubscriptionStatus.ACTIVE;
    Object.assign(sub, data);
    await repos2.subscriptions().save(sub);
    if (activating) await this.activate(id);
    await CacheService.delByPattern('ent:*');
    return sub;
  }

  async listPayments(page: number, limit: number, status?: PaymentStatus) {
    const qb = repos2.payments().createQueryBuilder('p').leftJoinAndSelect('p.user', 'u').leftJoinAndSelect('p.business', 'b');
    if (status) qb.where('p.status = :st', { st: status });
    const [items, total] = await qb.orderBy('p.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return {
      items: items.map((p) => ({ ...p, user: p.user ? { id: p.user.id, fullName: `${p.user.firstName} ${p.user.lastName}`, phone: p.user.phone, email: p.user.email } : null, business: p.business ? { id: p.business.id, name: p.business.name, slug: p.business.slug } : null })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async recordPayment(data: { userId?: string; businessId?: string; purpose: PaymentPurpose; amount: number; method: PaymentMethod; reference?: string; note?: string }) {
    return repos2.payments().save(repos2.payments().create({ ...data, amount: String(data.amount), status: PaymentStatus.CONFIRMED }));
  }

  /** Confirming a payment activates its subscription; rejecting cancels it. */
  async decidePayment(id: number, status: PaymentStatus.CONFIRMED | PaymentStatus.REJECTED, adminNote?: string) {
    const p = await repos2.payments().findOne({ where: { id } });
    if (!p) throw AppError.notFound('Payment not found');
    p.status = status;
    p.adminNote = adminNote || p.adminNote;
    await repos2.payments().save(p);
    if (p.subscriptionId) {
      if (status === PaymentStatus.CONFIRMED) await this.activate(p.subscriptionId);
      else {
        await repos2.subscriptions().update(p.subscriptionId, { status: SubscriptionStatus.CANCELLED });
        await NotificationService.notify(p.userId, NotificationType.PAYMENT_REJECTED, 'لم يتم تأكيد الدفعة', adminNote);
      }
    }
    return p;
  }

  private async activate(subscriptionId: number) {
    const sub = await repos2.subscriptions().findOne({ where: { id: subscriptionId } });
    if (!sub) return;
    // extend from the end of the current active subscription if any
    const current = await repos2.subscriptions().findOne({ where: { businessId: sub.businessId, status: SubscriptionStatus.ACTIVE, endDate: MoreThan(new Date()) }, order: { endDate: 'DESC' } });
    const start = current && current.id !== sub.id && current.endDate ? current.endDate : new Date();
    sub.startDate = start;
    sub.endDate = addPeriod(start, sub.period);
    sub.status = SubscriptionStatus.ACTIVE;
    await repos2.subscriptions().save(sub);
    await this.afterActivation(sub.id);
  }

  private async afterActivation(subscriptionId: number) {
    const sub = await repos2.subscriptions().findOne({ where: { id: subscriptionId }, relations: ['plan', 'business'] });
    if (!sub) return;
    if (sub.plan?.features?.verifiedBadge) await repos.businesses().update(sub.businessId, { isVerified: true });
    await CacheService.invalidateCatalog();
    await NotificationService.notify(sub.business?.ownerId, NotificationType.SUBSCRIPTION_ACTIVATED, `تم تفعيل ${sub.plan?.name} لـ "${sub.business?.name}"`, sub.endDate ? `حتى ${sub.endDate.toISOString().slice(0, 10)}` : undefined, { businessId: sub.businessId, slug: sub.business?.slug });
  }

  /** Job: expire ended subscriptions + reminders. */
  static async expireAndRemind(): Promise<void> {
    const now = new Date();
    await repos2.subscriptions().update({ status: SubscriptionStatus.ACTIVE, endDate: LessThan(now) }, { status: SubscriptionStatus.EXPIRED });
    if (!(await SettingsService.get('billingEnabled'))) return;
    const days = await SettingsService.get('renewalReminderDays');
    const soon = new Date(Date.now() + days * 864e5);
    const subs = await repos2.subscriptions()
      .createQueryBuilder('s').leftJoinAndSelect('s.business', 'b').leftJoinAndSelect('s.plan', 'p')
      .where('s.status = :a AND s.endDate <= :soon AND s.autoRenewReminder = false', { a: SubscriptionStatus.ACTIVE, soon }).getMany();
    for (const s of subs) {
      await NotificationService.notify(s.business?.ownerId, NotificationType.SUBSCRIPTION_EXPIRING, `اشتراك "${s.business?.name}" ينتهي قريباً`, `${s.plan?.name} — ${s.endDate?.toISOString().slice(0, 10)}`, { businessId: s.businessId });
      await repos2.subscriptions().update(s.id, { autoRenewReminder: true });
    }
  }
}
