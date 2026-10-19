const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../helpers/server');
const { resetDatabase, closeDatabase } = require('../helpers/database');
const { verifyToken } = require('../../src/utils/jwt');

const CREDENTIALS = { email: 'bob@example.com', password: 'secret123' };

describe('auth', () => {
  let server;

  before(async () => {
    server = await startServer();
  });

  beforeEach(resetDatabase);

  after(async () => {
    server.close();
    await closeDatabase();
  });

  it('signs up a user with role user, ignoring a role in the body', async () => {
    const res = await server.request('/api/auth/signup', { method: 'POST', body: { ...CREDENTIALS, role: 'admin' } });
    assert.equal(res.status, 201);
    assert.equal(res.body.email, CREDENTIALS.email);
    assert.equal(res.body.role, 'user');
    assert.equal(res.body.passwordHash, undefined);
  });

  it('rejects a duplicate email with 409', async () => {
    await server.request('/api/auth/signup', { method: 'POST', body: CREDENTIALS });
    const res = await server.request('/api/auth/signup', { method: 'POST', body: CREDENTIALS });
    assert.equal(res.status, 409);
  });

  it('signs in and returns a token for the user', async () => {
    const signup = await server.request('/api/auth/signup', { method: 'POST', body: CREDENTIALS });
    const res = await server.request('/api/auth/signin', { method: 'POST', body: CREDENTIALS });
    assert.equal(res.status, 200);
    assert.equal(verifyToken(res.body.token).sub, signup.body.id);
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    await server.request('/api/auth/signup', { method: 'POST', body: CREDENTIALS });
    const wrongPassword = await server.request('/api/auth/signin', {
      method: 'POST',
      body: { ...CREDENTIALS, password: 'wrong-password' },
    });
    const unknownEmail = await server.request('/api/auth/signin', {
      method: 'POST',
      body: { ...CREDENTIALS, email: 'nobody@example.com' },
    });
    assert.equal(wrongPassword.status, 401);
    assert.deepEqual(unknownEmail, wrongPassword);
  });
});
