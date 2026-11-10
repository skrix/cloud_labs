const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../helpers/server');
const { resetDatabase, closeDatabase } = require('../helpers/database');
const { createUser, createDevice } = require('../helpers/fixtures');
const { ingestQueue, createQueue, MAX_MESSAGE_BYTES } = require('../../src/queue');
const { storeReadings } = require('../../src/services/readings');
const { Reading } = require('../../src/db/models');
const { idempotency, createIdempotency } = require('../../src/idempotency');
const { fakeRedis } = require('../helpers/fake-redis');

describe('ingest through the queue', () => {
  let server;
  let owner;
  let userDevice;
  let apiKey;
  let sent;

  before(async () => {
    const sqs = { send: async (command) => sent.push(JSON.parse(command.input.MessageBody)) };
    Object.assign(ingestQueue, createQueue({ client: sqs, url: 'ingest' }));
    server = await startServer();
  });

  beforeEach(async () => {
    await resetDatabase();
    sent = [];
    owner = await createUser();
    const device = await createDevice();
    const created = await server.request('/api/user-devices', {
      method: 'POST',
      token: owner.token,
      body: { name: 'Kitchen', deviceId: device.id },
    });
    userDevice = created.body.userDevice;
    apiKey = created.body.apiKey;
  });

  after(async () => {
    server.close();
    await closeDatabase();
  });

  function ingest(body, key = apiKey) {
    return server.request('/api/ingest', { method: 'POST', apiKey: key, body });
  }

  function getReading(id) {
    return server.request(`/api/user-devices/${userDevice.id}/readings/${id}`, { token: owner.token });
  }

  it('answers 202 with the reading id and queues it without storing', async () => {
    const res = await ingest({ temperature: 21.5 });

    assert.equal(res.status, 202);
    assert.equal(res.headers.location, `/api/user-devices/${userDevice.id}/readings/${res.body.id}`);
    assert.deepEqual(sent, [{ readings: [res.body] }]);
    assert.equal((await getReading(res.body.id)).status, 404);
  });

  it('makes the reading readable once the worker stores it', async () => {
    const res = await ingest({ temperature: 21.5 });
    await storeReadings(sent[0].readings);

    const fetched = await getReading(res.body.id);
    assert.equal(fetched.status, 200);
    assert.deepEqual(fetched.body.data, { temperature: 21.5 });
    assert.equal(fetched.body.createdAt, res.body.createdAt);
  });

  it('stores a message delivered twice only once', async () => {
    await ingest([{ n: 1 }, { n: 2 }]);
    await storeReadings(sent[0].readings);
    await storeReadings(sent[0].readings);

    assert.equal(await Reading.count({ where: { userDeviceId: userDevice.id } }), 2);
  });

  it('never moves lastSeenAt back when an older message arrives late', async () => {
    await ingest({ n: 1 });
    await ingest({ n: 2 });
    const [older, newer] = sent.map((message) => message.readings);
    await storeReadings(newer);
    await storeReadings(older);

    const fetched = await server.request(`/api/user-devices/${userDevice.id}`, { token: owner.token });
    assert.equal(fetched.body.lastSeenAt, newer[0].createdAt);
  });

  it('queues a request retried with the same Idempotency-Key once, with the same ids', async () => {
    Object.assign(idempotency, createIdempotency({ client: fakeRedis() }));
    const headers = { 'Idempotency-Key': 'reading-001' };
    const first = await server.request('/api/ingest', { method: 'POST', apiKey, body: { t: 1 }, headers });
    const second = await server.request('/api/ingest', { method: 'POST', apiKey, body: { t: 1 }, headers });

    assert.equal(second.status, 202);
    assert.deepEqual(second.body, first.body);
    assert.equal(second.headers.location, first.headers.location);
    assert.equal(sent.length, 1);
  });

  it('checks the device key before queueing', async () => {
    const res = await ingest({ t: 1 }, 'unknown-key');
    assert.equal(res.status, 401);
    assert.equal(sent.length, 0);
  });

  it('rejects a payload too large for one message with 413', async () => {
    const res = await ingest({ blob: 'x'.repeat(MAX_MESSAGE_BYTES) });
    assert.equal(res.status, 413);
    assert.equal(sent.length, 0);
  });
});
