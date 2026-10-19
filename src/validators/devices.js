const { requireObject, requireString, optionalString, pick } = require('./helpers');

const DEVICE_FIELDS = ['name', 'chip', 'description'];

function validateDeviceCreate(body) {
  requireObject(body);
  requireString(body.name, 'name');
  optionalString(body.chip, 'chip');
  optionalString(body.description, 'description');
  return pick(body, DEVICE_FIELDS);
}

function validateDeviceUpdate(body) {
  requireObject(body);
  optionalString(body.name, 'name');
  optionalString(body.chip, 'chip');
  optionalString(body.description, 'description');
  return pick(body, DEVICE_FIELDS);
}

module.exports = { validateDeviceCreate, validateDeviceUpdate };
