const express = require('express');
const userDevicesService = require('../services/user-devices');
const readingsService = require('../services/readings');
const { authenticate } = require('../middleware/authenticate');
const { validateIdParam } = require('../middleware/validate-id');
const {
  validateUserDeviceCreate,
  validateUserDeviceUpdate,
  validateReadingsQuery,
  validateReadingsStatsQuery,
} = require('../validators/user-devices');

const router = express.Router();

router.use(authenticate);
router.param('id', validateIdParam);
router.param('readingId', validateIdParam);

router.get('/', async (req, res) => {
  const userDevices = await userDevicesService.listUserDevices(req.user.id);
  res.json(userDevices);
});

router.get('/:id', async (req, res) => {
  const userDevice = await userDevicesService.getUserDevice(req.user.id, req.params.id);
  res.json(userDevice);
});

router.post('/', async (req, res) => {
  const fields = validateUserDeviceCreate(req.body);
  const result = await userDevicesService.createUserDevice(req.user.id, fields);
  res.status(201).json(result);
});

router.patch('/:id', async (req, res) => {
  const changes = validateUserDeviceUpdate(req.body);
  const userDevice = await userDevicesService.updateUserDevice(req.user.id, req.params.id, changes);
  res.json(userDevice);
});

router.delete('/:id', async (req, res) => {
  await userDevicesService.deleteUserDevice(req.user.id, req.params.id);
  res.status(204).end();
});

router.post('/:id/rotate-key', async (req, res) => {
  const result = await userDevicesService.rotateApiKey(req.user.id, req.params.id);
  res.json(result);
});

router.get('/:id/readings', async (req, res) => {
  const query = validateReadingsQuery(req.query);
  const readings = await readingsService.listReadings(req.user.id, req.params.id, query);
  res.json(readings);
});

// Before /:id/readings/:readingId, which would otherwise take "stats" as a reading id.
router.get('/:id/readings/stats', async (req, res) => {
  const query = validateReadingsStatsQuery(req.query);
  res.json(await readingsService.getReadingStats(req.user.id, req.params.id, query));
});

router.get('/:id/readings/:readingId', async (req, res) => {
  const reading = await readingsService.getReading(req.user.id, req.params.id, req.params.readingId);
  res.json(reading);
});

module.exports = router;
