const express = require('express');
const readingsService = require('../services/readings');
const { validateReadingData, validateReadingBatch } = require('../validators/ingest');

const router = express.Router();

router.post('/', async (req, res) => {
  if (Array.isArray(req.body)) {
    const readings = await readingsService.ingestReadings(req.get('X-Device-Key'), validateReadingBatch(req.body));
    res.status(201).json(readings);
    return;
  }
  const data = validateReadingData(req.body);
  const reading = await readingsService.ingestReading(req.get('X-Device-Key'), data);
  res.status(201).json(reading);
});

module.exports = router;
