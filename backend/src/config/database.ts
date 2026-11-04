import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { logger } from './logger';
import { entities } from '../entities';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: env.db.synchronize,
  migrationsRun: false,
  logging: env.db.logging,
  entities,
  charset: 'utf8mb4_unicode_ci',
  timezone: 'Z',
  extra: { connectionLimit: 20 },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info(`[Database] Connected (synchronize=${env.db.synchronize})`);
  } catch (error) {
    logger.error('[Database] Failed to connect', { error: (error as Error).message });
    throw error;
  }
};
