const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateUserDeviceCreate,
  validateUserDeviceUpdate,
  validateReadingsQuery,
} = require('../../src/validators/user-devices');

const DEVICE_ID = '0b8f0c5e-3f6a-4d2b-9c1e-7a5d4e3f2a10';
const DAY_MS = 24 * 60 * 60 * 1000;

describe('validateUserDeviceCreate', () => {
  it('returns name, deviceId and firmwareId only', () => {
    const fields = validateUserDeviceCreate({ name: 'Kitchen', deviceId: DEVICE_ID, apiKeyHash: 'x' });
    assert.deepEqual(fields, { name: 'Kitchen', deviceId: DEVICE_ID });
  });

  it('rejects an invalid firmwareId', () => {
    assert.throws(() => validateUserDeviceCreate({ name: 'Kitchen', deviceId: DEVICE_ID, firmwareId: '1' }), {
      status: 400,
    });
  });
});

describe('validateUserDeviceUpdate', () => {
  it('allows only name and firmwareId', () => {
    assert.deepEqual(validateUserDeviceUpdate({ firmwareId: null, deviceId: DEVICE_ID }), { firmwareId: null });
  });
});

describe('validateReadingsQuery', () => {
  it('defaults to the last 7 days and 100 readings', () => {
    const { from, to, limit } = validateReadingsQuery({});
    assert.equal(limit, 100);
    assert.ok(Math.abs(to.getTime() - Date.now()) < 1000);
    assert.ok(Math.abs(to.getTime() - from.getTime() - 7 * DAY_MS) < 1000);
  });

  it('parses ISO dates and limit', () => {
    const query = validateReadingsQuery({ from: '2026-01-01', to: '2026-02-01T12:00:00Z', limit: '50' });
    assert.deepEqual(query, {
      from: new Date('2026-01-01'),
      to: new Date('2026-02-01T12:00:00Z'),
      limit: 50,
    });
  });

  it('rejects limits outside 1..1000', () => {
    for (const limit of ['0', '1001', '2.5', 'abc']) {
      assert.throws(() => validateReadingsQuery({ limit }), { status: 400 });
    }
  });

  it('rejects an invalid date', () => {
    assert.throws(() => validateReadingsQuery({ from: 'yesterday' }), {
      status: 400,
      message: 'from must be an ISO 8601 date',
    });
  });
});
