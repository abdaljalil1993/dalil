import dayjs from 'dayjs';
import type { WorkingHour } from '@/api/types';

export const telLink = (p?: string | null): string => (p ? `tel:${p.replace(/[^+\d]/g, '')}` : '#');
export const waLink = (p?: string | null, text?: string): string => {
  if (!p) return '#';
  let n = p.replace(/[^\d]/g, '');
  if (n.startsWith('09')) n = `963${n.slice(1)}`; // Syrian mobile local → international
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
export const mapsLink = (lat?: number | null, lng?: number | null, label?: string): string =>
  lat != null && lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : label
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`
      : '';

export const formatTime = (t: string | null, locale: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const d = dayjs().hour(h).minute(m);
  return locale === 'ar' ? d.format('h:mm') + (h < 12 ? ' ص' : ' م') : d.format('h:mm A');
};

export const formatHours = (h: WorkingHour | undefined, locale: string, labels: { closed: string; open24: string }) => {
  if (!h || h.isClosed) return labels.closed;
  if (h.isOpen24Hours) return labels.open24;
  return `${formatTime(h.openTime, locale)} – ${formatTime(h.closeTime, locale)}`;
};

export const todayIndex = () => new Date().getDay();
export const priceLabel = (n?: number | null) => (n ? '$'.repeat(n) : '');
export const compact = (n: number, locale: string) => new Intl.NumberFormat(locale === 'ar' ? 'ar-SY' : 'en', { notation: 'compact' }).format(n);
export const fmtDate = (d?: string | null, fmt = 'D MMM YYYY') => (d ? dayjs(d).format(fmt) : '—');
export const fromNow = (d?: string | null) => (d ? dayjs(d).fromNow() : '');
export const initials = (name?: string | null) => (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const formatPrice = (value: number | string | null | undefined, currency = 'SYP', locale = 'ar') => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const num = new Intl.NumberFormat(locale === 'ar' ? 'ar-SY' : 'en', { maximumFractionDigits: 2 }).format(n);
  const cur = currency === 'SYP' ? (locale === 'ar' ? 'ل.س' : 'SYP') : currency === 'USD' ? '$' : currency;
  return `${num} ${cur}`;
};

export const isoDay = (offset = 0) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Damascus' }).format(new Date(Date.now() + offset * 864e5));
export const limitLabel = (n: number, unlimited: string) => (n === -1 ? unlimited : String(n));
