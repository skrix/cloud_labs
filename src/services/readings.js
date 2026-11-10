const { randomUUID } = require('node:crypto');
const { Op } = require('sequelize');
const { sequelize } = require('../db');
const { UserDevice, Reading } = require('../db/models');
const { HttpError } = require('../errors');
const { hashApiKey } = require('../utils/crypto');
const { readingStats } = require('../utils/stats');
const { cache } = require('../cache');
const { ingestQueue } = require('../queue');
const { findOwnedUserDevice } = require('./user-devices');

async function findUserDeviceByApiKey(apiKey) {
  if (!apiKey) {
    throw new HttpError(401, 'Missing X-Device-Key header');
  }
  const userDevice = await UserDevice.findOne({ where: { apiKeyHash: hashApiKey(apiKey) } });
  if (!userDevice) {
    throw new HttpError(401, 'Invalid device key');
  }
  return userDevice;
}

async function listReadings(userId, userDeviceId, { from, to, limit }) {
  await findOwnedUserDevice(userId, userDeviceId);
  return Reading.findAll({
    where: { userDeviceId, createdAt: { [Op.between]: [from, to] } },
    order: [['createdAt', 'DESC']],
    limit,
  });
}

async function getReadingStats(userId, userDeviceId, { from, to, bucket, periodKey }) {
  await findOwnedUserDevice(userId, userDeviceId);
  return cache.getOrLoad(`stats:${userDeviceId}:${bucket}:${periodKey}`, async () => {
    const readings = await Reading.findAll({
      attributes: ['data', 'createdAt'],
      where: { userDeviceId, createdAt: { [Op.between]: [from, to] } },
      raw: true,
    });
    return { from, to, bucket, ...readingStats(readings, bucket) };
  });
}

async function getReading(userId, userDeviceId, readingId) {
  await findOwnedUserDevice(userId, userDeviceId);
  const reading = await Reading.findOne({ where: { id: readingId, userDeviceId } });
  if (!reading) {
    throw new HttpError(404, 'Reading not found');
  }
  return reading;
}

async function ingestReading(apiKey, data) {
  const userDevice = await findUserDeviceByApiKey(apiKey);
  return sequelize.transaction(async (transaction) => {
    const reading = await Reading.create({ userDeviceId: userDevice.id, data }, { transaction });
    await userDevice.update({ lastSeenAt: reading.createdAt }, { transaction });
    return reading;
  });
}

async function ingestReadings(apiKey, items) {
  const userDevice = await findUserDeviceByApiKey(apiKey);
  return sequelize.transaction(async (transaction) => {
    const readings = await Reading.bulkCreate(
      items.map((data) => ({ userDeviceId: userDevice.id, data })),
      { transaction },
    );
    await userDevice.update({ lastSeenAt: readings[readings.length - 1].createdAt }, { transaction });
    return readings;
  });
}

async function acceptReadings(apiKey, items) {
  const userDevice = await findUserDeviceByApiKey(apiKey);
  const createdAt = new Date().toISOString();
  const readings = items.map((data) => ({ id: randomUUID(), userDeviceId: userDevice.id, data, createdAt }));
  await ingestQueue.send({ readings });
  return readings;
}

async function storeReadings(readings) {
  const latest = readings.reduce((max, reading) => (reading.createdAt > max ? reading.createdAt : max), '');
  await sequelize.transaction(async (transaction) => {
    await Reading.bulkCreate(readings, { ignoreDuplicates: true, transaction });
    await UserDevice.update(
      { lastSeenAt: sequelize.fn('GREATEST', sequelize.col('lastSeenAt'), new Date(latest)) },
      { where: { id: readings[0].userDeviceId }, transaction },
    );
  });
}

module.exports = {
  listReadings,
  getReadingStats,
  getReading,
  ingestReading,
  ingestReadings,
  acceptReadings,
  storeReadings,
};
