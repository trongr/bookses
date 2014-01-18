var child = require("child_process")
var async = require("async")

var k = {
    convert: "/usr/local/bin/convert",
    tmp: "tmp",
    static_public: "/static/public",
    static_public_dir: "static/public", // local path
}

var imglib = module.exports = (function(){
    var imglib = {}

    imglib.resize = function(src, width, dst, done){
        var x = child.spawn(k.convert, [src, "-strip", "-resize", width, dst])
        x.stderr.on("data", function(data){
            console.log(data.toString())
        })
        x.on("close", function(code){
            done(null)
        })
    }

    imglib.process_img = function(img, thumb_size, new_basefilename, done){
        if (!img.headers || !img.headers["content-type"])
            return done({error:"processing img",er:"can't read img"})
        var ext = img.headers["content-type"].split("/")[1]
        if (ext != "jpeg" && ext != "png" && ext != "gif")
            return done({error:"processing img",er:"only accepts jpg, png, gif"})
        var regular = k.static_public_dir + "/" + new_basefilename + "." + ext
        var thumb = k.static_public_dir + "/" + new_basefilename + ".thumb." + ext
        async.waterfall([
            function(done){
                imglib.resize(img.path, thumb_size, thumb, function(er){
                    done(er)
                })
            },
            function(done){
                child.exec("mv " + img.path + " " + regular, function(er, stdout, stder){
                    done(er)
                })
            },
        ], function(er){
            if (er) done({error:"processing img",er:er})
            else done(null)
            child.exec("rm " + img.path, function(er, stdout, stder){})
        })
    }

    return imglib
}())

var test = (function(){
    var test = {}

    test.resize = function(){
        var src = process.argv[2]
        var width = process.argv[3]
        var dst = process.argv[4]
        imglib.resize(src, width, dst, function(er){
            console.log(JSON.stringify(er, 0, 2))
        })
    }

    return test
}())

if (require.main == module){
    test.resize()
} else {

}
