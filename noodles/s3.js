var async = require("async")
var child = require("child_process")
var configs = require("./configs.js")

exports.put = function(sources, bucket, done){
    var opts = ["put"]
    opts.push.apply(opts, sources)
    opts.push(bucket)
    var x = child.spawn(configs.bin.s3cmd, opts)
    x.stderr.on("data", function(data){
        console.log(data.toString())
    })
    x.on("close", function(code){
        if (code == 1) console.log(JSON.stringify({error:"s3cmd put"}, 0, 2))
        done(null)
    })
}
