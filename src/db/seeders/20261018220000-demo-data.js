const { hashPassword, hashApiKey } = require('../../utils/crypto');
const { DEVICES, FIRMWARES } = require('./20261018210000-catalog');

const HOUR_MS = 60 * 60 * 1000;
const READING_HOURS = 72;

// Demo users with devices and readings; the catalog and admin come from the catalog seeder.
const USERS = [
  { id: 'a0000000-0000-4000-8000-000000000002', email: 'alice@example.com', password: 'alice12345', role: 'user' },
  { id: 'a0000000-0000-4000-8000-000000000003', email: 'bob@example.com', password: 'bob12345', role: 'user' },
];

const USER_DEVICES = [
  { id: 'e0000000-0000-4000-8000-000000000001', userId: USERS[0].id, deviceId: DEVICES[0].id, firmwareId: FIRMWARES[1].id, name: 'Kitchen sensor', apiKey: 'demo-key-kitchen' },
  { id: 'e0000000-0000-4000-8000-000000000002', userId: USERS[0].id, deviceId: DEVICES[1].id, firmwareId: FIRMWARES[2].id, name: 'Balcony sensor', apiKey: 'demo-key-balcony' },
  { id: 'e0000000-0000-4000-8000-000000000003', userId: USERS[1].id, deviceId: DEVICES[0].id, firmwareId: null, name: 'Garage sensor', apiKey: 'demo-key-garage' },
];

function withTimestamps(row, date) {
  return { ...row, createdAt: date, updatedAt: date };
}

async function userRows(now) {
  const rows = [];
  for (const { password, ...user } of USERS) {
    rows.push(withTimestamps({ ...user, passwordHash: await hashPassword(password) }, now));
  }
  return rows;
}

function userDeviceRows(now) {
  return USER_DEVICES.map(({ apiKey, ...userDevice }) =>
    withTimestamps({ ...userDevice, apiKeyHash: hashApiKey(apiKey), lastSeenAt: now }, now),
  );
}

function readingRows(now) {
  const rows = [];
  for (const [deviceIndex, userDevice] of USER_DEVICES.entries()) {
    for (let hour = 1; hour <= READING_HOURS; hour += 1) {
      const data = {
        temperature: Number((20 + deviceIndex * 3 + 4 * Math.sin(hour / 4)).toFixed(1)),
        humidity: Math.round(45 + 10 * Math.cos(hour / 6)),
      };
      const createdAt = new Date(now.getTime() - hour * HOUR_MS);
      rows.push(withTimestamps({ userDeviceId: userDevice.id, data: JSON.stringify(data) }, createdAt));
    }
  }
  return rows;
}

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const options = { ignoreDuplicates: true };

    await queryInterface.bulkInsert('Users', await userRows(now), options);
    await queryInterface.bulkInsert('UserDevices', userDeviceRows(now), options);
    await queryInterface.bulkDelete('Readings', { userDeviceId: USER_DEVICES.map((userDevice) => userDevice.id) });
    await queryInterface.bulkInsert('Readings', readingRows(now));
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', { id: USERS.map((user) => user.id) });
  },
};
