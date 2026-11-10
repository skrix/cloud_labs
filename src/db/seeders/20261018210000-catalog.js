// Admin account and device catalog (part of npm run db:setup).
// Admin credentials come from ADMIN_EMAIL / ADMIN_PASSWORD (.env locally).
const { randomUUID } = require('crypto');
const { hashPassword } = require('../../utils/crypto');

const DEVICES = [
  { id: 'd0000000-0000-4000-8000-000000000001', name: 'ESP32 DevKitC', chip: 'ESP32-WROOM-32', description: 'Classic dual-core board' },
  { id: 'd0000000-0000-4000-8000-000000000002', name: 'ESP32-S3 DevKit', chip: 'ESP32-S3', description: 'Board with USB OTG' },
  { id: 'd0000000-0000-4000-8000-000000000003', name: 'ESP32-C3 SuperMini', chip: 'ESP32-C3', description: 'Small RISC-V board' },
];

const FIRMWARES = [
  { id: 'f0000000-0000-4000-8000-000000000001', deviceId: DEVICES[0].id, version: '1.0.0', releaseNotes: 'First release' },
  { id: 'f0000000-0000-4000-8000-000000000002', deviceId: DEVICES[0].id, version: '1.1.0', releaseNotes: 'Humidity sensor support' },
  { id: 'f0000000-0000-4000-8000-000000000003', deviceId: DEVICES[1].id, version: '2.0.0', releaseNotes: 'First S3 release' },
];

function adminCredentials() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set (see .env.example)');
  }
  return { email, password };
}

function withTimestamps(row, date) {
  return { ...row, createdAt: date, updatedAt: date };
}

module.exports = {
  DEVICES,
  FIRMWARES,

  async up(queryInterface) {
    const { email, password } = adminCredentials();
    const now = new Date();
    const options = { ignoreDuplicates: true };

    const admin = { id: randomUUID(), email, passwordHash: await hashPassword(password), role: 'admin' };
    await queryInterface.bulkInsert('Users', [withTimestamps(admin, now)], options);
    await queryInterface.bulkInsert('Devices', DEVICES.map((device) => withTimestamps(device, now)), options);
    await queryInterface.bulkInsert('Firmwares', FIRMWARES.map((firmware) => withTimestamps(firmware, now)), options);
  },

  async down(queryInterface) {
    const { email } = adminCredentials();
    await queryInterface.bulkDelete('Firmwares', { id: FIRMWARES.map((firmware) => firmware.id) });
    await queryInterface.bulkDelete('Devices', { id: DEVICES.map((device) => device.id) });
    await queryInterface.bulkDelete('Users', { email });
  },
};
