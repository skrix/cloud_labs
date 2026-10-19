const { randomUUID } = require('node:crypto');
const { User, Device, Firmware } = require('../../src/db/models');
const { hashPassword } = require('../../src/utils/crypto');
const { createToken } = require('../../src/utils/jwt');

const TEST_PASSWORD = 'test-password';
const testPasswordHash = hashPassword(TEST_PASSWORD);

async function createUser({ role = 'user' } = {}) {
  const user = await User.create({
    email: `user-${randomUUID()}@example.com`,
    passwordHash: await testPasswordHash,
    role,
  });
  return { user, token: createToken(user) };
}

function createDevice(fields = {}) {
  return Device.create({ name: `Device ${randomUUID()}`, chip: 'ESP32', ...fields });
}

function createFirmware(deviceId, fields = {}) {
  return Firmware.create({ deviceId, version: '1.0.0', ...fields });
}

module.exports = { TEST_PASSWORD, createUser, createDevice, createFirmware };
