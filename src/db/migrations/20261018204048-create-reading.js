'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Readings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      userDeviceId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'UserDevices', key: 'id' },
        onDelete: 'CASCADE'
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false
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

    await queryInterface.addIndex('Readings', [
      'userDeviceId',
      { name: 'createdAt', order: 'DESC' }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Readings');
  }
};
