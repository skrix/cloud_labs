'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Firmware extends Model {
    static associate(models) {
      this.belongsTo(models.Device, { foreignKey: 'deviceId' });
      this.hasMany(models.UserDevice, { foreignKey: 'firmwareId' });
    }
  }

  Firmware.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false
    },
    releaseNotes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Firmware',
    indexes: [
      { unique: true, fields: ['deviceId', 'version'] }
    ]
  });

  return Firmware;
};
