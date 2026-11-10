// Load test users and devices with a long readings history, so readings stats (the heaviest
// read) aggregate a realistic amount of data. Used by loadtest/script.js.
// loadtest-<u>@example.com / LOADTEST_PASSWORD, device API keys loadtest-key-<n>.
const { hashPassword, hashApiKey } = require('../../utils/crypto');
const { DEVICES } = require('./20261018210000-catalog');

const LOADTEST_PASSWORD = 'loadtest12345';
const USERS = 6;
const DEVICES_PER_USER = 10;
const HISTORY_DAYS = 30;
const INTERVAL_MS = 30 * 60 * 1000; // one reading every 30 minutes ≈ 1440 per device
const CHUNK = 5000;

const pad = (n) => String(n).padStart(12, '0');
const userId = (u) => `b0000000-0000-4000-8000-${pad(u + 1)}`;
const userDeviceId = (n) => `c0000000-0000-4000-8000-${pad(n + 1)}`;

function withTimestamps(row, date) {
  return { ...row, createdAt: date, updatedAt: date };
}

function reading(id, n, createdAt) {
  const hours = createdAt.getTime() / 3600000;
  const data = {
    temperature: Number((20 + (n % 5) + 4 * Math.sin(hours / 4) + Math.random()).toFixed(1)),
    humidity: Math.round(45 + 10 * Math.cos(hours / 6) + Math.random() * 5),
  };
  return withTimestamps({ userDeviceId: id, data: JSON.stringify(data) }, createdAt);
}

module.exports = {
  LOADTEST_PASSWORD,
  USERS,
  DEVICES_PER_USER,

  async up(queryInterface) {
    const now = new Date();
    const options = { ignoreDuplicates: true };
    const passwordHash = await hashPassword(LOADTEST_PASSWORD);

    const users = Array.from({ length: USERS }, (_, u) =>
      withTimestamps({ id: userId(u), email: `loadtest-${u}@example.com`, passwordHash, role: 'user' }, now),
    );
    await queryInterface.bulkInsert('Users', users, options);

    const devices = Array.from({ length: USERS * DEVICES_PER_USER }, (_, n) =>
      withTimestamps({
        id: userDeviceId(n),
        userId: userId(Math.floor(n / DEVICES_PER_USER)),
        deviceId: DEVICES[0].id,
        firmwareId: null,
        name: `Load test sensor ${n}`,
        apiKeyHash: hashApiKey(`loadtest-key-${n}`),
        lastSeenAt: now,
      }, now),
    );
    await queryInterface.bulkInsert('UserDevices', devices, options);

    const points = Math.floor((HISTORY_DAYS * 24 * 60 * 60 * 1000) / INTERVAL_MS);
    let rows = [];
    for (const [n, device] of devices.entries()) {
      for (let i = 1; i <= points; i += 1) {
        rows.push(reading(device.id, n, new Date(now.getTime() - i * INTERVAL_MS)));
        if (rows.length === CHUNK) {
          await queryInterface.bulkInsert('Readings', rows);
          rows = [];
        }
      }
    }
    if (rows.length > 0) {
      await queryInterface.bulkInsert('Readings', rows);
    }
  },

  // Devices and readings are removed by ON DELETE CASCADE.
  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', { id: Array.from({ length: USERS }, (_, u) => userId(u)) });
  },
};
