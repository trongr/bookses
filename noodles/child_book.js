var async = require("async")
var child = require("child_process")
var lazy = require("lazy")
var fs = require("fs")
var configs = require("./configs.js")
var s3 = require("./s3.js")

var u = (function(){
    var u = {}

    u.wget = function(src, dst, done){
        child.spawn("wget", [src, "-O", dst]) // CAP O not no cap o
            .on("exit", function(code, signal){
                if (code == 0) done(null)
                else done({error:"u.wget",src:src,dst:dst,code:code,signal:signal})
            })
    }

    u.write_book = function(src, dst, done){
        var out = fs.createWriteStream(dst)
        out.on("open", function(fd){
            var prev_line = ""
            var trailing = /\s*$/;
            var i = 0
            out.write("<p class='paragraph' data-p='" + (i++) + "'>")
            new lazy(fs.createReadStream(src)).lines.forEach(function(line){
                if (line) var l = line.toString()
                else l = "\n"
                if (l.length == 1){ // current line blank
                } else if (prev_line.length == 1){ // new paragraph
                    out.write("</p><p class='paragraph' data-p='" + (i++) + "'>")
                    out.write(l.replace(trailing, "\n"))
                } else { // inside paragraph
                    out.write(l.replace(trailing, "\n"))
                }
                prev_line = l
            }).on("pipe", function(){
                setTimeout(function(){
                    out.write("</p>\n")
                    out.end()
                    done(null)
                }, 1000) // have to do this cause we don't want the stream ending before writing to out
            })
        })
    }

    return u
}())

var child_book = (function(){
    var child_book = {}

    child_book.process_book = function(id, src, bucket){
        console.log("processing new book: " + id)
        var tmp = configs.tmp + "/" + id + ".html"
        var dst = configs.static_public_dir + "/" + id + ".html"
        async.waterfall([
            function(done){
                u.write_book(src, tmp, function(er){
                    done(er)
                })
            },
            function(done){
                if (bucket){
                    s3.put([tmp], bucket, function(er){
                        done(er)
                    })
                } else {
                    child.exec("mv " + tmp + " " + dst, function(er, stdout, stder){
                        done(er)
                    })
                }
            }
        ], function(er){
            console.log("done processing new book: " + id)
            if (er){
                console.log(JSON.stringify({error:"child_book.process_book",id:id,src:src,er:er}, 0, 2))
                child.exec("rm " + src + " " + tmp + " " + dst, function(er, stdout, stder){})
            } else child.exec("rm " + src + " " + tmp, function(er, stdout, stder){})
        })
    }

    return child_book
}())

var test = (function(){
    var test = {}

    test.run = function(){
        var id = process.argv[2]
        var src = process.argv[3]
        var bucket = process.argv[4]
        child_book.process_book(id, src, bucket)
    }

    test.wget = function(){
        var url = process.argv[2]
        var dst = process.argv[3]
        u.wget(url, dst, function(er){
            if (er) console.log(JSON.stringify(er, 0, 2))
        })
    }

    test.write_book = function(){
        var src = process.argv[2]
        var dst = process.argv[3]
        u.write_book(src, dst, function(er){
            if (er) console.log(JSON.stringify(er, 0, 2))
        })
    }

    return test
}())

console.log("requiring " + require.main.filename + " from " + module.filename)
if (require.main == module){
    test.run()
} else {

}
