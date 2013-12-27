var child = require("child_process")
var async = require("async")

var k = {
    convert: "/usr/local/bin/convert",
}

var img = module.exports = (function(){
    var img = {}

    img.resize = function(src, width, dst, done){
        var x = child.spawn(k.convert, [src, "-strip", "-resize", width, dst])
        x.stderr.on("data", function(data){
            console.log(data.toString())
        })
        x.on("close", function(code){
            done(null)
        })
    }

    return img
}())

var test = (function(){
    var test = {}

    test.resize = function(){
        var src = process.argv[2]
        var width = process.argv[3]
        var dst = process.argv[4]
        img.resize(src, width, dst, function(er){
            console.log(JSON.stringify(er, 0, 2))
        })
    }

    return test
}())

if (require.main == module){
    test.resize()
} else {

}
