import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './app';
import { connect, migrate } from './db';

const production = process.env.NODE_ENV === 'production';
const secret = process.env.SESSION_SECRET ?? (production ? '' : 'dev-only-secret');
if (!secret) throw new Error('SESSION_SECRET is not set');

const db = connect();
await migrate(db);
const app = createApp(db, { secret, secure: production, speechUrl: process.env.SPEECH_URL });

// In production the same server hands out the built app, so the cookie stays on one site.
const dist = fileURLToPath(new URL('../../dist', import.meta.url));
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(`${dist}/index.html`));
}

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => console.log(`Jana Tajweed server on http://localhost:${port}`));
