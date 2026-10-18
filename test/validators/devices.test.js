const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateDeviceCreate, validateDeviceUpdate } = require('../../src/validators/devices');

describe('validateDeviceCreate', () => {
  it('returns only device fields', () => {
    const fields = validateDeviceCreate({ name: 'ESP32 DevKit', chip: 'ESP32', id: 'x' });
    assert.deepEqual(fields, { name: 'ESP32 DevKit', chip: 'ESP32' });
  });

  it('requires a name', () => {
    assert.throws(() => validateDeviceCreate({ chip: 'ESP32' }), { status: 400 });
  });
});

describe('validateDeviceUpdate', () => {
  it('allows a partial update', () => {
    assert.deepEqual(validateDeviceUpdate({ description: 'Board' }), { description: 'Board' });
  });
});
