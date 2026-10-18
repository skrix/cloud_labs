const express = require('express');
const healthService = require('../services/health');

const router = express.Router();

function healthStatus(status) {
  return { status, timestamp: new Date().toISOString() };
}

router.get('/', (req, res) => {
  res.json(healthStatus('ok'));
});

router.get('/db', async (req, res) => {
  const isReachable = await healthService.isDatabaseReachable();
  if (!isReachable) {
    return res.status(503).json(healthStatus('error'));
  }
  res.json(healthStatus('ok'));
});

module.exports = router;
