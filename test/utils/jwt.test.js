const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { createToken, verifyToken } = require('../../src/utils/jwt');

const USER = { id: '0b8f0c5e-3f6a-4d2b-9c1e-7a5d4e3f2a10', role: 'user' };
const ONE_HOUR_SECONDS = 60 * 60;

describe('createToken and verifyToken', () => {
  it('puts the user id and role in the payload', () => {
    const payload = verifyToken(createToken(USER));
    assert.equal(payload.sub, USER.id);
    assert.equal(payload.role, USER.role);
  });

  it('expires after 1 hour', () => {
    const payload = verifyToken(createToken(USER));
    assert.equal(payload.exp - payload.iat, ONE_HOUR_SECONDS);
  });

  it('rejects a token signed with another secret', () => {
    const token = jwt.sign({ sub: USER.id, role: 'admin' }, 'another-secret');
    assert.throws(() => verifyToken(token), { name: 'JsonWebTokenError' });
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ sub: USER.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: -1 });
    assert.throws(() => verifyToken(token), { name: 'TokenExpiredError' });
  });
});
