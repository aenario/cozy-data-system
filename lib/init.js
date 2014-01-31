// Generated by CoffeeScript 1.7.1
var db, encryption;

db = require('../helpers/db_connect_helper').db_connect();

encryption = require('./encryption');

exports.initPassword = function(callback) {
  if (process.env !== 'development') {
    db.view("bankaccess/all", {}, (function(_this) {
      return function(err, res) {
        if (!err) {
          return res.forEach(function(value) {
            if (value.password != null) {
              return encryption.decrypt(value.password, (function(_this) {
                return function(err, password) {
                  if (password === value.password) {
                    return encryption.encrypt(value.password, function(err, password) {
                      value.password = password;
                      return db.save(value.id, value, function(err, res, body) {});
                    });
                  }
                };
              })(this));
            }
          });
        }
      };
    })(this));
  }
  return callback();
};