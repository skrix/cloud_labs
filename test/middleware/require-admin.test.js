const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { requireAdmin } = require('../../src/middleware/require-admin');

describe('requireAdmin', () => {
  it('lets an admin through', (t) => {
    const next = t.mock.fn();
    requireAdmin({ user: { id: 'u1', role: 'admin' } }, {}, next);
    assert.equal(next.mock.callCount(), 1);
  });

  it('rejects a normal user with 403', () => {
    assert.throws(() => requireAdmin({ user: { id: 'u1', role: 'user' } }, {}, () => {}), { status: 403 });
  });
});
