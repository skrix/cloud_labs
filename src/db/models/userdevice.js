'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserDevice extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId' });
      this.belongsTo(models.Device, { foreignKey: 'deviceId' });
      this.belongsTo(models.Firmware, { foreignKey: 'firmwareId' });
      this.hasMany(models.Reading, { foreignKey: 'userDeviceId' });
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.apiKeyHash;
      return values;
    }
  }

  UserDevice.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    firmwareId: DataTypes.UUID,
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apiKeyHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    lastSeenAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'UserDevice',
  });

  return UserDevice;
};
