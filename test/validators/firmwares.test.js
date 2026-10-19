const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateFirmwareFilter,
  validateFirmwareCreate,
  validateFirmwareUpdate,
} = require('../../src/validators/firmwares');

const DEVICE_ID = '0b8f0c5e-3f6a-4d2b-9c1e-7a5d4e3f2a10';

describe('validateFirmwareFilter', () => {
  it('returns an empty filter without deviceId', () => {
    assert.deepEqual(validateFirmwareFilter({}), {});
  });

  it('rejects an invalid deviceId', () => {
    assert.throws(() => validateFirmwareFilter({ deviceId: 'abc' }), { status: 400 });
  });
});

describe('validateFirmwareCreate', () => {
  it('requires deviceId and version', () => {
    assert.deepEqual(validateFirmwareCreate({ deviceId: DEVICE_ID, version: '1.0.0' }), {
      deviceId: DEVICE_ID,
      version: '1.0.0',
    });
    assert.throws(() => validateFirmwareCreate({ version: '1.0.0' }), { status: 400 });
  });
});

describe('validateFirmwareUpdate', () => {
  it('does not allow changing deviceId', () => {
    assert.deepEqual(validateFirmwareUpdate({ deviceId: DEVICE_ID, version: '1.0.1' }), { version: '1.0.1' });
  });
});
