// Logs one line per finished request: method, path, status and duration.
// Bodies, headers and query strings are never logged because they can contain passwords, tokens or keys.
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
