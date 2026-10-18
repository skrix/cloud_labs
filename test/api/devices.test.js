const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../helpers/server');
const { resetDatabase, closeDatabase } = require('../helpers/database');
const { createUser, createDevice, createFirmware } = require('../helpers/fixtures');

const UNKNOWN_ID = '0b8f0c5e-3f6a-4d2b-9c1e-7a5d4e3f2a10';

describe('devices', () => {
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

  it('lists devices for any user', async () => {
    await createDevice();
    const res = await server.request('/api/devices', { token: user.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
  });

  it('returns a device with its firmwares', async () => {
    const device = await createDevice();
    await createFirmware(device.id);
    const res = await server.request(`/api/devices/${device.id}`, { token: user.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.Firmwares.length, 1);
  });

  it('returns 404 for an unknown device', async () => {
    const res = await server.request(`/api/devices/${UNKNOWN_ID}`, { token: user.token });
    assert.equal(res.status, 404);
  });

  it('lets only admins create devices', async () => {
    const body = { name: 'ESP32 DevKitC', chip: 'ESP32' };
    const asUser = await server.request('/api/devices', { method: 'POST', token: user.token, body });
    const asAdmin = await server.request('/api/devices', { method: 'POST', token: admin.token, body });
    assert.equal(asUser.status, 403);
    assert.equal(asAdmin.status, 201);
    assert.equal(asAdmin.body.name, body.name);
  });

  it('rejects a duplicate name with 409', async () => {
    const device = await createDevice();
    const res = await server.request('/api/devices', { method: 'POST', token: admin.token, body: { name: device.name } });
    assert.equal(res.status, 409);
  });

  it('updates a device', async () => {
    const device = await createDevice();
    const res = await server.request(`/api/devices/${device.id}`, {
      method: 'PATCH',
      token: admin.token,
      body: { description: 'Updated' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.description, 'Updated');
  });

  it('refuses to delete a device that has firmwares', async () => {
    const device = await createDevice();
    await createFirmware(device.id);
    const res = await server.request(`/api/devices/${device.id}`, { method: 'DELETE', token: admin.token });
    assert.equal(res.status, 409);
  });

  it('deletes an unused device', async () => {
    const device = await createDevice();
    const res = await server.request(`/api/devices/${device.id}`, { method: 'DELETE', token: admin.token });
    assert.equal(res.status, 204);
  });
});
