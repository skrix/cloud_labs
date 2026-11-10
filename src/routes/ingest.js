const express = require('express');
const readingsService = require('../services/readings');
const { ingestQueue } = require('../queue');
const { idempotency } = require('../idempotency');
const { hashApiKey } = require('../utils/crypto');
const { validateReadingData, validateReadingBatch, validateIdempotencyKey } = require('../validators/ingest');

const router = express.Router();

async function ingest(apiKey, body) {
  const isBatch = Array.isArray(body);
  const items = isBatch ? validateReadingBatch(body) : [validateReadingData(body)];

  if (ingestQueue.enabled) {
    const readings = await readingsService.acceptReadings(apiKey, items);
    const [first] = readings;
    return {
      status: 202,
      body: isBatch ? readings : first,
      location: isBatch ? undefined : `/api/user-devices/${first.userDeviceId}/readings/${first.id}`,
    };
  }

  const readings = isBatch
    ? await readingsService.ingestReadings(apiKey, items)
    : [await readingsService.ingestReading(apiKey, items[0])];
  return { status: 201, body: isBatch ? readings : readings[0] };
}

router.post('/', async (req, res) => {
  const apiKey = req.get('X-Device-Key');
  const result = await idempotency.run({
    scope: `ingest:${hashApiKey(apiKey ?? '')}`,
    key: validateIdempotencyKey(req.get('Idempotency-Key')),
    body: req.body,
    execute: () => ingest(apiKey, req.body),
  });

  if (result.replayed) {
    res.set('Idempotent-Replayed', 'true');
  }
  if (result.location) {
    res.location(result.location);
  }
  res.status(result.status).json(result.body);
});

module.exports = router;
