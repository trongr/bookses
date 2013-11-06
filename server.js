var express = require('express')
var server = express()
var MongoStore = require('connect-mongo')(express)
var mongo = require("mongodb")
var http = require("http")
var app = http.createServer(server)
var books = require("./noodles/books.js")
var users = require("./noodles/users.js")

server.configure(function(){
    // server.use("/static", express.static(__dirname + "/static")) // letting nginx serve static files
    server.set('views', __dirname + '/static')
    server.engine('html', require('ejs').renderFile)

    server.use(express.bodyParser({uploadDir: "./tmp"}))
    server.use(express.logger("dev"))

    server.use(express.cookieParser())
    server.use(express.session({
        store: new MongoStore({
            db: new mongo.Db(process.env.DB || "bookses", new mongo.Server('localhost', 27017, {auto_reconnect:true}))
        }),
        secret:"the key to productivity is to do the things that have the most impact: don't worry about the little stuff"
    }))

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

server.post("/book", users.authenticate, books.create_book_validate, books.create_book)
server.get("/books", books.get_all_books)
server.get("/book/:id", books.get_book_by_id_validate, books.get_book_by_id)

server.post("/book/:id/quote", users.authenticate, books.create_quote_validate, books.create_quote)
server.get("/book/:id/quotes", books.get_book_quotes_validate, books.get_book_quotes)

server.post("/book/:id/like", users.authenticate, books.like_book_validate, books.like_book)

server.post("/quote/:id/comment", users.authenticate, books.create_quote_comment_validate, books.create_quote_comment)
server.get("/quote/:id/comments", books.get_quote_comments_validate, books.get_quote_comments)
server.post("/quote/:id/upvote", users.authenticate, books.upvote_quote_validate, books.upvote_quote)

server.post("/comment/:id/comment", users.authenticate, books.create_comment_comment_validate, books.create_comment_comment)
server.get("/comment/:id/comments", books.get_comment_comments_validate, books.get_comment_comments)
server.post("/comment/:id/upvote", users.authenticate, books.upvote_comment_validate, books.upvote_comment)

server.post("/user/:username/register", users.create_user_validate, users.create_user)
server.post("/user/:username/login", users.login_validate, users.login)
server.post("/user/logout", users.logout) // clears session
server.get("/user/login", users.is_logged_in) // tries to see if session is still open, without requiring user entering credentials

var port = process.env.PORT || 8080
app.listen(port, "127.0.0.1", function(){
    console.log("open for business on port " + port)
})
