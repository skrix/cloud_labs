const { createClient } = require('redis');
const { logger } = require('./utils/logger');

function createRedisClient(url) {
  const client = createClient({
    url,
    socket: { connectTimeout: 2000, reconnectStrategy: (retries) => Math.min(retries * 200, 5000) },
    disableOfflineQueue: true,
  });
  client.on('error', (error) => logger.error('redis error', { error: error.message }));
  client.on('ready', () => logger.info('redis connected', { url }));
  client.connect().catch((error) => logger.error('redis connect failed', { error: error.message }));
  return client;
}

const redisClient = process.env.REDIS_URL ? createRedisClient(process.env.REDIS_URL) : null;

async function closeRedis() {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
}

module.exports = { redisClient, closeRedis };
