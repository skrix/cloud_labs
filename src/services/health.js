// Health checks used by the load balancer and by operators.
const { sequelize } = require('../db');
const { logger } = require('../utils/logger');

async function isDatabaseReachable() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (err) {
    logger.error('database health check failed', { error: err.message });
    return false;
  }
}

module.exports = { isDatabaseReachable };
