const { HttpError } = require('../errors');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMissing(value) {
  return value === undefined || value === null;
}

function requireObject(body) {
  if (!isPlainObject(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, `${field} must be a non-empty string`);
  }
}

function optionalString(value, field) {
  if (!isMissing(value)) {
    requireString(value, field);
  }
}

function requireUuid(value, field) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new HttpError(400, `${field} must be a UUID`);
  }
}

function optionalUuid(value, field) {
  if (!isMissing(value)) {
    requireUuid(value, field);
  }
}

function pick(body, fields) {
  const result = {};
  for (const field of fields) {
    if (body[field] !== undefined) {
      result[field] = body[field];
    }
  }
  return result;
}

module.exports = {
  isPlainObject,
  requireObject,
  requireString,
  optionalString,
  requireUuid,
  optionalUuid,
  pick,
};
