// Starts the HTTP server and shuts it down cleanly. ECS sends SIGTERM on every deploy.
const { app } = require('./app');
const { sequelize } = require('./db');
const { logger } = require('./utils/logger');

const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const server = app.listen(PORT, (error) => {
  // Express 5 passes listen errors (for example "port in use") here; crash so the problem is visible.
  if (error) {
    throw error;
  }
  logger.info('server started', { port: PORT });
});

function shutdown(signal) {
  logger.info('shutdown started', { signal });

  // close() stops new connections and waits for running requests to finish.
  server.close(async () => {
    await sequelize.close();
    logger.info('shutdown complete');
    process.exit(0);
  });
}

// `once`: a second Ctrl+C falls back to Node's default behavior and kills the process at once.
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
