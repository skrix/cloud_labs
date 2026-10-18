const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateIdParam } = require('../../src/middleware/validate-id');

describe('validateIdParam', () => {
  it('calls next for a UUID', (t) => {
    const next = t.mock.fn();
    validateIdParam({}, {}, next, '0b8f0c5e-3f6a-4d2b-9c1e-7a5d4e3f2a10');
    assert.equal(next.mock.callCount(), 1);
  });

  it('rejects a value that is not a UUID', () => {
    assert.throws(() => validateIdParam({}, {}, () => {}, '42'), { status: 400, message: 'id must be a UUID' });
  });
});
