const { User } = require('../db/models');
const { UnauthorizedError } = require('../errors');
const { hashPassword, verifyPassword } = require('../utils/crypto');
const { createToken } = require('../utils/jwt');

// Compared against when the email is unknown, so the response time does not reveal which emails exist.
const DUMMY_PASSWORD_HASH = '$2b$12$A/21UVkRMvRbbN3UfUNwjOEKlQ69XW.4guPhG/hBeVPApj6dbx9FG';
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

async function signup({ email, password }) {
  const passwordHash = await hashPassword(password);
  return User.create({ email, passwordHash, role: 'user' });
}

async function signin({ email, password }) {
  const user = await User.findOne({ where: { email } });
  const passwordHash = user ? user.passwordHash : DUMMY_PASSWORD_HASH;
  const isPasswordValid = await verifyPassword(password, passwordHash);

  if (!user || !isPasswordValid) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  }
  return createToken(user);
}

module.exports = { signup, signin };
