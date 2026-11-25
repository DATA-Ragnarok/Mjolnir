import request from 'supertest';
import { connectTestDB, clearTestDB, closeTestDB } from './testHelper.js';
import { jest } from '@jest/globals';

const mockUserPayload = { sub: 'test-google-id-1', email: 'admin@example.com', name: 'Admin User' };

jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockImplementation(async () => ({ getPayload: () => mockUserPayload })),
  })),
}));

const { app } = await import('../index.js');

describe('Agent device-code auth & skills', () => {
  let webToken: string;

  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await closeTestDB(); });

  beforeEach(async () => {
    await clearTestDB();
    const res = await request(app).post('/api/auth/google').send({ idToken: 'fake' });
    webToken = res.body.token;
  });

  const startAndApprove = async () => {
    const start = await request(app).post('/api/agent/auth/device');
    await request(app).post('/api/agent/auth/approve')
      .set('Authorization', `Bearer ${webToken}`).send({ code: start.body.userCode });
    const poll = await request(app).post('/api/agent/auth/token').send({ deviceCode: start.body.deviceCode });
    return { start: start.body, poll };
  };

  it('starts device flow and reports pending until approved', async () => {
    const start = await request(app).post('/api/agent/auth/device');
    expect(start.status).toBe(201);
    expect(start.body.userCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(start.body.verifyUrl).toContain(`/agent/auth?code=${start.body.userCode}`);

    const poll = await request(app).post('/api/agent/auth/token').send({ deviceCode: start.body.deviceCode });
    expect(poll.status).toBe(202);
  });

  it('issues an 8h agent token after approval, only once', async () => {
    const { start, poll } = await startAndApprove();
    expect(poll.status).toBe(200);
    const ttl = new Date(poll.body.expiresAt).getTime() - Date.now();
    expect(ttl).toBeGreaterThan(7.9 * 3600 * 1000);
    expect(ttl).toBeLessThanOrEqual(8 * 3600 * 1000);

    const again = await request(app).post('/api/agent/auth/token').send({ deviceCode: start.deviceCode });
    expect(again.status).toBe(410);
  });

  it('requires a logged-in web user to approve', async () => {
    const start = await request(app).post('/api/agent/auth/device');
    const res = await request(app).post('/api/agent/auth/approve').send({ code: start.body.userCode });
    expect(res.status).toBe(401);
  });

  it('returns 410 when denied and 404 for unknown codes', async () => {
    const start = await request(app).post('/api/agent/auth/device');
    const deny = await request(app).post('/api/agent/auth/deny')
      .set('Authorization', `Bearer ${webToken}`).send({ code: start.body.userCode });
    expect(deny.status).toBe(200);
    const poll = await request(app).post('/api/agent/auth/token').send({ deviceCode: start.body.deviceCode });
    expect(poll.status).toBe(410);
    expect(poll.body.status).toBe('denied');

    const bad = await request(app).post('/api/agent/auth/approve')
      .set('Authorization', `Bearer ${webToken}`).send({ code: 'ZZZZ-ZZZZ' });
    expect(bad.status).toBe(404);
  });

  it('agent token works on /api/agent/* but not on web routes', async () => {
    const { poll } = await startAndApprove();
    const token = poll.body.token;

    const me = await request(app).get('/api/agent/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('admin@example.com');

    const web = await request(app).get('/api/epics').set('Authorization', `Bearer ${token}`);
    expect(web.status).toBe(401);
  });

  it('rejects the web session JWT on agent routes', async () => {
    const res = await request(app).get('/api/agent/me').set('Authorization', `Bearer ${webToken}`);
    expect(res.status).toBe(401);
  });

  it('revokes a token', async () => {
    const { poll } = await startAndApprove();
    const token = poll.body.token;
    const rev = await request(app).post('/api/agent/auth/revoke').set('Authorization', `Bearer ${token}`);
    expect(rev.status).toBe(200);
    const me = await request(app).get('/api/agent/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(401);
  });

  it('lists and revokes sessions from the web UI', async () => {
    const { poll } = await startAndApprove();
    const list = await request(app).get('/api/agent/auth/sessions').set('Authorization', `Bearer ${webToken}`);
    expect(list.body).toHaveLength(1);
    const del = await request(app).delete(`/api/agent/auth/sessions/${list.body[0].id}`)
      .set('Authorization', `Bearer ${webToken}`);
    expect(del.status).toBe(200);
    const me = await request(app).get('/api/agent/me').set('Authorization', `Bearer ${poll.body.token}`);
    expect(me.status).toBe(401);
    const after = await request(app).get('/api/agent/auth/sessions').set('Authorization', `Bearer ${webToken}`);
    expect(after.body).toHaveLength(0);
  });

  it('serves skills with ETag, filters by name, requires auth', async () => {
    const noAuth = await request(app).get('/api/agent/skills');
    expect(noAuth.status).toBe(401);

    const { poll } = await startAndApprove();
    const auth = { Authorization: `Bearer ${poll.body.token}` };
    const all = await request(app).get('/api/agent/skills').set(auth);
    expect(all.status).toBe(200);
    expect(all.body.skills.map((s: { name: string }) => s.name).sort()).toEqual(['overview', 'planning', 'stories']);

    const cached = await request(app).get('/api/agent/skills').set(auth).set('If-None-Match', all.headers['etag'] as string);
    expect(cached.status).toBe(304);

    const one = await request(app).get('/api/agent/skills?name=stories').set(auth);
    expect(one.body.skills).toHaveLength(1);
    const missing = await request(app).get('/api/agent/skills?name=nope').set(auth);
    expect(missing.status).toBe(404);
  });

  it('serves the public bootstrap skill file', async () => {
    const res = await request(app).get('/api/agent/bootstrap-skill');
    expect(res.status).toBe(200);
    expect(res.text).toContain('MJOLNIR_URL');
    expect(res.text).not.toContain('{{BASE_URL}}');
  });
});
