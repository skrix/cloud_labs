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

const ALB_IDLE_TIMEOUT_MS = 60 * 1000;
server.keepAliveTimeout = ALB_IDLE_TIMEOUT_MS + 5 * 1000;
server.headersTimeout = server.keepAliveTimeout + 1000;

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
