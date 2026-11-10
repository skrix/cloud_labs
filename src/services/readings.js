const { Op } = require('sequelize');
const { sequelize } = require('../db');
const { UserDevice, Reading } = require('../db/models');
const { HttpError } = require('../errors');
const { hashApiKey } = require('../utils/crypto');
const { readingStats } = require('../utils/stats');
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

async function getReadingStats(userId, userDeviceId, { from, to, bucket }) {
  await findOwnedUserDevice(userId, userDeviceId);
  const readings = await Reading.findAll({
    attributes: ['data', 'createdAt'],
    where: { userDeviceId, createdAt: { [Op.between]: [from, to] } },
    raw: true,
  });
  return { from, to, bucket, ...readingStats(readings, bucket) };
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

module.exports = { listReadings, getReadingStats, getReading, ingestReading, ingestReadings };
