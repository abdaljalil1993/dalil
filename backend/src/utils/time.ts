import { env } from '../config/env';

export interface HoursLike {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  isOpen24Hours: boolean;
}

/** Current day-of-week (0=Sunday) and "HH:MM:SS" in the app timezone. */
export const nowInAppTz = (date = new Date()): { dow: number; time: string } => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: env.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hour = get('hour') === '24' ? '00' : get('hour');
  return { dow: days.indexOf(get('weekday')), time: `${hour}:${get('minute')}:${get('second')}` };
};

const norm = (t: string | null) => (t ? (t.length === 5 ? `${t}:00` : t) : null);

const isWithin = (h: HoursLike, time: string): boolean => {
  if (h.isClosed) return false;
  if (h.isOpen24Hours) return true;
  const open = norm(h.openTime);
  const close = norm(h.closeTime);
  if (!open || !close) return false;
  if (open <= close) return time >= open && time < close;
  return time >= open || time < close; // overnight e.g. 18:00 -> 02:00
};

/** Returns null when the business has no hours configured. */
export const computeIsOpenNow = (hours: HoursLike[] | undefined | null, date = new Date()): boolean | null => {
  if (!hours || hours.length === 0) return null;
  const { dow, time } = nowInAppTz(date);
  const today = hours.find((h) => h.dayOfWeek === dow);
  if (today && isWithin(today, time)) return true;
  // still open from yesterday's overnight shift?
  const yesterday = hours.find((h) => h.dayOfWeek === (dow + 6) % 7);
  if (yesterday && !yesterday.isClosed && !yesterday.isOpen24Hours) {
    const open = norm(yesterday.openTime);
    const close = norm(yesterday.closeTime);
    if (open && close && open > close && time < close) return true;
  }
  return false;
};
