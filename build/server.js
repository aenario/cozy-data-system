// Generated by CoffeeScript 1.8.0
var application;

require('nodetime').profile({
  accountKey: '00661417eb0e61cf6d2ca140ccc8417cfdb15421',
  appName: 'Node.js Application'
});

require('v8-profiler');

application = module.exports = function(callback) {
  var americano, errorMiddleware, initialize, options;
  americano = require('americano');
  initialize = require('./server/initialize');
  errorMiddleware = require('./server/middlewares/errors');
  options = {
    name: 'data-system',
    port: process.env.PORT || 9101,
    host: process.env.HOST || "127.0.0.1",
    root: __dirname
  };
  return americano.start(options, function(app, server) {
    app.use(errorMiddleware);
    return initialize(app, server, callback);
  });
};

if (!module.parent) {
  application();
}
