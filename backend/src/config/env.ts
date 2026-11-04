import dotenv from 'dotenv';

dotenv.config();

const bool = (v: string | undefined, def = false): boolean => {
  if (v === undefined || v === '') return def;
  return ['true', '1', 'yes', 'on'].includes(v.toLowerCase());
};

const int = (v: string | undefined, def: number): number => {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : def;
};

const isProduction = process.env.NODE_ENV === 'production';

const requireInProd = (key: string, fallback: string): string => {
  const value = process.env[key];
  if (!value || value.startsWith('change_this')) {
    if (isProduction) {
      throw new Error(`[env] ${key} must be set to a strong value in production`);
    }
    return fallback;
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: int(process.env.PORT, 5000),
  appName: process.env.APP_NAME || 'Dalilak',
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${int(process.env.PORT, 5000)}`).replace(/\/$/, ''),
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:4173').replace(/\/$/, ''),
  timezone: process.env.APP_TIMEZONE || 'Asia/Damascus',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: int(process.env.DB_PORT, 3306),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'dalilak',
    logging: bool(process.env.DB_LOGGING),
    // No migrations: run `npm run db:sync` after pulling schema changes (or import database/schema.sql).
    // Auto-sync on every start is OFF by default: on MariaDB it rebuilds JSON columns and can wipe their data.
    synchronize: bool(process.env.DB_SYNCHRONIZE, false),
  },

  jwt: {
    accessSecret: requireInProd('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
    refreshSecret: requireInProd('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  redis: {
    enabled: bool(process.env.REDIS_ENABLED, false),
    host: process.env.REDIS_HOST || 'localhost',
    port: int(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: int(process.env.REDIS_DB, 0),
    ttl: int(process.env.REDIS_CACHE_TTL, 600),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: int(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Dalilak <no-reply@dalilak.app>',
  },

  sms: {
    /** log = print the code (dev) · http = call SMS_HTTP_URL (any SMS/WhatsApp gateway) */
    provider: (process.env.SMS_PROVIDER || 'log') as 'log' | 'http',
    httpUrl: process.env.SMS_HTTP_URL || '', // e.g. https://gateway/send?to={phone}&text={message}&key=XXX
    httpMethod: (process.env.SMS_HTTP_METHOD || 'GET').toUpperCase(),
    httpBody: process.env.SMS_HTTP_BODY || '', // JSON template for POST, e.g. {"to":"{phone}","text":"{message}"}
    otpTtlMinutes: int(process.env.OTP_TTL_MINUTES, 5),
  },

  osm: {
    /** Overpass API endpoints (first that answers wins). Free; data © OpenStreetMap contributors (ODbL). */
    overpassUrls: (process.env.OVERPASS_URLS || 'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass.private.coffee/api/interpreter')
      .split(',').map((s) => s.trim()).filter(Boolean),
  },

  firebase: {
    /** Path to a Firebase service-account JSON (or the JSON itself). Requires `npm i firebase-admin`. */
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || '',
  },

  corsOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:4173,http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, ''))
    .filter(Boolean),

  rateLimit: {
    globalPer15Min: int(process.env.RATE_LIMIT_GLOBAL, 1500),
    authPer15Min: int(process.env.RATE_LIMIT_AUTH, 20),
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
