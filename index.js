"use strict";

var fs = require('fs');
var restify = require('restify');
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
var User = sequelize.import(__dirname + "/models/user");

var server = restify.createServer({
  name: 'UserService',
  version: '0.0.0'
});
server.use(restify.queryParser());
server.use(restify.bodyParser());

/**
 * GET /users
 *
 * curl -v -X GET http://0.0.0.0:8080/users
**/
server.get('/users', function(req, res, cb) {
  User.findAll().complete(function(error, users) {
    if (error) throw error;
    res.send(200, users);
    next();
  });
});

/**
 * POST /users
 *
 * curl -v -X POST application/json" -d '{"username":"dandean","email":"me@dandean.com"}' http://0.0.0.0:8080/users
**/
server.post('/users', function(req, res, next) {
  // MySQL cannot auto-insert a generated UUID and return it. Must be done in
  // two separate queries:
  sequelize.query('SELECT UUID();', null, { raw: true }).done(function(error, result) {
    if (error) {
      res.send(500, error)
      return next();
    }

    var data = {
      id: result[0]['UUID()'],
      username: req.body.username,
      email: req.body.email
    };

    User.create(data).done(function(error, user) {
      if (error) throw error;
      res.send(200, user.values);
      next();
    });
  });
});

/**
 * GET /users/:id
 *
 * curl -v -X GET http://0.0.0.0:8080/users/13f507b6-0892-11e3-8dba-22e206753ccb
**/
server.get('/users/:id', function(req, res, next) {
  User.find({ where: { id: req.params.id } }).complete(function(error, user) {
    if (error) throw error;

    res.send(user == null ? 404 : 200, user.values);

    next();
  });
});

server.put('/users/:id', function(req, res, cb) {
});

server.patch('/users/:id', function(req, res, cb) {
});

server.del('/users/:id', function(req, res, cb) {
});


server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
