var async = require("async")
var configs = require("./configs.js")
var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var db = new mongo.Db(process.env.DB || configs.db, server)

db.open(function(er, db) {
    if (er) throw er
    console.log(module.filename + " connecting to " + (process.env.DB || configs.db))
})

var DB = module.exports = (function(){
    var DB = {}

    // entries can be a single element or an array of elements
    DB.create = function(table, entries, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"DB.create",table:table,entries:entries,er:er})
            else docs.insert(entries, {safe:true}, function(er, entries){
                if (er) done({error:"DB.create",table:table,entries:entries,er:er})
                else if (entries && entries.length) done(null, entries)
                else done({error:"DB.create",er:"null entries returned"})
            })
        })
    }

    DB.getone = function(table, query, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.getone",query:query,er:er})
            else docs.findOne(query, function(er, entry){
                if (er) done({error:"db.getone",query:query,er:er})
                else done(null, entry)
            })
        })
    }

    DB.count = function(table, query, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.count",query:query,er:er})
            else docs.count(query, function(er, count){
                if (er) done({error:"db count",query:query,er:er})
                else done(null, count)
            })
        })
    }

    DB.get = function(table, query, aux, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.get",query:query,er:er})
            else docs.find(query, aux).toArray(function(er, entries){
                if (er) done({error:"db.get",query:query,er:er})
                else done(null, entries)
            })
        })
    }

    DB.distinct = function(table, key, query, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db distinct",er:er})
            else docs.distinct(key, query, function(er, entries){
                if (er) done({error:"db distinct",er:er})
                else done(null, entries)
            })
        })
    }

    DB.update = function(table, query, update, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.update",table:table,query:query,update:update,er:er})
            else docs.update(query, update, {
                safe: true,
                multi: true
            }, function(er, num){
                if (er) done({error:"db.update",table:table,query:query,update:update,er:er})
                else done(null, num)
            })
        })
    }

    DB.multiupdate = function(table, entries, update, done){
        async.eachSeries(entries, function(entry, done){
            DB.update_entry(table, {
                _id: entry._id
            }, update, function(er, num){
                if (er) console.log(JSON.stringify({error:"db multiupdate",er:er}, 0, 2))
                done(null)
            })
        }, function(er){
            if (er) done({error:"db multiupdate",table:table,er:er})
            else done(null)
        })
    }

    DB.updateupsert = function(table, query, update, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.updateupsert",table:table,query:query,update:update,er:er})
            else docs.update(query, update, {
                safe: true,
                upsert: true
            }, function(er, num){
                if (er) done({error:"db.updateupsert",table:table,query:query,update:update,er:er})
                else done(null, num)
            })
        })
    }

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

var test = (function(){
    var test = {}

    return test
}())

if (require.main == module){

} else {

}