import { randomUUID } from 'crypto';
import { In, IsNull } from 'typeorm';
import { repos } from '../repositories';
import { BusinessSource, BusinessStatus } from '../entities/enums';
import { City } from '../entities';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';
import { normalizeText, slugify } from '../utils/text';
import { CacheService } from './CacheService';
import { SearchIndexService } from './SearchIndexService';

/**
 * Import real places from OpenStreetMap (free, legal with attribution "© OpenStreetMap contributors", ODbL).
 * Admin picks governorate/city + what to import → a background job pulls from the Overpass API,
 * maps OSM tags to our categories, and never duplicates (osmId unique + same name within ~150 m).
 */

type Tags = Record<string, string>;
interface Preset {
  key: string;
  name: string;
  nameEn: string;
  category: string; // our Category.nameEn
  selectors: string[]; // Overpass tag filters
  /** returns our SubCategory.nameEn (or null = category only) */
  sub: (t: Tags) => string | null;
}

const has = (v: string | undefined, ...xs: string[]) => Boolean(v && xs.some((x) => v.split(/[;,]/).map((s) => s.trim()).includes(x)));
const re = (vals: string[]) => `~"^(${vals.join('|')})$"`;

export const OSM_PRESETS: Preset[] = [
  { key: 'pharmacies', name: 'صيدليات', nameEn: 'Pharmacies', category: 'Pharmacies', selectors: ['["amenity"="pharmacy"]'], sub: () => 'Pharmacies' },
  { key: 'hospitals', name: 'مشافي ومراكز طبية ومخابر', nameEn: 'Hospitals, clinics & labs', category: 'Hospitals & Medical Centers', selectors: [`["amenity"${re(['hospital', 'clinic'])}]`, `["healthcare"${re(['laboratory', 'physiotherapist', 'centre'])}]`],
    sub: (t) => (t.healthcare === 'laboratory' ? 'Laboratories' : t.healthcare === 'physiotherapist' ? 'Physiotherapy' : t.amenity === 'hospital' ? 'Hospitals' : null) },
  { key: 'doctors', name: 'أطباء وعيادات أسنان', nameEn: 'Doctors & dentists', category: 'Doctors', selectors: [`["amenity"${re(['doctors', 'dentist'])}]`],
    sub: (t) => {
      const s = t['healthcare:speciality'] || '';
      if (t.amenity === 'dentist' || has(s, 'dentistry')) return 'Dentistry';
      const m: Record<string, string> = { ophthalmology: 'Ophthalmology', paediatrics: 'Pediatrics', gynaecology: 'Gynecology', cardiology: 'Cardiology', dermatology: 'Dermatology', orthopaedics: 'Orthopedics', otolaryngology: 'ENT', internal: 'Internal Medicine', neurology: 'Neurology & Psychiatry', psychiatry: 'Neurology & Psychiatry', general: 'General Practice' };
      for (const [k, v] of Object.entries(m)) if (has(s, k)) return v;
      return null;
    } },
  { key: 'restaurants', name: 'مطاعم ووجبات سريعة', nameEn: 'Restaurants & fast food', category: 'Restaurants', selectors: [`["amenity"${re(['restaurant', 'fast_food', 'food_court'])}]`],
    sub: (t) => {
      const c = t.cuisine || '';
      if (has(c, 'seafood', 'fish')) return 'Seafood';
      if (has(c, 'pizza')) return 'Pizza & Pastry';
      if (has(c, 'shawarma', 'falafel', 'kebab', 'doner')) return 'Shawarma & Falafel';
      if (has(c, 'grill', 'barbecue', 'steak_house')) return 'Grills';
      if (has(c, 'burger', 'chicken', 'sandwich') || t.amenity === 'fast_food') return 'Fast Food';
      if (has(c, 'arab', 'syrian', 'lebanese', 'oriental', 'middle_eastern')) return 'Oriental';
      return null;
    } },
  { key: 'sweets', name: 'حلويات وبوظة', nameEn: 'Sweets & ice cream', category: 'Restaurants', selectors: [`["shop"${re(['confectionery', 'pastry', 'chocolate'])}]`, '["amenity"="ice_cream"]'], sub: () => 'Sweets' },
  { key: 'cafes', name: 'مقاهي وكافيهات', nameEn: 'Cafes', category: 'Cafes', selectors: [`["amenity"${re(['cafe', 'hookah_lounge'])}]`, '["shop"="juice"]'],
    sub: (t) => (t.amenity === 'hookah_lounge' || t.hookah === 'yes' ? 'Shisha Cafes' : t.shop === 'juice' ? 'Juice Bars' : 'Coffee Shops') },
  { key: 'hotels', name: 'فنادق وإقامة', nameEn: 'Hotels & stays', category: 'Hotels & Stays', selectors: [`["tourism"${re(['hotel', 'motel', 'guest_house', 'hostel', 'apartment', 'chalet'])}]`, '["leisure"="resort"]'],
    sub: (t) => (t.leisure === 'resort' ? 'Resorts' : t.tourism === 'chalet' ? 'Chalets' : t.tourism === 'apartment' ? 'Furnished Apartments' : 'Hotels') },
  { key: 'groceries', name: 'مواد غذائية وأفران', nameEn: 'Groceries & bakeries', category: 'Groceries & Food', selectors: [`["shop"${re(['supermarket', 'convenience', 'grocery', 'bakery', 'butcher', 'greengrocer', 'poultry'])}]`],
    sub: (t) => ({ supermarket: 'Supermarkets', convenience: 'Mini Markets', grocery: 'Mini Markets', bakery: 'Bakeries', butcher: 'Butchers', poultry: 'Butchers', greengrocer: 'Fruits & Vegetables' } as Tags)[t.shop] || null },
  { key: 'shopping', name: 'محلات وتسوق', nameEn: 'Shops', category: 'Shopping', selectors: [`["shop"${re(['clothes', 'shoes', 'boutique', 'electronics', 'mobile_phone', 'computer', 'furniture', 'gift', 'perfumery', 'jewelry', 'cosmetics', 'mall', 'department_store'])}]`],
    sub: (t) => (['clothes', 'shoes', 'boutique'].includes(t.shop) ? 'Clothing & Shoes' : ['electronics', 'mobile_phone', 'computer'].includes(t.shop) ? 'Electronics' : t.shop === 'furniture' ? 'Furniture' : ['gift', 'perfumery', 'jewelry', 'cosmetics'].includes(t.shop) ? 'Gifts & Perfumes' : null) },
  { key: 'beauty', name: 'حلاقة وتجميل', nameEn: 'Barbers & beauty', category: 'Beauty & Care', selectors: [`["shop"${re(['hairdresser', 'beauty'])}]`],
    sub: (t) => (t.shop === 'beauty' ? 'Beauty Centers' : t['hairdresser'] === 'barber' || t.male === 'yes' ? 'Barbers' : t.female === 'yes' ? 'Ladies Salons' : null) },
  { key: 'cars', name: 'سيارات ومحطات وقود', nameEn: 'Car services & fuel', category: 'Cars', selectors: [`["shop"${re(['car', 'car_repair', 'car_parts', 'tyres'])}]`, `["amenity"${re(['fuel', 'car_wash'])}]`],
    sub: (t) => (t.amenity === 'fuel' ? 'Gas Stations' : t.amenity === 'car_wash' ? 'Car Wash' : t.shop === 'car' ? 'Car Dealers' : ['car_parts', 'tyres'].includes(t.shop) ? 'Spare Parts' : 'Car Repair') },
  { key: 'education', name: 'مدارس ومعاهد وروضات', nameEn: 'Education', category: 'Education', selectors: [`["amenity"${re(['school', 'kindergarten', 'college', 'university', 'language_school', 'training'])}]`],
    sub: (t) => (t.amenity === 'school' ? 'Schools' : t.amenity === 'kindergarten' ? 'Kindergartens' : ['language_school', 'training', 'college'].includes(t.amenity) ? 'Institutes' : null) },
  { key: 'banks', name: 'بنوك وصرافة وبريد', nameEn: 'Banks, exchange & post', category: 'Public Services', selectors: [`["amenity"${re(['bank', 'bureau_de_change', 'money_transfer', 'post_office'])}]`],
    sub: (t) => (t.amenity === 'post_office' ? 'Post & Telecom' : ['bureau_de_change', 'money_transfer'].includes(t.amenity) ? null : 'Banks') },
  { key: 'government', name: 'دوائر حكومية وخدمات عامة', nameEn: 'Government & public', category: 'Public Services', selectors: [`["amenity"${re(['townhall', 'courthouse', 'police', 'fire_station'])}]`, '["office"="government"]'], sub: () => 'Government Offices' },
  { key: 'entertainment', name: 'ترفيه وحدائق ونوادي', nameEn: 'Entertainment, parks & gyms', category: 'Entertainment', selectors: [`["amenity"${re(['cinema', 'theatre'])}]`, `["leisure"${re(['park', 'amusement_arcade', 'fitness_centre', 'sports_centre', 'water_park', 'beach_resort'])}]`],
    sub: (t) => (['cinema', 'theatre'].includes(t.amenity) ? 'Cinema & Theater' : t.leisure === 'park' ? 'Parks' : ['fitness_centre', 'sports_centre'].includes(t.leisure) ? 'Gyms & Clubs' : ['water_park', 'beach_resort'].includes(t.leisure) ? 'Beaches & Pools' : t.leisure === 'amusement_arcade' ? 'Gaming Lounges' : null) },
  { key: 'lawyers', name: 'محامون', nameEn: 'Lawyers', category: 'Lawyers', selectors: ['["office"="lawyer"]'], sub: () => null },
  { key: 'offices', name: 'مكاتب عقارية وهندسية وتأمين', nameEn: 'Real estate, engineering & insurance offices', category: 'Services & Offices', selectors: [`["office"${re(['estate_agent', 'architect', 'engineer', 'insurance', 'accountant', 'translator'])}]`],
    sub: (t) => ({ estate_agent: 'Real Estate', architect: 'Engineering Offices', engineer: 'Engineering Offices', insurance: 'Insurance', accountant: 'Accounting', translator: 'Translation' } as Tags)[t.office] || null },
  { key: 'craftsmen', name: 'حرفيون وصيانة', nameEn: 'Craftsmen & repair', category: 'Maintenance & Craftsmen', selectors: [`["craft"${re(['electrician', 'plumber', 'carpenter', 'painter', 'hvac', 'metal_construction', 'electronics_repair'])}]`, '["shop"="mobile_phone_repair"]'],
    sub: (t) => ({ electrician: 'Electrician', plumber: 'Plumber', carpenter: 'Carpenter', painter: 'Painter & Decor', hvac: 'AC & Refrigeration', metal_construction: 'Aluminum & Smithing', electronics_repair: 'Phone & PC Repair' } as Tags)[t.craft] || (t.shop === 'mobile_phone_repair' ? 'Phone & PC Repair' : null) },
  { key: 'events', name: 'صالات أفراح وتصوير', nameEn: 'Event halls & photography', category: 'Events & Weddings', selectors: ['["amenity"="events_venue"]', '["craft"="photographer"]', '["shop"="photo"]'],
    sub: (t) => (t.amenity === 'events_venue' ? 'Wedding Halls' : 'Photography') },
  { key: 'vets', name: 'بيطري وحيوانات', nameEn: 'Vets & pet shops', category: 'Vets & Pets', selectors: ['["amenity"="veterinary"]', '["shop"="pet"]'], sub: (t) => (t.shop === 'pet' ? 'Pet Shops' : 'Vet Clinics') },
];

/** Syrian governorates → OSM ISO3166-2 code (for whole-governorate imports) */
const GOV_ISO: Record<string, string> = {
  'دمشق': 'SY-DI', 'ريف دمشق': 'SY-RD', 'حلب': 'SY-HL', 'حمص': 'SY-HI', 'حماة': 'SY-HM', 'اللاذقية': 'SY-LA', 'طرطوس': 'SY-TA', 'إدلب': 'SY-ID',
  'دير الزور': 'SY-DY', 'الرقة': 'SY-RA', 'الحسكة': 'SY-HA', 'درعا': 'SY-DR', 'السويداء': 'SY-SU', 'القنيطرة': 'SY-QU',
};

export interface ImportOptions {
  presets: string[];
  /** 'governorate' = the whole governorate of cityId · 'radius' = radiusKm around the city centre */
  scope: 'governorate' | 'radius';
  cityId: number;
  radiusKm?: number;
  /** true = only count what would be imported (no writes) */
  dryRun?: boolean;
  /** fill empty phone/website/hours/coords on businesses we imported before */
  updateExisting?: boolean;
}

export interface ImportJob {
  id: string;
  status: 'running' | 'done' | 'failed';
  options: ImportOptions;
  startedAt: string;
  finishedAt: string | null;
  found: number;
  created: number;
  updated: number;
  skippedDuplicate: number;
  skippedNoName: number;
  byPreset: Record<string, { found: number; created: number }>;
  samples: { name: string; preset: string; city: string; phone: string | null }[];
  error: string | null;
  createdBy: string;
  progress?: { done: number; total: number; current: string | null };
  failedTiles?: number;
  stoppedEarly?: boolean;
  lastError?: string | null;
  note?: string | null;
}

const jobs = new Map<string, ImportJob>();
let running: string | null = null;

// ───────────── helpers ─────────────
const DAYS: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** Parses common OSM opening_hours ("24/7", "Mo-Fr 08:00-17:00; Sa 09:00-13:00; Su off"). Unknown → null. */
export const parseOpeningHours = (raw?: string) => {
  if (!raw) return null;
  const v = raw.trim();
  if (v === '24/7') return [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, openTime: null, closeTime: null, isClosed: false, isOpen24Hours: true }));
  const out = new Map<number, { dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean; isOpen24Hours: boolean }>();
  for (const part of v.split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^([A-Za-z,\- ]+)\s+(off|closed|[\d:,\- +]+)$/i) || part.match(/^()([\d:,\- +]+)$/);
    if (!m) return null;
    const dayExpr = m[1].trim() || 'Mo-Su';
    const days = new Set<number>();
    for (const tok of dayExpr.split(',').map((s) => s.trim())) {
      const [a, b] = tok.split('-').map((s) => s.trim().slice(0, 2));
      if (!(a in DAYS)) return null;
      if (!b) { days.add(DAYS[a]); continue; }
      if (!(b in DAYS)) return null;
      let i = ORDER.indexOf(a);
      for (let n = 0; n < 7; n++) { days.add(DAYS[ORDER[i]]); if (ORDER[i] === b) break; i = (i + 1) % 7; }
    }
    const timeExpr = m[2].trim().toLowerCase();
    if (timeExpr === 'off' || timeExpr === 'closed') { days.forEach((d) => out.set(d, { dayOfWeek: d, openTime: null, closeTime: null, isClosed: true, isOpen24Hours: false })); continue; }
    const ranges = timeExpr.split(',').map((r) => r.trim().match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\+?$/)).filter(Boolean) as RegExpMatchArray[];
    if (!ranges.length) return null;
    const pad = (s: string) => s.padStart(5, '0');
    const open = pad(ranges[0][1]);
    let close = pad(ranges[ranges.length - 1][2]);
    if (close === '24:00') close = '23:59';
    days.forEach((d) => out.set(d, { dayOfWeek: d, openTime: open, closeTime: close, isClosed: false, isOpen24Hours: open === '00:00' && close === '23:59' }));
  }
  if (!out.size) return null;
  // days not mentioned → closed
  for (let d = 0; d < 7; d++) if (!out.has(d)) out.set(d, { dayOfWeek: d, openTime: null, closeTime: null, isClosed: true, isOpen24Hours: false });
  return [...out.values()].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
};

const first = (...vals: (string | undefined)[]) => vals.find((v) => v && v.trim())?.split(';')[0].trim() || null;
const cut = (v: string | null, n: number) => (v ? v.slice(0, n) : null);
const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371e3, toR = (x: number) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

type OverpassData = { elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Tags }[] };

/** Optional proxy (OSM_PROXY=http://127.0.0.1:8080) — useful when the server can't reach Overpass directly. */
let dispatcher: unknown;
async function getDispatcher() {
  if (!env.osm.proxy) return undefined;
  if (!dispatcher) {
    const { ProxyAgent } = await import('undici');
    dispatcher = new ProxyAgent(env.osm.proxy);
  }
  return dispatcher;
}

const why = (e: unknown) => {
  const err = e as Error & { code?: string; cause?: { code?: string; message?: string } };
  return [...new Set([err.message, err.code, err.cause?.code, err.cause?.message].filter(Boolean))].join(' — ');
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RETRYABLE = new Set([429, 502, 503, 504]);

/**
 * Calls Overpass with fail-over between mirrors and exponential back-off (public servers are often "at capacity").
 * onWait reports what we're waiting for (shown in the admin UI).
 */
/**
 * HTTP call to Overpass. Without a proxy we use Node's https module and force IPv4 by default
 * (OSM_IP_FAMILY=4): on some networks IPv6 connects but then stalls until the server drops it after 60 s.
 */
async function httpCall(url: string, query: string, useGet: boolean, dispatcher?: unknown): Promise<{ ok: boolean; status: number; text: string }> {
  const qs = new URLSearchParams({ data: query }).toString();
  if (dispatcher) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 150_000);
    try {
      const res = await fetch(useGet ? `${url}?${qs}` : url, { method: useGet ? 'GET' : 'POST', ...(useGet ? {} : { body: qs, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }), signal: ctrl.signal, dispatcher } as RequestInit);
      return { ok: res.ok, status: res.status, text: await res.text() };
    } finally { clearTimeout(timer); }
  }
  const u = new URL(useGet ? `${url}?${qs}` : url);
  const lib = u.protocol === 'http:' ? await import('http') : await import('https');
  return new Promise((resolve, reject) => {
    const req = lib.request({
      protocol: u.protocol, hostname: u.hostname, port: u.port || undefined, path: u.pathname + u.search, method: useGet ? 'GET' : 'POST',
      family: env.osm.ipFamily || undefined,
      headers: { 'User-Agent': 'Dalilak-Directory/2 (OSM importer; +https://github.com)', Accept: 'application/json', ...(useGet ? {} : { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(qs) }) },
      timeout: 90_000,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve({ ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300, status: res.statusCode || 0, text: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
    const hard = setTimeout(() => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })), 75_000);
    req.on('close', () => clearTimeout(hard));
    req.on('error', reject);
    if (!useGet) req.write(qs);
    req.end();
  });
}

/** Mirrors that hung on this network (skipped for 15 min) */
const badHosts = new Map<string, number>();

async function overpass(query: string, onWait?: (msg: string) => void): Promise<OverpassData> {
  const errors: string[] = [];
  const d = await getDispatcher();
  let reachable = false;
  for (let round = 0; round < 6; round++) {
    const now = Date.now();
    let urls = env.osm.overpassUrls.filter((u) => (badHosts.get(new URL(u).host) || 0) < now);
    if (!urls.length) { badHosts.clear(); urls = env.osm.overpassUrls.slice(0, 1); }
    let busy = 0;
    let cutNow = 0;
    for (const url of urls) {
      const host = new URL(url).host;
      const t0 = Date.now();
      try {
        const useGet = query.length < 6000;
        const res = await httpCall(url, query, useGet, d);
        reachable = true;
        if (res.ok) return JSON.parse(res.text) as OverpassData;
        if (RETRYABLE.has(res.status)) busy++;
        const msg = `${host}: HTTP ${res.status}${RETRYABLE.has(res.status) ? ' (busy)' : ''}`;
        errors.push(msg);
        logger.warn(`[OSM] ${msg}`);
        if (!RETRYABLE.has(res.status)) throw new Error(msg);
      } catch (e) {
        if ((e as Error).message?.startsWith(host)) throw e;
        if (/UND_ERR_SOCKET|other side closed|ECONNRESET|ETIMEDOUT|aborted|socket hang up/i.test(why(e))) reachable = true;
        const secs = Math.round((Date.now() - t0) / 1000);
        errors.push(`${host}: ${why(e)} after ${secs}s`);
        logger.warn(`[OSM] ${url} failed after ${secs}s: ${why(e)}`);
        // connection dropped while the server was still working = the network cuts long requests
        if (secs >= 40 && /SOCKET|closed|ECONNRESET|ETIMEDOUT|aborted|hang up/i.test(why(e))) { reachable = true; cutNow++; badHosts.set(host, Date.now() + 15 * 60_000); }
      }
    }
    // every mirror hung and none even said "busy" → the network itself cuts us
    if (cutNow && cutNow === urls.length && !busy) {
      throw new Error(`Your network cuts long requests (~60s) before OpenStreetMap answers. Use "Around the city" with a smaller radius, fewer types, or "Import from file". Details: ${errors.slice(-2).join(' | ')}`);
    }
    if (!reachable && round >= 1) break; // nothing answers at all → don't wait forever
    const wait = Math.min(10_000 * 2 ** round, 90_000); // 10s, 20s, 40s, 80s, 90s
    onWait?.(`busy — retry in ${wait / 1000}s (attempt ${round + 2}/6)`);
    await sleep(wait);
  }
  throw new Error(reachable
    ? `OpenStreetMap servers are busy right now — try again in a few minutes or use "Import from file". Details: ${errors.slice(-3).join(' | ')}`
    : `Could not reach the OpenStreetMap servers from this server. Use "Import from file" instead, or set OSM_PROXY. Details: ${errors.slice(-3).join(' | ')}`);
}

/**
 * Small, fast query: "around" each target city (no heavy area lookup) + plain ["name"] filter.
 * Long-running queries get cut by some networks after ~30-60 s, so we keep each one light.
 */
export function buildQuery(o: Pick<ImportOptions, 'scope' | 'radiusKm'>, presets: Preset[], cities: City[]) {
  const r = Math.round(Math.min(Math.max(o.radiusKm || (o.scope === 'governorate' ? 12 : 10), 1), 60) * 1000);
  const body = cities
    .filter((c) => c.latitude != null && c.longitude != null)
    .flatMap((c) => presets.flatMap((p) => p.selectors.map((s) => `nwr(around:${r},${c.latitude},${c.longitude})${s}["name"];`)))
    .join('\n');
  return `[out:json][timeout:60];(\n${body}\n);out tags center qt 5000;`;
}

/** Small query for one circle (tile) with all selected types. */
export function tileQuery(lat: number, lng: number, radiusM: number, presets: Preset[]) {
  const body = presets.flatMap((p) => p.selectors.map((s) => `nwr(around:${radiusM},${lat.toFixed(5)},${lng.toFixed(5)})${s}["name"];`)).join('\n');
  return `[out:json][timeout:45];(\n${body}\n);out tags center qt 3000;`;
}

/**
 * Splits a big circle (radiusKm around a city) into small 3.5 km circles on a ~5 km grid,
 * so every request is tiny and finishes in a few seconds (works on networks that cut long requests).
 */
export function tilesFor(lat: number, lng: number, radiusKm: number) {
  const TILE = 3.5, STEP = 5;
  if (radiusKm <= 4.5) return [{ lat, lng, r: Math.round(radiusKm * 1000) }];
  const out: { lat: number; lng: number; r: number }[] = [];
  const dLat = STEP / 111.32, dLng = STEP / (111.32 * Math.cos((lat * Math.PI) / 180));
  const n = Math.ceil(radiusKm / STEP);
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    const km = Math.hypot(i * STEP, j * STEP);
    if (km <= radiusKm + TILE * 0.5) out.push({ lat: lat + i * dLat, lng: lng + j * dLng, r: TILE * 1000 });
  }
  return out;
}

/** Cities used for a job: the governorate's cities (scope=governorate) or just the chosen one. */
async function targetCities(o: Pick<ImportOptions, 'scope'>, city: City) {
  if (o.scope !== 'governorate') return [city];
  const gov = city.state || city.name;
  const list = (await repos.cities().find()).filter((c) => (c.state || c.name) === gov && c.latitude != null && c.longitude != null);
  return list.length ? list : [city];
}

export class OsmImportService {
  /** The Overpass query for these options — paste it in overpass-turbo.eu when the server has no access. */
  static async query(opts: Pick<ImportOptions, 'presets' | 'scope' | 'cityId' | 'radiusKm'>) {
    const presets = OSM_PRESETS.filter((p) => opts.presets.includes(p.key));
    if (!presets.length) throw AppError.badRequest('Pick at least one type to import');
    const city = await repos.cities().findOne({ where: { id: opts.cityId } });
    if (!city) throw AppError.badRequest('City not found');
    const query = buildQuery(opts, presets, await targetCities(opts, city));
    return { query, turboUrl: `https://overpass-turbo.eu/?Q=${encodeURIComponent(query)}&R` };
  }

  static presets() {
    return OSM_PRESETS.map(({ key, name, nameEn, category }) => ({ key, name, nameEn, category }));
  }

  static list() {
    return [...jobs.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 20);
  }

  static get(id: string) {
    const j = jobs.get(id);
    if (!j) throw AppError.notFound('Import job not found');
    return j;
  }

  /** Undo: delete unclaimed places imported from OSM in a city / its governorate (claimed or reviewed ones are kept). */
  static async removeImported(cityId: number, scope: 'city' | 'governorate', dryRun = false) {
    const city = await repos.cities().findOne({ where: { id: cityId } });
    if (!city) throw AppError.badRequest('City not found');
    const ids = scope === 'governorate' ? (await repos.cities().find()).filter((c) => (c.state || c.name) === (city.state || city.name)).map((c) => c.id) : [city.id];
    const list = await repos.businesses().find({ where: { source: BusinessSource.OSM, cityId: In(ids), ownerId: IsNull(), reviewCount: 0 }, select: ['id'] });
    if (!dryRun && list.length) {
      for (let i = 0; i < list.length; i += 200) await repos.businesses().delete(list.slice(i, i + 200).map((b) => b.id));
      await CacheService.invalidateCatalog();
    }
    return { count: list.length, deleted: !dryRun };
  }

  static async start(opts: ImportOptions, userId: string, provided?: OverpassData): Promise<ImportJob> {
    if (running) throw new AppError('Another import is running — wait for it to finish', 409, undefined, 'IMPORT_RUNNING');
    const presets = OSM_PRESETS.filter((p) => opts.presets.includes(p.key));
    if (!presets.length) throw AppError.badRequest('Pick at least one type to import');
    const city = await repos.cities().findOne({ where: { id: opts.cityId } });
    if (!city) throw AppError.badRequest('City not found');
    if (provided && !Array.isArray(provided.elements)) throw AppError.badRequest('Invalid file — export the result from Overpass Turbo as "raw OSM data" (JSON)');
    if (!provided && (city.latitude == null || city.longitude == null)) throw AppError.badRequest('This city has no coordinates — use governorate scope or add coordinates');

    const job: ImportJob = {
      id: randomUUID(), status: 'running', options: opts, startedAt: new Date().toISOString(), finishedAt: null,
      found: 0, created: 0, updated: 0, skippedDuplicate: 0, skippedNoName: 0, byPreset: {}, samples: [], error: null, createdBy: userId,
    };
    jobs.set(job.id, job);
    running = job.id;
    this.run(job, presets, city, provided)
      .catch((e) => { job.status = 'failed'; job.error = (e as Error).message; logger.error(`[OSM] job ${job.id} failed: ${(e as Error).message}`); })
      .finally(() => { running = null; job.finishedAt = new Date().toISOString(); if (job.status === 'running') job.status = 'done'; });
    return job;
  }

  private static async run(job: ImportJob, presets: Preset[], city: City, provided?: OverpassData) {
    const o = job.options;
    // ── target cities (the governorate's cities, used to assign each place to the nearest one)
    const gov = city.state || city.name;
    const allCities = await repos.cities().find();
    const targets = (o.scope === 'governorate' ? allCities.filter((c) => (c.state || c.name) === gov) : [city]).filter((c) => c.latitude != null && c.longitude != null);
    if (!targets.length) targets.push(city);

    // ── lookups
    const cats = await repos.categories().find({ relations: ['subCategories'] });
    const catBy = new Map(cats.map((c) => [c.nameEn, c]));
    const cityIds = targets.map((c) => c.id);
    const existing = await repos.businesses().find({ where: { cityId: In(cityIds) }, select: ['id', 'name', 'nameEn', 'latitude', 'longitude', 'osmId', 'source', 'phone', 'website'] });
    const byOsm = new Map(existing.filter((b) => b.osmId).map((b) => [b.osmId!, b]));
    const seenOsm = new Set<string>();

    // ── turn OSM elements into businesses (called per tile → progress is saved as we go)
    const ingest = async (elements: OverpassData['elements']) => {
      for (const el of elements) {
        const t = el.tags || {};
        const osmId = `${el.type}/${el.id}`;
        if (seenOsm.has(osmId)) continue;
        seenOsm.add(osmId);
        const preset = presets.find((p) => p.selectors.some((s) => matchesSelector(t, s)));
        if (!preset) continue;
        job.found++;
        const bp = (job.byPreset[preset.key] ||= { found: 0, created: 0 });
        bp.found++;

        const nameAr = first(t['name:ar'], t.name);
        const nameEn = first(t['name:en']);
        const name = nameAr || nameEn;
        if (!name) { job.skippedNoName++; continue; }
        const lat = el.lat ?? el.center?.lat ?? null;
        const lng = el.lon ?? el.center?.lon ?? null;
        const target = lat != null && lng != null ? targets.reduce((best, c) => (dist({ lat, lng }, { lat: c.latitude!, lng: c.longitude! }) < dist({ lat, lng }, { lat: best.latitude!, lng: best.longitude! }) ? c : best), targets[0]) : city;
        const phone = cut(first(t.phone, t['contact:phone'], t['contact:mobile'], t.mobile), 30);
        const website = cut(first(t.website, t['contact:website'], t.url), 255);
        const hours = parseOpeningHours(t.opening_hours);

        // ── duplicates
        const prev = byOsm.get(osmId);
        if (prev) {
          if (o.updateExisting && !o.dryRun && prev.source === BusinessSource.OSM) {
            const patch: Record<string, unknown> = {};
            if (!prev.phone && phone) patch.phone = phone;
            if (!prev.website && website) patch.website = website;
            if (prev.latitude == null && lat != null) Object.assign(patch, { latitude: lat, longitude: lng });
            if (Object.keys(patch).length) { await repos.businesses().update(prev.id, patch); job.updated++; }
            if (hours) { const n = await repos.hours().count({ where: { businessId: prev.id } }); if (!n) { await repos.hours().save(hours.map((h) => repos.hours().create({ ...h, businessId: prev.id }))); job.updated++; } }
          } else job.skippedDuplicate++;
          continue;
        }
        const norm = normalizeText(name);
        const twin = existing.find((b) => (normalizeText(b.name) === norm || (nameEn && b.nameEn && normalizeText(b.nameEn) === normalizeText(nameEn))) && (lat == null || b.latitude == null || dist({ lat, lng: lng! }, { lat: b.latitude, lng: b.longitude! }) < 150));
        if (twin) {
          if (!twin.osmId && !o.dryRun) { await repos.businesses().update(twin.id, { osmId }); twin.osmId = osmId; byOsm.set(osmId, twin); }
          job.skippedDuplicate++;
          continue;
        }

        const cat = catBy.get(preset.category);
        if (!cat) continue;
        const subName = preset.sub(t);
        const sub = subName ? cat.subCategories?.find((s) => s.nameEn === subName) : undefined;
        if (job.samples.length < 12) job.samples.push({ name, preset: preset.key, city: target.name, phone });
        if (o.dryRun) { job.created++; bp.created++; continue; }

        const social: Record<string, string> = {};
        const fb = first(t['contact:facebook'], t.facebook);
        const ig = first(t['contact:instagram'], t.instagram);
        if (fb) social.facebook = fb.startsWith('http') ? fb : `https://facebook.com/${fb}`;
        if (ig) social.instagram = ig.startsWith('http') ? ig : `https://instagram.com/${ig}`;
        const street = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
        const saved = await repos.businesses().save(repos.businesses().create({
          name: name.slice(0, 255), nameEn: nameEn && nameEn !== name ? nameEn.slice(0, 255) : (null as never),
          slug: await uniqueSlug(nameEn || name),
          categoryId: cat.id, subCategoryId: sub?.id ?? null, cityId: target.id,
          latitude: lat, longitude: lng,
          address: (cut(street || first(t['addr:full']), 500) as never) ?? undefined,
          district: (cut(first(t['addr:suburb'], t['addr:neighbourhood'], t['addr:quarter']), 150) as never) ?? undefined,
          phone: phone as never, whatsapp: cut(first(t['contact:whatsapp']), 30) as never, website: website as never, email: cut(first(t.email, t['contact:email']), 255) as never,
          socialLinks: Object.keys(social).length ? social : null,
          tags: [t.cuisine, t['healthcare:speciality']].filter(Boolean).join(',').replace(/;/g, ',').slice(0, 500) || (null as never),
          status: BusinessStatus.APPROVED, source: BusinessSource.OSM, osmId, ownerId: null, isActive: true, isVerified: false, approvedAt: new Date(),
        }));
        if (hours) await repos.hours().save(hours.map((h) => repos.hours().create({ ...h, businessId: saved.id })));
        await SearchIndexService.reindex(saved.id);
        existing.push(saved);
        byOsm.set(osmId, saved);
        job.created++;
        bp.created++;
          }
    };

    if (provided) await ingest(provided.elements);
    else {
      // many tiny "tile" queries (3.5 km circles) instead of one big one; a failed tile is skipped, not fatal
      const tc = (await targetCities(o, city)).filter((c) => c.latitude != null && c.longitude != null);
      const R = Math.min(Math.max(o.radiusKm || (o.scope === 'governorate' ? 12 : 8), 1), 40);
      const tiles = tc.flatMap((c) => tilesFor(c.latitude!, c.longitude!, R).map((t) => ({ ...t, city: c.name })));
      job.progress = { done: 0, total: tiles.length, current: null };
      job.failedTiles = 0;
      let failsInRow = 0;
      for (const t of tiles) {
        job.progress.current = t.city;
        job.note = null;
        try {
          const part = await overpass(tileQuery(t.lat, t.lng, t.r, presets), (msg) => { job.note = msg; });
          await ingest(part.elements);
          failsInRow = 0;
        } catch (err) {
          job.failedTiles++;
          failsInRow++;
          job.lastError = (err as Error).message;
          logger.warn(`[OSM] tile skipped (${t.city} ${t.lat.toFixed(3)},${t.lng.toFixed(3)}): ${(err as Error).message.slice(0, 160)}`);
          if (failsInRow >= 3) { job.stoppedEarly = true; break; }
        }
        job.progress.done++;
        await sleep(1000);
      }
      job.progress.current = null;
      job.note = null;
      if (job.failedTiles && !job.found) throw new Error(job.lastError || 'Import failed');
    }
    if (!o.dryRun && job.created) await CacheService.invalidateCatalog();
  }
}

/** Minimal matcher for the selector strings used above: ["k"="v"] or ["k"~"^(a|b)$"] */
function matchesSelector(t: Tags, sel: string) {
  const m = sel.match(/^\["([^"]+)"(=|~)"([^"]+)"\]$/);
  if (!m) return false;
  const [, k, op, v] = m;
  if (!(k in t)) return false;
  return op === '=' ? t[k] === v : new RegExp(v).test(t[k]);
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'place';
  let slug = base;
  for (let i = 2; ; i++) {
    if (!(await repos.businesses().findOne({ where: { slug }, select: ['id'] }))) return slug;
    slug = `${base}-${i}`;
  }
}
