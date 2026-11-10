const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MAX_BATCH_SIZE, validateReadingData, validateReadingBatch } = require('../../src/validators/ingest');

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

describe('validateReadingBatch', () => {
  it('accepts an array of objects', () => {
    const batch = [{ t: 1 }, { t: 2 }];
    assert.equal(validateReadingBatch(batch), batch);
  });

  it('rejects empty, oversized and non-object batches', () => {
    const oversized = Array.from({ length: MAX_BATCH_SIZE + 1 }, () => ({ t: 1 }));
    for (const body of [[], oversized, [{ t: 1 }, 2], { t: 1 }]) {
      assert.throws(() => validateReadingBatch(body), { status: 400 });
    }
  });
});
