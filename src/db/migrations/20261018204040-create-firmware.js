'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Firmwares', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      deviceId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Devices', key: 'id' },
        onDelete: 'RESTRICT'
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false
      },
      releaseNotes: {
        type: Sequelize.TEXT
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

    await queryInterface.addIndex('Firmwares', ['deviceId', 'version'], {
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Firmwares');
  }
};
