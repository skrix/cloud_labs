const { HttpError } = require('../errors');

function notFound(req, res, next) {
  next(new HttpError(404, 'Route not found'));
}

module.exports = { notFound };
