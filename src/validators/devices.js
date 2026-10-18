const {
  requireObject,
  requireString,
  optionalString,
  nullableString,
  removeUndefined,
  requireAtLeastOneField,
} = require('./helpers');

function validateDeviceCreate(body) {
  requireObject(body);
  return removeUndefined({
    name: requireString(body, 'name'),
    chip: nullableString(body, 'chip'),
    description: nullableString(body, 'description'),
  });
}

function validateDeviceUpdate(body) {
  requireObject(body);
  const changes = removeUndefined({
    name: optionalString(body, 'name'),
    chip: nullableString(body, 'chip'),
    description: nullableString(body, 'description'),
  });
  requireAtLeastOneField(changes);
  return changes;
}

module.exports = { validateDeviceCreate, validateDeviceUpdate };
