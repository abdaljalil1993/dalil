import { getRedisClient } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../config/logger';

/** Redis cache with graceful fallback (no-op when Redis is disabled/unavailable). */
export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) return null;
    try {
      const raw = await client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      logger.warn(`[Cache] get ${key} failed`);
      return null;
    }
  }

  static async set(key: string, value: unknown, ttl = env.redis.ttl): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
      await client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch {
      logger.warn(`[Cache] set ${key} failed`);
    }
  }

  static async del(...keys: string[]): Promise<void> {
    const client = getRedisClient();
    if (!client || keys.length === 0) return;
    try {
      await client.del(...keys);
    } catch {
      /* ignore */
    }
  }

  /** Uses SCAN (non-blocking) instead of KEYS. */
  static async delByPattern(pattern: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
      let cursor = '0';
      do {
        const [next, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
        cursor = next;
        if (keys.length) await client.del(...keys);
      } while (cursor !== '0');
    } catch {
      /* ignore */
    }
  }

  static async remember<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  /** Invalidate everything that lists businesses (home, categories counts, cities counts...). */
  static async invalidateCatalog(): Promise<void> {
    await Promise.all([
      this.delByPattern('home:*'),
      this.delByPattern('categories:*'),
      this.delByPattern('cities:*'),
      this.delByPattern('business:*'),
      this.del('dashboard:stats'),
    ]);
  }
}
