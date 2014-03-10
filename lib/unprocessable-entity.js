module.exports = UnprocessableEntity;

var restify = require('restify');
var util = require('util');

restify.UnprocessableEntity = UnprocessableEntity;

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
