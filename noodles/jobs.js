var cron = require("cron").CronJob
var child = require("child_process")

var cleanup = (function(){
    var cleanup = {}

    cleanup.tmp = function(){
        new cron("13 29 * * * *", function(){
            child.exec("find tmp/* -mtime +1 -exec rm {} \\;", function(er, stdout, stder){
                if (er) console.log(JSON.stringify(er, 0, 2))
                console.log(new Date() + " cleaning up tmp")
            })
        }, null, true)
    }

    return cleanup
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){

} else {
    cleanup.tmp()
}
