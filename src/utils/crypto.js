// Password hashing and device API keys.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const BCRYPT_COST = 12;
const API_KEY_BYTES = 32;

function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function generateApiKey() {
  return crypto.randomBytes(API_KEY_BYTES).toString('hex');
}

// SHA-256 instead of bcrypt: the key is 32 random bytes, so it cannot be guessed and needs no slow hash.
// An unsalted hash is also deterministic, which lets ingest find the device by the hash (unique index).
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateApiKey,
  hashApiKey,
};
