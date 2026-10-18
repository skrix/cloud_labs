// Requires "Authorization: Bearer <token>" and puts the caller on req.user = { id, role }.
const { UnauthorizedError } = require('../errors');
const { verifyToken } = require('../utils/jwt');

const BEARER_PREFIX = 'Bearer ';

function readBearerToken(req) {
  const header = req.get('Authorization');
  if (!header || !header.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedError('Missing bearer token');
  }
  return header.slice(BEARER_PREFIX.length);
}

function readTokenPayload(token) {
  try {
    return verifyToken(token);
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

function authenticate(req, res, next) {
  const payload = readTokenPayload(readBearerToken(req));
  req.user = { id: payload.sub, role: payload.role };
  next();
}

module.exports = { authenticate };
