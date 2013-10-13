var lazy = require("lazy")
var fs = require("fs")

var htmlator = (function(){
    var htmlator = {}

    htmlator.htmlate = function(src, dst, done){
        var out = fs.createWriteStream(dst)
        out.on("open", function(fd){
            var prev_line = ""
            var blank = /^(\r|\n|\r\n)$/;
            var newline = /\r|\n|\r\n/;
            out.write("<p>\n")
            new lazy(fs.createReadStream(src)).lines.forEach(function(line){
                var l = line.toString()
                if (blank.test(l)){ // current line blank

                } else if (blank.test(prev_line)){ // new paragraph
                    out.write("</p>\n<p>\n")
                    out.write(l.replace(newline, "\n"))
                } else { // inside paragraph
                    out.write(l.replace(newline, "\n"))
                }
                prev_line = l
            }).on("pipe", function(){
                out.write("</p>\n")
                out.end()
                done(null)
            })
        })
    }

    return htmlator
}())

var test = (function(){
    var test = {}

    test.htmlate = function(){
        var src = process.argv[2]
        var dst = process.argv[3]
        htmlator.htmlate(src, dst, function(er){
            if (er) console.log(JSON.stringify(er, 0, 2))
        })
    }

    return test
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){
    test.htmlate()
} else {

}
