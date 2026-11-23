import connectPg from 'connect-pg-simple';
import express, { type NextFunction, type Request, type Response } from 'express';
import session from 'express-session';
import type { Db } from './db';
import { checkPassword, hashPassword } from './passwords';

declare module 'express-session' {
  interface SessionData {
    parentId: string;
  }
}

// The same lists as the app's profiles store.
const AVATARS = ['cat', 'rabbit', 'bird', 'fish', 'turtle', 'squirrel', 'dog', 'snail'];
const BANDS = ['little', 'young', 'junior'];
const MAX_CHILDREN = 5;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Options {
  /** Signs the session cookie. Required in production. */
  secret: string;
  /** Sends the cookie over HTTPS only. */
  secure?: boolean;
}

/** Ten wrong passwords for an address in fifteen minutes, and it waits. Kept in memory: one server process. */
function limiter() {
  const fails = new Map<string, { count: number; since: number }>();
  const WINDOW = 15 * 60 * 1000;
  return {
    blocked(key: string) {
      const f = fails.get(key);
      if (f && Date.now() - f.since > WINDOW) fails.delete(key);
      return (fails.get(key)?.count ?? 0) >= 10;
    },
    fail(key: string) {
      const f = fails.get(key) ?? { count: 0, since: Date.now() };
      fails.set(key, { ...f, count: f.count + 1 });
    },
    clear(key: string) {
      fails.delete(key);
    }
  };
}

const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

function signedIn(req: Request, res: Response, next: NextFunction) {
  if (!req.session.parentId) return void res.status(401).json({ error: 'signed_out' });
  next();
}

interface ChildRow {
  id: string;
  name: string;
  avatar: string;
  band: string;
  progress: unknown;
  updated_at: Date;
}

const childJson = (c: ChildRow) => ({ id: c.id, name: c.name, avatar: c.avatar, band: c.band, progress: c.progress, updatedAt: c.updated_at.toISOString() });

export function createApp(db: Db, options: Options) {
  const app = express();
  const PgStore = connectPg(session);
  const tries = limiter();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '256kb' }));
  app.use(
    '/api',
    session({
      store: new PgStore({ pool: db, createTableIfMissing: true }),
      name: 'jana.sid',
      secret: options.secret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: { httpOnly: true, sameSite: 'lax', secure: !!options.secure, maxAge: 180 * 24 * 3600 * 1000 }
    })
  );

  const start = (req: Request, parentId: string) =>
    new Promise<void>((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : ((req.session.parentId = parentId), resolve()))));

  app.post(
    '/api/signup',
    wrap(async (req, res) => {
      const email = String(req.body?.email ?? '').trim();
      const password = String(req.body?.password ?? '');
      if (!EMAIL.test(email) || email.length > 200) return res.status(400).json({ error: 'bad_email' });
      if (password.length < 8 || password.length > 200) return res.status(400).json({ error: 'short_password' });
      const taken = await db.query('SELECT 1 FROM parents WHERE lower(email) = lower($1)', [email]);
      if (taken.rowCount) return res.status(409).json({ error: 'email_taken' });
      const { rows } = await db.query<{ id: string }>('INSERT INTO parents (email, password) VALUES ($1, $2) RETURNING id', [email, await hashPassword(password)]);
      await start(req, rows[0].id);
      res.status(201).json({ email });
    })
  );

  app.post(
    '/api/login',
    wrap(async (req, res) => {
      const email = String(req.body?.email ?? '').trim();
      const password = String(req.body?.password ?? '');
      const key = email.toLowerCase();
      if (tries.blocked(key)) return res.status(429).json({ error: 'too_many' });
      const { rows } = await db.query<{ id: string; email: string; password: string }>('SELECT id, email, password FROM parents WHERE lower(email) = lower($1)', [email]);
      if (!rows[0] || !(await checkPassword(password, rows[0].password))) {
        tries.fail(key);
        return res.status(401).json({ error: 'wrong_login' });
      }
      tries.clear(key);
      await start(req, rows[0].id);
      res.json({ email: rows[0].email });
    })
  );

  app.post('/api/logout', (req, res, next) => req.session.destroy((err) => (err ? next(err) : res.clearCookie('jana.sid').json({ ok: true }))));

  app.get(
    '/api/me',
    signedIn,
    wrap(async (req, res) => {
      const { rows } = await db.query<{ email: string }>('SELECT email FROM parents WHERE id = $1', [req.session.parentId]);
      if (!rows[0]) return res.status(401).json({ error: 'signed_out' });
      res.json({ email: rows[0].email });
    })
  );

  /** Deletes the account and every child's data, for good. */
  app.delete(
    '/api/me',
    signedIn,
    wrap(async (req, res) => {
      await db.query('DELETE FROM parents WHERE id = $1', [req.session.parentId]);
      await new Promise<void>((resolve) => req.session.destroy(() => resolve()));
      res.clearCookie('jana.sid').json({ ok: true });
    })
  );

  /** The family's children with their progress; `removed` lists the ids taken away on another device. */
  app.get(
    '/api/children',
    signedIn,
    wrap(async (req, res) => {
      const { rows } = await db.query<ChildRow & { deleted_at: Date | null }>(
        'SELECT id, name, avatar, band, progress, updated_at, deleted_at FROM children WHERE parent_id = $1 ORDER BY updated_at',
        [req.session.parentId]
      );
      res.json({ children: rows.filter((c) => !c.deleted_at).map(childJson), removed: rows.filter((c) => c.deleted_at).map((c) => c.id) });
    })
  );

  /** Saves a child as the app has them, progress already merged with what the server had. */
  app.put(
    '/api/children/:id',
    signedIn,
    wrap(async (req, res) => {
      const id = req.params.id;
      const { name, avatar, band, progress } = req.body ?? {};
      if (!/^[a-z0-9]{1,32}$/i.test(id)) return res.status(400).json({ error: 'bad_id' });
      if (typeof name !== 'string' || !name.trim() || name.length > 24) return res.status(400).json({ error: 'bad_name' });
      if (!AVATARS.includes(avatar) || !BANDS.includes(band)) return res.status(400).json({ error: 'bad_profile' });
      if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return res.status(400).json({ error: 'bad_progress' });

      const had = await db.query<{ deleted_at: Date | null }>('SELECT deleted_at FROM children WHERE parent_id = $1 AND id = $2', [req.session.parentId, id]);
      if (had.rows[0]?.deleted_at) return res.status(410).json({ error: 'removed' });
      if (!had.rowCount) {
        const count = await db.query('SELECT 1 FROM children WHERE parent_id = $1 AND deleted_at IS NULL', [req.session.parentId]);
        if ((count.rowCount ?? 0) >= MAX_CHILDREN) return res.status(409).json({ error: 'too_many_children' });
      }
      const { rows } = await db.query<ChildRow>(
        `INSERT INTO children (parent_id, id, name, avatar, band, progress) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (parent_id, id) DO UPDATE SET name = $3, avatar = $4, band = $5, progress = $6, updated_at = now()
         RETURNING id, name, avatar, band, progress, updated_at`,
        [req.session.parentId, id, name.trim(), avatar, band, JSON.stringify(progress)]
      );
      res.json(childJson(rows[0]));
    })
  );

  /** Removes a child: their progress is wiped and only the id is kept, so other devices remove them too. */
  app.delete(
    '/api/children/:id',
    signedIn,
    wrap(async (req, res) => {
      await db.query(
        `INSERT INTO children (parent_id, id, name, avatar, band, deleted_at) VALUES ($1, $2, '', '', '', now())
         ON CONFLICT (parent_id, id) DO UPDATE SET name = '', avatar = '', band = '', progress = '{}'::jsonb, deleted_at = now()`,
        [req.session.parentId, req.params.id]
      );
      res.json({ ok: true });
    })
  );

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if ((err as { type?: string }).type === 'entity.too.large') return res.status(413).json({ error: 'too_large' });
    if ((err as { type?: string }).type === 'entity.parse.failed') return res.status(400).json({ error: 'bad_json' });
    console.error(err);
    res.status(500).json({ error: 'server' });
  });
  return app;
}
