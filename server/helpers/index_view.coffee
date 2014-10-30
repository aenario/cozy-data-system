log = require('printit')()
db = require('../helpers/db_connect_helper').db_connect()

## Callback all design documents from database
recoverDocs = (res, docs, callback) =>
    if res and res.length isnt 0
        doc = res.pop()
        db.get doc.id, (err, result) =>
            docs.push(result)
            recoverDocs res, docs, callback
    else
        callback docs

## Callback all design documents from database
recoverDesignDocs = (callback) =>
    filterRange =
        startkey: "_design/"
        endkey: "_design0"
    db.all filterRange, (err, res) =>
        recoverDocs res, [], callback

# Index all views in <views>
updateViews = (type, views, callback) ->
    if views.length > 0
        view = views.pop()
        log.info "Update view #{type}/#{view}"
        db.view "#{type}/#{view}", {}, (err, res, body) ->
            log.error err if err?
            updateViews type, views, callback
    else
        callback()

# Index all views in all documents in <docs>
updateDocs = (docs, callback) ->
    if docs.length > 0
        doc = docs.pop()
        type = doc._id.substr 8, doc._id.length-1
        updateViews type, Object.keys(doc.views), () ->
            updateDocs docs, callback
    else
        callback()

# index all views
index = module.exports = (callback) ->
    log.info "Update all views ...."
    recoverDesignDocs (docs) =>
        updateDocs docs, () ->
            callback() if callback?

if not module.parent
    index()