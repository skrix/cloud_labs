// Mounts every resource router. app.js puts this router under /api.
const express = require('express');
const healthRouter = require('./health');

const router = express.Router();

router.use('/health', healthRouter);

module.exports = router;
