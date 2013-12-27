var request = require("request")
var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var DB = new mongo.Db(process.env.DB || "bookses", server)
DB.open(function(er, db) {
    if (er) throw er
    console.log(module.filename + " connecting to " + (process.env.DB || "bookses"))
})
var async = require("async")
var imglib = require("../noodles/img.js")

var loop = function(){
    async.waterfall([
        function(done){
            setTimeout(function(){
                DB.collection("comments", {safe:true}, function(er, docs){
                    docs.find({
                        thumb: {$exists:false}
                    }).toArray(function(er, entries){
                        done(er, entries)
                    })
                })
            }, 2000)
        },
        function(entries, done){
            async.eachSeries(entries, function(entry, done){
                async.waterfall([
                    function(done){
                        var src = "static/public/" + entry._id
                        var thumb = "static/public/"  + entry._id + ".thumb"
                        imglib.resize(src, 200, thumb, function(er){
                            done(null)
                        })
                    },
                    function(done){
                        DB.collection("comments", {safe:true}, function(er, docs){
                            docs.update({
                                _id: entry._id
                            },{
                                $set: {
                                    thumb: "/static/public/" + entry._id + ".thumb"
                                }
                            }, function(er, num){
                                done(null)
                            })
                        })
                    }
                ], function(er){
                    done(null)
                })
            }, function(er){
                done(er)
            })
        }
    ], function(er){
        console.log(JSON.stringify(er, 0, 2))
    })
}

loop()
