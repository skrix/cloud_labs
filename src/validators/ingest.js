const { HttpError } = require('../errors');
const { isPlainObject } = require('./helpers');

function validateReadingData(body) {
  if (!isPlainObject(body)) {
    throw new HttpError(400, 'Reading must be a JSON object');
  }
  return body;
}

module.exports = { validateReadingData };
