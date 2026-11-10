const { HttpError } = require('../errors');
const { isPlainObject } = require('./helpers');

function validateReadingData(body) {
  if (!isPlainObject(body)) {
    throw new HttpError(400, 'Reading must be a JSON object');
  }
  return body;
}

const MAX_BATCH_SIZE = 1000;

// A batch: readings a device buffered (e.g. while offline) and uploads at once.
function validateReadingBatch(body) {
  if (!Array.isArray(body) || body.length === 0 || body.length > MAX_BATCH_SIZE) {
    throw new HttpError(400, `A batch must be an array of 1 to ${MAX_BATCH_SIZE} readings`);
  }
  if (!body.every(isPlainObject)) {
    throw new HttpError(400, 'Every reading in a batch must be a JSON object');
  }
  return body;
}

module.exports = { MAX_BATCH_SIZE, validateReadingData, validateReadingBatch };
