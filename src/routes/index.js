// Mounts every resource router. app.js puts this router under /api.
const express = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');
const devicesRouter = require('./devices');
const firmwaresRouter = require('./firmwares');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/devices', devicesRouter);
router.use('/firmwares', firmwaresRouter);

module.exports = router;
