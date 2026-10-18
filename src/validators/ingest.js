const { BadRequestError, UnauthorizedError } = require('../errors');
const { isPlainObject } = require('./helpers');

// A missing key is an authentication failure, so 401 like a wrong key.
function validateDeviceKey(apiKey) {
  if (!apiKey) {
    throw new UnauthorizedError('Missing X-Device-Key header');
  }
  return apiKey;
}

function validateReadingData(body) {
  if (!isPlainObject(body)) {
    throw new BadRequestError('Reading must be a JSON object');
  }
  return body;
}

module.exports = { validateDeviceKey, validateReadingData };
