var express = require('express')
var server = express()
var http = require("http")
var app = http.createServer(server)

server.configure(function(){
    server.use("/static", express.static(__dirname + "/static"))
    server.set('views', __dirname + '/static')
    server.engine('html', require('ejs').renderFile)

    server.use(express.bodyParser({uploadDir: "./tmp"}))
    server.use(express.logger("dev"))

    server.use(express.cookieParser())
    server.use(express.session({secret: "avada kedavra came from abracadabra"}))

    server.all('*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*")
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
        res.header("Access-Control-Allow-Headers", "Content-Type")
        next()
    })
    server.options("*", function(req, res){
        res.header("Access-Control-Allow-Origin", "*")
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
        res.header("Access-Control-Allow-Headers", "Content-Type")
        res.end()
    })
})

server.configure('development', function(){
    server.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }))
})

server.configure('production', function(){
    server.use(express.errorHandler())
})

server.get("/", function(req, res){res.render("home.html")})
server.get("/health", function(req, res){res.send({a:1})})

server.post("/bug", function(req, res){
    console.log(JSON.stringify(req.body, 0, 2))
    res.send({a:1})
})

var port = process.env.PORT || 8080
app.listen(port, "127.0.0.1", function(){
    console.log("open for business on port " + port)
})
