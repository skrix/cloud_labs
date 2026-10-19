const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateReadingData } = require('../../src/validators/ingest');

describe('validateReadingData', () => {
  it('accepts any JSON object', () => {
    const data = { temperature: 21.5, nested: { ok: true } };
    assert.equal(validateReadingData(data), data);
  });

  it('rejects arrays and primitives', () => {
    for (const body of [[1, 2], 42, null]) {
      assert.throws(() => validateReadingData(body), { status: 400 });
    }
  });
});
