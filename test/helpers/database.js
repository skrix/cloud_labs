const { sequelize } = require('../../src/db');

function resetDatabase() {
  return sequelize.truncate({ cascade: true });
}

function closeDatabase() {
  return sequelize.close();
}

module.exports = { resetDatabase, closeDatabase };
