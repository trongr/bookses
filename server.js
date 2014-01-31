var express = require('express')
var server = express()
var MongoStore = require('connect-mongo')(express)
var mongo = require("mongodb")
var http = require("http")
var app = http.createServer(server)
var books = require("./noodles/books.js")
var users = require("./noodles/users.js")
var jobs = require("./noodles/jobs.js")

var k = {
    max_req_size: 10485760
}

server.configure(function(){
    if (process.env.ENV == "local"){
        server.use("/static", express.static(__dirname + "/static"))
    }
    server.set('views', __dirname + '/static')
    server.engine('html', require('ejs').renderFile)

    server.use(function(req, res, next){
        var size = 0
        req.on("data", function(data){
            size += data.length
            if (size > k.max_req_size){
                console.log({error:"request over limit"})
                res.destroy()
            }
        })
        next()
    })
    server.use(express.bodyParser({
        keepExtensions: true,
        uploadDir: "./tmp"
    }))

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

server.get("/", function(req, res){res.render("mobile.html")})
server.get("/read/:id", function(req, res){res.render("mobook.html")})
server.get("/old", function(req, res){res.render("home.html")})
server.get("/old/read/:id", function(req, res){res.render("book.html")})
server.get("/profile", function(req, res){res.render("profile.html")})

server.get("/health", function(req, res){res.send({a:1})})
server.post("/bug", function(req, res){
    console.log(JSON.stringify(req.body, 0, 2))
    res.send({a:1})
})

server.post("/book", users.authenticate, books.create_book_validate, books.create_book)
server.get("/books", books.get_all_books_validate, books.get_all_books)
server.get("/books/search", books.search_validate, books.search)
server.get("/book/:id", books.get_book_by_id_validate, books.get_book_by_id)
server.post("/book/:id/like", users.authenticate, books.like_book_validate, books.like_book)

server.get("/book/:id/paragraphs", books.get_paragraphs_validate, books.get_paragraphs)
server.get("/book/:id/edits", books.get_book_edits_validate, books.get_book_edits)

// authenticate_anonymous lets anonymous users through as well as logged in users
server.get("/comments", books.get_comments_validate, books.get_comments)
server.post("/comment", users.authenticate_anonymous, books.create_comment_validate, books.create_comment)
server.get("/comment/:id", books.get_comment_validate, books.get_comment)
server.get("/book/:id/comments", books.get_book_comments_validate, books.get_book_comments)
server.get("/book/:id/latest_comments", books.get_book_latest_comments_validate, books.get_book_latest_comments)
server.get("/comment/:id/comments", books.get_comment_comments_validate, books.get_comment_comments)
server.post("/comment/:id/upvote", users.authenticate_anonymous, books.upvote_comment_validate, books.upvote_comment)

server.post("/user/:username/register", users.create_user_validate, users.create_user)
server.post("/user/:username/login", users.login_validate, users.login)
server.post("/user/logout", users.logout) // clears session
server.get("/user/login", users.is_logged_in) // tries to see if session is still open, without requiring user entering credentials
server.get("/user/:username/public", users.get_user_public_info_validate, users.get_user_public_info)
server.post("/user/edit", users.authenticate, users.edit_user_validate, users.edit_user)

server.get("/user/notis", users.authenticate, books.get_user_notis_validate, books.get_user_notis)
server.post("/user/clear_notis", users.authenticate, books.clear_user_notis_validate, books.clear_user_notis)
server.get("/user/comments/notis", users.authenticate, books.get_comment_notis_validate, books.get_comment_notis)
server.post("/comment/:id/clear_notis", users.authenticate, books.clear_comment_notis_validate, books.clear_comment_notis)

server.get("/book/:id/tags", books.get_book_tags_validate, books.get_book_tags)
server.get("/book/:id/tag_comments", books.get_book_tag_comments_validate, books.get_book_tag_comments)

var port = process.env.PORT || 8080
app.listen(port, "127.0.0.1", function(){
    console.log("open for business on port " + port)
})
