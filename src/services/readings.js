const { Op } = require('sequelize');
const { UserDevice, Reading } = require('../db/models');
const { HttpError } = require('../errors');
const { hashApiKey } = require('../utils/crypto');
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

async function ingestReading(apiKey, data) {
  const userDevice = await findUserDeviceByApiKey(apiKey);
  const reading = await Reading.create({ userDeviceId: userDevice.id, data });
  await userDevice.update({ lastSeenAt: reading.createdAt });
  return reading;
}

module.exports = { listReadings, ingestReading };
