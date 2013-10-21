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
    tables: {
        books: "books",
        quotes: "quotes",
        comments: "comments",
    }
}

var DB = (function(){
    var DB = {}

    DB.create = function(table, entry, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"DB.create",table:table,entry:entry,er:er})
            else docs.insert(entry, {safe:true}, function(er, entries){
                if (er) done({error:"DB.create",table:table,entry:entry,er:er})
                else if (entries[0]) done(null, entries[0])
                else done({error:"DB.create",er:"no entry returned"})
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

    DB.get_entry_by_id = function(table, id, done){
        var query = {
            _id: new mongo.ObjectID(id)
        }
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.get_entry_by_id",table:table,id:id,er:er})
            else docs.findOne(query, function(er, entry){
                if (er) done({error:"db.get_entry_by_id",table:table,id:id,er:er})
                else done(null, entry)
            })
        })
    }

    DB.update_entry_by_id = function(table, id, update, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.update_entry_by_id",table:table,id:id,update:update,er:er})
            else docs.update({
                _id: new mongo.ObjectID(id),
            }, update, {
                safe: true
            }, function(er, num){
                if (er) done({error:"db.update_entry_by_id",table:table,id:id,update:update,er:er})
                else done(null, num)
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

    DB.get_comment_comments = function(id, done){
        var query = {
            parent: id
        }
        var aux = {
            sort: [["created","asc"]],
        }
        db.collection("comments", {safe:true}, function(er, docs){
            if (er) done({error:"db.get_comment_comments",id:id,er:er})
            else docs.find(query, aux).toArray(function(er, comments){
                if (er) done({error:"db.get_comment_comments",id:id,er:er})
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
        DB.create(k.tables.books, book, function(er, book){
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
        DB.get_entry_by_id(req.params.id, function(er, book){
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
                DB.get_entry_by_id(k.tables.books, req.params.id, function(er, book){
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
                        votes: 1,
                        replies: 0,
                    }
                    DB.create(k.tables.quotes, quote, function(er, quote){
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

    books.create_quote_comment_validate = function(req, res, next){
        helpers.check_id(req.params.id, function(er){
            next(er)
        })
    }

    books.create_quote_comment = function(req, res){
        async.waterfall([
            function(done){
                DB.get_entry_by_id(k.tables.quotes, req.params.id, function(er, quote){
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
                    votes: 1,
                    replies: 0
                }
                DB.create(k.tables.comments, comment, function(er, comment){
                    done(er, quote, comment)
                })
            },
            function(quote, comment, done){
                DB.update_entry_by_id("quotes", quote._id.toString(), {$inc:{replies:1}}, function(er, num){
                    done(er, comment)
                })
            },
        ], function(er, comment){
            if (er){
                console.log(JSON.stringify({error:"books.create_quote_comment",params:req.params.id,body:req.body,er:er}, 0, 2))
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

    books.create_comment_comment_validate = function(req, res, next){
        helpers.check_id(req.params.id, function(er){
            next(er)
        })
    }

    books.create_comment_comment = function(req, res){
        async.waterfall([
            function(done){
                DB.get_entry_by_id(k.tables.comments, req.params.id, function(er, comment){
                    if (er) done(er)
                    else if (comment) done(null, comment)
                    else done({error:"no such comment"})
                })
            },
            function(parent, done){
                var comment = {
                    comment: req.body.comment,
                    parent: parent._id.toString(),
                    created: new Date(),
                    votes: 1,
                    replies: 0
                }
                DB.create(k.tables.comments, comment, function(er, comment){
                    done(er, parent, comment)
                })
            },
            function(parent, comment, done){
                DB.update_entry_by_id("comments", parent._id.toString(), {$inc:{replies:1}}, function(er, num){
                    done(er, comment)
                })
            },
        ], function(er, comment){
            if (er){
                console.log(JSON.stringify({error:"books.create_comment_comment",params:req.params.id,body:req.body,er:er}, 0, 2))
                res.send({error:"create comment"})
            } else {
                res.send({comment:comment})
            }
        })
    }

    books.get_comment_comments_validate = function(req, res, next){
        helpers.check_id(req.params.id, function(er){
            next(er)
        })
    }

    books.get_comment_comments = function(req, res){
        DB.get_comment_comments(req.params.id, function(er, comments){
            if (er){
                console.log(JSON.stringify({error:"books.get_comment_comments",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get comment comments"})
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

    test.create_quote_comment = function(){
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

    test.create_comment_comment = function(){
        var comment = process.argv[2]
        request.post({
            url: k.localhost + "/comment/525d3afdcb66b1b160000044/comment",
            form: {
                comment: comment,
            },
            json: true
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    return test
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){
    test.create_comment_comment()
} else {

}
