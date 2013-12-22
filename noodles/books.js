
// todo use this to get the last N items, and sort by votes
// collection.find(query, aux).sort({votes:-1}, function(err, cursor){
//     cursor.toArray(function(er, entries){})
// })

var cron = require("cron").CronJob
var request = require("request")
var async = require("async")
var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var db = new mongo.Db(process.env.DB || "bookses", server)
var validate = require("./validate.js")
var child = require("child_process")

var k = {
    tmp: "tmp",
    static_public: "/static/public",
    static_public_dir: "static/public", // local path
    localhost: "http://localhost:8080",
    tables: {
        books: "books",
        comments: "comments",
        likes: "likes",
        jobs: "jobs",
    },
    page_size: 10,
    milliseconds_in_a_day: 24 * 60 * 60 * 1000,
    recursion_limit: 10,
}

db.open(function(er, db) {
    if (er) throw er
    console.log(module.filename + " connecting to " + (process.env.DB || "bookses"))
    db.collection(k.tables.books, {safe:true}, function(er, docs){
        if (er) throw er
        else docs.ensureIndex({
            title: "text",
            description: "text"
        }, function(er, re){
            if (er) throw er
        })
    })
    db.collection(k.tables.comments, {safe:true}, function(er, docs){
        if (er) throw er
        else docs.ensureIndex({p:1, parent:1}, function(er, re){
            if (er) throw er
        })
    })
})

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

    DB.find_books = function(text, aux, done){
        db.command({
            text: k.tables.books,
            search: text
        }, function(er, re){
            if (er) done({error:"find books",text:text,er:er})
            else if (re && re.results){
                done(null, re.results.slice(aux.skip, aux.skip + aux.limit))
            } else done({error:"find books",er:"mysterious error",re:re})
        })
    }

    DB.aggregate = function(table, pipe, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) return done({error:"db aggregate",table:table,pipe:pipe,er:er})
            docs.aggregate(pipe, function(er, re){
                if (er) return done({error:"db aggregate",table:table,pipe:pipe,er:er})
                else if (re) done(null, re)
                else done({error:"db aggregate",table:table,pipe:pipe,er:"mysterious error"})
            })
        })
    }

    DB.update_comment_recursive = function(id, update, recursion){
        console.log(id, recursion)
        if (recursion < 0) return
        async.waterfall([
            function(done){
                DB.update_entry_by_id(k.tables.comments, id, update, function(er, num){
                    done(er)
                })
            },
            function(done){
                DB.get_entry_by_id(k.tables.comments, id, function(er, comment){
                    if (er) done(er)
                    else if (comment) done(null, comment)
                    else done({error:"no such comment"})
                })
            },
        ], function(er, comment){
            if (er) console.log(JSON.stringify({error:"update comment mod time",id:id,recursion:recursion,er:er}, 0, 2))
            else if (comment.parent) DB.update_comment_recursive(comment.parent, update, --recursion)
        })
    }

    return DB
}())

var press = (function(){
    var press = {}

    press.working = false

    press.process_books = function(){
        new cron("*/13 * * * * *", function(){
            if (press.working) return
            else press.working = true
            async.waterfall([
                function(done){
                    DB.get_entries(k.tables.jobs, {
                        done: false,
                        created: {$gte: new Date(new Date().getTime() - k.milliseconds_in_a_day)}
                    }, {}, function(er, entries){
                        done(er, entries)
                    })
                },
                function(jobs, done){
                    if (jobs.length){
                        console.log(new Date() + " start processing books")
                        console.log(JSON.stringify(jobs, 0, 2))
                    }
                    async.eachSeries(jobs, function(job, done){
                        child.fork("noodles/child_book.js", [job.book, job.src])
                            .on("exit", function(code, signal){
                                if (code == 0) var update = {$set:{done:true}}
                                else var update = {$set:{done:null}}
                                DB.update_entry_by_id(k.tables.jobs, job._id.toString(), update, function(er, num){
                                    done(null)
                                    if (er) console.log(JSON.stringify(er, 0, 2))
                                })
                            })
                    }, function(er){
                        done(null, jobs)
                    })
                }
            ], function(er, jobs){
                if (er) console.log(JSON.stringify({error:"press process books",er:er}, 0, 2))
                if (jobs.length) console.log(new Date() + " end processing books")
                press.working = false
            })
        }, null, true)
    }

    return press
}())

var books = module.exports = (function(){
    var books = {}

    books.create_book_validate = function(req, res, next){
        async.waterfall([
            function(done){
                validate.text_length(req.body.title, function(er){
                    done(er)
                })
            },
            function(done){
                validate.text_length(req.body.description, function(er){
                    done(er)
                })
            },
            function(done){
                if (!req.files) done({error:"no file"})
                else done(null)
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.create_book_validate",er:er}, 0, 2))
                res.send({error:"create book",info:er.error})
            } else next(null)
        })
    }

    books.create_book = function(req, res){
        var id = new mongo.ObjectID()
        var book = {
            _id: id,
            username: req.session.username,
            title: req.body.title,
            description: req.body.description,
            url: k.static_public + "/" + id,
            created: new Date(),
            modified: new Date(),
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
                var job = {
                    book: book._id.toString(),
                    src: req.files.file.path,
                    created: new Date(),
                    done: false,
                }
                DB.create(k.tables.jobs, job, function(er, job){
                    if (er) console.log(JSON.stringify(er, 0, 2))
                })
            }
        ], function(er, new_book){
            if (er){
                console.log(JSON.stringify({error:"books.create_book",body:req.body,er:er}, 0, 2))
                res.send({error:"create book"})
            } else {
                res.send({book:new_book})
            }
        })
    }

    books.get_all_books_validate = function(req, res, next){
        async.waterfall([
            function(done){
                req.query.page = req.query.page || 0
                validate.integer(req.query.page, function(er){
                    done(er)
                })
            },
        ], function(er, re){
            if (er) res.send({error:"get all books",er:er})
            else next(null)
        })
    }

    books.get_all_books = function(req, res){
        var query = {}
        var aux = {
            sort: [["modified","desc"]],
            // sort: [["pop","desc"]],
            limit: k.page_size,
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

    books.search_validate = function(req, res, next){
        async.waterfall([
            function(done){
                req.query.page = req.query.page || 0
                validate.integer(req.query.page, function(er){
                    done(er)
                })
            },
            function(done){
                validate.search_string(req.query.search, function(er){
                    done(er)
                })
            }
        ], function(er, re){
            if (er) res.send({error:"search books",er:er})
            else next(null)
        })
    }

    books.search = function(req, res){
        DB.find_books(req.query.search, {
            limit: k.page_size,
            skip: req.query.page * k.page_size
        }, function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"books.search",er:er}, 0, 2))
                res.send({error:"search"})
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
        DB.get_entry_by_id(k.tables.books, req.params.id, function(er, book){
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

    books.create_comment_validate = function(req, res, next){
        async.waterfall([
            function(done){
                validate.id(req.body.book, function(er){
                    if (er) done({error:"invalid id",book:req.body.book,er:er})
                    else done(null)
                })
            },
            function(done){
                validate.integer(req.body.p, function(er){
                    if (er) done({error:"p not an integer"})
                    else done(null)
                })
            },
            function(done){
                if (req.body.parent) validate.id(req.body.parent, function(er){
                    if (er) done({error:"invalid id",parent:req.body.parent,er:er})
                    else done(null)
                })
                else done(null)
            },
            function(done){
                validate.text_length(req.body.comment, function(er){
                    done(er)
                })
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.create_comment_validate",er:er}, 0, 2))
                res.send({error:"create comment",info:er.error})
            } else next(null)
        })
    }

    books.create_comment = function(req, res){
        async.waterfall([
            function(done){
                try {
                    var id = new mongo.ObjectID()
                    var comment = {
                        _id: id,
                        username: req.session.username,
                        comment: req.body.comment,
                        book: req.body.book,
                        p: parseInt(req.body.p),
                        edit: (req.body.edit == "true"),
                        parent: req.body.parent,
                        created: new Date(),
                        modified: new Date(),
                        votes: 1,
                        replies: 0,
                        pop: 1
                    }
                    if (req.files.img) comment.img = k.static_public + "/" + id
                    DB.create(k.tables.comments, comment, function(er, comment){
                        done(er, comment)
                    })
                } catch (er){
                    done({er:"parse int paragraph"})
                }
            },
            function(comment, done){
                done(null, comment)
                if (req.files.img) child.exec("mv " + req.files.img.path + " " + k.static_public_dir + "/" + comment._id, function(er, stdout, stder){
                    if (er) console.log(JSON.stringify({error:"books.create_comment: mv img",src:req.files.img.path,id:comment._id}, 0, 2))
                })
                if (req.body.book) DB.update_entry_by_id(k.tables.books, req.body.book, {
                    $inc: {replies:1, pop:1},
                    $set: {modified:new Date()}
                }, function(er, num){
                    if (er) console.log(JSON.stringify({error:"books.create_comment: updating book pop",id:req.body.book,er:er}, 0, 2))
                })
                if (req.body.parent) DB.update_comment_recursive(req.body.parent, {
                    $inc: {replies:1, pop:1},
                    $set: {modified:new Date()}
                }, k.recursion_limit)
            }
        ], function(er, comment){
            if (er){
                console.log(JSON.stringify({error:"books.create_comment",params:req.params.id,body:req.body,er:er}, 0, 2))
                res.send({error:"create comment"})
            } else {
                res.send({comment:comment})
            }
        })
    }

    books.get_book_comments_validate = function(req, res, next){
        async.parallel([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
            function(done){
                try {
                    req.query.p = parseInt(req.query.p)
                    done(null)
                } catch (er){
                    done({error:"cannot parse p"})
                }
            },
            function(done){
                var page = req.query.page || 0
                validate.integer(page, function(er){
                    done(er)
                })
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_comments_validate",er:er}, 0, 2))
                res.send({error:"get book comments"})
            } else next(null)
        })
    }

    books.get_book_comments = function(req, res){
        var query = {
            book: req.params.id,
            p: req.query.p,
            parent: null,
            edit: (req.query.edit == "true")
        }
        var aux = {
            sort: [["modified","desc"]],
            // sort: [["pop","desc"]],
            limit: k.page_size + 1,
            skip: req.query.page * k.page_size
        }
        DB.get_entries(k.tables.comments, query, aux, function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_comments",er:er}, 0, 2))
                res.send({error:"get book comments"})
            } else {
                res.send({comments:entries})
            }
        })
    }

    books.get_book_latest_comments_validate = function(req, res, next){
        async.parallel([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
            function(done){
                var page = req.query.page || 0
                validate.integer(page, function(er){
                    done(er)
                })
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_latest_comments_validate",er:er}, 0, 2))
                res.send({error:"get book comments"})
            } else next(null)
        })
    }

    books.get_book_latest_comments = function(req, res){
        var query = {
            book: req.params.id,
            parent: null
        }
        var aux = {
            sort: [["modified","desc"]],
            // sort: [["pop","desc"]],
            limit: k.page_size + 1,
            skip: req.query.page * k.page_size
        }
        DB.get_entries(k.tables.comments, query, aux, function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_latest_comments",er:er}, 0, 2))
                res.send({error:"get book comments"})
            } else {
                res.send({comments:entries})
            }
        })
    }

    books.get_comment_comments_validate = function(req, res, next){
        async.parallel([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
            function(done){
                var page = req.query.page || 0
                validate.integer(page, function(er){
                    done(er)
                })
            }
        ], function(er, re){
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
            sort: [["modified","desc"]],
            // sort: [["pop","desc"]],
            limit: k.page_size + 1,
            skip: req.query.page * k.page_size
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

    books.upvote_comment_validate = function(req, res, next){
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books.upvote_comment_validate",er:er}, 0, 2))
                res.send({error:"upvote comment"})
            } else next(null)
        })
    }

    books.upvote_comment = function(req, res){
        async.waterfall([
            function(done){
                DB.get_entries(k.tables.likes, {
                    user: req.session.username,
                    like: req.params.id
                }, {}, function(er, entries){
                    done(er, entries)
                })
            },
            function(entries, done){
                if (entries.length) done({info:"you already liked this"})
                else DB.create(k.tables.likes, {
                    user: req.session.username,
                    like: req.params.id,
                    created: new Date(),
                }, function(er, like){
                    done(er)
                })
            },
            function(done){
                done(null, 1)
                DB.update_comment_recursive(req.params.id, {
                    $inc: {votes:1, pop:1},
                    $set: {modified:new Date()}
                }, k.recursion_limit)
            }
        ], function(er, num){
            if (er){
                console.log(JSON.stringify({error:"books.upvote_comment",id:req.params.id,er:er}, 0, 2))
                res.send({error:"upvote comment",info:er.info})
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

    books.like_book = function(req, res){
        async.waterfall([
            function(done){
                DB.get_entries(k.tables.likes, {
                    user: req.session.username,
                    like: req.params.id
                }, {}, function(er, entries){
                    done(er, entries)
                })
            },
            function(entries, done){
                if (entries.length) done({info:"you already liked this"})
                else DB.create(k.tables.likes, {
                    user: req.session.username,
                    like: req.params.id,
                    created: new Date(),
                }, function(er, like){
                    done(er)
                })
            },
            function(done){
                DB.update_entry_by_id(k.tables.books, req.params.id, {
                    $inc: {votes:1, pop:1},
                    $set: {modified:new Date()}
                }, function(er, num){
                    done(er, num)
                })
            }
        ], function(er, num){
            if (er){
                console.log(JSON.stringify({error:"books.like_book",id:req.params.id,er:er}, 0, 2))
                res.send({error:"like book",info:er.info})
            } else {
                res.send({num:num})
            }
        })
    }

    books.get_paragraphs_validate = function(req, res, next){
        async.parallel([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.get_paragraphs_validate",er:er}, 0, 2))
                res.send({error:"get book paragraphs"})
            } else next(null)
        })
    }

    books.get_paragraphs = function(req, res){
        DB.aggregate(k.tables.comments, [{
            $match: {
                book: req.params.id,
                parent: null,
                edit: false
            }
        },{
            $group: {_id:"$p", count:{$sum:"$pop"}}
        },{
            $sort: {_id:1}
        }], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books get paragraphs",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get book paragraphs"})
            } else res.send({paragraphs:re})
        })
    }

    books.get_book_edits_validate = function(req, res, next){
        async.parallel([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_edits_validate",er:er}, 0, 2))
                res.send({error:"get book edits",er:er})
            } else next(null)
        })
    }

    books.get_book_edits = function(req, res){
        DB.aggregate(k.tables.comments, [{
            $match: {
                book: req.params.id,
                parent: null,
                edit: true
            }
        },{
            $sort: {modified:-1}
        },{
            $group: {
                _id: "$p",
                edit: {$first:"$_id"},
            }
        },{
            $sort: {_id:1}
        }], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books get book edits",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get book edits"})
            } else res.send({edits:re})
        })
    }

    books.get_comment_validate = function(req, res, next){
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books.get_comment_validate",er:er}, 0, 2))
                res.send({error:"get comment validate",er:er})
            } else next(null)
        })
    }

    books.get_comment = function(req, res){
        DB.get_entry_by_id(k.tables.comments, req.params.id, function(er, comment){
            if (er){
                console.log(JSON.stringify({error:"books.get_comment",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get comment by id"})
            } else if (comment){
                res.send({comment:comment})
            } else {
                res.send({error:"get comment by id",info:"no such comment"})
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

    test.create_comment = function(){
        var comment = process.argv[2]
        var p = process.argv[3]
        request.post({
            url: k.localhost + "/book/525a5c25b79c992d22000004/comment",
            form: {
                comment: comment,
                p: p
            },
            json: true
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    test.get_book_comments = function(){
        request.get({
            url: k.localhost + "/book/525a5c25b79c992d22000004/comments",
            json: true,
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    test.get_comment_comments = function(){
        request.get({
            url: k.localhost + "/comment/525b9685fc28df044f000036/comments",
            json: true,
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    test.find_books = function(){
        var text = process.argv[2]
        var page = process.argv[3]
        request.get({
            url: k.localhost + "/books/search",
            qs: {
                search: text,
                page: page
            },
            json: true,
        }, function(er, res, body){
            if (er) console.log(JSON.stringify(er, 0, 2))
            else console.log(JSON.stringify(body, 0, 2))
        })
    }

    test.get_paragraphs = function(){
        setTimeout(function(){
            books.get_paragraphs(0, 1)
        }, 2000)
    }

    return test
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){
    test.get_paragraphs()
} else {
    press.process_books()
}
