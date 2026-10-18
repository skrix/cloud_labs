// The one place that turns errors into HTTP responses. Every error response has the shape { error: message }.
const { HttpError } = require('../errors');
const { logger } = require('../utils/logger');

const SEQUELIZE_ERROR_STATUS = {
  SequelizeValidationError: 400,
  SequelizeUniqueConstraintError: 409,
  SequelizeForeignKeyConstraintError: 409,
};

// PostgreSQL reports ON DELETE RESTRICT as "restrict_violation" (23001). Sequelize only maps
// 23503 to ForeignKeyConstraintError, so a RESTRICT failure arrives as a plain DatabaseError.
const RESTRICT_VIOLATION_CODE = '23001';

const FOREIGN_KEY_MESSAGE = 'The resource is referenced by other records';
const INTERNAL_ERROR_MESSAGE = 'Internal server error';

function isRestrictViolation(err) {
  return err.name === 'SequelizeDatabaseError' && err.parent?.code === RESTRICT_VIOLATION_CODE;
}

function describeSequelizeError(err) {
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return FOREIGN_KEY_MESSAGE;
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return `${Object.keys(err.fields).join(' and ')} must be unique`;
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

  if (isRestrictViolation(err)) {
    return res.status(409).json({ error: FOREIGN_KEY_MESSAGE });
  }

  // Express's own errors (malformed JSON, body too large) mark client-safe messages with `expose`.
  if (err.expose && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }

  // Not the whole error object: it can contain SQL with user data.
  logger.error('unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: INTERNAL_ERROR_MESSAGE });
}

module.exports = { errorHandler };
