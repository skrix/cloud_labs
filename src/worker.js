const { sequelize } = require('./db');
const { ingestQueue } = require('./queue');
const { storeReadings } = require('./services/readings');
const { createIngestWorker } = require('./ingest-worker');
const { closeRedis } = require('./redis');
const { logger } = require('./utils/logger');

if (!ingestQueue.enabled) {
  logger.error('INGEST_QUEUE_URL is required');
  process.exit(1);
}

const worker = createIngestWorker({ queue: ingestQueue, store: storeReadings });

function shutdown(signal) {
  logger.info('worker shutdown started', { signal });
  worker.stop();
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

logger.info('worker started');
worker.run().then(async () => {
  await closeRedis();
  await sequelize.close();
  logger.info('worker shutdown complete');
  process.exit(0);
});
