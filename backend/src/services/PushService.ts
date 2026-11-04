import fs from 'fs';
import { In } from 'typeorm';
import { repos2 } from '../repositories';
import { env } from '../config/env';
import { logger } from '../config/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let messaging: any = null;
let initTried = false;

/**
 * Firebase Cloud Messaging. Optional: set FIREBASE_SERVICE_ACCOUNT and run `npm i firebase-admin`.
 * Without it, notifications are stored in-app only (GET /notifications).
 */
const init = () => {
  if (initTried) return messaging;
  initTried = true;
  if (!env.firebase.serviceAccount) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admin = require('firebase-admin');
    const raw = env.firebase.serviceAccount.trim().startsWith('{') ? env.firebase.serviceAccount : fs.readFileSync(env.firebase.serviceAccount, 'utf8');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    messaging = admin.messaging();
    logger.info('[Push] Firebase messaging enabled');
  } catch (e) {
    logger.warn(`[Push] disabled: ${(e as Error).message}`);
  }
  return messaging;
};

export class PushService {
  static async register(userId: string, token: string, platform = 'android', locale?: string) {
    const existing = await repos2.devices().findOne({ where: { token } });
    if (existing) {
      Object.assign(existing, { userId, platform, locale });
      return repos2.devices().save(existing);
    }
    return repos2.devices().save(repos2.devices().create({ userId, token, platform, locale }));
  }

  static async unregister(token: string) {
    await repos2.devices().delete({ token });
  }

  static async sendToUser(userId: string, title: string, body?: string, data?: Record<string, unknown>) {
    const m = init();
    if (!m) return;
    const devices = await repos2.devices().find({ where: { userId } });
    if (!devices.length) return;
    const strData = Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, String(v)]));
    try {
      const res = await m.sendEachForMulticast({ tokens: devices.map((d) => d.token), notification: { title, body: body || '' }, data: strData });
      const dead = res.responses.map((r: { success: boolean; error?: { code: string } }, i: number) => (!r.success && /registration-token-not-registered|invalid-argument/.test(r.error?.code || '') ? devices[i].token : null)).filter(Boolean);
      if (dead.length) await repos2.devices().delete({ token: In(dead) });
    } catch (e) {
      logger.warn(`[Push] send failed: ${(e as Error).message}`);
    }
  }
}
