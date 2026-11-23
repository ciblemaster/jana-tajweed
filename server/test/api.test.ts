import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { connect, migrate, type Db } from '../src/db';
import { checkPassword, hashPassword } from '../src/passwords';

// Runs against a real Postgres: set TEST_DATABASE_URL to a throwaway database.
const url = process.env.TEST_DATABASE_URL;
let db: Db;
let app: ReturnType<typeof createApp>;

const kid = { name: 'Jana', avatar: 'cat', band: 'young', progress: { surahs: { 1: { listen: true } }, days: ['2026-11-23'] } };

describe('passwords', () => {
  it('checks a password against its hash, and nothing else', async () => {
    const stored = await hashPassword('bismillah1');
    expect(stored).not.toContain('bismillah1');
    expect(await checkPassword('bismillah1', stored)).toBe(true);
    expect(await checkPassword('bismillah2', stored)).toBe(false);
    expect(await checkPassword('x', 'nonsense')).toBe(false);
  });
});

describe.skipIf(!url)('api', () => {
  beforeAll(async () => {
    db = connect(url);
    await db.query('DROP TABLE IF EXISTS children, parents, session CASCADE');
    await migrate(db);
    app = createApp(db, { secret: 'test' });
  });
  afterAll(async () => db?.end());

  it('signs up, keeps the grown-up signed in, and refuses the same email twice', async () => {
    const agent = request.agent(app);
    await agent.post('/api/signup').send({ email: 'Mum@example.com', password: 'short' }).expect(400);
    await agent.post('/api/signup').send({ email: 'Mum@example.com', password: 'long enough' }).expect(201);
    expect((await agent.get('/api/me').expect(200)).body.email).toBe('Mum@example.com');
    await request(app).post('/api/signup').send({ email: 'mum@example.com', password: 'long enough' }).expect(409);
    await agent.post('/api/logout').expect(200);
    await agent.get('/api/me').expect(401);
  });

  it('logs in with any letter case, and not with a wrong password', async () => {
    await request(app).post('/api/login').send({ email: 'mum@example.com', password: 'wrong one!' }).expect(401);
    const agent = request.agent(app);
    await agent.post('/api/login').send({ email: 'MUM@example.com', password: 'long enough' }).expect(200);
    await agent.get('/api/me').expect(200);
  });

  it('keeps children per family, so the same id in two families never mixes', async () => {
    const mum = request.agent(app);
    await mum.post('/api/login').send({ email: 'mum@example.com', password: 'long enough' }).expect(200);
    const dad = request.agent(app);
    await dad.post('/api/signup').send({ email: 'dad@example.com', password: 'long enough' }).expect(201);

    await mum.put('/api/children/abc123').send(kid).expect(200);
    await dad.put('/api/children/abc123').send({ ...kid, name: 'Yusuf' }).expect(200);
    const mine = (await mum.get('/api/children').expect(200)).body;
    expect(mine.children).toHaveLength(1);
    expect(mine.children[0]).toMatchObject({ id: 'abc123', name: 'Jana', progress: kid.progress });
    expect((await dad.get('/api/children')).body.children[0].name).toBe('Yusuf');
    await request(app).get('/api/children').expect(401);
  });

  it('checks what a child is saved with', async () => {
    const mum = request.agent(app);
    await mum.post('/api/login').send({ email: 'mum@example.com', password: 'long enough' });
    await mum.put('/api/children/abc123').send({ ...kid, avatar: 'dragon' }).expect(400);
    await mum.put('/api/children/abc123').send({ ...kid, name: '' }).expect(400);
    await mum.put('/api/children/abc123').send({ ...kid, progress: [] }).expect(400);
    await mum.put('/api/children/a!b').send(kid).expect(400);
    await mum.put('/api/children/abc123').send({ ...kid, progress: { big: 'x'.repeat(300_000) } }).expect(413);
  });

  it('allows five children, and a removed child stays removed on every device', async () => {
    const mum = request.agent(app);
    await mum.post('/api/login').send({ email: 'mum@example.com', password: 'long enough' });
    for (const id of ['k2', 'k3', 'k4', 'k5']) await mum.put(`/api/children/${id}`).send(kid).expect(200);
    await mum.put('/api/children/k6').send(kid).expect(409);
    await mum.delete('/api/children/k5').expect(200);
    await mum.put('/api/children/k5').send(kid).expect(410);
    const list = (await mum.get('/api/children')).body;
    expect(list.children.map((c: { id: string }) => c.id)).not.toContain('k5');
    expect(list.removed).toEqual(['k5']);
    const row = await db.query("SELECT name, progress FROM children WHERE id = 'k5'");
    expect(row.rows[0]).toEqual({ name: '', progress: {} });
    await mum.put('/api/children/k6').send(kid).expect(200);
  });

  it('deletes the account and all its children', async () => {
    const dad = request.agent(app);
    await dad.post('/api/login').send({ email: 'dad@example.com', password: 'long enough' }).expect(200);
    await dad.delete('/api/me').expect(200);
    await dad.get('/api/me').expect(401);
    await request(app).post('/api/login').send({ email: 'dad@example.com', password: 'long enough' }).expect(401);
    expect((await db.query("SELECT 1 FROM children WHERE name = 'Yusuf'")).rowCount).toBe(0);
  });

  it('slows down guessing after ten wrong passwords', async () => {
    for (let i = 0; i < 10; i++) await request(app).post('/api/login').send({ email: 'mum@example.com', password: `guess ${i}!` }).expect(401);
    await request(app).post('/api/login').send({ email: 'mum@example.com', password: 'long enough' }).expect(429);
  });
});
