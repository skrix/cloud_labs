const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  ValidationError,
  ValidationErrorItem,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} = require('sequelize');
const { HttpError } = require('../../src/errors');
const { errorHandler } = require('../../src/middleware/error-handler');

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function handle(err) {
  const res = createResponse();
  errorHandler(err, {}, res, () => {});
  return res;
}

describe('errorHandler', () => {
  beforeEach((t) => {
    t.mock.method(console, 'log', () => {});
  });

  it('uses the status and message of an HttpError', () => {
    const res = handle(new HttpError(404, 'Device not found'));
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Device not found' });
  });

  it('maps a Sequelize validation error to 400', () => {
    const err = new ValidationError('Validation error', [new ValidationErrorItem('email must be a valid email address')]);
    const res = handle(err);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: 'email must be a valid email address' });
  });

  it('maps a unique constraint error to 409', () => {
    const err = new UniqueConstraintError({ errors: [new ValidationErrorItem('email must be unique')] });
    const res = handle(err);
    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, { error: 'email must be unique' });
  });

  it('maps a foreign key error to 409', () => {
    const res = handle(new ForeignKeyConstraintError({}));
    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, { error: 'The resource is referenced by other records' });
  });

  it('passes through client errors from Express, like malformed JSON', () => {
    const err = Object.assign(new Error('Unexpected token'), { status: 400, expose: true });
    const res = handle(err);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: 'Unexpected token' });
  });

  it('hides details of unknown errors and logs them', () => {
    const res = handle(new Error('password=secret in SQL'));
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: 'Internal server error' });
    assert.equal(console.log.mock.callCount(), 1);
  });
});
