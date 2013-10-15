var request = require("request")
var async = require("async")
var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var db = new mongo.Db(process.env.DB || "boks", server)
var helpers = require("./helpers.js")

db.open(function(er, db) {
    if (er) throw er
    console.log(module.filename + " connecting to " + (process.env.DB || "boks"))
})

var k = {
    static_public: "/static/public",
    response_limit: 20,
    localhost: "http://localhost:8080",
}

var DB = (function(){
    var DB = {}

    DB.create_book = function(book, done){
        db.collection("books", {safe:true}, function(er, docs){
            if (er) done({error:"DB.create_book",book:book,er:er})
            else docs.insert(book, {safe:true}, function(er, books){
                if (er) done({error:"DB.create_book",book:book,er:er})
                else if (books[0]) done(null, books[0])
                else done({error:"DB.create_book",er:"no book returned"})
            })
        })
    }

    DB.get_all_books = function(done){
        var query = {

        }
        var aux = {
            sort: [["created", true ? "desc" : "asc"]],
            limit: k.response_limit
        }
        db.collection("books", {safe:true}, function(er, docs){
            if (er) done({error:"db.get_all_books",er:er})
            else docs.find(query, aux).toArray(function(er, books){
                if (er) done({error:"db.get_all_books",er:er})
                else done(null, books)
            })
        })
    }

    DB.get_book_by_id = function(id, done){
        var query = {
            _id: new mongo.ObjectID(id)
        }
        db.collection("books", {safe:true}, function(er, docs){
            if (er) done({error:"db.get_book_by_id",id:id,er:er})
            else docs.findOne(query, function(er, book){
                if (er) done({error:"db.get_book_by_id",id:id,er:er})
                else done(null, book)
            })
        })
    }

    DB.create_quote = function(quote, done){
        db.collection("quotes", {safe:true}, function(er, docs){
            if (er) done({error:"DB.create_quote",quote:quote,er:er})
            else docs.insert(quote, {safe:true}, function(er, quotes){
                if (er) done({error:"DB.create_quote",quote:quote,er:er})
                else if (quotes[0]) done(null, quotes[0])
                else done({error:"DB.create_quote",er:"no quote returned"})
            })
        })
    }

    // todo. range by paragraph
    DB.get_book_quotes = function(id, done){
        var query = {
            book: id
        }
        var aux = {
            sort: [["p","asc"]],
        }
        db.collection("quotes", {safe:true}, function(er, docs){
            if (er) done({error:"db.get_book_quotes",id:id,er:er})
            else docs.find(query, aux).toArray(function(er, quotes){
                if (er) done({error:"db.get_book_quotes",id:id,er:er})
                else done(null, quotes)
            })
        })
    }

    DB.get_quote_by_id = function(id, done){
        var query = {
            _id: new mongo.ObjectID(id)
        }
        db.collection("quotes", {safe:true}, function(er, docs){
            if (er) done({error:"db.get_quote_by_id",id:id,er:er})
            else docs.findOne(query, function(er, quote){
                if (er) done({error:"db.get_quote_by_id",id:id,er:er})
                else done(null, quote)
            })
        })
    }

    DB.create_comment = function(comment, done){
        db.collection("comments", {safe:true}, function(er, docs){
            if (er) done({error:"DB.create_comment",comment:comment,er:er})
            else docs.insert(comment, {safe:true}, function(er, comments){
                if (er) done({error:"DB.create_comment",comment:comment,er:er})
                else if (comments[0]) done(null, comments[0])
                else done({error:"DB.create_comment",er:"no comment returned"})
            })
        })
    }

    DB.get_quote_comments = function(id, done){
        var query = {
            quote: id
        }
        var aux = {
            sort: [["created","asc"]],
        }
        db.collection("comments", {safe:true}, function(er, docs){
            if (er) done({error:"db.get_quote_comments",id:id,er:er})
            else docs.find(query, aux).toArray(function(er, comments){
                if (er) done({error:"db.get_quote_comments",id:id,er:er})
                else done(null, comments)
            })
        })
    }

    return DB
}())

var books = module.exports = (function(){
    var books = {}

    // todo
    books.create_book_validate = function(req, res, next){
        next(null)
    }

    books.create_book = function(req, res){
        var id = new mongo.ObjectID()
        var book = {
            _id: id,
            title: req.body.title,
            description: req.body.description,
            created: new Date(),
            src: k.static_public + "/" + id + ".html"
        }
        DB.create_book(book, function(er, book){
            if (er){
                console.log(JSON.stringify({error:"books.create_book",body:req.body,er:er}, 0, 2))
                res.send({error:"create book"})
            } else {
                res.send({book:book})
            }
        })
    }

    books.get_all_books = function(req, res){
        DB.get_all_books(function(er, books){
            if (er){
                console.log(JSON.stringify({error:"books.get_all_books",er:er}, 0, 2))
                res.send({error:"get all books"})
            } else {
                res.send({books:books})
            }
        })
    }

    books.get_book_by_id_validate = function(req, res, next){
        helpers.check_id(req.params.id, function(er){
            next(er)
        })
    }

    books.get_book_by_id = function(req, res){
        DB.get_book_by_id(req.params.id, function(er, book){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_by_id",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get book by id"})
            } else if (book){
                res.send({book:book})
            } else {
                res.send({error:"get book by id",info:"no such book"})
            }
        })
    }

    // todo. check other params
    books.create_quote_validate = function(req, res, next){
        helpers.check_id(req.params.id, function(er){
            next(er)
        })
    }

    books.create_quote = function(req, res){
        async.waterfall([
            function(done){
                DB.get_book_by_id(req.params.id, function(er, book){
                    if (er) done(er)
                    else if (book) done(null, book)
                    else done({error:"no such book"})
                })
            },
            function(book, done){
                try {
                    var quote = {
                        quote: req.body.quote,
                        book: book._id.toString(),
                        p: parseInt(req.body.p),
                        created: new Date(),
                    }
                    DB.create_quote(quote, function(er, quote){
                        done(er, quote)
                    })
                } catch (er){
                    done({er:"parse int paragraph"})
                }
            },
        ], function(er, quote){
            if (er){
                console.log(JSON.stringify({error:"books.create_quote",params:req.params.id,body:req.body,er:er}, 0, 2))
                res.send({error:"create quote"})
            } else {
                res.send({quote:quote})
            }
        })
    }

    books.get_book_quotes_validate = function(req, res, next){
        helpers.check_id(req.params.id, function(er){
            next(er)
        })
    }

    books.get_book_quotes = function(req, res){
        DB.get_book_quotes(req.params.id, function(er, quotes){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_quotes",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get book quotes"})
            } else {
                res.send({quotes:quotes})
            }
        })
    }

    books.create_comment_validate = function(req, res, next){
        helpers.check_id(req.params.id, function(er){
            next(er)
        })
    }

    books.create_comment = function(req, res){
        async.waterfall([
            function(done){
                DB.get_quote_by_id(req.params.id, function(er, quote){
                    if (er) done(er)
                    else if (quote) done(null, quote)
                    else done({error:"no such quote"})
                })
            },
            function(quote, done){
                var comment = {
                    comment: req.body.comment,
                    quote: quote._id.toString(),
                    created: new Date(),
                }
                DB.create_comment(comment, function(er, comment){
                    done(er, comment)
                })
            },
        ], function(er, comment){
            if (er){
                console.log(JSON.stringify({error:"books.create_comment",params:req.params.id,body:req.body,er:er}, 0, 2))
                res.send({error:"create comment"})
            } else {
                res.send({comment:comment})
            }
        })
    }

    books.get_quote_comments_validate = function(req, res, next){
        helpers.check_id(req.params.id, function(er){
            next(er)
        })
    }

    // mark
    books.get_quote_comments = function(req, res){
        DB.get_quote_comments(req.params.id, function(er, comments){
            if (er){
                console.log(JSON.stringify({error:"books.get_quote_comments",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get quote comments"})
            } else {
                res.send({comments:comments})
            }
        })
    }

    return books
}())

var test = (function(){
    var  test = {}

    test.create_book = function(){
        var title = process.argv[2]
        var description = process.argv[3]
        request.post({
            url: k.localhost + "/book",
            form: {
                title: title,
                description: description,
            },
            json: true
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    test.get_all_books = function(){
        request.get({
            url: k.localhost + "/books",
            json: true
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    test.get_book_by_id = function(){
        request.get({
            url: k.localhost + "/book/5259f9d4dda122801a000001",
            json: true
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    test.create_quote = function(){
        var quote = process.argv[2]
        var p = process.argv[3]
        request.post({
            url: k.localhost + "/book/525a5c25b79c992d22000004/quote",
            form: {
                quote: quote,
                p: p
            },
            json: true
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    test.get_book_quotes = function(){
        request.get({
            url: k.localhost + "/book/525a5c25b79c992d22000004/quotes",
            json: true,
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    test.create_comment = function(){
        var comment = process.argv[2]
        request.post({
            url: k.localhost + "/quote/525ba6e2fc28df044f000070/comment",
            form: {
                comment: comment,
            },
            json: true
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    test.get_quote_comments = function(){
        request.get({
            url: k.localhost + "/quote/525b9685fc28df044f000036/comments",
            json: true,
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    return test
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){
    test.create_comment()
} else {

}
