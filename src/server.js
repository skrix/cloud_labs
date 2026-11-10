const { app } = require('./app');
const { sequelize } = require('./db');
const { closeCache } = require('./cache');
const { logger } = require('./utils/logger');

const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const server = app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  logger.info('server started', { port: PORT });
});

// Longer than the ALB idle timeout (60 s), so the ALB closes idle connections first;
// otherwise it can reuse a connection Node just closed and answer the client with 502.
server.keepAliveTimeout = 65 * 1000;
server.headersTimeout = 66 * 1000; // must be greater than keepAliveTimeout

function shutdown(signal) {
  logger.info('shutdown started', { signal });

  server.close(async () => {
    await closeCache();
    await sequelize.close();
    logger.info('shutdown complete');
    process.exit(0);
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
