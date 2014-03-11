var restify = require('restify');
var Service = require('../service');
var User = Service.models.User;
var server = Service.server;

/**
 * POST /authenticate
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

      res.send(200, User.filterUserResult(user));
    });
  });
});
