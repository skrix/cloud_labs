// Shared cache in Redis for cache-aside reads. Off without REDIS_URL or with CACHE_ENABLED=false.
// A Redis failure never fails a request: the read falls back to the database.
const { createClient } = require('redis');
const { logger } = require('./utils/logger');

const DEFAULT_TTL_SECONDS = 60;

function createCache({ client = null, ttlSeconds = DEFAULT_TTL_SECONDS } = {}) {
  async function get(key) {
    try {
      const value = await client.get(key);
      return value === null ? undefined : JSON.parse(value);
    } catch (error) {
      logger.error('cache get failed', { key, error: error.message });
      return undefined;
    }
  }

  async function set(key, value) {
    try {
      await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (error) {
      logger.error('cache set failed', { key, error: error.message });
    }
  }

  // Cache-aside: return a fresh cached value (HIT), otherwise load it, store it for ttlSeconds
  // and return it (MISS). Without a client every call loads (OFF).
  async function getOrLoad(key, load) {
    if (!client) {
      return { value: await load(), status: 'OFF' };
    }
    const cached = await get(key);
    if (cached !== undefined) {
      return { value: cached, status: 'HIT' };
    }
    const value = await load();
    await set(key, value);
    return { value, status: 'MISS' };
  }

  return { getOrLoad, ttlSeconds, enabled: Boolean(client) };
}

function createRedisClient(url) {
  const client = createClient({
    url,
    socket: { connectTimeout: 2000, reconnectStrategy: (retries) => Math.min(retries * 200, 5000) },
    // Fail fast instead of queueing commands while Redis is unreachable.
    disableOfflineQueue: true,
  });
  client.on('error', (error) => logger.error('redis error', { error: error.message }));
  client.on('ready', () => logger.info('redis connected', { url }));
  client.connect().catch((error) => logger.error('redis connect failed', { error: error.message }));
  return client;
}

const enabled = Boolean(process.env.REDIS_URL) && process.env.CACHE_ENABLED !== 'false';
const ttlSeconds = Number(process.env.CACHE_TTL_SECONDS) || DEFAULT_TTL_SECONDS;
const redisClient = enabled ? createRedisClient(process.env.REDIS_URL) : null;
const cache = createCache({ client: redisClient, ttlSeconds });

async function closeCache() {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
}

module.exports = { cache, closeCache, createCache, DEFAULT_TTL_SECONDS };
