const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../helpers/server');
const { resetDatabase, closeDatabase } = require('../helpers/database');
const { createUser, createDevice } = require('../helpers/fixtures');
const { fakeRedis } = require('../helpers/fake-redis');
const { idempotency, createIdempotency } = require('../../src/idempotency');
const { Reading } = require('../../src/db/models');

describe('POST /ingest with Idempotency-Key', () => {
  let server;
  let owner;
  let device;
  let apiKey;

  before(async () => {
    server = await startServer();
  });

  beforeEach(async () => {
    await resetDatabase();
    Object.assign(idempotency, createIdempotency({ client: fakeRedis() }));
    owner = await createUser();
    device = await createDevice();
    apiKey = await createUserDevice('Kitchen');
  });

  after(async () => {
    server.close();
    await closeDatabase();
  });

  async function createUserDevice(name) {
    const created = await server.request('/api/user-devices', {
      method: 'POST',
      token: owner.token,
      body: { name, deviceId: device.id },
    });
    return created.body.apiKey;
  }

  function ingest(body, { key, deviceKey = apiKey } = {}) {
    return server.request('/api/ingest', {
      method: 'POST',
      apiKey: deviceKey,
      body,
      headers: key ? { 'Idempotency-Key': key } : {},
    });
  }

  function countReadings() {
    return Reading.count();
  }

  it('two identical requests: one reading stored, two identical responses', async () => {
    const first = await ingest({ temperature: 21.5 }, { key: 'reading-001' });
    const second = await ingest({ temperature: 21.5 }, { key: 'reading-001' });

    assert.equal(await countReadings(), 1);
    assert.equal(first.status, 201);
    assert.equal(second.status, first.status);
    assert.deepEqual(second.body, first.body);
    assert.equal(first.headers['idempotent-replayed'], undefined);
    assert.equal(second.headers['idempotent-replayed'], 'true');
  });

  it('replays a batch as a whole', async () => {
    const batch = [{ n: 1 }, { n: 2 }, { n: 3 }];
    const first = await ingest(batch, { key: 'batch-001' });
    const second = await ingest(batch, { key: 'batch-001' });

    assert.equal(await countReadings(), 3);
    assert.deepEqual(second.body, first.body);
  });

  it('stores each request with a different key or without a key', async () => {
    await ingest({ t: 1 }, { key: 'a' });
    await ingest({ t: 1 }, { key: 'b' });
    await ingest({ t: 1 });
    await ingest({ t: 1 });
    assert.equal(await countReadings(), 4);
  });

  it('keeps the same key of two devices apart', async () => {
    const otherKey = await createUserDevice('Bedroom');
    await ingest({ t: 1 }, { key: 'same' });
    const other = await ingest({ t: 1 }, { key: 'same', deviceKey: otherKey });

    assert.equal(other.status, 201);
    assert.equal(await countReadings(), 2);
  });

  it('rejects the same key with a different body with 422', async () => {
    await ingest({ t: 1 }, { key: 'reused' });
    const res = await ingest({ t: 2 }, { key: 'reused' });
    assert.equal(res.status, 422);
    assert.equal(await countReadings(), 1);
  });

  it('rejects an invalid key with 400', async () => {
    const res = await ingest({ t: 1 }, { key: 'x'.repeat(256) });
    assert.equal(res.status, 400);
    assert.equal(await countReadings(), 0);
  });

  it('does not keep a failed request, so a retry with the same key can succeed', async () => {
    const rejected = await ingest({ t: 1 }, { key: 'retry', deviceKey: 'unknown-key' });
    const retried = await ingest({ t: 1 }, { key: 'retry', deviceKey: 'unknown-key' });
    assert.equal(rejected.status, 401);
    assert.equal(retried.status, 401);
    assert.equal(retried.headers['idempotent-replayed'], undefined);
  });
});
