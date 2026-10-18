const { HttpError } = require('../errors');

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    throw new HttpError(403, 'Admin role required');
  }
  next();
}

module.exports = { requireAdmin };
