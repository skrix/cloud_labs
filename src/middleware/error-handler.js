const { HttpError } = require('../errors');
const { logger } = require('../utils/logger');

const SEQUELIZE_ERROR_STATUS = {
  SequelizeValidationError: 400,
  SequelizeUniqueConstraintError: 409,
  SequelizeForeignKeyConstraintError: 409,
};
const POSTGRES_RESTRICT_VIOLATION = '23001';
const REFERENCED_MESSAGE = 'The resource is referenced by other records';

function isRestrictViolation(err) {
  return err.parent?.code === POSTGRES_RESTRICT_VIOLATION;
}

function sequelizeMessage(err) {
  if (!err.errors) {
    return REFERENCED_MESSAGE;
  }
  return err.errors.map((item) => item.message).join(', ');
}

function errorHandler(err, req, res, next) {
  if (err instanceof HttpError || err.expose) {
    return res.status(err.status).json({ error: err.message });
  }
  if (SEQUELIZE_ERROR_STATUS[err.name]) {
    return res.status(SEQUELIZE_ERROR_STATUS[err.name]).json({ error: sequelizeMessage(err) });
  }
  if (isRestrictViolation(err)) {
    return res.status(409).json({ error: REFERENCED_MESSAGE });
  }

  logger.error('unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };
