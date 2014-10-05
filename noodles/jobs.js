var cron = require("cron").CronJob
var child = require("child_process")
var db = require("./db.js")
var configs = require("./configs.js")

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
            db.remove(configs.table.likes, {
                created: {
                    $lte: new Date(new Date().getTime() - yesterday)
                }
            }, function(er, num){
                if (er) console.log(JSON.stringify(er, 0, 2))
                console.log(new Date() + " cleaning up likes " + num)
            })
        }, null, true)
    }

    cleanup.voters = function(){
        var yesterday = 1000 * 60 * 60 * 24
        new cron("13 31 2 * * *", function(){
            db.remove(configs.table.voters, {
                created: {
                    $lte: new Date(new Date().getTime() - yesterday)
                }
            }, function(er, num){
                if (er) console.log(JSON.stringify(er, 0, 2))
                console.log(new Date() + " cleaning up voters " + num)
            })
        }, null, true)
    }

    cleanup.locks = function(){
        var tenminutes = 1000 * 60 * 10
        new cron("29 */1 * * * *", function(){
            db.update(configs.table.comments, {
                locked: true,
                modified: {
                    $lte: new Date(new Date().getTime() - tenminutes)
                }
            },{
                $set: {
                    locked: false
                }
            }, function(er, num){
                if (er) console.log(JSON.stringify({error:"expiring locks",er:er}, 0, 2))
            })
        }, null, true)
    }

    return cleanup
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){
    cleanup.locks()
} else {
    cleanup.tmp()
    cleanup.likes()
    // cleanup.locks()
    cleanup.voters()
}
