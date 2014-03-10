"use strict";
var bcrypt = require('bcrypt');

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
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
      type: DataTypes.STRING(120),
      unique: true,
      allowNull: false,
      validate: {
        isAlphanumeric: {
          msg: 'Invalid username, only letters and numbers are allowed'
        }
      }
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
  },

  {
    // Do not delete records – just mark them as deleted.
    paranoid: true,

    classMethods: {
      /**
       * User.filterUserResult(object) -> Object
       * - object (Object|User): The user instance or object of user data
       *
       * Returns an object with sensitive properties removed.
      **/
      filterUserResult: function(object) {
        if (!object) return object;
        var user;
        if (object.toJSON) {
          user = object.toJSON();
          delete user.password;

        } else {
          user = {};
          console.log(object)
          Object.keys(object).forEach(function(key) {
            if (key == 'password') return;
            user[key] = object[key];
          });
        }
        return user;
      },

      /**
       * User.filterUserResult(array) -> Array
       * - array (Array<Object|User>): An array of user instances or objects
       *
       * Returns an array of objects with sensitive properties removed.
      **/
      filterUsersResult: function(array) {
        if (Array.isArray(array) == false) throw new Error('Invalid Argument');
        if (array.length == 0) return array;
        array = array.map(function(object) {
          return User.filterUserResult(object);
        });
        return array;
      }
    },

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

  return User;
};
