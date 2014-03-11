var restify = require('restify');
var Service = require('../service');
var User = Service.models.User;
var Sequelize = Service.Sequelize;
var server = Service.server;

/**
 * sanitize(value) -> String
 * - value (String): The string to sanitize
 *
 * Strip special SQL characters to prevent SQL injection.
**/
function sanitize(value) {
  if (!value) return value;

  // TODO: Verify that this is enough. This is not my area of experitise.
  return value.replace(/['";\\]/g, '');
}

/**
 * GET /users -> Array<User>
 * - limit?     (Integer)
 * - page?      (Integer)
 * - query?     (String): Matches all fields
 * - username?  (String): Matches username field
 * - email?     (String): Matches email field
**/
server.get('/users', function(req, res, next) {
  // The query object to be passed to Sequelize:
  var query = {};

  // Limit the number of records returned:
  var limit = parseInt(req.query.limit);
  if (isNaN(limit) === false)
    query.limit = limit;

  // The page of records to return:
  var page = parseInt(req.query.page);
  if (isNaN(page) === false && query.limit)
    query.offset = (page - 1) * query.limit;

  // Plain text pattern searching:
  var fields = [];

  if (req.query.query) {
    // `query` given – search all fields:
    fields = ['username', 'email'];

  } else {
    // Search only requested fields:
    var username = (req.query.username || '').trim();
    var email = (req.query.email || '').trim();

    if (username) fields.push('username');
    if (email) fields.push('email');
  }

  if (fields.length > 0) {
    var whereQuery = '';
    var whereTerms = [];

    // Build the WHERE clause, including search on each requested field:
    fields.forEach(function(name) {
      var term = (req.query[name] || req.query['query'] || '').trim();

      // Only include the term if it's not an empty string:
      if (term) {
        // Escape the underscore and percent characters, as they are special
        // characters in the ILIKE expression:
        term = term.replace(/[_%]/g, '\_');
        term = sanitize(term);

        if (!term) return;

        // Append OR if we are searching multiple fields:
        if (whereQuery !== '') whereQuery += ' OR ';

        // ILIKE performs a case-insensitive search.
        // Wrap `term` in "%" to match any location in the value.
        whereQuery += name + " ILIKE ?";

        // Push the term into the query for injection:
        whereTerms.push('%' + term + '%');
      }
    });

    if (whereTerms.length > 0) {
      whereTerms.unshift(whereQuery);
      query.where = whereTerms;
    }
  }

  User.findAll(query).complete(function(error, users) {
    if (error) {
      req.log.error(error);
      return next(new restify.InternalError(error));
    }
    res.send(200, User.filterUsersResult(users));
    next();
  });
});

/**
 * POST /users -> Object<User>
 * - username (String)
 * - email (String)
 * - password (String)
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
      return next(new restify.UnprocessableEntity('Password is required'));

    if (/.{5,}/.test(password) == false)
      return next(new restify.UnprocessableEntity('Password must be at least five characters'));

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
          return next(new restify.UnprocessableEntity(error.username[0]));

        if (error.email)
          return next(new restify.UnprocessableEntity(error.email[0]));

        req.log.error(error);
        return next(new restify.InternalError(error));
      }
      done();
    });
  }

  function done() {
    res.send(200, User.filterUserResult(user));
    next();
  }
});

/**
 * GET /users/:id -> Object<User>
 * - :id (UUID)
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
      res.send(200, User.filterUserResult(user));
    }
    next();
  });
});

server.put('/users/:id', function(req, res, next) {
  res.send(404);
  next();
});

/**
 * PATCH /users/:id -> Object<User>
 * - :id (UUID)
 * - username (String)Optional
 * - email (String): Optional
 * - password (String): Optional
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
      return next(new restify.UnprocessableEntity('Password must be at least five characters'));

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

      res.send(200, User.filterUserResult(user));
      next();
    });
  }
});

/**
 * DELETE /users/:id -> null (204)
 * - :id (UUID)
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
