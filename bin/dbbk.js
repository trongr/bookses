var async = require("async")
var child = require("child_process")

var k = {
    bucket: "s3://bookses.dbbk",
    s3cmd: "/usr/local/bin/s3cmd",
    mongodump: "/usr/bin/mongodump",
    tmp: "/home/ubuntu/nt/boks/static/public/",
    db: "bookses_" + new Date().getDate(),
}

var bk = module.exports = (function(){
    var bk = {}

    bk.init = function(){
        async.waterfall([
            function(done){
                child.exec("cd " + k.tmp + " && " + k.mongodump + " --out " + k.db, function(er, stdout, stder){
                    done(er)
                })
            },
            function(done){
                var x = child.spawn(k.s3cmd, [
                    "put", "--recursive", k.db, k.bucket
                ],{
                    cwd: k.tmp
                })
                x.stderr.on("data", function(data){console.log(data.toString())})
                x.stdout.on("data", function(data){console.log(data.toString())})
                x.on("close", function(code){
                    if (code == 0) done(null)
                    else done({msg: "s3cmd put er"})
                })
            }
        ], function(er){
            if (er) console.log(JSON.stringify({error:"backing up db",er:er}, 0, 2))
        })
    }

    return bk
}())

if (require.main == module){
    bk.init()
} else {

}
