const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../helpers/server');
const { resetDatabase, closeDatabase } = require('../helpers/database');
const { createUser, createDevice } = require('../helpers/fixtures');
const { Reading } = require('../../src/db/models');

const DAY_MS = 24 * 60 * 60 * 1000;

describe('readings', () => {
  let server;
  let owner;
  let userDevice;
  let apiKey;

  before(async () => {
    server = await startServer();
  });

  beforeEach(async () => {
    await resetDatabase();
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

  function ingest(data, key = apiKey) {
    return server.request('/api/ingest', { method: 'POST', apiKey: key, body: data });
  }

  function listReadings(query = '', token = owner.token) {
    return server.request(`/api/user-devices/${userDevice.id}/readings${query}`, { token });
  }

  async function createReadingDaysAgo(days) {
    const createdAt = new Date(Date.now() - days * DAY_MS);
    await Reading.create({ userDeviceId: userDevice.id, data: { daysAgo: days }, createdAt });
  }

  it('stores a reading and updates lastSeenAt', async () => {
    const res = await ingest({ temperature: 21.5 });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.data, { temperature: 21.5 });

    const fetched = await server.request(`/api/user-devices/${userDevice.id}`, { token: owner.token });
    assert.equal(fetched.body.lastSeenAt, res.body.createdAt);
  });

  it('rejects a missing or unknown key with 401', async () => {
    const missing = await server.request('/api/ingest', { method: 'POST', body: { t: 1 } });
    const unknown = await ingest({ t: 1 }, 'unknown-key');
    assert.equal(missing.status, 401);
    assert.equal(unknown.status, 401);
  });

  it('rejects a body that is not an object', async () => {
    const res = await ingest([1, 2, 3]);
    assert.equal(res.status, 400);
  });

  it('lists readings newest first and applies limit', async () => {
    await ingest({ n: 1 });
    await ingest({ n: 2 });
    await ingest({ n: 3 });
    const res = await listReadings('?limit=2');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map((reading) => reading.data.n), [3, 2]);
  });

  it('returns only the last 7 days by default', async () => {
    await createReadingDaysAgo(1);
    await createReadingDaysAgo(8);
    const res = await listReadings();
    assert.deepEqual(res.body.map((reading) => reading.data.daysAgo), [1]);
  });

  it('filters by from and to', async () => {
    await createReadingDaysAgo(2);
    await createReadingDaysAgo(10);
    await createReadingDaysAgo(20);
    const from = new Date(Date.now() - 15 * DAY_MS).toISOString();
    const to = new Date(Date.now() - 5 * DAY_MS).toISOString();
    const res = await listReadings(`?from=${from}&to=${to}`);
    assert.deepEqual(res.body.map((reading) => reading.data.daysAgo), [10]);
  });

  it('returns 404 for readings of another user', async () => {
    const otherUser = await createUser();
    const res = await listReadings('', otherUser.token);
    assert.equal(res.status, 404);
  });
});
