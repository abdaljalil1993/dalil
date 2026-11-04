/**
 * Creates / updates all tables from the entities (no migrations) — SAFE for MySQL and MariaDB.
 *   npm run db:sync
 *
 * Why not TypeORM's plain synchronize()? On MariaDB a JSON column is reported as LONGTEXT, so TypeORM
 * thinks it changed and runs "DROP COLUMN x; ADD x json" on every sync → the column's data is lost.
 * Here we take TypeORM's planned queries and turn every DROP+ADD pair of the same column into a single
 * "MODIFY" (keeps the data). Everything else runs as planned.
 *   npm run db:sync -- --dry   → print the SQL without running it
 */
import 'reflect-metadata';
import '../config/env';
import { AppDataSource } from '../config/database';

const DROP_RE = /^ALTER TABLE `([^`]+)` DROP COLUMN `([^`]+)`$/;
const ADD_RE = /^ALTER TABLE `([^`]+)` ADD `([^`]+)` (.+)$/s;

export async function safeSync(dry = false) {
  const plan = await AppDataSource.driver.createSchemaBuilder().log();
  const queries = plan.upQueries.map((q) => q.query);
  const adds = new Map<string, string>();
  queries.forEach((q) => { const m = q.match(ADD_RE); if (m) adds.set(`${m[1]}.${m[2]}`, m[3]); });

  const out: string[] = [];
  const skipAdd = new Set<string>();
  for (const q of queries) {
    const d = q.match(DROP_RE);
    if (d && adds.has(`${d[1]}.${d[2]}`)) {
      out.push(`ALTER TABLE \`${d[1]}\` MODIFY \`${d[2]}\` ${adds.get(`${d[1]}.${d[2]}`)}`);
      skipAdd.add(`${d[1]}.${d[2]}`);
      continue;
    }
    const a = q.match(ADD_RE);
    if (a && skipAdd.has(`${a[1]}.${a[2]}`)) continue;
    out.push(q);
  }

  if (dry) { out.forEach((q) => console.log(`${q};`)); return out.length; }
  const runner = AppDataSource.createQueryRunner();
  try {
    for (const q of out) await runner.query(q);
  } finally {
    await runner.release();
  }
  return out.length;
}

if (require.main === module) {
  (async () => {
    const dry = process.argv.includes('--dry');
    AppDataSource.setOptions({ synchronize: false });
    await AppDataSource.initialize();
    const n = await safeSync(dry);
    console.log(dry ? `ℹ ${n} statements (dry run, nothing changed)` : `✔ Database schema is in sync with entities (${n} statements, data kept)`);
    await AppDataSource.destroy();
    process.exit(0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
