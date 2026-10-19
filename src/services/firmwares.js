const { Firmware } = require('../db/models');
const { HttpError } = require('../errors');
const { findDevice } = require('./devices');

async function getFirmware(id) {
  const firmware = await Firmware.findByPk(id);
  if (!firmware) {
    throw new HttpError(404, 'Firmware not found');
  }
  return firmware;
}

function listFirmwares(filter) {
  return Firmware.findAll({ where: filter, order: [['createdAt', 'ASC']] });
}

async function createFirmware(fields) {
  await findDevice(fields.deviceId);
  return Firmware.create(fields);
}

async function updateFirmware(id, changes) {
  const firmware = await getFirmware(id);
  return firmware.update(changes);
}

async function deleteFirmware(id) {
  const firmware = await getFirmware(id);
  await firmware.destroy();
}

module.exports = {
  listFirmwares,
  getFirmware,
  createFirmware,
  updateFirmware,
  deleteFirmware,
};
