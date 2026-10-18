const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { HttpError } = require('../../src/errors');
const {
  requireObject,
  requireString,
  optionalString,
  requireUuid,
  optionalUuid,
  pick,
} = require('../../src/validators/helpers');

const UUID = '0b8f0c5e-3f6a-4d2b-9c1e-7a5d4e3f2a10';

function assertBadRequest(fn, message) {
  assert.throws(fn, (err) => err instanceof HttpError && err.status === 400 && err.message === message);
}

describe('requireObject', () => {
  it('accepts a plain object', () => {
    assert.doesNotThrow(() => requireObject({}));
  });

  it('rejects arrays, null and missing bodies', () => {
    for (const body of [[], null, undefined, 'text']) {
      assertBadRequest(() => requireObject(body), 'Request body must be a JSON object');
    }
  });
});

describe('requireString', () => {
  it('accepts a non-empty string', () => {
    assert.doesNotThrow(() => requireString('ESP32', 'name'));
  });

  it('rejects empty, blank and non-string values', () => {
    for (const value of ['', '   ', 42, undefined, null]) {
      assertBadRequest(() => requireString(value, 'name'), 'name must be a non-empty string');
    }
  });
});

describe('optionalString', () => {
  it('accepts undefined and null', () => {
    assert.doesNotThrow(() => optionalString(undefined, 'chip'));
    assert.doesNotThrow(() => optionalString(null, 'chip'));
  });

  it('rejects a non-string value', () => {
    assertBadRequest(() => optionalString(42, 'chip'), 'chip must be a non-empty string');
  });
});

describe('requireUuid and optionalUuid', () => {
  it('accepts a UUID', () => {
    assert.doesNotThrow(() => requireUuid(UUID, 'deviceId'));
  });

  it('rejects a value that is not a UUID', () => {
    assertBadRequest(() => requireUuid('123', 'deviceId'), 'deviceId must be a UUID');
  });

  it('allows a missing optional UUID', () => {
    assert.doesNotThrow(() => optionalUuid(undefined, 'firmwareId'));
    assert.doesNotThrow(() => optionalUuid(null, 'firmwareId'));
  });
});

describe('pick', () => {
  it('returns only the listed fields that are present', () => {
    const body = { name: 'a', chip: null, role: 'admin' };
    assert.deepEqual(pick(body, ['name', 'chip', 'description']), { name: 'a', chip: null });
  });
});
