const express = require('express');
const userDevicesService = require('../services/user-devices');
const readingsService = require('../services/readings');
const { authenticate } = require('../middleware/authenticate');
const { validateIdParam } = require('../middleware/validate-id');
const {
  validateUserDeviceCreate,
  validateUserDeviceUpdate,
  validateReadingsQuery,
} = require('../validators/user-devices');

const router = express.Router();

router.use(authenticate);
router.param('id', validateIdParam);

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

module.exports = router;
