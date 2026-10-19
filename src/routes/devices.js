const express = require('express');
const devicesService = require('../services/devices');
const { authenticate } = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/require-admin');
const { validateIdParam } = require('../middleware/validate-id');
const { validateDeviceCreate, validateDeviceUpdate } = require('../validators/devices');

const router = express.Router();

router.use(authenticate);
router.param('id', validateIdParam);

router.get('/', async (req, res) => {
  const devices = await devicesService.listDevices();
  res.json(devices);
});

router.get('/:id', async (req, res) => {
  const device = await devicesService.getDevice(req.params.id);
  res.json(device);
});

router.post('/', requireAdmin, async (req, res) => {
  const fields = validateDeviceCreate(req.body);
  const device = await devicesService.createDevice(fields);
  res.status(201).json(device);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const changes = validateDeviceUpdate(req.body);
  const device = await devicesService.updateDevice(req.params.id, changes);
  res.json(device);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await devicesService.deleteDevice(req.params.id);
  res.status(204).end();
});

module.exports = router;
