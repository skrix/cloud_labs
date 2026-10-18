// The one place that turns errors into HTTP responses. Every error response has the shape { error: message }.
const { HttpError } = require('../errors');
const { logger } = require('../utils/logger');

const SEQUELIZE_ERROR_STATUS = {
  SequelizeValidationError: 400,
  SequelizeUniqueConstraintError: 409,
  SequelizeForeignKeyConstraintError: 409,
};

const FOREIGN_KEY_MESSAGE = 'The resource is referenced by other records';
const INTERNAL_ERROR_MESSAGE = 'Internal server error';

function describeSequelizeError(err) {
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return FOREIGN_KEY_MESSAGE;
  }
  return err.errors.map((item) => item.message).join('; ');
}

// Express needs all four arguments to recognize this function as an error handler.
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  const sequelizeStatus = SEQUELIZE_ERROR_STATUS[err.name];
  if (sequelizeStatus) {
    return res.status(sequelizeStatus).json({ error: describeSequelizeError(err) });
  }

  // Errors from Express itself (for example malformed JSON or a too large body) follow the
  // http-errors convention: `expose` marks messages that are safe to show to the client.
  if (err.expose && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }

  // Only message and stack: the full error object can contain SQL with user data.
  logger.error('unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
}

module.exports = { errorHandler };
