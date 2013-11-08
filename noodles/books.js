var request = require("request")
var async = require("async")
var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var db = new mongo.Db(process.env.DB || "bookses", server)
var validate = require("./validate.js")
var child = require("child_process")

db.open(function(er, db) {
    if (er) throw er
    console.log(module.filename + " connecting to " + (process.env.DB || "bookses"))
})

var k = {
    tmp: "tmp",
    static_public: "static/public",
    localhost: "http://localhost:8080",
    tables: {
        books: "books",
        quotes: "quotes",
        comments: "comments",
    },
    page_size: 10,
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

    DB.get_entries = function(table, query, aux, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.get_entries",table:table,query:query,aux:aux,er:er})
            else docs.find(query, aux).toArray(function(er, entries){
                if (er) done({error:"db.get_entries",table:table,query:query,aux:aux,er:er})
                else done(null, entries)
            })
        })
    }

    return DB
}())

var parent_book = (function(){
    var parent_book = {}

    parent_book.process_book = function(book, done){
        var id = book._id.toString()
        var src = book.src
        child.fork("noodles/child_book.js", [id, src])
            .on("exit", function(code, signal){
                if (code == 0) done(null)
                else done({error:"parent_book.process_book",book:book,code:code,signal:signal})
            })
            .on("error", function(er){
                done({error:"parent_book.process_book",book:book,er:er})
            })
    }

    return parent_book
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
            username: req.session.username,
            title: req.body.title,
            description: req.body.description,
            src: req.body.src,
            url: k.static_public + "/" + id,
            created: new Date(),
            votes: 1,
            replies: 0,
            pop: 1,
        }
        async.waterfall([
            function(done){
                DB.create(k.tables.books, book, function(er, book){
                    done(er, book)
                })
            },
            function(book, done){
                done(null, book)
                parent_book.process_book(book, function(er){
                    if (er){
                        console.log(JSON.stringify(er, 0, 2))
                        var update = {
                            $set: {error:"processing book"}
                        }
                        DB.update_entry_by_id(k.tables.books, book._id.toString(), update, function(er, num){
                            if (er) console.log(JSON.stringify(er, 0, 2))
                        })
                    }
                })
            }
        ], function(er, book){
            if (er){
                console.log(JSON.stringify({error:"books.create_book",body:req.body,er:er}, 0, 2))
                res.send({error:"create book"})
            } else {
                res.send({book:book})
            }
        })
    }

    books.get_all_books_validate = function(req, res, next){
        var page = req.query.page || 0
        validate.integer(page, function(er){
            if (er) res.send({error:"invalid page",er:er})
            else next(null)
        })
    }

    books.get_all_books = function(req, res){
        var query = {}
        var aux = {
            sort: [["pop","desc"]],
            limit: k.page_size, // todo change to reasonable size, e.g. 10
            skip: req.query.page * k.page_size
        }
        DB.get_entries(k.tables.books, query, aux, function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"books.get_all_books",er:er}, 0, 2))
                res.send({error:"get all books"})
            } else {
                res.send({books:entries})
            }
        })
    }

    books.get_book_by_id_validate = function(req, res, next){
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_by_id_validate",er:er}, 0, 2))
                res.send({error:"get book"})
            } else next(null)
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
        async.waterfall([
            function(done){
                validate.id(req.params.id, function(er){
                    if (er) done({error:"invalid id"})
                    else done(null)
                })
            },
            function(done){
                validate.text_length(req.body.quote, function(er){
                    done(er)
                })
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.create_quote_validate",er:er}, 0, 2))
                res.send({error:"create quote",info:er.error})
            } else next(null)
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
                        username: req.session.username,
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
            function(quote, done){
                done(null, quote)
                DB.update_entry_by_id(k.tables.books, req.params.id, {$inc:{replies:1,pop:1}}, function(er, num){
                    if (er) console.log(JSON.stringify({error:"books.create_quote",id:req.params.id,er:er}, 0, 2))
                })
            }
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
        async.parallel([
            function(done){
                try {
                    req.query.p = parseInt(req.query.p)
                    done(null)
                } catch (er){
                    done({error:"cannot parse p"})
                }
            },
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_quotes_validate",er:er}, 0, 2))
                res.send({error:"get book quotes"})
            } else next(null)
        })
    }

    books.get_book_quotes = function(req, res){
        var book = req.params.id
        var p = req.query.p
        var result = []
        async.timesSeries(k.page_size, function(i, done){
            var query = {
                book: book,
                p: p + i
            }
            var aux = {
                sort: [["pop","desc"]],
                limit: 5 // todo change to reasonable size, e.g. 5
            }
            DB.get_entries(k.tables.quotes, query, aux, function(er, entries){
                result.push.apply(result, entries)
                done(null)
            })
        }, function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_quotes",er:er}, 0, 2))
                res.send({error:"get book quotes"})
            } else {
                res.send({quotes:result})
            }
        })
    }

    books.create_quote_comment_validate = function(req, res, next){
        async.waterfall([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
            function(done){
                validate.text_length(req.body.comment, function(er){
                    done(er)
                })
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.create_quote_comment_validate",er:er}, 0, 2))
                res.send({error:"create quote comment",er:er})
            } else next(null)
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
                    username: req.session.username,
                    comment: req.body.comment,
                    quote: quote._id.toString(),
                    created: new Date(),
                    votes: 1,
                    replies: 0,
                    pop: 1, // pop is the sum of votes and replies, used to sort results
                }
                DB.create(k.tables.comments, comment, function(er, comment){
                    done(er, quote, comment)
                })
            },
            function(quote, comment, done){
                DB.update_entry_by_id(k.tables.quotes, quote._id.toString(), {$inc:{replies:1,pop:1}}, function(er, num){
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
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books.get_quote_comments_validate",er:er}, 0, 2))
                res.send({error:"get quote comments"})
            } else next(null)
        })
    }

    books.get_quote_comments = function(req, res){
        var query = {
            quote: req.params.id
        }
        var aux = {
            sort: [["pop","desc"]],
            limit: k.page_size
        }
        DB.get_entries(k.tables.comments, query, aux, function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"books.get_quote_comments",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get quote comments"})
            } else {
                res.send({comments:entries})
            }
        })
    }

    books.create_comment_comment_validate = function(req, res, next){
        async.waterfall([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
            function(done){
                validate.text_length(req.body.comment, function(er){
                    done(er)
                })
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.create_comment_comment_validate",er:er}, 0, 2))
                res.send({error:"create comment comment",er:er})
            } else next(null)
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
                    username: req.session.username,
                    comment: req.body.comment,
                    parent: parent._id.toString(),
                    created: new Date(),
                    votes: 1,
                    replies: 0,
                    pop: 1, // pop = votes + replies, used to sort results
                }
                DB.create(k.tables.comments, comment, function(er, comment){
                    done(er, parent, comment)
                })
            },
            function(parent, comment, done){
                DB.update_entry_by_id("comments", parent._id.toString(), {$inc:{replies:1,pop:1}}, function(er, num){
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
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books.get_comment_comments_validate",er:er}, 0, 2))
                res.send({error:"get comment comments"})
            } else next(null)
        })
    }

    books.get_comment_comments = function(req, res){
        var query = {
            parent: req.params.id
        }
        var aux = {
            sort: [["pop","desc"]],
            limit: k.page_size
        }
        DB.get_entries(k.tables.comments, query, aux, function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"books.get_comment_comments",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get comment comments"})
            } else {
                res.send({comments:entries})
            }
        })
    }

    books.upvote_quote_validate = function(req, res, next){
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books.upvote_quote_validate",er:er}, 0, 2))
                res.send({error:"upvote quote"})
            } else next(null)
        })
    }

    books.upvote_quote = function(req, res){
        DB.update_entry_by_id(k.tables.quotes, req.params.id, {$inc:{votes:1,pop:1}}, function(er, num){
            if (er){
                console.log(JSON.stringify({error:"books.upvote_quote",id:req.params.id,er:er}, 0, 2))
                res.send({error:"upvote quote"})
            } else {
                res.send({num:num})
            }
        })
    }

    books.upvote_comment_validate = function(req, res, next){
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books.upvote_comment_validate",er:er}, 0, 2))
                res.send({error:"upvote comment"})
            } else next(null)
        })
    }

    books.upvote_comment = function(req, res){
        DB.update_entry_by_id("comments", req.params.id, {$inc:{votes:1,pop:1}}, function(er, num){
            if (er){
                console.log(JSON.stringify({error:"books.upvote_comment",id:req.params.id,er:er}, 0, 2))
                res.send({error:"upvote comment"})
            } else {
                res.send({num:num})
            }
        })
    }

    books.like_book_validate = function(req, res, next){
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books.like_book_validate",er:er}, 0, 2))
                res.send({error:"like book",er:"invalid id"})
            } else next(null)
        })
    }
    // mark
    books.like_book = function(req, res){
        DB.update_entry_by_id(k.tables.books, req.params.id, {$inc:{votes:1,pop:1}}, function(er, num){
            if (er){
                console.log(JSON.stringify({error:"books.like_book",id:req.params.id,er:er}, 0, 2))
                res.send({error:"like book"})
            } else {
                res.send({num:num})
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
        var src = process.argv[4]
        request.post({
            url: k.localhost + "/book",
            form: {
                title: title,
                description: description,
                src: src
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
    test.create_book()
} else {

}
