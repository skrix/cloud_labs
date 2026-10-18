const {
  requireObject,
  requireString,
  optionalString,
  nullableString,
  requireUuid,
  optionalUuid,
  removeUndefined,
  requireAtLeastOneField,
} = require('./helpers');

function validateFirmwareFilter(query) {
  return removeUndefined({
    deviceId: optionalUuid(query, 'deviceId'),
  });
}

function validateFirmwareCreate(body) {
  requireObject(body);
  return removeUndefined({
    deviceId: requireUuid(body, 'deviceId'),
    version: requireString(body, 'version'),
    releaseNotes: nullableString(body, 'releaseNotes'),
  });
}

// deviceId is not editable: user devices on this firmware would end up with another device's firmware.
function validateFirmwareUpdate(body) {
  requireObject(body);
  const changes = removeUndefined({
    version: optionalString(body, 'version'),
    releaseNotes: nullableString(body, 'releaseNotes'),
  });
  requireAtLeastOneField(changes);
  return changes;
}

module.exports = { validateFirmwareFilter, validateFirmwareCreate, validateFirmwareUpdate };
