// Physical devices of the signed-in user. Every query is scoped to req.user.id.
const express = require('express');
const userDevicesService = require('../services/user-devices');
const readingsService = require('../services/readings');
const { authenticate } = require('../middleware/authenticate');
const { validateId } = require('../validators/helpers');
const {
  validateUserDeviceCreate,
  validateUserDeviceUpdate,
  validateReadingsQuery,
} = require('../validators/user-devices');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const userDevices = await userDevicesService.listUserDevices(req.user.id);
  res.json(userDevices);
});

router.get('/:id', async (req, res) => {
  const id = validateId(req.params.id);
  const userDevice = await userDevicesService.getUserDevice(req.user.id, id);
  res.json(userDevice);
});

router.post('/', async (req, res) => {
  const fields = validateUserDeviceCreate(req.body);
  const result = await userDevicesService.createUserDevice(req.user.id, fields);
  res.status(201).json(result);
});

router.patch('/:id', async (req, res) => {
  const id = validateId(req.params.id);
  const changes = validateUserDeviceUpdate(req.body);
  const userDevice = await userDevicesService.updateUserDevice(req.user.id, id, changes);
  res.json(userDevice);
});

router.delete('/:id', async (req, res) => {
  const id = validateId(req.params.id);
  await userDevicesService.deleteUserDevice(req.user.id, id);
  res.status(204).end();
});

router.post('/:id/rotate-key', async (req, res) => {
  const id = validateId(req.params.id);
  const result = await userDevicesService.rotateApiKey(req.user.id, id);
  res.json(result);
});

router.get('/:id/readings', async (req, res) => {
  const id = validateId(req.params.id);
  const query = validateReadingsQuery(req.query);
  const readings = await readingsService.listReadings(req.user.id, id, query);
  res.json(readings);
});

module.exports = router;
