import 'reflect-metadata';
import { env } from './config/env';
import app from './app';
import { AppDataSource, initializeDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { initCloudinary } from './config/cloudinary';
import { logger } from './config/logger';
import { startJobs, stopJobs } from './jobs/scheduler';

const bootstrap = async (): Promise<void> => {
  await initializeDatabase();
  await connectRedis();
  logger.info(initCloudinary() ? '[Storage] Cloudinary enabled' : '[Storage] Cloudinary not configured - using local /uploads');
  startJobs();

  const server = app.listen(env.port, () => {
    logger.info(`[Server] ${env.appName} API on http://localhost:${env.port} (${env.nodeEnv})`);
    logger.info(`[Server] Docs: http://localhost:${env.port}/api/v1/docs`);
  });

  const shutdown = (signal: string) => {
    logger.info(`[Server] ${signal} - shutting down`);
    stopJobs();
    server.close(async () => {
      await AppDataSource.destroy().catch(() => undefined);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error('[Server] Unhandled rejection', { reason }));
};

bootstrap().catch((err) => {
  logger.error('[Server] Bootstrap failed', { error: (err as Error).message });
  process.exit(1);
});
