// In-memory stand-in for the node-redis client: get / set with { NX, EX } / del.
function fakeRedis({ failing = false } = {}) {
  const store = new Map();

  function check() {
    if (failing) {
      throw new Error('connection refused');
    }
  }

  return {
    store,
    async get(key) {
      check();
      return store.has(key) ? store.get(key).value : null;
    },
    async set(key, value, options = {}) {
      check();
      if (options.NX && store.has(key)) {
        return null;
      }
      store.set(key, { value, ttl: options.EX });
      return 'OK';
    },
    async del(key) {
      check();
      return store.delete(key) ? 1 : 0;
    },
  };
}

module.exports = { fakeRedis };
