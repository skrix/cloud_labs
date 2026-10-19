const { requireUuid } = require('../validators/helpers');

function validateIdParam(req, res, next, id) {
  requireUuid(id, 'id');
  next();
}

module.exports = { validateIdParam };
