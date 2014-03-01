"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: sequelize.fn('uuid_generate_v4')
    },

    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },

    username: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      validate: {
        isAlphanumeric: true
      }
    }
  });
};
