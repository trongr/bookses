
var cron = require("cron").CronJob
var child = require("child_process")
var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var db = new mongo.Db(process.env.DB || "bookses", server)
db.open(function(er, db) {
    if (er) throw er
    console.log(module.filename + " connecting to " + (process.env.DB || "bookses"))
})

var k = {
    tables: {
        likes: "likes"
    }
}

var DB = (function(){
    var DB = {}

    DB.remove = function(table, query, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.remove",table:table,query:query,er:er})
            else docs.remove(query, function(er, num){
                if (er) done({error:"db.remove",table:table,query:query,er:er})
                else done(null, num)
            })
        })
    }

    return DB

}())

var cleanup = (function(){
    var cleanup = {}

    cleanup.tmp = function(){
        new cron("13 29 1 * * *", function(){
            child.exec("find tmp/* -mtime +1 -exec rm {} \\;", function(er, stdout, stder){
                if (er) console.log(JSON.stringify(er, 0, 2))
                console.log(new Date() + " cleaning up tmp")
            })
        }, null, true)
    }

    cleanup.likes = function(){
        var yesterday = 1000 * 60 * 60 * 24
        new cron("13 29 2 * * *", function(){
            DB.remove(k.tables.likes, {
                created: {
                    $lte: new Date(new Date().getTime() - yesterday)
                }
            }, function(er, num){
                if (er) console.log(JSON.stringify(er, 0, 2))
                console.log(new Date() + " cleaning up likes " + num)
            })
        }, null, true)
    }

    return cleanup
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){

} else {
    cleanup.tmp()
    cleanup.likes()
}
