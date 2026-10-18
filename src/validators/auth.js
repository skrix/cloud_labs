const { BadRequestError } = require('../errors');
const { requireObject, requireString } = require('./helpers');

const MIN_PASSWORD_LENGTH = 8;

// Emails are stored lower-case so "Bob@x.com" and "bob@x.com" are the same account.
function validateCredentials(body) {
  requireObject(body);
  return {
    email: requireString(body, 'email').toLowerCase(),
    password: requireString(body, 'password'),
  };
}

// Length is checked only on sign-up so old passwords keep working if the rule changes.
// `role` is not returned, so nobody can sign up as admin.
function validateSignup(body) {
  const credentials = validateCredentials(body);
  if (credentials.password.length < MIN_PASSWORD_LENGTH) {
    throw new BadRequestError(`password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return credentials;
}

module.exports = { validateCredentials, validateSignup };
