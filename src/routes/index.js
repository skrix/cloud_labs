// Mounts every resource router. app.js puts this router under /api.
const express = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');
const devicesRouter = require('./devices');
const firmwaresRouter = require('./firmwares');
const userDevicesRouter = require('./user-devices');
const ingestRouter = require('./ingest');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/devices', devicesRouter);
router.use('/firmwares', firmwaresRouter);
router.use('/user-devices', userDevicesRouter);
router.use('/ingest', ingestRouter);

module.exports = router;
