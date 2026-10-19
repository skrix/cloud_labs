const { HttpError } = require('../errors');
const { requireObject, requireString } = require('./helpers');

const MIN_PASSWORD_LENGTH = 8;

function validateCredentials(body) {
  requireObject(body);
  requireString(body.email, 'email');
  requireString(body.password, 'password');
  return { email: body.email.toLowerCase(), password: body.password };
}

function validateSignup(body) {
  const credentials = validateCredentials(body);
  if (credentials.password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return credentials;
}

module.exports = { validateCredentials, validateSignup };
