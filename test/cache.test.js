const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createCache } = require('../src/cache');

// In-memory stand-in for the Redis client: get / set with { EX } like node-redis.
function fakeClient({ failing = false } = {}) {
  const store = new Map();
  return {
    store,
    async get(key) {
      if (failing) {
        throw new Error('connection refused');
      }
      return store.has(key) ? store.get(key).value : null;
    },
    async set(key, value, options) {
      if (failing) {
        throw new Error('connection refused');
      }
      store.set(key, { value, ttl: options.EX });
    },
  };
}

describe('cache-aside', () => {
  it('loads on a miss, stores with the TTL and serves the next call from the cache', async () => {
    const client = fakeClient();
    const cache = createCache({ client, ttlSeconds: 45 });
    let loads = 0;
    const load = async () => ({ count: (loads += 1) });

    const first = await cache.getOrLoad('stats:1', load);
    const second = await cache.getOrLoad('stats:1', load);

    assert.deepEqual(first, { value: { count: 1 }, status: 'MISS' });
    assert.deepEqual(second, { value: { count: 1 }, status: 'HIT' });
    assert.equal(loads, 1);
    assert.equal(client.store.get('stats:1').ttl, 45);
  });

  it('keeps different keys apart', async () => {
    const cache = createCache({ client: fakeClient() });
    await cache.getOrLoad('stats:1', async () => 'one');
    const other = await cache.getOrLoad('stats:2', async () => 'two');
    assert.deepEqual(other, { value: 'two', status: 'MISS' });
  });

  it('always loads when there is no client', async () => {
    const cache = createCache();
    let loads = 0;
    await cache.getOrLoad('stats:1', async () => (loads += 1));
    const second = await cache.getOrLoad('stats:1', async () => (loads += 1));
    assert.deepEqual(second, { value: 2, status: 'OFF' });
    assert.equal(cache.enabled, false);
  });

  it('falls back to loading when Redis fails', async () => {
    const cache = createCache({ client: fakeClient({ failing: true }) });
    const result = await cache.getOrLoad('stats:1', async () => 'from database');
    assert.deepEqual(result, { value: 'from database', status: 'MISS' });
  });
});
