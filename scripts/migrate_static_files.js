var child = require("child_process")
var async = require("async")
var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var db = new mongo.Db(process.env.DB || "bookses", server)
db.open(function(er, db) {
    if (er) throw er
    console.log(module.filename + " connecting to " + (process.env.DB || "bookses"))
})
var s3 = require("../noodles/s3.js")

var migrate = (function(){
    var migrate = {}

    migrate.init = function(){
        var table = "comments" // mark
        async.waterfall([
            function(done){
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
                    if (entry.img && entry.thumb && entry.img.slice(0, 1) == "h"){ // mark
                        // var path_img = entry.img.slice(1)
                        // var path_thumb = entry.thumb.slice(1)
                        // var bucket = "s3://bookses.img/"
                        // s3.put([path_img, path_thumb], bucket, function(er){
                        //     done(null)
                        // })
                        var root = "s3://bookses.img/"
                        var path_img = root + entry.img.match(/http:\/\/bookses.img.s3.amazonaws.com\/(.*)/)[1]
                        var path_thumb = root + entry.thumb.match(/http:\/\/bookses.img.s3.amazonaws.com\/(.*)/)[1]
                        child.exec("s3cmd setacl --acl-public " + path_img + " " + path_thumb, function(er, stder, stdout){
                            console.log(stder)
                            console.log(stdout)
                            if (er) console.log(JSON.stringify(er, 0, 2))
                            done(null)
                        })
                        // var query = {
                        //     _id: entry._id
                        // }
                        // var update = {
                        //     $set: {
                        //         img: path_img,
                        //         thumb: path_thumb
                        //     }
                        // }
                        // db.collection(table, {safe:true}, function(er, docs){
                        //     if (er) done({error:"db.update_entry",table:table,query:query,update:update,er:er})
                        //     else docs.update(query, update, {safe:true}, function(er, num){
                        //         done(null)
                        //     })
                        // })
                    } else {
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
