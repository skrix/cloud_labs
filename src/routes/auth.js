// Public endpoints to create an account and get a JWT.
const express = require('express');
const authService = require('../services/auth');
const { validateCredentials, validateSignup } = require('../validators/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const credentials = validateSignup(req.body);
  const user = await authService.signup(credentials);
  res.status(201).json(user);
});

router.post('/signin', async (req, res) => {
  const credentials = validateCredentials(req.body);
  const token = await authService.signin(credentials);
  res.json({ token });
});

module.exports = router;
