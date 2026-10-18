const express = require('express');
const firmwaresService = require('../services/firmwares');
const { authenticate } = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/require-admin');
const { validateId } = require('../validators/helpers');
const {
  validateFirmwareFilter,
  validateFirmwareCreate,
  validateFirmwareUpdate,
} = require('../validators/firmwares');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const filter = validateFirmwareFilter(req.query);
  const firmwares = await firmwaresService.listFirmwares(filter);
  res.json(firmwares);
});

router.get('/:id', async (req, res) => {
  const id = validateId(req.params.id);
  const firmware = await firmwaresService.getFirmware(id);
  res.json(firmware);
});

router.post('/', requireAdmin, async (req, res) => {
  const fields = validateFirmwareCreate(req.body);
  const firmware = await firmwaresService.createFirmware(fields);
  res.status(201).json(firmware);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const id = validateId(req.params.id);
  const changes = validateFirmwareUpdate(req.body);
  const firmware = await firmwaresService.updateFirmware(id, changes);
  res.json(firmware);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = validateId(req.params.id);
  await firmwaresService.deleteFirmware(id);
  res.status(204).end();
});

module.exports = router;
