const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../helpers/server');
const { closeDatabase } = require('../helpers/database');
const { createToken } = require('../../src/utils/jwt');

const USER_TOKEN = createToken({ id: '0b8f0c5e-3f6a-4d2b-9c1e-7a5d4e3f2a10', role: 'user' });

describe('app', () => {
  let server;

  before(async () => {
    server = await startServer();
  });

  after(async () => {
    server.close();
    await closeDatabase();
  });

  it('GET /api/health returns ok', async () => {
    const res = await server.request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('GET /api/health/db checks the database', async () => {
    const res = await server.request('/api/health/db');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('unknown routes return JSON 404', async () => {
    const res = await server.request('/api/unknown');
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'Route not found' });
  });

  it('protected routes require a token', async () => {
    const res = await server.request('/api/devices');
    assert.equal(res.status, 401);
  });

  it('rejects an id that is not a UUID', async () => {
    const res = await server.request('/api/user-devices/42', { token: USER_TOKEN });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: 'id must be a UUID' });
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await fetch(`${server.baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad',
    });
    assert.equal(res.status, 400);
  });

  it('serves Swagger UI without auth', async () => {
    const res = await fetch(`${server.baseUrl}/docs/`);
    assert.equal(res.status, 200);
  });
});
