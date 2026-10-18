// Small building blocks shared by the resource validators.
// Each helper reads one field, throws BadRequestError if it is invalid, and returns the clean value.
const { BadRequestError } = require('../errors');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function requireObject(body) {
  if (!isPlainObject(body)) {
    throw new BadRequestError('Request body must be a JSON object');
  }
}

function requireString(body, field) {
  const value = body[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestError(`${field} is required and must be a non-empty string`);
  }
  return value;
}

// For fields that are optional in the request but cannot be empty or null in the database.
function optionalString(body, field) {
  if (body[field] === undefined) {
    return undefined;
  }
  return requireString(body, field);
}

// For optional columns: null clears the value.
function nullableString(body, field) {
  const value = body[field];
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value !== 'string') {
    throw new BadRequestError(`${field} must be a string or null`);
  }
  return value;
}

function requireUuid(body, field) {
  const value = body[field];
  if (!isUuid(value)) {
    throw new BadRequestError(`${field} is required and must be a UUID`);
  }
  return value;
}

function optionalUuid(body, field) {
  if (body[field] === undefined) {
    return undefined;
  }
  return requireUuid(body, field);
}

function nullableUuid(body, field) {
  const value = body[field];
  if (value === undefined || value === null) {
    return value;
  }
  return requireUuid(body, field);
}

// Route parameters are checked before the query, otherwise PostgreSQL rejects a non-UUID with a 500.
function validateId(id) {
  if (!isUuid(id)) {
    throw new BadRequestError('id must be a UUID');
  }
  return id;
}

// Fields the client did not send stay out of the result, so an update does not touch them.
function removeUndefined(fields) {
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

function requireAtLeastOneField(changes) {
  if (Object.keys(changes).length === 0) {
    throw new BadRequestError('Request body must contain at least one field to update');
  }
}

module.exports = {
  isPlainObject,
  requireObject,
  requireString,
  optionalString,
  nullableString,
  requireUuid,
  optionalUuid,
  nullableUuid,
  validateId,
  removeUndefined,
  requireAtLeastOneField,
};
