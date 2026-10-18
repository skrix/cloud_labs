const { Device, Firmware } = require('../db/models');
const { HttpError } = require('../errors');

async function findDevice(id, options = {}) {
  const device = await Device.findByPk(id, options);
  if (!device) {
    throw new HttpError(404, 'Device not found');
  }
  return device;
}

function listDevices() {
  return Device.findAll({ order: [['createdAt', 'ASC']] });
}

function getDevice(id) {
  return findDevice(id, { include: Firmware });
}

function createDevice(fields) {
  return Device.create(fields);
}

async function updateDevice(id, changes) {
  const device = await findDevice(id);
  return device.update(changes);
}

async function deleteDevice(id) {
  const device = await findDevice(id);
  await device.destroy();
}

module.exports = {
  findDevice,
  listDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
};
