/**
 * Creates / updates all tables from the entities ONE time (no migrations).
 * Use it for the first production deploy (keep DB_SYNCHRONIZE=false while the server runs),
 * or import schema.sql instead.
 *   npm run db:sync
 */
import 'reflect-metadata';
import '../config/env';
import { AppDataSource } from '../config/database';

(async () => {
  AppDataSource.setOptions({ synchronize: false });
  await AppDataSource.initialize();
  await AppDataSource.synchronize();
  console.log('✔ Database schema is in sync with entities');
  await AppDataSource.destroy();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
