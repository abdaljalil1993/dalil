import { logger } from '../config/logger';
import { AuthService } from '../services/AuthService';
import { PromotionService } from '../services/PromotionService';
import { BillingService } from '../services/BillingService';
import { ListingService } from '../services/ListingService';
import { RequestService } from '../services/RequestService';

const timers: NodeJS.Timeout[] = [];

const every = (name: string, ms: number, fn: () => Promise<void>, runNow = false) => {
  const run = () => fn().catch((e) => logger.warn(`[Job:${name}] ${(e as Error).message}`));
  if (runNow) run();
  timers.push(setInterval(run, ms));
};

/** Lightweight in-process jobs (no extra infra needed). */
export const startJobs = (): void => {
  every('promotions-sync', 5 * 60 * 1000, PromotionService.syncFeaturedFlags, true);
  every('token-cleanup', 6 * 60 * 60 * 1000, AuthService.cleanupTokens);
  every('subscriptions', 60 * 60 * 1000, BillingService.expireAndRemind, true);
  every('listings-expiry', 60 * 60 * 1000, ListingService.expire, true);
  every('requests-expiry', 60 * 60 * 1000, RequestService.expire, true);
};

export const stopJobs = (): void => timers.forEach(clearInterval);
