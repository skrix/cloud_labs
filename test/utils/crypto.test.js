const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword, generateApiKey, hashApiKey } = require('../../src/utils/crypto');

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const passwordHash = await hashPassword('secret123');
    assert.notEqual(passwordHash, 'secret123');
    assert.equal(await verifyPassword('secret123', passwordHash), true);
    assert.equal(await verifyPassword('wrong', passwordHash), false);
  });

  it('uses bcrypt cost 12', async () => {
    const passwordHash = await hashPassword('secret123');
    assert.match(passwordHash, /^\$2[ab]\$12\$/);
  });
});

describe('API keys', () => {
  it('generates 32 random bytes as hex', () => {
    const apiKey = generateApiKey();
    assert.match(apiKey, /^[0-9a-f]{64}$/);
    assert.notEqual(apiKey, generateApiKey());
  });

  it('hashes a key to the same SHA-256 hex every time', () => {
    const apiKey = generateApiKey();
    assert.equal(hashApiKey(apiKey), hashApiKey(apiKey));
    assert.match(hashApiKey(apiKey), /^[0-9a-f]{64}$/);
    assert.notEqual(hashApiKey(apiKey), apiKey);
  });
});
