const express = require('express');
const readingsService = require('../services/readings');
const { validateReadingData } = require('../validators/ingest');

const router = express.Router();

router.post('/', async (req, res) => {
  const data = validateReadingData(req.body);
  const reading = await readingsService.ingestReading(req.get('X-Device-Key'), data);
  res.status(201).json(reading);
});

module.exports = router;
