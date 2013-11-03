var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var db = new mongo.Db(process.env.DB || "bookses", server)
db.open(function(er, db) {
    if (er) throw er
    console.log(module.filename + " connecting to " + (process.env.DB || "bookses"))
})
var async = require("async")
var request = require("request")
var validate = require("./validate.js")

var k = {
    tables: {
        users: "users",
    }
}

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

    DB.get_user = function(username, password, done){
        var query = {
            username: username,
            password: password
        }
        db.collection(k.tables.users, {safe:true}, function(er, docs){
            if (er) done({error:"db.get_user",query:query,er:er})
            else docs.findOne(query, function(er, entry){
                if (er) done({error:"db.get_user",query:query,er:er})
                else done(null, entry)
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
            created: new Date(),
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
        var username = req.params.username
        var password = req.body.password
        DB.get_user(username, password, function(er, user){
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
        var username = req.session.username
        var password = req.session.password
        DB.get_user(username, password, function(er, user){
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
            res.send({loggedin:true})
        } else {
            res.send({loggedin:false})
        }
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

console.log("requiring " + require.main.filename + " from " + module.filename)
if (require.main == module){
    test.create_user()
} else {

}
