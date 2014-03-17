"use strict";

var fs = require('fs');
var Sequelize = require('sequelize');
var pkg = require('../package.json');

// Determine the environment. Default to "development" if not set.
var environmentName = pkg.name.toUpperCase().replace(/-/g, '_') + '_ENV';
var environment = process.env[environmentName] || 'development';

var config;
try {
  config = require('../config/' + environment + '.json');
} catch (error) {
  console.log(error.stack);
  var msg = 'Cannot parse config file for environment "' + environment + '". ';
  msg += 'Check the file at "config/' + environment + '.json".';
  throw new Error(msg);
}
config.environment = environment;

// Connect to the database:
var sequelize = new Sequelize(config.database, config.username, config.password, {
  dialect: 'postgres',
  host: config.host,
  port: 5432
});

// Load the user model:
var User = sequelize.import(__dirname + '/../lib/models/user');

// Synchronize sequelize models with the database:
sequelize
  .sync({ force: true })
  .success(function() {
    sequelize
      .query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
      .success(function() {
        console.log('Created uuid-ossp Extension');
      })
      .error(function() {
        console.error('ERROR Creating uuid-ossp Extension');
        console.log(arguments);
      });
  })
  .error(function() {
    console.log('ERROR');
    console.log(arguments);
  });
