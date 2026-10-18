// Firmware versions released for a catalog device.
const { Firmware } = require('../db/models');
const { NotFoundError } = require('../errors');
const { findDevice } = require('./devices');

async function findFirmware(id) {
  const firmware = await Firmware.findByPk(id);
  if (!firmware) {
    throw new NotFoundError('Firmware not found');
  }
  return firmware;
}

function listFirmwares(filter) {
  return Firmware.findAll({ where: filter, order: [['createdAt', 'ASC']] });
}

function getFirmware(id) {
  return findFirmware(id);
}

async function createFirmware(fields) {
  await findDevice(fields.deviceId);
  return Firmware.create(fields);
}

async function updateFirmware(id, changes) {
  const firmware = await findFirmware(id);
  return firmware.update(changes);
}

// User devices on this firmware get firmwareId = NULL (ON DELETE SET NULL).
async function deleteFirmware(id) {
  const firmware = await findFirmware(id);
  await firmware.destroy();
}

module.exports = {
  findFirmware,
  listFirmwares,
  getFirmware,
  createFirmware,
  updateFirmware,
  deleteFirmware,
};
