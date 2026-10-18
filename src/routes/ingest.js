// Called by the devices themselves: authenticated by X-Device-Key, not by a JWT.
const express = require('express');
const readingsService = require('../services/readings');
const { validateDeviceKey, validateReadingData } = require('../validators/ingest');

const router = express.Router();

router.post('/', async (req, res) => {
  const apiKey = validateDeviceKey(req.get('X-Device-Key'));
  const data = validateReadingData(req.body);
  const reading = await readingsService.ingestReading(apiKey, data);
  res.status(201).json(reading);
});

module.exports = router;
