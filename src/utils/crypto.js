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

// SHA-256, not bcrypt: a 32-byte random key needs no slow hash, and a deterministic
// hash lets ingest look the device up by apiKeyHash.
function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateApiKey,
  hashApiKey,
};
