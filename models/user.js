"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false
    },

    username: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false
    }
  });
};