// Device catalog: generic device types (for example "ESP32 DevKit") that admins manage.
const { Device, Firmware } = require('../db/models');
const { NotFoundError } = require('../errors');

async function findDevice(id) {
  const device = await Device.findByPk(id);
  if (!device) {
    throw new NotFoundError('Device not found');
  }
  return device;
}

function listDevices() {
  return Device.findAll({ order: [['createdAt', 'ASC']] });
}

async function getDevice(id) {
  const device = await Device.findByPk(id, {
    include: Firmware,
    order: [[Firmware, 'createdAt', 'ASC']],
  });
  if (!device) {
    throw new NotFoundError('Device not found');
  }
  return device;
}

function createDevice(fields) {
  return Device.create(fields);
}

async function updateDevice(id, changes) {
  const device = await findDevice(id);
  return device.update(changes);
}

// The database refuses (ON DELETE RESTRICT) while firmwares or user devices refer to it -> 409.
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
