fs = require 'fs'
feed = require '../lib/feed'
checkDocType = require('../lib/token').checkDocType
db = require('../helpers/db_connect_helper').db_connect()
log = require('printit')()

count = 0

### Helpers ###

## function recoverDocs (callback)
## @res {tab} design docs without views
## @docs {tab} design docs with view
## @callback {function} Continuation to pass control back to when complete.
## Callback all design documents from database
recoverDocs = (res, docs, callback) =>
    if res and res.length isnt 0
        doc = res.pop()
        db.get doc.id, (err, result) =>
            docs.push(result)
            recoverDocs res, docs, callback
    else
        callback docs

## function recoverDocs (callback)
## @callback {function} Continuation to pass control back to when complete.
## Callback all design documents from database
recoverDesignDocs = (callback) =>
    filterRange =
        startkey: "_design/"
        endkey: "_design0"
    db.all filterRange, (err, res) =>
        recoverDocs res, [], callback

indexAllView = () ->
    log.info "Update all views ...."
    recoverDesignDocs (docs) =>
        for doc in docs
            for view, body of doc.views
                type = doc._id.substr 8, doc._id.length-1
                log.info "Update view #{type}/#{view}"
                db.view "#{type}/#{view}", {}, (err, res, body) ->
                    log.error err if err?




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
        indexAllView()
        count = 0
    next()

