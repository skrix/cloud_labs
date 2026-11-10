const { logger } = require('./utils/logger');
const { redisClient } = require('./redis');

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

const enabled = process.env.CACHE_ENABLED !== 'false';
const ttlSeconds = Number(process.env.CACHE_TTL_SECONDS) || DEFAULT_TTL_SECONDS;
const cache = createCache({ client: enabled ? redisClient : null, ttlSeconds });

module.exports = { cache, createCache, DEFAULT_TTL_SECONDS };
