const { Op } = require('sequelize');
const { sequelize } = require('../db');
const { UserDevice, Reading } = require('../db/models');
const { UnauthorizedError } = require('../errors');
const { hashApiKey } = require('../utils/crypto');
const { findOwnedUserDevice } = require('./user-devices');

async function findUserDeviceByApiKey(apiKey) {
  const userDevice = await UserDevice.findOne({ where: { apiKeyHash: hashApiKey(apiKey) } });
  if (!userDevice) {
    throw new UnauthorizedError('Invalid device key');
  }
  return userDevice;
}

function createdAtRange(from, to) {
  const range = {};
  if (from) {
    range[Op.gte] = from;
  }
  if (to) {
    range[Op.lte] = to;
  }
  return range;
}

async function listReadings(userId, userDeviceId, { from, to, limit }) {
  await findOwnedUserDevice(userId, userDeviceId);

  const where = { userDeviceId };
  if (from || to) {
    where.createdAt = createdAtRange(from, to);
  }
  return Reading.findAll({ where, order: [['createdAt', 'DESC']], limit });
}

async function ingestReading(apiKey, data) {
  const userDevice = await findUserDeviceByApiKey(apiKey);

  return sequelize.transaction(async (transaction) => {
    const reading = await Reading.create({ userDeviceId: userDevice.id, data }, { transaction });
    await userDevice.update({ lastSeenAt: reading.createdAt }, { transaction });
    return reading;
  });
}

module.exports = { listReadings, ingestReading };
