"use strict";

//
// BASIC IMPORTS
//

var fs = require('fs');
var Service = require('./lib/service');
var restify = require('restify');
var UnprocessableEntity = require('./lib/unprocessable-entity');
var Sequelize = require('sequelize');

//
// APPLICATION CONFIG
// Manually import database configuration. Currently in this file to allow the
// sequelize CLI access using its own default file location.
//

var config = JSON.parse(fs.readFileSync('./config/config.json'))['development'];

//
// CREATE AND CONFIGURE LOGGER
//

var Bunyan = require('bunyan');
var log = new Bunyan({
  name: 'UserService',
  streams: [
    {
      stream: process.stdout,
      level: 'debug'
    },
    {
      type: 'rotating-file',
      path: 'logs/trace.log',
      level: 'trace',
      period: '1d',           // Daily rotation
      count: 3                // Keep 3 back copies
    }
  ],
  serializers: {
    req: Bunyan.stdSerializers.req,
    res: restify.bunyan.serializers.res,
  },
});

//
// DATABASE CONNECTION
//

var sequelize = new Sequelize(config.database, config.username, config.password, {
  dialect: 'postgres',
  host: config.host,
  port: 5432,
  logging: function(message) {
    log.info('PSQL: %s', message);
  }
});

// Load the user model:
var User = sequelize.import(__dirname + "/lib/models/user");

//
// CREATE AND CONFIGURE SERVER
//

var server = restify.createServer({
  name: 'UserService',
  version: '0.0.0',
  log: log
});
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.requestLogger());

//
// SERVICE OBJECT
// Treat the "Service" module as the global namespace where all other modules
// can gain access to core members of the application.
//

Service.config = config;
Service.Sequelize = Sequelize;
Service.models.User = User;
Service.server = server;
Service.logger = log;

//
// HTTP RESOURCES
//

require('./lib/resources/authentication');
require('./lib/resources/users');

//
// START THE SERVER
//

server.listen(8082, function() {
  console.log('%s listening at %s', server.name, server.url);
});
