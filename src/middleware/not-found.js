// Unknown routes get a JSON 404 instead of Express's HTML page.
const { NotFoundError } = require('../errors');

function notFound(req, res, next) {
  next(new NotFoundError('Route not found'));
}

module.exports = { notFound };
