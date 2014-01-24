var child = require("child_process")
var async = require("async")
var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var db = new mongo.Db(process.env.DB || "bookses", server)
db.open(function(er, db) {
    if (er) throw er
    console.log(module.filename + " connecting to " + (process.env.DB || "bookses"))
})

var migrate = (function(){
    var migrate = {}

    migrate.init = function(){
        async.waterfall([
            function(done){
                var table = "books" // mark
                var query = {}
                var aux = {}
                db.collection(table, {safe:true}, function(er, docs){
                    if (er) done({error:"db.get_entries",table:table,query:query,aux:aux,er:er})
                    else docs.find(query, aux).toArray(function(er, entries){
                        if (er) done({error:"db.get_entries",table:table,query:query,aux:aux,er:er})
                        else done(null, entries)
                    })
                })
            },
            function(entries, done){
                async.eachSeries(entries, function(entry, done){
                    if (entry.url){ // mark
                        var src = "http://bookses.com" + entry.url
                        var x = child.spawn("wget", [src, "-P", "tmp/"]) // mark todo change to static/public/
                        x.stderr.on("data", function(data){
                            console.log(data.toString())
                        })
                        x.on("close", function(code){
                            if (code == 1) console.log("wget error")
                            // done(null) // mark
                        })
                    } else {
                        console.log(JSON.stringify(entry, 0, 2))
                        done(null)
                    }
                }, function(er){
                    done(null)
                })
            }
        ], function(er){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log("done")
        })
    }

    return migrate
}())

setTimeout(function(){
    migrate.init()
}, 2000)
