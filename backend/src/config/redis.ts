import Redis from 'ioredis';
import { logger } from './logger';
import { env } from './env';

let redisClient: Redis | null = null;
let redisReady = false;

export const isRedisReady = (): boolean => env.redis.enabled && redisReady && redisClient !== null;

export const getRedisClient = (): Redis | null => (isRedisReady() ? redisClient : null);

export const connectRedis = async (): Promise<boolean> => {
  if (!env.redis.enabled) {
    logger.info('[Redis] Disabled (REDIS_ENABLED=false) - running without cache');
    return false;
  }
  try {
    redisClient = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password,
      db: env.redis.db,
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy: (times: number) => (times > 5 ? null : Math.min(times * 300, 3000)),
    });
    redisClient.on('ready', () => {
      redisReady = true;
      logger.info('[Redis] Ready');
    });
    redisClient.on('error', (err) => logger.warn(`[Redis] ${err.message}`));
    redisClient.on('end', () => {
      redisReady = false;
    });
    await redisClient.connect();
    redisReady = true;
    return true;
  } catch (err) {
    logger.warn('[Redis] Connection failed; continuing without cache');
    redisReady = false;
    return false;
  }
};
