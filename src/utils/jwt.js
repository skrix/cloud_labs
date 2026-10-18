// Creates and verifies the JWTs that users send as "Authorization: Bearer <token>".
const jwt = require('jsonwebtoken');

const TOKEN_TTL = '1h';
const TOKEN_ALGORITHM = 'HS256';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

function createToken(user) {
  const payload = { sub: user.id, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL, algorithm: TOKEN_ALGORITHM });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: [TOKEN_ALGORITHM] });
}

module.exports = { createToken, verifyToken };
