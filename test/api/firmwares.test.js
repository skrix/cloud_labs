const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../helpers/server');
const { resetDatabase, closeDatabase } = require('../helpers/database');
const { createUser, createDevice, createFirmware } = require('../helpers/fixtures');
const { UserDevice } = require('../../src/db/models');

const UNKNOWN_ID = '0b8f0c5e-3f6a-4d2b-9c1e-7a5d4e3f2a10';

describe('firmwares', () => {
  let server;
  let admin;
  let user;

  before(async () => {
    server = await startServer();
  });

  beforeEach(async () => {
    await resetDatabase();
    admin = await createUser({ role: 'admin' });
    user = await createUser();
  });

  after(async () => {
    server.close();
    await closeDatabase();
  });

  it('filters firmwares by deviceId', async () => {
    const device = await createDevice();
    const otherDevice = await createDevice();
    await createFirmware(device.id);
    await createFirmware(otherDevice.id);

    const res = await server.request(`/api/firmwares?deviceId=${device.id}`, { token: user.token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map((firmware) => firmware.deviceId), [device.id]);
  });

  it('creates a firmware for an existing device', async () => {
    const device = await createDevice();
    const res = await server.request('/api/firmwares', {
      method: 'POST',
      token: admin.token,
      body: { deviceId: device.id, version: '2.0.0' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.version, '2.0.0');
  });

  it('returns 404 when the device does not exist', async () => {
    const res = await server.request('/api/firmwares', {
      method: 'POST',
      token: admin.token,
      body: { deviceId: UNKNOWN_ID, version: '1.0.0' },
    });
    assert.equal(res.status, 404);
  });

  it('rejects a duplicate version of the same device with 409', async () => {
    const device = await createDevice();
    await createFirmware(device.id, { version: '1.0.0' });
    const res = await server.request('/api/firmwares', {
      method: 'POST',
      token: admin.token,
      body: { deviceId: device.id, version: '1.0.0' },
    });
    assert.equal(res.status, 409);
  });

  it('clears firmwareId of user devices when the firmware is deleted', async () => {
    const device = await createDevice();
    const firmware = await createFirmware(device.id);
    const userDevice = await UserDevice.create({
      userId: user.user.id,
      deviceId: device.id,
      firmwareId: firmware.id,
      name: 'Kitchen',
      apiKeyHash: 'hash',
    });

    const res = await server.request(`/api/firmwares/${firmware.id}`, { method: 'DELETE', token: admin.token });
    await userDevice.reload();
    assert.equal(res.status, 204);
    assert.equal(userDevice.firmwareId, null);
  });
});
