'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserDevices', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      deviceId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Devices', key: 'id' },
        onDelete: 'RESTRICT'
      },
      firmwareId: {
        type: Sequelize.UUID,
        references: { model: 'Firmwares', key: 'id' },
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      apiKeyHash: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      lastSeenAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('UserDevices', ['userId']);
    await queryInterface.addIndex('UserDevices', ['deviceId']);
    await queryInterface.addIndex('UserDevices', ['firmwareId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserDevices');
  }
};
