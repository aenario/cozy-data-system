fs = require 'fs'
feed = require '../lib/feed'
fork = require('child_process').fork
checkDocType = require('../lib/token').checkDocType
db = require('../helpers/db_connect_helper').db_connect()
log = require('printit')()
count = 0



# Delete files on the file system
module.exports.deleteFiles = (files) ->
    if files? and Object.keys(files).length > 0
        fs.unlinkSync file.path for key, file of files

# Check the application has the permissions to access the route
module.exports.checkPermissions = (req, permission, next) ->
    checkDocType req.header('authorization'), permission, (err, appName, isAuthorized) ->
        if not appName
            err = new Error "Application is not authenticated"
            err.status = 401
            next err
        else if not isAuthorized
            err = new Error "Application is not authorized"
            err.status = 403
            next err
        else
            feed.publish 'usage.application', appName
            req.appName = appName
            next()

module.exports.incrementCount = (next) ->
    count += 1
    if count > 100
        count = 0
        child = fork(__dirname + "/index_view.coffee")
        child.on 'message', (m) ->
            console.log 'received: ' + m
        child.on 'close', (code) ->
            console.log "process close with code #{code}"
    next()

