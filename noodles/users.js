var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var db = new mongo.Db(process.env.DB || "bookses", server)
var async = require("async")
var request = require("request")
var validate = require("./validate.js")
var imglib = require("./img.js")

var k = {
    tables: {
        users: "users",
    },
    class: {
        classic: "classic",
        published: "published",
        indie: "indie",
        amateur: "amateur",
    }
}

db.open(function(er, db) {
    if (er) throw er
    console.log(module.filename + " connecting to " + (process.env.DB || "bookses"))
    db.collection(k.tables.users, {safe:true}, function(er, docs){
        if (er) throw er
        else docs.ensureIndex({username:1}, function(er, re){
            if (er) throw er
        })
    })
})

var DB = (function(){
    var DB = {}

    DB.create = function(table, entry, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"DB.create",table:table,entry:entry,er:er})
            else docs.insert(entry, {safe:true}, function(er, entries){
                if (er) done({error:"DB.create",table:table,entry:entry,er:er})
                else if (entries[0]) done(null, entries[0])
                else done({error:"DB.create",er:"no entry returned"})
            })
        })
    }

    DB.get = function(table, query, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.get",query:query,er:er})
            else docs.findOne(query, function(er, entry){
                if (er) done({error:"db.get",query:query,er:er})
                else done(null, entry)
            })
        })
    }

    DB.get_user = function(query, excludes, done){
        db.collection(k.tables.users, {safe:true}, function(er, docs){
            if (er) done({error:"db.get_user",query:query,er:er})
            else docs.findOne(query, excludes, function(er, entry){
                if (er) done({error:"db.get_user",query:query,er:er})
                else done(null, entry)
            })
        })
    }

    // mark
    DB.update_entry = function(table, query, update, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.update_entry",table:table,query:query,update:update,er:er})
            else docs.update(query, update, {
                safe: true
            }, function(er, num){
                if (er) done({error:"db.update_entry",table:table,query:query,update:update,er:er})
                else done(null, num)
            })
        })
    }

    return DB
}())

var users = module.exports = (function(){
    var users = {}

    users.create_user_validate = function(req, res, next){
        async.waterfall([
            function(done){
                validate.username(req.params.username, function(er){
                    done(er)
                })
            },
            function(done){
                validate.password(req.body.password, function(er){
                    done(er)
                })
            },
            function(done){
                if (req.body.email && req.body.email.length > 1000){
                    done({info:"email too long"})
                } else done(null)
            },
            function(done){
                var query = {
                    username: req.params.username
                }
                DB.get(k.tables.users, query, function(er, entry){
                    if (er) done(er)
                    else if (entry) done({info:"user exists"})
                    else done(null)
                })
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"users.create_user_validate",er:er}, 0, 2))
                res.send({error:"creating user",info:er.info})
            } else next(null)
        })
    }

    users.create_user = function(req, res){
        var id = new mongo.ObjectID()
        var user = {
            _id: id,
            username: req.params.username,
            password: req.body.password,
            email: req.body.email,
            created: new Date(),
            class: k.class.amateur
        }
        DB.create(k.tables.users, user, function(er, user){
            if (er){
                console.log(JSON.stringify({error:"users.create_user",user:user,er:er}, 0, 2))
                res.send({error:"creating user"})
            } else {
                req.session.username = user.username
                req.session.password = user.password
                res.send({user:user})
            }
        })
    }

    users.login_validate = function(req, res, next){
        next(null)
    }

    users.login = function(req, res){
        DB.get_user({
            username: req.params.username,
            password: req.body.password
        }, {}, function(er, user){
            if (er){
                console.log(JSON.stringify({error:"users.login",er:er}, 0, 2))
                res.send({error:"login"})
            } else if (user){
                req.session.username = user.username
                req.session.password = user.password
                res.send({user:user})
            } else {
                res.send({error:"no such user"})
            }
        })
    }

    users.logout = function(req, res){
        req.session.username = null
        req.session.password = null
        res.send({loggedout:true})
    }

    users.authenticate = function(req, res, next){
        DB.get_user({
            username: req.session.username,
            password: req.session.password
        }, {}, function(er, user){
            if (er){
                console.log(JSON.stringify({error:"users.authenticate",er:er}, 0, 2))
                res.send({error:"authenticate"})
            } else if (user){
                next(null)
            } else {
                res.send({loggedin:false})
            }
        })
    }

    users.authenticate_anonymous = function(req, res, next){
        var username = req.session.username
        var password = req.session.password
        if (!username || username == "anonymous"){
            req.session.username = "anonymous"
            next(null)
        } else if (username) DB.get_user({
            username: username,
            password: password
        }, {}, function(er, user){
            if (er){
                console.log(JSON.stringify({error:"users.authenticate",er:er}, 0, 2))
                res.send({error:"authenticate"})
            } else if (user){
                next(null)
            } else {
                res.send({loggedin:false})
            }
        })
    }

    users.is_logged_in = function(req, res){
        if (req.session.username && req.session.password){
            res.send({
                user: {
                    username: req.session.username,
                    loggedin: true
                }
            })
        } else {
            res.send({
                user: {
                    username: req.session.username,
                    loggedin: false
                }
            })
        }
    }

    users.get_user_public_info_validate = function(req, res, next){
        next(null)
    }

    users.get_user_public_info = function(req, res){
        DB.get_user({
            username: req.params.username,
        }, {
            password: 0,
            notis: 0,
            email: 0,
        }, function(er, user){
            if (er){
                console.log(JSON.stringify({error:"users.get_user_public_info",er:er}, 0, 2))
                res.send({error:"get_user_public_info"})
            } else if (user){
                res.send({user:user})
            } else {
                res.send({error:"no such user"})
            }
        })
    }

    // mark todo
    users.edit_user_validate = function(req, res, next){
        async.waterfall([
            function(done){
                done(null)
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"users.edit_user_validate",er:er}, 0, 2))
                res.send({error:"edit user validate",info:er.error})
            } else next(null)
        })
    }

    users.edit_user = function(req, res){
        async.waterfall([
            function(done){
                var update = {}
                if (req.body.email) update.email = req.body.email
                if (req.files.img && req.files.img.headers && req.files.img.headers["content-type"]){
                    var ext = req.files.img.headers["content-type"].split("/")[1]
                    if (ext != "jpeg" && ext != "png" && ext != "gif")
                        return done({error:"processing img",er:"only accepts jpg, png, gif"})
                    update.img = k.static_public + "/" + id + "." + ext
                    update.thumb = k.static_public + "/" + id + ".thumb." + ext
                } else if (req.files.img){
                    return done({error:"processing img",er:"can't read img headers"})
                }
                DB.update_entry(k.tables.users, {
                    username: req.session.username
                },{
                    $set: update
                }, function(er, num){
                    done(er)
                })
            },
            function(done){
                DB.get_user({
                    username: req.session.username,
                }, {}, function(er, user){
                    done(er, user)
                })
            },
            function(user, done){
                if (req.files.img){
                    imglib.process_img(req.files.img, 100, user.username, function(er){
                        if (er) console.log(JSON.stringify(er, 0, 2))
                        done(null, user)
                    })
                } else done(null, user)
            }
        ], function(er, user){
            if (er){
                console.log(JSON.stringify({error:"users.edit_user",body:req.body,er:er}, 0, 2))
                res.send({error:"edit user"})
            } else {
                res.send({user:user})
            }
        })
    }

    return users
}())

var test = (function(){
    var test = {}

    test.k = {
        localhost: "http://localhost:8080",
    }

    test.create_user = function(){
        var username = process.argv[2]
        var password = process.argv[3]
        request.post({
            url: test.k.localhost + "/user/" + username,
            form: {password:password},
            json: true,
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    return test
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){
    test.create_user()
} else {

}
