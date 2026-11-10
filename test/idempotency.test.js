const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createIdempotency } = require('../src/idempotency');
const { fakeRedis } = require('./helpers/fake-redis');

function counter(response = { status: 201, body: { id: 'r1' } }) {
  const execute = async () => {
    execute.calls += 1;
    return response;
  };
  execute.calls = 0;
  return execute;
}

describe('idempotency', () => {
  const request = { scope: 'ingest:device', key: 'key-1', body: { t: 1 } };

  it('runs once and replays the stored response for the same key', async () => {
    const client = fakeRedis();
    const idempotency = createIdempotency({ client, ttlSeconds: 86400 });
    const execute = counter();

    const first = await idempotency.run({ ...request, execute });
    const second = await idempotency.run({ ...request, execute });

    assert.equal(execute.calls, 1);
    assert.deepEqual(first, { status: 201, body: { id: 'r1' }, replayed: false });
    assert.deepEqual(second, { status: 201, body: { id: 'r1' }, replayed: true });
    assert.equal(client.store.get('idempotency:ingest:device:key-1').ttl, 86400);
  });

  it('keeps keys of different scopes apart', async () => {
    const idempotency = createIdempotency({ client: fakeRedis() });
    const execute = counter();
    await idempotency.run({ ...request, execute });
    await idempotency.run({ ...request, scope: 'ingest:other-device', execute });
    assert.equal(execute.calls, 2);
  });

  it('rejects the same key with a different body with 422', async () => {
    const idempotency = createIdempotency({ client: fakeRedis() });
    await idempotency.run({ ...request, execute: counter() });
    await assert.rejects(idempotency.run({ ...request, body: { t: 2 }, execute: counter() }), { status: 422 });
  });

  it('rejects a repeat while the first request is still running with 409', async () => {
    const idempotency = createIdempotency({ client: fakeRedis() });
    let finish;
    const slow = () =>
      new Promise((resolve) => {
        finish = () => resolve({ status: 201, body: {} });
      });

    const first = idempotency.run({ ...request, execute: slow });
    await assert.rejects(idempotency.run({ ...request, execute: counter() }), { status: 409 });
    finish();
    await first;
  });

  it('frees the key when the request fails, so a retry runs', async () => {
    const idempotency = createIdempotency({ client: fakeRedis() });
    const failing = async () => {
      throw new Error('database down');
    };
    await assert.rejects(idempotency.run({ ...request, execute: failing }), /database down/);

    const execute = counter();
    const retry = await idempotency.run({ ...request, execute });
    assert.equal(execute.calls, 1);
    assert.equal(retry.replayed, false);
  });

  it('runs every time without a key, without Redis, or when Redis fails', async () => {
    const execute = counter();
    await createIdempotency({ client: fakeRedis() }).run({ ...request, key: undefined, execute });
    await createIdempotency().run({ ...request, execute });
    await createIdempotency({ client: fakeRedis({ failing: true }) }).run({ ...request, execute });
    assert.equal(execute.calls, 3);
  });
});
