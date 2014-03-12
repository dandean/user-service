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

var pkg = require('./package.json');

// Determine the environment. Default to "development" if not set.
var environmentName = pkg.name.toUpperCase().replace(/-/g, '_') + '_ENV';
var environment = process.env[environmentName] || 'development';

var config;
try {
  config = require('./config/' + environment + '.json');
} catch (error) {
  console.log(error.stack);
  var msg = 'Cannot parse config file for environment "' + environment + '". ';
  msg += 'Check the file at "config/' + environment + '.json".';
  throw new Error(msg);
}
config.environment = environment;

//
// CREATE AND CONFIGURE LOGGER
//

var Bunyan = require('bunyan');
var log = new Bunyan({
  name: pkg.name,
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
  name: pkg.name,
  version: pkg.version,
  log: log
});
server.use(restify.queryParser({ mapParams: false }));
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
  log.info('%s@%s (%s) listening at %s', server.name, pkg.version, environment, server.url);
});
