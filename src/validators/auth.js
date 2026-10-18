// Input validation for sign-up and sign-in.
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

// The length rule is only checked on sign-up: sign-in must keep working if the rule changes later.
// Any `role` in the body is dropped here, so nobody can sign up as admin.
function validateSignup(body) {
  const credentials = validateCredentials(body);
  if (credentials.password.length < MIN_PASSWORD_LENGTH) {
    throw new BadRequestError(`password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return credentials;
}

module.exports = { validateCredentials, validateSignup };
