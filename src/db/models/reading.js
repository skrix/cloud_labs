'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reading extends Model {
    static associate(models) {
      this.belongsTo(models.UserDevice, { foreignKey: 'userDeviceId' });
    }
  }

  Reading.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userDeviceId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Reading'
  });

  return Reading;
};
