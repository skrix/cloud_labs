const { UserDevice, Device, Firmware } = require('../db/models');
const { HttpError } = require('../errors');
const { generateApiKey, hashApiKey } = require('../utils/crypto');
const { findDevice } = require('./devices');

async function findOwnedUserDevice(userId, id, options = {}) {
  const userDevice = await UserDevice.findOne({ where: { id, userId }, ...options });
  if (!userDevice) {
    throw new HttpError(404, 'User device not found');
  }
  return userDevice;
}

async function checkFirmwareBelongsToDevice(firmwareId, deviceId) {
  if (!firmwareId) {
    return;
  }
  const firmware = await Firmware.findByPk(firmwareId);
  if (!firmware || firmware.deviceId !== deviceId) {
    throw new HttpError(400, 'firmwareId must be a firmware of the same device');
  }
}

function listUserDevices(userId) {
  return UserDevice.findAll({ where: { userId }, order: [['createdAt', 'ASC']] });
}

function getUserDevice(userId, id) {
  return findOwnedUserDevice(userId, id, { include: [Device, Firmware] });
}

async function createUserDevice(userId, fields) {
  await findDevice(fields.deviceId);
  await checkFirmwareBelongsToDevice(fields.firmwareId, fields.deviceId);

  const apiKey = generateApiKey();
  const userDevice = await UserDevice.create({ ...fields, userId, apiKeyHash: hashApiKey(apiKey) });
  return { userDevice, apiKey };
}

async function updateUserDevice(userId, id, changes) {
  const userDevice = await findOwnedUserDevice(userId, id);
  await checkFirmwareBelongsToDevice(changes.firmwareId, userDevice.deviceId);
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
