var mongo = require("mongodb")
var async = require("async")
var validate = require("./validate.js")
var db = require("./db.js")
var configs = require("./configs.js")

var vote = module.exports = (function(){
    var vote = {}

    vote.createvotevalidate = function(req, res, next){
        async.parallel([
            function(done){
                validate.shorttext(req.body.text, function(er){
                    done(er)
                })
            },
            function(done){
                validate.html(req.body.text, function(er, re){
                    req.body.text = re
                    done(er)
                })
            }
        ], function(er){
            if (er){
                console.log(JSON.stringify({error:"create vote validate",er:er}, 0, 2))
                res.send({error:"create vote validate",er:er})
            } else next(null)
        })
    }

    vote.createvote = function(req, res){
        async.waterfall([
            function(done){
                var entry = {
                    text: req.body.text,
                    created: new Date(),
                    modified: new Date(),
                    votes: 1,
                }
                db.create(configs.table.votes, entry, function(er, entries){
                    if (er) done(er)
                    else if (entries && entries.length) done(null, entries[0])
                    else done({error:"create vote",er:"null result"})
                })
            },
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"create vote",er:er}, 0, 2))
                res.send({error:"create vote"})
            } else {
                res.send({vote:re})
            }
        })
    }

    vote.getvotesvalidate = function(req, res, next){
        async.parallel([
            function(done){
                var page = req.query.page || 0
                validate.integer(page, function(er){
                    done(er)
                })
            },
            function(done){
                if (req.query.limit) validate.integer(req.query.limit, function(er){
                    if (er) done({error:"limit not an integer"})
                    else {
                        req.query.limit = parseInt(req.query.limit)
                        done(null)
                    }
                })
                else done(null)
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"get votes validate",er:er}, 0, 2))
                res.send({error:"get votes validate"})
            } else next(null)
        })
    }

    vote.getvotes = function(req, res){
        var query = {
            del: {$exists:false}
        }
        var aux = {
            sort: [["votes","desc"],["modified","desc"]],
            limit: configs.bigpagesize,
            skip: req.query.page * configs.bigpagesize
        }
        if (req.query.limit && req.query.limit < configs.bigpagesize) aux.limit = req.query.limit
        if (req.query.recent == "true") aux.sort = [["created","desc"]]
        async.waterfall([
            function(done){
                db.get(configs.table.votes, query, aux, function(er, entries){
                    done(er, entries)
                })
            },
            function(entries, done){
                db.count(configs.table.votes, query, function(er, count){
                    done(er, entries, count)
                })
            }
        ], function(er, entries, count){
            if (er){
                console.log(JSON.stringify({error:"get votes",er:er}, 0, 2))
                res.send({error:"get votes"})
            } else {
                res.send({
                    votes: entries,
                    total: count,
                    page: req.query.page,
                    pagesize: configs.bigpagesize
                })
            }
        })
    }

    vote.upvotevalidate = function(req, res, next){
        async.parallel([
            function(done){
                validate.id(req.params.id, function(er){
                    if (er) done({error:"invalid id",er:er})
                    else done(null)
                })
            }
        ], function(er){
            if (er){
                console.log(JSON.stringify({error:"upvote validate",er:er}, 0, 2))
                res.send({error:"upvote validate"})
            } else next(null)
        })
    }

    vote.upvote = function(req, res){
        var ip = req.headers['x-forwarded-for']
        var username = req.session.username
        async.waterfall([
            function(done){
                if (process.env.ENV == "local") done(null, null)
                else db.get(configs.table.voters, {
                    ip: ip,
                    vote: req.params.id
                }, {}, function(er, entries){
                    done(er, entries)
                })
            },
            function(entries, done){
                if (process.env.ENV == "local") done(null)
                else if (req.session.username == "trong") done(null)
                else if (entries.length) done({info:"you already liked this"})
                else db.create(configs.table.voters, {
                    ip: ip,
                    username: username,
                    vote: req.params.id,
                    created: new Date(),
                }, function(er, entry){
                    done(er)
                })
            },
            function(done){
                db.update(configs.table.votes, {
                    _id: new mongo.ObjectID(req.params.id)
                },{
                    $inc: {votes:1},
                    $set: {modified:new Date()}
                }, function(er, num){
                    done(er, num)
                })
            }
        ], function(er, num){
            if (er){
                res.send({error:"upvote comment",info:er.info})
            } else {
                res.send({num:num})
            }
        })
    }

    vote.editvotevalidate = function(req, res, next){
        async.parallel([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"vote.editvotevalidate",er:er}, 0, 2))
                res.send({error:"edit vote validate",er:er})
            } else next(null)
        })
    }

    vote.editvote = function(req, res){
        var update = {
            modified: new Date(),
        }
        if (req.body.del == "true") update.del = true
        db.update(configs.table.votes, {
            _id: new mongo.ObjectID(req.params.id)
        },{
            $set: update
        }, function(er, num){
            if (er) res.send({error:"edit vote",er:er})
            else res.send({num:num})
        })
    }

    return vote
}())