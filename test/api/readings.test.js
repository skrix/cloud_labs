const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
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

  it('rejects a body that is not an object or a batch of objects', async () => {
    const primitives = await ingest([1, 2, 3]);
    const scalar = await ingest(42);
    assert.equal(primitives.status, 400);
    assert.equal(scalar.status, 400);
  });

  it('stores a batch of readings', async () => {
    const res = await ingest([{ n: 1 }, { n: 2 }, { n: 3 }]);
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.map((reading) => reading.data.n), [1, 2, 3]);
    const listed = await listReadings();
    assert.equal(listed.body.length, 3);
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

  it('gets one reading by id', async () => {
    const created = await ingest({ temperature: 19 });
    const res = await server.request(`/api/user-devices/${userDevice.id}/readings/${created.body.id}`, {
      token: owner.token,
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, created.body);
  });

  it('returns 404 for a reading of another user or another device', async () => {
    const created = await ingest({ temperature: 19 });
    const path = `/api/user-devices/${userDevice.id}/readings/${created.body.id}`;
    const otherUser = await createUser();
    const foreign = await server.request(path, { token: otherUser.token });
    const unknown = await server.request(`/api/user-devices/${userDevice.id}/readings/${randomUUID()}`, {
      token: owner.token,
    });
    assert.equal(foreign.status, 404);
    assert.equal(unknown.status, 404);
  });

  it('returns stats of readings in the period, per hour', async () => {
    await ingest({ temperature: 20, humidity: 40 });
    await ingest({ temperature: 24 });
    await createReadingDaysAgo(10); // outside the default 7 days
    const res = await server.request(`/api/user-devices/${userDevice.id}/readings/stats`, { token: owner.token });
    assert.equal(res.status, 200);
    assert.equal(res.headers['x-cache'], 'OFF'); // no REDIS_URL in tests
    assert.equal(res.body.bucket, 'hour');
    assert.equal(res.body.count, 2);
    assert.deepEqual(res.body.fields.temperature, { count: 2, min: 20, max: 24, avg: 22, p50: 20, p95: 24 });
    assert.equal(res.body.fields.humidity.count, 1);
    assert.equal(res.body.buckets.reduce((total, bucket) => total + bucket.count, 0), 2);
  });

  it('rejects an unknown stats bucket and hides stats of another user', async () => {
    const path = `/api/user-devices/${userDevice.id}/readings/stats`;
    const badBucket = await server.request(`${path}?bucket=week`, { token: owner.token });
    const otherUser = await createUser();
    const foreign = await server.request(path, { token: otherUser.token });
    assert.equal(badBucket.status, 400);
    assert.equal(foreign.status, 404);
  });

  it('rejects a reading id that is not a UUID', async () => {
    const res = await server.request(`/api/user-devices/${userDevice.id}/readings/42`, { token: owner.token });
    assert.equal(res.status, 400);
  });
});
