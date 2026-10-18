const { HttpError } = require('../errors');
const { requireObject, requireString, optionalString, requireUuid, optionalUuid, pick } = require('./helpers');

const DEFAULT_READINGS_LIMIT = 100;
const MAX_READINGS_LIMIT = 1000;

function validateUserDeviceCreate(body) {
  requireObject(body);
  requireString(body.name, 'name');
  requireUuid(body.deviceId, 'deviceId');
  optionalUuid(body.firmwareId, 'firmwareId');
  return pick(body, ['name', 'deviceId', 'firmwareId']);
}

function validateUserDeviceUpdate(body) {
  requireObject(body);
  optionalString(body.name, 'name');
  optionalUuid(body.firmwareId, 'firmwareId');
  return pick(body, ['name', 'firmwareId']);
}

function parseDate(value, field, defaultDate) {
  if (value === undefined) {
    return defaultDate;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${field} must be an ISO 8601 date`);
  }
  return date;
}

function parseLimit(value) {
  if (value === undefined) {
    return DEFAULT_READINGS_LIMIT;
  }
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_READINGS_LIMIT) {
    throw new HttpError(400, `limit must be an integer from 1 to ${MAX_READINGS_LIMIT}`);
  }
  return limit;
}

function validateReadingsQuery(query) {
  return {
    from: parseDate(query.from, 'from', new Date(0)),
    to: parseDate(query.to, 'to', new Date()),
    limit: parseLimit(query.limit),
  };
}

module.exports = { validateUserDeviceCreate, validateUserDeviceUpdate, validateReadingsQuery };
