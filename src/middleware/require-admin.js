// Allows only admins. Must run after authenticate, which sets req.user.
const { ForbiddenError } = require('../errors');

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Admin role required');
  }
  next();
}

module.exports = { requireAdmin };
