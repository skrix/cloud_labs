const { HttpError } = require('../errors');
const { verifyToken } = require('../utils/jwt');

function readPayload(header) {
  const [scheme, token] = (header || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Missing bearer token');
  }
  try {
    return verifyToken(token);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}

function authenticate(req, res, next) {
  const payload = readPayload(req.get('Authorization'));
  req.user = { id: payload.sub, role: payload.role };
  next();
}

module.exports = { authenticate };
