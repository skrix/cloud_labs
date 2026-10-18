// Device catalog. Every signed-in user can read it; only admins can change it.
const express = require('express');
const devicesService = require('../services/devices');
const { authenticate } = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/require-admin');
const { validateId } = require('../validators/helpers');
const { validateDeviceCreate, validateDeviceUpdate } = require('../validators/devices');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const devices = await devicesService.listDevices();
  res.json(devices);
});

router.get('/:id', async (req, res) => {
  const id = validateId(req.params.id);
  const device = await devicesService.getDevice(id);
  res.json(device);
});

router.post('/', requireAdmin, async (req, res) => {
  const fields = validateDeviceCreate(req.body);
  const device = await devicesService.createDevice(fields);
  res.status(201).json(device);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const id = validateId(req.params.id);
  const changes = validateDeviceUpdate(req.body);
  const device = await devicesService.updateDevice(id, changes);
  res.json(device);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = validateId(req.params.id);
  await devicesService.deleteDevice(id);
  res.status(204).end();
});

module.exports = router;
