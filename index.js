"use strict";

var fs = require('fs');
var restify = require('restify');
var bunyan = require('bunyan');
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
server.use(restify.requestLogger());

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
 * curl -v -X GET http://0.0.0.0:8082/users
**/
server.get('/users', function(req, res, next) {
  User.findAll().complete(function(error, users) {
    if (error) {
      req.log.error(error);
      return next(new restify.InternalError(error));
    }
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
      if (error) {
        req.log.error(error);
        return next(new restify.InternalError(error));
      }

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
      if (error) {
        req.log.error(error);
        return next(new restify.InternalError(error));
      }
      save();
    });
  }

  function save() {
    user.save().complete(function(error, user) {
      if (error) {
        if (error.username)
          return next(new UnprocessableEntity(error.username[0]));

        if (error.email)
          return next(new UnprocessableEntity(error.email[0]));

        req.log.error(error);
        return next(new restify.InternalError(error));
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
 * curl -v -X GET http://0.0.0.0:8082/users/31d78fe5-e9bc-4a3c-b7c5-621b307a1a5f
**/
server.get('/users/:id', function(req, res, next) {
  User.find(req.params.id).complete(function(error, user) {
    if (error) {
      req.log.error(error);
      return next(new restify.InternalError(error));
    }

    if (user == null) {
      res.send(404);

    } else {

      var result = user.toJSON();
      delete result.password;
      res.send(200, result);
    }
    next();
  });
});

server.put('/users/:id', function(req, res, next) {
  res.send(404);
  next();
});

/**
 * PATCH /users/:id
 *
 * curl -v -X PATCH -H "Content-Type: application/json" -d '{"username":"dandean","email":"me@dandean.com", "password": "blah1234"}' http://0.0.0.0:8082/users/ec33bead-d53c-4de5-b168-6df836fa25da
**/
server.patch('/users/:id', function(req, res, next) {
  var user;
  var email = req.params.email;
  var username = req.params.username;
  var password = (req.body.password || '').trim();

  return findUser();

  function findUser() {
    User.find(req.params.id).complete(function(error, userResult) {
      if (error) {
        req.log.error(error);
        return next(new restify.InternalError(error));
      }

      if (userResult == null) {
        res.send(404);
        next();

      } else {
        user = userResult;
        findUserByEmail();
      }
    });
  }

  function findUserByEmail() {
    if (!email || user.email == email) return findUserByUsername();

    User.find({ where: { email: email } }).complete(function(error, user) {
      if (error) {
        req.log.error(error);
        return next(new restify.InternalError(error));
      }

      if (user)
        return next(new restify.ConflictError('The email is already taken'));

      findUserByUsername();
    });
  }

  function findUserByUsername() {
    if (!username || user.username == username) return testPasswordValue();

    User.find({ where: { username: username } }).complete(function(error, user) {
      if (error) {
        req.log.error(error);
        return next(new restify.InternalError(error));
      }

      if (user)
        return next(new restify.ConflictError('The username is already taken'));

      testPasswordValue();
    });
  }

  function testPasswordValue() {
    if (password == '') return updateUser();

    if (/.{5,}/.test(password) == false)
      return next(new UnprocessableEntity('Password must be at least five characters'));

    setPassword();
  }

  var passwordWasSet = false;
  function setPassword() {
    passwordWasSet = true;
    user.setPassword(password, function(error) {
      if (error) {
        req.log.error(error);
        return next(new restify.InternalError(error));
      }
      updateUser();
    });
  }

  function updateUser() {
    var attributes = {};
    if (email) attributes.email = email;
    if (username) attributes.username = username;
    if (passwordWasSet) attributes.password = user.password;

    user.updateAttributes(attributes).complete(function(error, user) {
      if (error) {
        req.log.error(error);
        return next(new restify.InternalError(error));
      }

      var result = user.toJSON();
      delete result.password;
      res.send(200, result);
      next();
    });
  }
});

/**
 * DELETE /users/:id
 *
 * curl -v -X DELETE http://0.0.0.0:8082/users/31d78fe5-e9bc-4a3c-b7c5-621b307a1a5f
**/
server.del('/users/:id', function(req, res, next) {
  User.find(req.params.id).complete(function(error, user) {
    if (error) {
      req.log.error(error);
      return next(new restify.InternalError(error));
    }

    if (user == null) {
      res.send(404);

    } else {

      user.destroy().complete(function(error) {
        if (error) {
          req.log.error(error);
          return next(new restify.InternalError(error));
        }
        res.send(204);
        next();
      });
    }
  });
});

/**
 * POST /authenticate
 *
 * curl -v -X POST -H "Content-Type: application/json" -d '{"username":"dandean","password":"blah1234"}' http://0.0.0.0:8082/authenticate
 * curl -v -X POST -H "Content-Type: application/json" -d '{"email":"me@dandean.com","password":"blah1234"}' http://0.0.0.0:8082/authenticate
**/
server.post('/authenticate', function(req, res, next) {
  var username = (req.params.username || '').trim();
  var email = (req.params.email || '').trim();
  var password = (req.params.password || '').trim();

  if (username == '' && password == '')
    return next(new restify.NotAuthorizedError('Username or email is required'));

  if (password == '')
    return next(new restify.NotAuthorizedError('Password is required'));

  var where = {};
  if (username) where.username = username;
  if (email) where.email = email;

  User.find({ where: where }).complete(function(error, user) {
    if (error) {
      req.log.error(error);
      return next(new restify.InternalError(error));
    }
    if (user == null) return next(new restify.ResourceNotFoundError());

    user.verifyPassword(password, function(error, result) {
      if (error) {
        req.log.error(error);
        return next(new restify.InternalError(error));
      }
      if (result == false) return next(new restify.NotAuthorizedError('Authentication failed'));

      res.send(200, user.toJSON());
    });
  });

});

server.listen(8082, function() {
  console.log('%s listening at %s', server.name, server.url);
});
