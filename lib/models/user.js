"use strict";
var bcrypt = require('bcrypt');

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
        isEmail: {
          msg: 'Invalid email address'
        }
      }
    },

    username: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      validate: {
        isAlphanumeric: {
          msg: 'Invalid username, only letters and numbers are allowed'
        }
      }
    },

    password: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
  },

  {
    paranoid: true,
    instanceMethods: {
      setPassword: function(password, callback) {
        return bcrypt.genSalt(10, function(error, salt) {
          if (error) return callback(error);

          return bcrypt.hash(password, salt, function(error, encrypted) {
            if (error) return callback(error);

            this.password = encrypted;
            return callback();
          }.bind(this));
        }.bind(this));
      },
      verifyPassword: function(password, callback) {
        return bcrypt.compare(password, this.password, function(error, res) {
          return callback(error, res);
        });
      }
    }
  });
};
