const { UserDevice, Device, Firmware } = require('../db/models');
const { BadRequestError, NotFoundError } = require('../errors');
const { generateApiKey, hashApiKey } = require('../utils/crypto');
const { findDevice } = require('./devices');

// Another user's device gives 404, not 403, so callers cannot probe which ids exist.
async function findOwnedUserDevice(userId, id, options = {}) {
  const userDevice = await UserDevice.findOne({ where: { id, userId }, ...options });
  if (!userDevice) {
    throw new NotFoundError('User device not found');
  }
  return userDevice;
}

async function checkFirmwareMatchesDevice(firmwareId, deviceId) {
  if (!firmwareId) {
    return;
  }
  const firmware = await Firmware.findByPk(firmwareId);
  if (!firmware || firmware.deviceId !== deviceId) {
    throw new BadRequestError('firmwareId must be a firmware of the same device');
  }
}

function listUserDevices(userId) {
  return UserDevice.findAll({ where: { userId }, order: [['createdAt', 'ASC']] });
}

function getUserDevice(userId, id) {
  return findOwnedUserDevice(userId, id, { include: [Device, Firmware] });
}

// Only the hash is stored, so the plain key can be shown to the owner this one time only.
async function createUserDevice(userId, fields) {
  await findDevice(fields.deviceId);
  await checkFirmwareMatchesDevice(fields.firmwareId, fields.deviceId);

  const apiKey = generateApiKey();
  const userDevice = await UserDevice.create({ ...fields, userId, apiKeyHash: hashApiKey(apiKey) });
  return { userDevice, apiKey };
}

async function updateUserDevice(userId, id, changes) {
  const userDevice = await findOwnedUserDevice(userId, id);
  await checkFirmwareMatchesDevice(changes.firmwareId, userDevice.deviceId);
  return userDevice.update(changes);
}

async function deleteUserDevice(userId, id) {
  const userDevice = await findOwnedUserDevice(userId, id);
  await userDevice.destroy();
}

async function rotateApiKey(userId, id) {
  const userDevice = await findOwnedUserDevice(userId, id);
  const apiKey = generateApiKey();
  await userDevice.update({ apiKeyHash: hashApiKey(apiKey) });
  return { userDevice, apiKey };
}

module.exports = {
  findOwnedUserDevice,
  listUserDevices,
  getUserDevice,
  createUserDevice,
  updateUserDevice,
  deleteUserDevice,
  rotateApiKey,
};
