var mongo = require("mongodb")
var async = require("async")
var validate = require("./validate.js")
var db = require("./db.js")
var configs = require("./configs.js")

var sub = module.exports = (function(){
    var sub = {}

    sub.subscribevalidate = function(req, res, next){
        async.parallel([
            function(done){
                validate.shorttext(req.body.email, function(er){
                    done(er)
                })
            }
        ], function(er){
            if (er){
                console.log(JSON.stringify({error:"subscribe validate",er:er}, 0, 2))
                res.send({error:"subscribe validate",er:er})
            } else next(null)
        })
    }

    sub.subscribe = function(req, res){
        async.waterfall([
            function(done){
                var entry = {
                    email: req.body.email,
                    created: new Date(),
                    modified: new Date(),
                }
                db.create(configs.table.subs, entry, function(er, entries){
                    if (er) done(er)
                    else if (entries && entries.length) done(null, entries[0])
                    else done({error:"subscribe",er:"null result"})
                })
            },
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"subscribe",er:er}, 0, 2))
                res.send({error:"subscribe"})
            } else {
                res.send({sub:re})
            }
        })
    }

    sub.getsubsvalidate = function(req, res, next){
        async.parallel([
            function(done){
                var page = req.query.page || 0
                validate.integer(page, function(er){
                    done(er)
                })
            },
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"get subs validate",er:er}, 0, 2))
                res.send({error:"get subs validate"})
            } else next(null)
        })
    }

    sub.getsubs = function(req, res){
        var query = {
            del: {$exists:false}
        }
        var aux = {
            sort: [["modified","desc"]],
            limit: configs.bigpagesize,
            skip: req.query.page * configs.bigpagesize
        }
        async.waterfall([
            function(done){
                db.get(configs.table.subs, query, aux, function(er, entries){
                    done(er, entries)
                })
            },
            function(entries, done){
                db.count(configs.table.subs, query, function(er, count){
                    done(er, entries, count)
                })
            }
        ], function(er, entries, count){
            if (er){
                console.log(JSON.stringify({error:"get subs",er:er}, 0, 2))
                res.send({error:"get subs"})
            } else {
                res.send({
                    subs: entries,
                    total: count,
                    page: req.query.page,
                    pagesize: configs.bigpagesize
                })
            }
        })
    }

    return sub
}())