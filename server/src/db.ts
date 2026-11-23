import { readFileSync } from 'node:fs';
import pg from 'pg';

export type Db = pg.Pool;

export function connect(url = process.env.DATABASE_URL): Db {
  if (!url) throw new Error('DATABASE_URL is not set');
  return new pg.Pool({ connectionString: url, max: 10 });
}

/** Creates the tables if they are missing. */
export async function migrate(db: Db) {
  await db.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
}
