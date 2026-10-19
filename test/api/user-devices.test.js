const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../helpers/server');
const { resetDatabase, closeDatabase } = require('../helpers/database');
const { createUser, createDevice, createFirmware } = require('../helpers/fixtures');
const { UserDevice, Reading } = require('../../src/db/models');
const { hashApiKey } = require('../../src/utils/crypto');

describe('user devices', () => {
  let server;
  let owner;
  let otherUser;
  let device;

  before(async () => {
    server = await startServer();
  });

  beforeEach(async () => {
    await resetDatabase();
    owner = await createUser();
    otherUser = await createUser();
    device = await createDevice();
  });

  after(async () => {
    server.close();
    await closeDatabase();
  });

  function createUserDevice(token, body = { name: 'Kitchen', deviceId: device.id }) {
    return server.request('/api/user-devices', { method: 'POST', token, body });
  }

  it('returns the API key once and stores only its hash', async () => {
    const res = await createUserDevice(owner.token);
    assert.equal(res.status, 201);
    assert.match(res.body.apiKey, /^[0-9a-f]{64}$/);
    assert.equal(res.body.userDevice.apiKeyHash, undefined);

    const stored = await UserDevice.findByPk(res.body.userDevice.id);
    assert.equal(stored.apiKeyHash, hashApiKey(res.body.apiKey));

    const fetched = await server.request(`/api/user-devices/${stored.id}`, { token: owner.token });
    assert.equal(fetched.body.apiKey, undefined);
    assert.equal(fetched.body.apiKeyHash, undefined);
    assert.equal(fetched.body.Device.id, device.id);
  });

  it('lists only the devices of the caller', async () => {
    await createUserDevice(owner.token);
    await createUserDevice(otherUser.token);
    const res = await server.request('/api/user-devices', { token: owner.token });
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].userId, owner.user.id);
  });

  it('returns 404 for a device of another user', async () => {
    const created = await createUserDevice(owner.token);
    const path = `/api/user-devices/${created.body.userDevice.id}`;

    const get = await server.request(path, { token: otherUser.token });
    const patch = await server.request(path, { method: 'PATCH', token: otherUser.token, body: { name: 'Mine' } });
    const remove = await server.request(path, { method: 'DELETE', token: otherUser.token });
    assert.deepEqual([get.status, patch.status, remove.status], [404, 404, 404]);
  });

  it('rejects a firmware of another device with 400', async () => {
    const otherDevice = await createDevice();
    const otherFirmware = await createFirmware(otherDevice.id);
    const res = await createUserDevice(owner.token, { name: 'Kitchen', deviceId: device.id, firmwareId: otherFirmware.id });
    assert.equal(res.status, 400);
  });

  it('updates name and firmware', async () => {
    const firmware = await createFirmware(device.id);
    const created = await createUserDevice(owner.token);
    const res = await server.request(`/api/user-devices/${created.body.userDevice.id}`, {
      method: 'PATCH',
      token: owner.token,
      body: { name: 'Living room', firmwareId: firmware.id },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Living room');
    assert.equal(res.body.firmwareId, firmware.id);
  });

  it('rotates the API key so only the new key works', async () => {
    const created = await createUserDevice(owner.token);
    const oldKey = created.body.apiKey;
    const rotated = await server.request(`/api/user-devices/${created.body.userDevice.id}/rotate-key`, {
      method: 'POST',
      token: owner.token,
    });

    const withOldKey = await server.request('/api/ingest', { method: 'POST', apiKey: oldKey, body: { t: 1 } });
    const withNewKey = await server.request('/api/ingest', { method: 'POST', apiKey: rotated.body.apiKey, body: { t: 1 } });
    assert.equal(withOldKey.status, 401);
    assert.equal(withNewKey.status, 201);
  });

  it('deletes the device together with its readings', async () => {
    const created = await createUserDevice(owner.token);
    await server.request('/api/ingest', { method: 'POST', apiKey: created.body.apiKey, body: { t: 1 } });

    const res = await server.request(`/api/user-devices/${created.body.userDevice.id}`, {
      method: 'DELETE',
      token: owner.token,
    });
    assert.equal(res.status, 204);
    assert.equal(await Reading.count(), 0);
  });
});
