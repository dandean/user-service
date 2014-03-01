"use strict";

var fs = require('fs');
var Sequelize = require('sequelize');

// Manually import database configuration. Currently in this file to allow the
// sequelize CLI access using its own default file location.
var config = JSON.parse(fs.readFileSync('./config/config.json'))['development'];

// Connect to the database:
var sequelize = new Sequelize(config.database, config.username, config.password, {
  dialect: 'postgres',
  host: config.host,
  port: 5432
});

// Load the user model:
var User = sequelize.import(__dirname + '/../models/user');

// Synchronize sequelize models with the database:
sequelize
  .sync({ force: true })
  .success(function() {
    // Create the trigger
    // var query = '';
    // query += 'CREATE TRIGGER `before_insert_users` BEFORE INSERT ON `Users` FOR EACH ROW ';
    // query += 'SET NEW.id = UUID(), NEW.createdAt = NOW();';

    // sequelize
    //   .query(query, null, { raw: true })
    //   .success(function() {
    //     console.log('TRIGGER SUCCESS');
    //   })
    //   .error(function() {
    //     console.error('ERROR Creating Trigger');
    //     console.log(arguments);
    //   });
  })
  .error(function() {
    console.log('ERROR');
    console.log(arguments);
  });
