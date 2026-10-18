// Mounts every resource router. app.js puts this router under /api.
const express = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);

module.exports = router;
