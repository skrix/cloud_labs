const { logger } = require('../utils/logger');

function requestLogger(req, res, next) {
  const startedAt = Date.now();
  const { method, path } = req;

  res.on('finish', () => {
    logger.info('request', {
      method,
      path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}

module.exports = { requestLogger };
