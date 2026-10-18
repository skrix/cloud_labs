const { app } = require('./app');
const { sequelize } = require('./db');
const { logger } = require('./utils/logger');

const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const server = app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  logger.info('server started', { port: PORT });
});

function shutdown(signal) {
  logger.info('shutdown started', { signal });

  server.close(async () => {
    await sequelize.close();
    logger.info('shutdown complete');
    process.exit(0);
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
