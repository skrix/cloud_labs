const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateCredentials, validateSignup } = require('../../src/validators/auth');

describe('validateCredentials', () => {
  it('lower-cases the email and drops unknown fields', () => {
    const credentials = validateCredentials({ email: 'Bob@Example.com', password: 'secret', role: 'admin' });
    assert.deepEqual(credentials, { email: 'bob@example.com', password: 'secret' });
  });

  it('requires email and password', () => {
    assert.throws(() => validateCredentials({ email: 'bob@example.com' }), { status: 400 });
  });
});

describe('validateSignup', () => {
  it('rejects a password shorter than 8 characters', () => {
    assert.throws(() => validateSignup({ email: 'bob@example.com', password: 'short' }), {
      status: 400,
      message: 'password must be at least 8 characters',
    });
  });

  it('accepts a password of 8 characters', () => {
    assert.doesNotThrow(() => validateSignup({ email: 'bob@example.com', password: '12345678' }));
  });
});
