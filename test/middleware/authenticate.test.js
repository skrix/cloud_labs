const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { authenticate } = require('../../src/middleware/authenticate');
const { createToken } = require('../../src/utils/jwt');

function requestWithAuthorization(value) {
  return { get: (name) => (name === 'Authorization' ? value : undefined) };
}

describe('authenticate', () => {
  it('sets req.user from a valid token', (t) => {
    const next = t.mock.fn();
    const req = requestWithAuthorization(`Bearer ${createToken({ id: 'user-1', role: 'admin' })}`);

    authenticate(req, {}, next);

    assert.deepEqual(req.user, { id: 'user-1', role: 'admin' });
    assert.equal(next.mock.callCount(), 1);
  });

  it('rejects a missing header', () => {
    assert.throws(() => authenticate(requestWithAuthorization(undefined), {}, () => {}), {
      status: 401,
      message: 'Missing bearer token',
    });
  });

  it('rejects another scheme', () => {
    assert.throws(() => authenticate(requestWithAuthorization('Basic abc'), {}, () => {}), { status: 401 });
  });

  it('rejects an invalid token', () => {
    assert.throws(() => authenticate(requestWithAuthorization('Bearer not-a-jwt'), {}, () => {}), {
      status: 401,
      message: 'Invalid or expired token',
    });
  });
});
