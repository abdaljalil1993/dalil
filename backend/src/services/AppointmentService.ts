import { In, MoreThanOrEqual } from 'typeorm';
import { repos, repos2 } from '../repositories';
import { Business, User } from '../entities';
import { AppointmentStatus, BusinessStatus, NotificationType, UserRole } from '../entities/enums';
import { AppError } from '../utils/AppError';
import { buildPaginationMeta } from '../utils/response';
import { EntitlementService } from './BillingService';
import { NotificationService } from './NotificationService';
import { publicUser } from './serializers';
import { assertCanManage } from './ExtrasService';

const ACTIVE = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const tzToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Damascus' }).format(new Date());
const tzNowMin = () => { const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Damascus', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).split(':').map(Number); return (h % 24) * 60 + m; };

export type BookingSettingsInput = Partial<Pick<Business, 'bookingEnabled' | 'bookingMode' | 'slotMinutes' | 'slotCapacity' | 'bookingDaysAhead' | 'bookingAutoConfirm' | 'bookingNote' | 'acceptsQuotes'>>;

/** Appointments (doctors, salons, lawyers: time slots) and day bookings (halls, chalets). */
export class AppointmentService {
  async updateSettings(businessId: string, user: User, data: BookingSettingsInput) {
    await assertCanManage(businessId, user);
    if (data.bookingEnabled) await EntitlementService.assertFeature(businessId, 'bookings', user);
    if (data.acceptsQuotes) await EntitlementService.assertFeature(businessId, 'quotes', user);
    await repos.businesses().update(businessId, data);
    const b = await repos.businesses().findOne({ where: { id: businessId } });
    return this.settingsOf(b!);
  }

  settingsOf(b: Business) {
    return { bookingEnabled: b.bookingEnabled, bookingMode: b.bookingMode, slotMinutes: b.slotMinutes, slotCapacity: b.slotCapacity, bookingDaysAhead: b.bookingDaysAhead, bookingAutoConfirm: b.bookingAutoConfirm, bookingNote: b.bookingNote, acceptsQuotes: b.acceptsQuotes };
  }

  /** Free slots for a date, derived from working hours, capacity and existing bookings. */
  async availability(businessId: string, date: string) {
    const b = await repos.businesses().findOne({ where: { id: businessId }, relations: ['workingHours'] });
    if (!b || b.status !== BusinessStatus.APPROVED) throw AppError.notFound('Business not found');
    if (!b.bookingEnabled) return { ...this.settingsOf(b), date, slots: [], available: false };
    const today = tzToday();
    const max = new Date(Date.now() + b.bookingDaysAhead * 864e5).toISOString().slice(0, 10);
    if (date < today || date > max) return { ...this.settingsOf(b), date, slots: [], available: false };
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    const h = b.workingHours.find((x) => x.dayOfWeek === dow);
    const booked = await repos2.appointments().find({ where: { businessId, date, status: In(ACTIVE) } });

    if (b.bookingMode === 'day') {
      const open = !h || !h.isClosed;
      return { ...this.settingsOf(b), date, slots: [], available: open && booked.length < b.slotCapacity, remaining: Math.max(0, b.slotCapacity - booked.length) };
    }
    if (!h || h.isClosed) return { ...this.settingsOf(b), date, slots: [], available: false };
    let start = h.isOpen24Hours ? 0 : toMin(h.openTime || '09:00');
    let end = h.isOpen24Hours ? 24 * 60 : toMin(h.closeTime || '17:00');
    if (end <= start) end += 24 * 60;
    if (date === today) start = Math.max(start, Math.ceil((tzNowMin() + 30) / b.slotMinutes) * b.slotMinutes);
    const slots: { time: string; remaining: number }[] = [];
    for (let m = start; m + b.slotMinutes <= end; m += b.slotMinutes) {
      const t = toTime(m);
      const taken = booked.filter((a) => a.time?.slice(0, 5) === t).length;
      if (taken < b.slotCapacity) slots.push({ time: t, remaining: b.slotCapacity - taken });
    }
    return { ...this.settingsOf(b), date, slots, available: slots.length > 0 };
  }

  async book(businessId: string, user: User, data: { date: string; time?: string; itemId?: number; partySize?: number; phone?: string; note?: string }) {
    const b = await repos.businesses().findOne({ where: { id: businessId } });
    if (!b) throw AppError.notFound('Business not found');
    if (b.ownerId === user.id) throw AppError.badRequest('You cannot book your own business');
    const av = await this.availability(businessId, data.date);
    if (!av.available) throw AppError.badRequest('This date is not available');
    if (b.bookingMode === 'slot') {
      if (!data.time || !av.slots.some((s) => s.time === data.time)) throw AppError.badRequest('Selected time is not available');
    }
    if (await repos2.appointments().exist({ where: { businessId, userId: user.id, date: data.date, status: In(ACTIVE) } })) throw AppError.conflict('You already have a booking on this date');
    if (data.itemId && !(await repos2.items().exist({ where: { id: data.itemId, businessId } }))) throw AppError.badRequest('Service not found');
    const appt = await repos2.appointments().save(repos2.appointments().create({
      businessId, userId: user.id, date: data.date, time: b.bookingMode === 'slot' ? data.time : null,
      endTime: b.bookingMode === 'slot' && data.time ? toTime(toMin(data.time) + b.slotMinutes) : null,
      itemId: data.itemId ?? null, partySize: data.partySize || 1, phone: data.phone || user.phone, note: data.note,
      status: b.bookingAutoConfirm ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING,
    }));
    await NotificationService.notify(b.ownerId, NotificationType.NEW_APPOINTMENT, `حجز جديد: ${data.date}${data.time ? ` ${data.time}` : ''}`, `${user.firstName} ${user.lastName} — ${b.name}`, { businessId, appointmentId: appt.id });
    return this.one(appt.id);
  }

  async mine(userId: string, upcoming = true) {
    const where = upcoming ? { userId, date: MoreThanOrEqual(tzToday()) } : { userId };
    const rows = await repos2.appointments().find({ where, relations: ['business', 'item'], order: { date: upcoming ? 'ASC' : 'DESC', time: 'ASC' }, take: 100 });
    return rows.map((a) => this.serialize(a));
  }

  async forOwner(user: User, filter: { businessId?: string; date?: string; status?: AppointmentStatus; page: number; limit: number }) {
    const ids = filter.businessId ? [filter.businessId] : (await repos.businesses().find({ where: { ownerId: user.id }, select: ['id'] })).map((b) => b.id);
    if (filter.businessId && user.role !== UserRole.ADMIN) await assertCanManage(filter.businessId, user);
    if (!ids.length) return { items: [], meta: buildPaginationMeta(0, filter.page, filter.limit) };
    const qb = repos2.appointments().createQueryBuilder('a').leftJoinAndSelect('a.user', 'user').leftJoinAndSelect('a.business', 'business').leftJoinAndSelect('a.item', 'item').where('a.businessId IN (:...ids)', { ids });
    if (filter.date) qb.andWhere('a.date = :d', { d: filter.date });
    else qb.andWhere('a.date >= :t', { t: tzToday() });
    if (filter.status) qb.andWhere('a.status = :s', { s: filter.status });
    const [items, total] = await qb.orderBy('a.date', 'ASC').addOrderBy('a.time', 'ASC').skip((filter.page - 1) * filter.limit).take(filter.limit).getManyAndCount();
    return { items: items.map((a) => ({ ...this.serialize(a), user: a.user ? { ...publicUser(a.user), phone: a.phone || a.user.phone } : null })), meta: buildPaginationMeta(total, filter.page, filter.limit) };
  }

  async setStatus(id: number, user: User, status: AppointmentStatus, ownerNote?: string) {
    const a = await repos2.appointments().findOne({ where: { id }, relations: ['business'] });
    if (!a) throw AppError.notFound('Appointment not found');
    const isCustomer = a.userId === user.id;
    const isOwner = a.business.ownerId === user.id || user.role === UserRole.ADMIN;
    if (isCustomer && !isOwner) {
      if (status !== AppointmentStatus.CANCELLED) throw AppError.forbidden('You can only cancel your booking');
    } else if (!isOwner) throw AppError.forbidden();
    a.status = status;
    if (ownerNote !== undefined && isOwner) a.ownerNote = ownerNote;
    await repos2.appointments().save(a);
    const notifyUser = isOwner && !isCustomer ? a.userId : a.business.ownerId;
    await NotificationService.notify(notifyUser, NotificationType.APPOINTMENT_UPDATE, `تحديث حجز ${a.date}${a.time ? ` ${a.time.slice(0, 5)}` : ''} — ${a.business.name}`, status, { businessId: a.businessId, slug: a.business.slug, appointmentId: a.id });
    return this.one(id);
  }

  private async one(id: number) {
    const a = await repos2.appointments().findOne({ where: { id }, relations: ['business', 'item'] });
    return a ? this.serialize(a) : null;
  }

  private serialize(a: import('../entities').Appointment) {
    return {
      id: a.id, date: a.date, time: a.time?.slice(0, 5) || null, endTime: a.endTime?.slice(0, 5) || null, partySize: a.partySize, phone: a.phone, note: a.note, ownerNote: a.ownerNote, status: a.status, createdAt: a.createdAt,
      business: a.business ? { id: a.business.id, name: a.business.name, slug: a.business.slug, logoImage: a.business.logoImage, phone: a.business.phone, address: a.business.address } : null,
      item: a.item ? { id: a.item.id, name: a.item.name, price: a.item.price } : null,
    };
  }
}
