const express = require('express');
const readingsService = require('../services/readings');
const { ingestQueue } = require('../queue');
const { validateReadingData, validateReadingBatch } = require('../validators/ingest');

const router = express.Router();

router.post('/', async (req, res) => {
  const apiKey = req.get('X-Device-Key');
  const isBatch = Array.isArray(req.body);
  const items = isBatch ? validateReadingBatch(req.body) : [validateReadingData(req.body)];

  if (ingestQueue.enabled) {
    const readings = await readingsService.acceptReadings(apiKey, items);
    if (!isBatch) {
      const [reading] = readings;
      res.location(`/api/user-devices/${reading.userDeviceId}/readings/${reading.id}`);
    }
    res.status(202).json(isBatch ? readings : readings[0]);
    return;
  }

  const readings = isBatch
    ? await readingsService.ingestReadings(apiKey, items)
    : [await readingsService.ingestReading(apiKey, items[0])];
  res.status(201).json(isBatch ? readings : readings[0]);
});

module.exports = router;
