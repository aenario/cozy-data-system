// Generated by CoffeeScript 1.9.3
var checkPermissions, couchDBHeaders, db, getCredentialsHeader, request, requestOptions, retrieveJsonDocument, through, uCaseHeader, uCaseWord, url;

db = require('../helpers/db_connect_helper').db_connect();

checkPermissions = require('../helpers/utils').checkPermissionsSync;

request = require('request');

url = require('url');

through = require('through');

getCredentialsHeader = function() {
  var basicCredentials, credentials, password, username;
  username = db.connection.auth.username;
  password = db.connection.auth.password;
  credentials = username + ":" + password;
  basicCredentials = new Buffer(credentials).toString('base64');
  return "Basic " + basicCredentials;
};

uCaseWord = function(word) {
  switch (word) {
    case 'etag':
      return 'ETag';
    default:
      return word.replace(/^./, function(l) {
        return l.toUpperCase();
      });
  }
};

uCaseHeader = function(headerName) {
  return headerName.replace(/\w*/g, uCaseWord);
};

couchDBHeaders = function(nodeHeaders) {
  var couchHeaders, i, len, name, ref;
  couchHeaders = {};
  ref = Object.keys(nodeHeaders);
  for (i = 0, len = ref.length; i < len; i++) {
    name = ref[i];
    couchHeaders[uCaseHeader(name)] = nodeHeaders[name];
  }
  return couchHeaders;
};

retrieveJsonDocument = function(data) {
  var endJson, endJsonPart, endSeparator, json, jsonPart, separator, startJson, startJsonPart, startSeparator;
  startJson = data.indexOf('Content-Type: application/json');
  if (startJson === -1) {
    return ['document not full', null];
  }
  json = data.substring(0, startJson);
  endSeparator = json.lastIndexOf('\n');
  json = json.substring(0, endSeparator);
  startSeparator = json.lastIndexOf('\n');
  separator = data.substring(startSeparator + 1, endSeparator - 1);
  startJsonPart = data.indexOf(separator);
  json = data.substring(startJson, data.length);
  endJsonPart = json.indexOf(separator);
  if (endJsonPart === -1) {
    return ['document not full', null];
  }
  jsonPart = json.substring(0, endJsonPart);
  startJson = jsonPart.indexOf('{');
  endJson = jsonPart.lastIndexOf('}');
  json = jsonPart.substring(startJson, endJson + 1);
  return [null, JSON.parse(json)];
};

requestOptions = function(req) {
  var bodyToTransmit, err, headers, host, options, port, targetURL;
  headers = couchDBHeaders(req.headers);
  if (process.env.NODE_ENV === "production") {
    headers['Authorization'] = getCredentialsHeader();
  } else {
    headers['Authorization'] = null;
  }
  targetURL = req.url.replace('replication', db.name);
  host = db.connection.host;
  port = db.connection.port;
  options = {
    method: req.method,
    headers: headers,
    uri: url.resolve("http://" + host + ":" + port, targetURL)
  };
  if (req.body && options.headers['Content-Type'] === 'application/json') {
    if ((req.body != null) && Object.keys(req.body).length > 0) {
      bodyToTransmit = JSON.stringify(req.body);
      options['body'] = bodyToTransmit;
      err = checkPermissions(req, bodyToTransmit.docType);
      return [err, options];
    }
  }
  return [null, options];
};

module.exports.proxy = function(req, res, next) {
  var couchReq, data, err, options, permissions, ref, stream;
  ref = requestOptions(req), err = ref[0], options = ref[1];
  if (err != null) {
    return res.send(403, err);
  }
  stream = through();
  couchReq = request(options).on('response', function(response) {
    var data, headers, permissions;
    headers = couchDBHeaders(response.headers);
    res.set(headers);
    res.statusCode = response.statusCode;
    data = [];
    permissions = false;
    response.on('data', function(chunk) {
      var content, doc, ref1;
      if (req.method === 'GET') {
        if (permissions) {
          return res.write(chunk);
        } else {
          data.push(chunk);
          if (headers['Content-Type'] === 'application/json') {
            try {
              doc = JSON.parse(Buffer.concat(data));
            } catch (_error) {}
          } else {
            content = Buffer.concat(data).toString();
            ref1 = retrieveJsonDocument(content), err = ref1[0], doc = ref1[1];
          }
          if (doc) {
            err = checkPermissions(req, doc.docType);
            if (err) {
              res.send(403, err);
              return couchReq.end();
            } else {
              permissions = true;
              return res.write(Buffer.concat(data));
            }
          }
        }
      } else {
        return res.write(chunk);
      }
    });
    return response.on('end', function() {
      return res.end();
    });
  }).on('error', function(err) {
    console.log('error');
    return res.send(500, err);
  });
  stream.pipe(couchReq);
  data = [];
  permissions = false;
  req.on('data', function(chunk) {
    var doc, ref1;
    if (permissions) {
      return stream.emit('data', chunk);
    } else {
      data.push(chunk);
      ref1 = retrieveJsonDocument(Buffer.concat(data).toString()), err = ref1[0], doc = ref1[1];
      if (!err) {
        err = checkPermissions(req, doc.docType);
        if (err) {
          res.send(403, err);
          stream.emit('end');
          couchReq.end();
          return req.destroy();
        } else {
          permissions = true;
          return stream.emit('data', Buffer.concat(data));
        }
      }
    }
  });
  return req.on('end', function() {
    return stream.emit('end');
  });
};
