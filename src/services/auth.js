const { randomUUID } = require('crypto');
const { User } = require('../db/models');
const { HttpError } = require('../errors');
const { hashPassword, verifyPassword } = require('../utils/crypto');
const { createToken } = require('../utils/jwt');

const missingUserPasswordHash = hashPassword(randomUUID());

async function signup({ email, password }) {
  const passwordHash = await hashPassword(password);
  return User.create({ email, passwordHash, role: 'user' });
}

async function signin({ email, password }) {
  const user = await User.findOne({ where: { email } });
  const passwordHash = user ? user.passwordHash : await missingUserPasswordHash;
  const isPasswordValid = await verifyPassword(password, passwordHash);

  if (!user || !isPasswordValid) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return createToken(user);
}

module.exports = { signup, signin };
