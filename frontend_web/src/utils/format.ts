import dayjs from 'dayjs';
import type { WorkingHour } from '@/api/types';

export const telLink = (p?: string | null): string => (p ? `tel:${p.replace(/[^+\d]/g, '')}` : '#');
export const waLink = (p?: string | null, text?: string): string => {
  if (!p) return '#';
  let n = p.replace(/[^\d]/g, '');
  if (n.startsWith('09')) n = `963${n.slice(1)}`; // Syrian mobile local → international
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
export const mapsLink = (lat?: number | null, lng?: number | null, label?: string, origin?: { lat: number; lng: number } | null): string =>
  lat != null && lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${Number(lat)},${Number(lng)}&travelmode=driving${origin ? `&origin=${origin.lat},${origin.lng}` : ''}`
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

/**
 * Opens Google Maps directions FROM the user's real GPS position (not the IP/VPN guess Google uses otherwise).
 * The tab is opened synchronously (no popup blocking), then pointed at the final URL.
 */
export const openDirections = (lat?: number | null, lng?: number | null, label?: string) => {
  const fallback = mapsLink(lat, lng, label);
  if (!fallback) return;
  const win = window.open('about:blank', '_blank');
  const go = (url: string) => { if (win) win.location.href = url; else window.location.href = url; };
  if (lat == null || lng == null || !navigator.geolocation) return go(fallback);
  let done = false;
  const timer = setTimeout(() => { if (!done) { done = true; go(fallback); } }, 4000);
  navigator.geolocation.getCurrentPosition(
    (p) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const o = { lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) };
      // VPN / IP guesses (e.g. Malta, Greece) or very rough positions → let Google Maps ask the user instead
      const plausible = o.lat >= 32.2 && o.lat <= 37.5 && o.lng >= 35.5 && o.lng <= 42.5 && p.coords.accuracy <= 5000;
      go(plausible ? mapsLink(lat, lng, label, o) : fallback);
    },
    () => { if (done) return; done = true; clearTimeout(timer); go(fallback); },
    { enableHighAccuracy: true, timeout: 3500, maximumAge: 120_000 },
  );
};
