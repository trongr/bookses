var child = require("child_process")
var async = require("async")
var configs = require("./configs.js")
var s3 = require("./s3.js")

var imglib = module.exports = (function(){
    var imglib = {}

    imglib.resize = function(src, width, dst, done){
        var x = child.spawn(configs.bin.convert, [src, "-strip", "-resize", width, dst])
        x.stdout.on("data", function(data){
            console.log(data.toString())
        })
        x.stderr.on("data", function(data){
            console.log(data.toString())
        })
        x.on("close", function(code){
            if (code == 0) done(null) // sometimes convert fails to resize gifs
            else child.exec("cp " + src + " " + dst, function(er, stdout, stder){
                if (er) done({error:"can't resize or move image",er:er,src:src,dst:dst})
                else done(null)
            })
        })
    }

    imglib.process_img = function(img, thumb_size, new_basefilename, bucket, done){
        if (!img.headers || !img.headers["content-type"])
            return done({error:"processing img",er:"can't read img"})
        var ext = img.headers["content-type"].split("/")[1]
        if (ext != "jpeg" && ext != "png" && ext != "gif")
            return done({error:"processing img",er:"only accepts jpg, png, gif"})
        var tmp_thumb = configs.tmp + "/" + new_basefilename + ".thumb." + ext
        var tmp_regular = configs.tmp + "/" + new_basefilename + "." + ext
        var local_regular = configs.static_public_dir + "/" + new_basefilename + "." + ext
        var local_thumb = configs.static_public_dir + "/" + new_basefilename + ".thumb." + ext
        async.waterfall([
            function(done){
                imglib.resize(img.path, thumb_size, tmp_thumb, function(er){
                    done(er)
                })
            },
            function(done){
                child.exec("mv " + img.path + " " + tmp_regular, function(er, stdout, stder){
                    if (er) done({error:"can't move regular image",src:img.path,dst:tmp_regular})
                    else done(null)
                })
            },
            function(done){
                if (bucket){
                    s3.put([tmp_regular, tmp_thumb], bucket, function(er){
                        if (er) done({error:"can't put image on s3",er:er,tmp_regular:tmp_regular,tmp_thumb:tmp_thumb})
                        else done(null)
                    })
                } else {
                    child.exec("mv " + tmp_regular + " " + local_regular, function(er, stdout, stder){
                        if (er) done({error:"can't move local regular image",er:er,tmp_regular:tmp_regular,local_regular:local_regular})
                        else child.exec("mv " + tmp_thumb + " " + local_thumb, function(er, stdout, stder){
                            if (er) done({error:"can't move local thumb image",er:er,tmp_thumb:tmp_thumb,local_thumb:local_thumb})
                            else done(null)
                        })
                    })
                }
            },
        ], function(er){
            if (er){
                done({error:"processing img",er:er})
                child.exec("rm " + img.path + " "
                           + tmp_thumb + " "
                           + local_thumb + " "
                           + local_regular, function(er, stdout, stder){})
            } else done(null)
            child.exec("rm " + img.path + " " + tmp_thumb + " " + tmp_regular, function(er, stdout, stder){})
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
