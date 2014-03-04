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

// TODO: Move UnprocessableEntity into its own module:
var util = require('util');

function UnprocessableEntity(message) {
  restify.RestError.call(this, {
    restCode: 'UnprocessableEntity',
    statusCode: 422,
    message: message,
    constructorOpt: UnprocessableEntity
  });
  this.name = 'UnprocessableEntity';
};
util.inherits(UnprocessableEntity, restify.RestError);

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
 * curl -v -X POST -H "Content-Type: application/json" -d '{"username":"dandean","email":"me@dandean.com"}' http://0.0.0.0:8082/users
**/
server.post('/users', function(req, res, next) {
  var user;
  var password;
  var data = {
    username: req.body.username,
    email: req.body.email
  };

  return checkForExistingUser();

  function checkForExistingUser() {
    User.find({
      where: Sequelize.or(
        { username: data.username },
        { email: data.email }
      )
    }).complete(function(error, user) {
      if (user)
        return next(new restify.ConflictError('The username or email is already taken'));

      testPasswordValue();
    });
  }

  function testPasswordValue() {
    password = (req.body.password || '').trim();
    if (password == '')
      return next(new UnprocessableEntity('Password is required'));

    if (/.{5,}/.test(password) == false)
      return next(new UnprocessableEntity('Password must be at least five characters'));

    buildUser();
  }

  function buildUser() {
    user = User.build(data);
    setPassword();
  }

  function setPassword() {
    user.setPassword(password, function(error) {
      if (error) throw error;
      save();
    });
  }

  function save(callback) {
    user.save().complete(function(error, user) {
      if (error) {
        if (error.username)
          return next(new UnprocessableEntity(error.username[0]));

        if (error.email)
          return next(new UnprocessableEntity(error.email[0]));

        throw error;
      }
      done();
    });
  }

  function done() {
    var result = user.toJSON();
    delete result.password;
    res.send(200, result);
    next();
  }
});

/**
 * GET /users/:id
 *
 * curl -v -X GET http://0.0.0.0:8082/users/2cef5667-d14d-49f6-974b-79b0e06cef73
**/
server.get('/users/:id', function(req, res, next) {
  User.find({ where: { id: req.params.id } }).complete(function(error, user) {
    if (error) throw error;

    if (user == null) {
      res.send(404);

    } else {
      res.send(200, user.values);
    }
    next();
  });
});

server.put('/users/:id', function(req, res, cb) {
});

server.patch('/users/:id', function(req, res, cb) {
});

server.del('/users/:id', function(req, res, cb) {
});

server.listen(8082, function() {
  console.log('%s listening at %s', server.name, server.url);
});
