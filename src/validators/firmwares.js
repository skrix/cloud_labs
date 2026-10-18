const { requireObject, requireString, optionalString, requireUuid, optionalUuid, pick } = require('./helpers');

function validateFirmwareFilter(query) {
  optionalUuid(query.deviceId, 'deviceId');
  return pick(query, ['deviceId']);
}

function validateFirmwareCreate(body) {
  requireObject(body);
  requireUuid(body.deviceId, 'deviceId');
  requireString(body.version, 'version');
  optionalString(body.releaseNotes, 'releaseNotes');
  return pick(body, ['deviceId', 'version', 'releaseNotes']);
}

function validateFirmwareUpdate(body) {
  requireObject(body);
  optionalString(body.version, 'version');
  optionalString(body.releaseNotes, 'releaseNotes');
  return pick(body, ['version', 'releaseNotes']);
}

module.exports = { validateFirmwareFilter, validateFirmwareCreate, validateFirmwareUpdate };
