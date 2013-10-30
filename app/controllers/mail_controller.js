// Generated by CoffeeScript 1.6.2
var User, checkBody, checkDocType, nodemailer, sendEmail, user,
  _this = this;

User = require('./lib/user');

user = new User();

nodemailer = require("nodemailer");

checkDocType = require('./lib/token').checkDocType;

before('permissionSendMail', function() {
  var auth,
    _this = this;

  auth = req.header('authorization');
  return checkDocType(auth, "send mail", function(err, appName, isAuthorized) {
    if (!appName) {
      err = new Error("Application is not authenticated");
      return send({
        error: err
      }, 401);
    } else if (!isAuthorized) {
      err = new Error("Application is not authorized");
      return send({
        error: err
      }, 403);
    } else {
      compound.app.feed.publish('usage.application', appName);
      return next();
    }
  });
}, {
  only: ['sendMail']
});

before('permissionSendMail', function() {
  var auth,
    _this = this;

  auth = req.header('authorization');
  return checkDocType(auth, "send mail to user", function(err, appName, isAuthorized) {
    if (!appName) {
      err = new Error("Application is not authenticated");
      return send({
        error: err
      }, 401);
    } else if (!isAuthorized) {
      err = new Error("Application is not authorized");
      return send({
        error: err
      }, 403);
    } else {
      compound.app.feed.publish('usage.application', appName);
      return next();
    }
  });
}, {
  only: ['sendMailToUser']
});

before('permissionSendMail', function() {
  var auth,
    _this = this;

  auth = req.header('authorization');
  return checkDocType(auth, "send mail from user", function(err, appName, isAuthorized) {
    if (!appName) {
      err = new Error("Application is not authenticated");
      return send({
        error: err
      }, 401);
    } else if (!isAuthorized) {
      err = new Error("Application is not authorized");
      return send({
        error: err
      }, 403);
    } else {
      compound.app.feed.publish('usage.application', appName);
      return next();
    }
  });
}, {
  only: ['sendMailFromUser']
});

sendEmail = function(mailOptions, callback) {
  var transport;

  transport = nodemailer.createTransport("SMTP", {});
  return transport.sendMail(mailOptions, function(error, response) {
    transport.close();
    return callback(error, response);
  });
};

checkBody = function(attributes) {
  var attr, _i, _len, _results;

  _results = [];
  for (_i = 0, _len = attributes.length; _i < _len; _i++) {
    attr = attributes[_i];
    if (body[attr] == null) {
      _results.push(send({
        error: "Body has not all necessary attributes"
      }, 400));
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

action('sendMail', function() {
  var mailOptions;

  checkBody(['to', 'from', 'subject', 'content']);
  mailOptions = {
    to: body.to,
    from: body.from,
    subject: body.subject,
    text: body.content,
    html: body.html || void 0
  };
  if (body.attachments != null) {
    mailOptions.attachments = body.attachments;
  }
  return sendEmail(mailOptions, function(error, response) {
    if (error) {
      console.log("[sendMail] Error : " + error);
      return send({
        error: error
      }, 500);
    } else {
      return send(response, 200);
    }
  });
});

action('sendMailToUser', function() {
  checkBody(['from', 'subject', 'content']);
  return user.getUser(function(err, user) {
    var mailOptions,
      _this = this;

    if (err) {
      console.log("[sendMailToUser] err: " + err);
      return send(500);
    } else {
      mailOptions = {
        to: user.email,
        from: body.from,
        subject: body.subject,
        text: body.content,
        html: body.html || void 0
      };
      if (body.attachments != null) {
        mailOptions.attachments = body.attachments;
      }
      return sendEmail(mailOptions, function(error, response) {
        if (error) {
          console.log("[sendMail] Error : " + error);
          return send({
            error: error
          }, 500);
        } else {
          return send(response, 200);
        }
      });
    }
  });
});

action('sendMailFromUser', function() {
  checkBody(['to', 'subject', 'content']);
  return user.getUser(function(err, user) {
    var mailOptions,
      _this = this;

    if (err) {
      console.log("[sendMailFromUser] err: " + err);
      return send(500);
    } else {
      mailOptions = {
        to: body.to,
        from: user.email,
        subject: body.subject,
        text: body.content,
        html: body.html || void 0
      };
      if (body.attachments != null) {
        mailOptions.attachments = body.attachments;
      }
      return sendEmail(mailOptions, function(error, response) {
        if (error) {
          console.log("[sendMail] Error : " + error);
          return send({
            error: error
          }, 500);
        } else {
          return send(response, 200);
        }
      });
    }
  });
});
