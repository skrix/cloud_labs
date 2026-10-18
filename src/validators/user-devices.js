const { BadRequestError } = require('../errors');
const {
  requireObject,
  requireString,
  optionalString,
  requireUuid,
  nullableUuid,
  removeUndefined,
  requireAtLeastOneField,
} = require('./helpers');

const DEFAULT_READINGS_LIMIT = 100;
const MAX_READINGS_LIMIT = 1000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/;
const DIGITS_PATTERN = /^\d+$/;

function validateUserDeviceCreate(body) {
  requireObject(body);
  return removeUndefined({
    name: requireString(body, 'name'),
    deviceId: requireUuid(body, 'deviceId'),
    firmwareId: nullableUuid(body, 'firmwareId'),
  });
}

function validateUserDeviceUpdate(body) {
  requireObject(body);
  const changes = removeUndefined({
    name: optionalString(body, 'name'),
    firmwareId: nullableUuid(body, 'firmwareId'),
  });
  requireAtLeastOneField(changes);
  return changes;
}

function optionalIsoDate(query, field) {
  const value = query[field];
  if (value === undefined) {
    return undefined;
  }
  const date = new Date(value);
  const isValid = typeof value === 'string' && ISO_DATE_PATTERN.test(value) && !Number.isNaN(date.getTime());
  if (!isValid) {
    throw new BadRequestError(`${field} must be an ISO 8601 date`);
  }
  return date;
}

function readingsLimit(query) {
  const value = query.limit;
  if (value === undefined) {
    return DEFAULT_READINGS_LIMIT;
  }
  const limit = Number(value);
  const isValid = typeof value === 'string' && DIGITS_PATTERN.test(value) && limit >= 1 && limit <= MAX_READINGS_LIMIT;
  if (!isValid) {
    throw new BadRequestError(`limit must be an integer from 1 to ${MAX_READINGS_LIMIT}`);
  }
  return limit;
}

function validateReadingsQuery(query) {
  return removeUndefined({
    from: optionalIsoDate(query, 'from'),
    to: optionalIsoDate(query, 'to'),
    limit: readingsLimit(query),
  });
}

module.exports = { validateUserDeviceCreate, validateUserDeviceUpdate, validateReadingsQuery };
