const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../src/app');
const { createToken } = require('../src/utils/jwt');

const USER_TOKEN = createToken({ id: '0b8f0c5e-3f6a-4d2b-9c1e-7a5d4e3f2a10', role: 'user' });

let server;
let baseUrl;

function request(path, { token, headers = {}, ...options } = {}) {
  const authorization = token ? { Authorization: `Bearer ${token}` } : {};
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authorization, ...headers },
  });
}

describe('API without database', () => {
  before(() => {
    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(() => {
    server.close();
  });

  it('GET /api/health returns ok', async () => {
    const res = await request('/api/health');
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.status, 'ok');
  });

  it('unknown routes return JSON 404', async () => {
    const res = await request('/api/unknown');
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: 'Route not found' });
  });

  it('protected routes require a token', async () => {
    const res = await request('/api/devices');
    assert.equal(res.status, 401);
  });

  it('admin routes reject a normal user', async () => {
    const res = await request('/api/devices', { method: 'POST', token: USER_TOKEN, body: '{"name":"x"}' });
    assert.equal(res.status, 403);
  });

  it('rejects an id that is not a UUID', async () => {
    const res = await request('/api/user-devices/42', { token: USER_TOKEN });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'id must be a UUID' });
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request('/api/auth/signin', { method: 'POST', body: '{bad' });
    assert.equal(res.status, 400);
  });

  it('validates signup input before touching the database', async () => {
    const res = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'bob@example.com', password: 'short' }),
    });
    assert.equal(res.status, 400);
  });

  it('ingest requires X-Device-Key', async () => {
    const res = await request('/api/ingest', { method: 'POST', body: '{"temperature":21}' });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: 'Missing X-Device-Key header' });
  });

  it('serves Swagger UI without auth', async () => {
    const res = await fetch(`${baseUrl}/docs/`);
    assert.equal(res.status, 200);
  });
});
