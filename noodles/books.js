
// todo use this to get the last N items, and sort by votes
// collection.find(query, aux).sort({votes:-1}, function(err, cursor){
//     cursor.toArray(function(er, entries){})
// })

var cron = require("cron").CronJob
var request = require("request")
var async = require("async")
var child = require("child_process")
var mongo = require("mongodb")
var server = new mongo.Server('localhost', 27017, {auto_reconnect:true})
var db = new mongo.Db(process.env.DB || "bookses", server)
var validate = require("./validate.js")
var imglib = require("./img.js")
var configs = require("./configs.js")

var k = {
    tmp: "tmp",
    localhost: "http://localhost:8080",
    tables: {
        books: "books",
        comments: "comments",
        likes: "likes",
        jobs: "jobs",
        users: "users",
        tags: "tags",
    },
    bigpagesize: 50,
    page_size: 10,
    milliseconds_in_a_day: 24 * 60 * 60 * 1000,
    recursion_limit: 10,
    class: {
        all: "all",
        classic: "classic",
        published: "published",
        indie: "indie",
        amateur: "amateur"
    },
    sort: {
        best: "best",
        recent: "recent"
    },
    sort_by: {
        best: [["pop","desc"],["modified","desc"]],
        recent: [["created","desc"]],
    }
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
    db.collection(k.tables.likes, {safe:true}, function(er, docs){
        if (er) throw er
        else docs.ensureIndex({like:1,ip:1}, function(er, re){
            if (er) throw er
        })
    })
    db.collection(k.tables.tags, {safe:true}, function(er, docs){
        if (er) throw er
        else docs.ensureIndex({tag:1}, function(er, re){
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

    DB.update_entry = function(table, query, update, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.update_entry",table:table,query:query,update:update,er:er})
            else docs.update(query, update, {
                safe: true
            }, function(er, num){
                if (er) done({error:"db.update_entry",table:table,query:query,update:update,er:er})
                else done(null, num)
            })
        })
    }

    DB.remove = function(table, query, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.remove",table:table,query:query,er:er})
            else docs.remove(query, function(er, num){
                if (er) done({error:"db.remove",table:table,query:query,er:er})
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

    DB.get_entry = function(table, query, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.get_entry",query:query,er:er})
            else docs.findOne(query, function(er, entry){
                if (er) done({error:"db.get_entry",query:query,er:er})
                else done(null, entry)
            })
        })
    }

    DB.count_entries = function(table, query, aux, done){
        db.collection(table, {safe:true}, function(er, docs){
            if (er) done({error:"db.count_entries",table:table,query:query,aux:aux,er:er})
            else docs.count(query, aux, function(er, count){
                if (er) done({error:"db.count_entries",table:table,query:query,aux:aux,er:er})
                else done(null, count)
            })
        })
    }

    DB.find_books = function(text, query, aux, done){
        db.command({
            text: k.tables.books,
            search: text,
            filter: query
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

    DB.update_comment_recursive = function(id, _update, recursion, exclude){
        console.log(id, recursion)
        if (recursion < 0) return
        async.waterfall([
            function(done){
                DB.get_entry_by_id(k.tables.comments, id, function(er, comment){
                    if (er) done(er)
                    else if (comment) done(null, comment)
                    else done({error:"no such comment"})
                })
            },
            function(comment, done){
                var update = {
                    $inc: {pop:1},
                    $set: {modified:new Date()}
                }
                if (_update.notee){
                    update.$inc.replies = 1
                    update.$set.notee = _update.notee
                    if (comment.username != update.$set.notee) update.$set.notis = true
                } else if (recursion == k.recursion_limit){ // only notis direct likes
                    update.$inc.votes = 1
                    update.$set.voter = _update.voter
                    if (comment.username != update.$set.voter) update.$set.notis = true
                }
                // else {
                //     update.$inc.votes = 1 // but still count votes
                // }
                if (exclude[comment.username]) delete update.$set.notis
                exclude[comment.username] = true
                if (update.$set.notis && comment.username != "anonymous"){
                    DB.update_entry(k.tables.users, {
                        username: comment.username,
                    },{
                        $set: {notis:true},
                        $inc: {kudos:1}
                    }, function(er, num){
                        if (er) console.log(JSON.stringify(er, 0, 2))
                    })
                }
                DB.update_entry_by_id(k.tables.comments, id, update, function(er, num){
                    done(er, comment)
                })
            },
        ], function(er, comment){
            if (er) console.log(JSON.stringify({error:"update comment mod time",id:id,recursion:recursion,er:er}, 0, 2))
            else if (comment.parent) DB.update_comment_recursive(comment.parent, _update, --recursion, exclude)
        })
    }

    DB.update_tags = function(book_id, tags, done){
        async.eachSeries(tags, function(tag, done){
            async.waterfall([
                function(done){
                    DB.update_entry(k.tables.tags, {
                        book: book_id,
                        tag: tag
                    },{
                        $set: {modified:new Date()},
                        $inc: {pop:1}
                    }, function(er, num){
                        done(er, num)
                    })
                },
                function(num, done){
                    if (num == 0){
                        var newtag = {
                            book: book_id,
                            tag: tag,
                            created: new Date(),
                            modified: new Date(),
                            pop: 1,
                        }
                        DB.create(k.tables.tags, newtag, function(er, entry){
                            done(er)
                        })
                    } else done(null)
                }
            ], function(er){
                done(er)
            })
        }, function(er){
            if (er) done({error:"update tags",info:er})
            else done(null)
        })
    }

    DB.get_comment_parents = function(id, recursion, result, done){
        console.log("get comment parents", id, recursion)
        if (recursion < 0) return done(null, result)
        DB.get_entry_by_id(k.tables.comments, id, function(er, comment){
            if (er) done({error:"get comment parents",er:er})
            else if (comment){
                result.unshift(comment)
                if (comment.parent){
                    DB.get_comment_parents(comment.parent, --recursion, result, done)
                } else {
                    done(null, result)
                }
            } else done({error:"get comment parents",info:"comment doesn't exist"})
        })
    }

    return DB
}())

var press = (function(){
    var press = {}

    press.working = false

    press.process_books = function(){
        new cron("*/5 * * * * *", function(){
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
                        if (process.env.ENV == "local") var bucket = "" // can't set bucket = null cause that becomes "null"
                        else var bucket = configs.bucket.book
                        child.fork("noodles/child_book.js", [job.book, job.src, bucket])
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
                validate.html(req.body.title, function(er, re){
                    req.body.title = re
                    done(er)
                })
            },
            function(done){
                validate.text_length(req.body.author, function(er){
                    done(er)
                })
            },
            function(done){
                validate.html(req.body.author, function(er, re){
                    req.body.author = re
                    done(er)
                })
            },
            function(done){
                validate.text_length(req.body.description, function(er){
                    done(er)
                })
            },
            function(done){
                validate.html(req.body.description, function(er, re){
                    req.body.description = re
                    done(er)
                })
            },
            function(done){
                if (!req.files) done({error:"no file"})
                else done(null)
            },
            function(done){
                if (Date.parse(req.body.readyon)) done(null)
                else done({error:"invalid publish date"})
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.create_book_validate",er:er}, 0, 2))
                res.send({error:"create book",info:er.error})
            } else next(null)
        })
    }

    books.create_book = function(req, res){
        async.waterfall([
            function(done){
                DB.get_entries(k.tables.users, {
                    username: req.session.username
                }, {}, function(er, entries){
                    if (er) done(er)
                    else if (entries && entries.length) done(null, entries[0])
                    else done({error:"no such user"})
                })
            },
            function(user, done){
                var id = new mongo.ObjectID()
                var book = {
                    _id: id,
                    username: req.session.username,
                    user_img: user.thumb,
                    class: user.class,
                    title: req.body.title,
                    author: req.body.author,
                    description: req.body.description,
                    poetry: (req.body.poetry == "true"),
                    created: new Date(),
                    modified: new Date(),
                    readyon: new Date(req.body.readyon),
                    ready: false,
                    votes: 1,
                    replies: 0,
                    pop: 1,
                }
                if (process.env.ENV == "local"){
                    book.url = configs.static_public + "/" + id + ".html"
                } else {
                    book.url = configs.bucket_url.book + "/" + id + ".html"
                }
                DB.create(k.tables.books, book, function(er, book){
                    done(er, user, book)
                })
            },
            function(user, book, done){
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
                DB.update_entry_by_id(k.tables.users, user._id.toString(), {
                    $inc: {kudos:1}
                }, function(er, num){
                    if (er) console.log(JSON.stringify({error:"books.create_book: kudos",username:user.username,er:er}, 0, 2))
                })
            }
        ], function(er, new_book){
            try {
                if (er){
                    console.log(JSON.stringify({error:"books.create_book",body:req.body,er:er}, 0, 2))
                    res.send({error:"create book"})
                } else {
                    res.send({book:new_book})
                }
            } catch (e){
                // in case client disconnects before image upload finishes, crashing the server
                console.log({error:"create book",er:"responding to client request"})
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
            function(done){
                if (req.query.class && !(
                    req.query.class == k.class.all ||
                    req.query.class == k.class.classic ||
                    req.query.class == k.class.published ||
                    req.query.class == k.class.indie ||
                    req.query.class == k.class.amateur
                )){
                    done(er)
                } else done(null)
            },
            function(done){
                if (req.query.username) validate.username(req.query.username, function(er){
                    done(er)
                })
                else done(null)
            }
        ], function(er, re){
            if (er) res.send({error:"get all books",er:er})
            else next(null)
        })
    }

    books.get_all_books = function(req, res){
        var query = {
            del: {$exists:false}
        }
        if (req.query.class && req.query.class != k.class.all) query.class = req.query.class
        if (req.query.username) query.username = req.query.username
        var aux = {
            sort: [["created","desc"]],
            // sort: [["pop","desc"]],
            limit: k.page_size,
            skip: req.query.page * k.page_size
        }
        if (req.query.latest == "true") aux.sort = [["modified", "desc"]]
        async.waterfall([
            function(done){
                DB.get_entries(k.tables.books, query, aux, function(er, entries){
                    done(er, entries)
                })
            },
            function(entries, done){
                var opts = {}
                if (req.query.latestcomments == "true") opts.latest = true
                if (req.query.imgs == "true") opts.imgs = true
                async.each(entries, function(entry, done){
                    books.get_book_img_comments(entry._id.toString(), opts, function(er, comments){
                        if (er) entry.img_comments = []
                        else entry.img_comments = comments
                        done(null)
                    })
                }, function(er){
                    done(null, entries)
                });
            },
            function(entries, done){
                DB.count_entries(k.tables.books, query, {}, function(er, count){
                    done(er, entries, count)
                })
            }
        ], function(er, entries, count){
            if (er){
                console.log(JSON.stringify({error:"books.get_all_books",er:er}, 0, 2))
                res.send({error:"get all books"})
            } else {
                res.send({
                    books: entries,
                    total: count,
                    page: req.query.page,
                    pagesize: k.page_size,
                })
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
            },
            function(done){
                if (req.query.class && !(
                    req.query.class == k.class.all ||
                    req.query.class == k.class.classic ||
                    req.query.class == k.class.published ||
                    req.query.class == k.class.indie ||
                    req.query.class == k.class.amateur
                )){
                    done(er)
                } else done(null)
            }
        ], function(er, re){
            if (er) res.send({error:"search books",er:er})
            else next(null)
        })
    }

    books.search = function(req, res){
        var query = {}
        if (req.query.class && req.query.class != k.class.all)
            query.class = req.query.class
        var aux = {
            limit: k.page_size,
            skip: req.query.page * k.page_size
        }
        DB.find_books(req.query.search, query, aux, function(er, entries){
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
            },
            function(done){ // edits can contain html code
                if (req.body.edit != "true") validate.html(req.body.comment, function(er, re){
                    req.body.comment = re
                    done(er)
                })
                else done(null)
            },
            function(done){
                if (req.body.artists) validate.text_length_zero_ok(req.body.artists, function(er){
                    if (er) done({error:"invalid artists string"})
                    else done(null)
                })
                else done(null)
            },
            function(done){
                if (req.body.artists) validate.html(req.body.artists, function(er, re){
                    req.body.artists = re
                    done(er)
                })
                else done(null)
            },
            function(done){
                if (req.body.youtube && req.body.youtube > 500){
                    done({error:"youtube link too long"})
                } else done(null)
            },
            function(done){
                if (req.body.tags){
                    try {
                        if (typeof req.body.tags === "string") req.body.tags = JSON.parse(req.body.tags)
                        validate.tags(req.body.tags, function(er){
                            if (er) done({error:"invalid tags",info:er})
                            else done(null)
                        })
                    } catch (e){
                        done({error:"can't parse tags"})
                    }
                } else done(null)
            },
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
                if (req.session.username == "anonymous"){
                    done(null, {username:req.session.username})
                } else {
                    DB.get_entry(k.tables.users, {
                        username: req.session.username,
                    }, function(er, entry){
                        if (er) done(er)
                        else if (entry) done(null, entry)
                        else done({error:"no such user",user:req.session.username})
                    })
                }
            },
            function(user, done){
                var id = new mongo.ObjectID()
                if (req.files.img){
                    if (process.env.ENV == "local") var bucket = null
                    else var bucket = configs.bucket.img
                    imglib.process_img(req.files.img, 200, id.toString(), bucket, function(er){
                        done(er, user, id)
                    })
                } else done(null, user, id)
                if (req.body.book) DB.update_entry_by_id(k.tables.books, req.body.book, {
                    $inc: {replies:1, pop:1},
                    $set: {modified:new Date()}
                }, function(er, num){
                    if (er) console.log(JSON.stringify({error:"books.create_comment: updating book pop",id:req.body.book,er:er}, 0, 2))
                })
                if (user.username != "anonymous") DB.update_entry_by_id(k.tables.users, user._id.toString(), {
                    $inc: {kudos:1}
                }, function(er, num){
                    if (er) console.log(JSON.stringify({error:"books.create_comment: kudos",username:user.username,er:er}, 0, 2))
                })
                if (req.body.parent) DB.update_comment_recursive(req.body.parent, {
                    notee: req.session.username
                }, k.recursion_limit, {})
                if (req.body.tags) DB.update_tags(req.body.book, req.body.tags, function(er){
                    if (er) console.log(JSON.stringify(er, 0, 2))
                })
            },
            function(user, id, done){
                try {
                    var comment = {
                        _id: id,
                        username: req.session.username,
                        user_img: user.thumb,
                        comment: req.body.comment,
                        tags: req.body.tags,
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
                    if (req.files.img && req.files.img.headers && req.files.img.headers["content-type"]){
                        var ext = req.files.img.headers["content-type"].split("/")[1]
                        if (ext != "jpeg" && ext != "png" && ext != "gif")
                            return done({error:"processing img",er:"only accepts jpg, png, gif"})
                        if (process.env.ENV == "local"){
                            comment.img = configs.static_public + "/" + id + "." + ext
                            comment.thumb = configs.static_public + "/" + id + ".thumb." + ext
                        } else {
                            comment.img = configs.bucket_url.img + "/" + id + "." + ext
                            comment.thumb = configs.bucket_url.img + "/" + id + ".thumb." + ext
                        }
                    } else if (req.files.img){
                        return done({error:"processing img",er:"can't read img headers"})
                    }
                    if (req.body.youtube) comment.youtube = req.body.youtube
                    if (req.body.artists) comment.artists = req.body.artists
                    DB.create(k.tables.comments, comment, function(er, comment){
                        done(er, comment)
                    })
                } catch (er){
                    done({er:"parse int paragraph"})
                }
            },
        ], function(er, comment){
            try {
                if (er){
                    console.log(JSON.stringify({error:"books.create_comment",params:req.params.id,body:req.body,er:er}, 0, 2))
                    res.send({error:"create comment"})
                } else {
                    res.send({comment:comment})
                }
            } catch (e){ // in case client disconnects before image upload finishes, crashing the server
                console.log({error:"create comment try catch"})
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
                if (req.query.p) validate.integer(req.query.p, function(er){
                    if (er) done({error:"p not an integer"})
                    else {
                        req.query.p = parseInt(req.query.p)
                        done(null)
                    }
                })
                else done(null)
            },
            function(done){
                var page = req.query.page || 0
                validate.integer(page, function(er){
                    done(er)
                })
            },
            function(done){
                if (req.query.limit) validate.integer(req.query.limit, function(er){
                    if (er) done({error:"limit not an integer"})
                    else {
                        req.query.limit = parseInt(req.query.limit)
                        done(null)
                    }
                })
                else done(null)
            },
            function(done){
                if (req.query.sort){
                    if (req.query.sort == k.sort.best || req.query.sort == k.sort.recent) done(null)
                    else done({error:"wrong sort parameter"})
                } else done(null)
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
            edit: (req.query.edit == "true"),
            del: {$exists:false},
        }
        var aux = {
            sort: k.sort_by.recent,
            limit: k.page_size + 1,
            skip: req.query.page * k.page_size
        }
        if (req.query.p >= 0) query.p = req.query.p
        if (req.query.img == "true") query.img = {$exists:true}
        if (req.query.sort) aux.sort = k.sort_by[req.query.sort]
        if (req.query.limit && req.query.limit < k.bigpagesize) aux.limit = req.query.limit
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
            del: {$exists:false}
            // parent: null,
            // edit: false // let people choose to show edits on front end
        }
        var aux = {
            sort: [["created","desc"]],
            // sort: [["pop","desc"]],
            limit: k.page_size, // + 1 if you want client to know whether there're more results
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
            },
            function(done){
                if (req.query.sort){
                    if (req.query.sort == k.sort.best || req.query.sort == k.sort.recent) done(null)
                    else done({error:"wrong sort parameter"})
                } else done(null)
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
            parent: req.params.id,
            del: {$exists:false}
        }
        var aux = {
            sort: k.sort_by.best,
            limit: k.page_size + 1,
            skip: req.query.page * k.page_size
        }
        if (req.query.sort) aux.sort = k.sort_by[req.query.sort]
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
        var ip = req.headers['x-forwarded-for']
        var username = req.session.username
        async.waterfall([
            function(done){
                if (process.env.ENV == "local") done(null, null)
                else DB.get_entries(k.tables.likes, {
                    ip: ip,
                    like: req.params.id
                }, {}, function(er, entries){
                    done(er, entries)
                })
            },
            function(entries, done){
                if (process.env.ENV == "local") done(null)
                else if (req.session.username == "trong") done(null)
                else if (entries.length) done({info:"you already liked this"})
                else DB.create(k.tables.likes, {
                    ip: ip,
                    username: username,
                    like: req.params.id,
                    created: new Date(),
                }, function(er, like){
                    done(er)
                })
            },
            function(done){
                done(null, 1)
                DB.update_comment_recursive(req.params.id, {
                    voter: req.session.username
                }, k.recursion_limit, {})
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
                edit: false,
                del: {$exists:false}
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
        var result = []
        async.waterfall([
            function(done){
                DB.aggregate(k.tables.comments, [{
                    $match: {
                        book: req.params.id,
                        parent: null,
                        edit: true,
                        del: {$exists:false}
                    }
                },{
                    $sort: {pop:-1, modified:-1}
                },{
                    $group: {
                        _id: "$p",
                        edit_id: {$first:"$_id"},
                    }
                },{
                    $sort: {_id:1}
                }], function(er, re){
                    done(er, re)
                })
            },
            function(entries, done){
                async.each(entries, function(entry, done){
                    var p = entry._id
                    var id = entry.edit_id
                    DB.get_entry_by_id(k.tables.comments, id.toString(), function(er, comment){
                        if (er) done(er)
                        else if (comment){
                            result.push(comment)
                            done(null)
                        } else done({error:"no such comment",id:id})
                    })
                }, function(er){
                    done(er)
                })
            }
        ], function(er){
            if (er){
                console.log(JSON.stringify({error:"books get book edits",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get book edits"})
            } else res.send({edits:result})
        })
    }

    books.get_book_img_comments = function(id, opts, done){
        var query = {
            book: id,
            del: {$exists:false}
            // $or: [{
            //     img: {$exists:true}
            // },{
            //     youtube: {$exists:true}
            // }]
        }
        if (opts.imgs) query.img = {$exists:true}
        var aux = {
            // sort: [["modified","desc"]],
            sort: [["pop","desc"],["modified","desc"]],
            limit: 5,
        }
        if (opts.latest) aux.sort = [["created","desc"]]
        DB.get_entries(k.tables.comments, query, aux, function(er, entries){
            done(er, entries)
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
        async.waterfall([
            function(done){
                DB.get_entry_by_id(k.tables.comments, req.params.id, function(er, comment){
                    if (er) done({info:"unknown problem"})
                    else if (comment) done(null, comment)
                    else done({info:"no such comment"})
                })
            }
        ], function(er, comment){
            if (er){
                console.log(JSON.stringify({error:"books.get_comment",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get comment by id",info:er.info})
            } else {
                res.send({comment:comment})
            }
        })
    }

    books.get_user_notis_validate = function(req, res, next){
        next(null) // nothing to validate
    }

    books.get_user_notis = function(req, res){
        console.log(req.session.username)
        async.waterfall([
            function(done){
                var query = {
                    username: req.session.username,
                }
                var aux = {}
                DB.get_entries(k.tables.users, query, aux, function(er, entries){
                    if (er) done({info:"can't get user notis"})
                    else if (entries && entries[0]) done(null, entries[0])
                    else done({info:"no such user"})
                })
            },
        ], function(er, user){
            if (er){
                console.log(JSON.stringify({error:"get user notis",er:er}, 0, 2))
                res.send({error:"get user notis",info:er.info})
            } else res.send({user:user})
        })
    }

    books.clear_user_notis_validate = function(req, res, next){
        next(null) // nothing to validate
    }

    books.clear_user_notis = function(req, res){
        async.waterfall([
            function(done){
                DB.update_entry(k.tables.users, {
                    username: req.session.username,
                },{
                    $set: {notis:false}
                }, function(er, num){
                    done(er)
                })
            },
        ], function(er){
            if (er){
                console.log(JSON.stringify({error:"clear user notis",er:er}, 0, 2))
                res.send({error:"clear user notis",info:er.info})
            } else res.send({ok:true})
        })
    }

    books.get_comment_notis_validate = function(req, res, next){
        next(null) // nothing to validate
    }

    books.get_comment_notis = function(req, res){
        async.waterfall([
            function(done){
                var query = {
                    username: req.session.username,
                    notis: {$exists:true},
                    del: {$exists:false}
                }
                var aux = {
                    sort: [["modified","desc"]],
                    limit: 10, // todo pagination
                }
                DB.get_entries(k.tables.comments, query, aux, function(er, entries){
                    if (er) done({info:"can't get comment notis"})
                    else done(null, entries)
                })
            },
        ], function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"get comment notis",er:er}, 0, 2))
                res.send({error:"get comment notis",info:er.info})
            } else res.send({notis:entries})
        })
    }

    books.clear_comment_notis_validate = function(req, res, next){
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books.clear_comment_notis_validate",er:er}, 0, 2))
                res.send({error:"clear comment notis"})
            } else next(null)
        })
    }

    books.clear_comment_notis = function(req, res){
        async.waterfall([
            function(done){
                DB.update_entry(k.tables.comments, {
                    _id: new mongo.ObjectID(req.params.id)
                },{
                    $set: {notis:false}
                }, function(er, num){
                    done(er)
                })
            },
        ], function(er){
            if (er){
                console.log(JSON.stringify({error:"clear comment notis",er:er}, 0, 2))
                res.send({error:"clear comment notis",info:er.info})
            } else res.send({ok:true})
        })
    }

    books.get_comments_validate = function(req, res, next){
        async.parallel([
            function(done){
                var page = req.query.page || 0
                validate.integer(page, function(er){
                    done(er)
                })
            },
            function(done){
                if (req.query.sort){
                    if (req.query.sort == k.sort.best || req.query.sort == k.sort.recent) done(null)
                    else done({error:"wrong sort parameter"})
                } else done(null)
            },
            function(done){
                if (req.query.username) validate.username(req.query.username, function(er){
                    done(er)
                })
                else done(null)
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.get_comments_validate",er:er}, 0, 2))
                res.send({error:"get comments"})
            } else next(null)
        })
    }

    books.get_comments = function(req, res){
        var query = {
            del: {$exists:false}
        }
        if (req.query.username) query.username = req.query.username
        var aux = {
            sort: k.sort_by.best,
            limit: k.page_size + 1,
            skip: req.query.page * k.page_size
        }
        if (req.query.sort) aux.sort = k.sort_by[req.query.sort]
        DB.get_entries(k.tables.comments, query, aux, function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"books.get_comments",er:er}, 0, 2))
                res.send({error:"get book comments"})
            } else {
                res.send({comments:entries})
            }
        })
    }

    books.get_book_tags_validate = function(req, res, next){
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
            },
            function(done){
                if (req.query.sort){
                    if (req.query.sort == k.sort.best || req.query.sort == k.sort.recent) done(null)
                    else done({error:"wrong sort parameter"})
                } else done(null)
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_tags_validate",er:er}, 0, 2))
                res.send({error:"get book tags"})
            } else next(null)
        })
    }

    books.get_book_tags = function(req, res){
        var query = {
            book: req.params.id,
        }
        var aux = {
            sort: k.sort_by.best,
            limit: k.page_size,
            skip: req.query.page * k.page_size
        }
        if (req.query.sort) aux.sort = k.sort_by[req.query.sort]
        DB.get_entries(k.tables.tags, query, aux, function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_tags",er:er}, 0, 2))
                res.send({error:"get book tags"})
            } else {
                res.send({tags:entries})
            }
        })
    }

    books.get_book_tag_comments_validate = function(req, res, next){
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
            },
            function(done){
                if (req.query.sort){
                    if (req.query.sort == k.sort.best || req.query.sort == k.sort.recent) done(null)
                    else done({error:"wrong sort parameter"})
                } else done(null)
            },
            function(done){
                if (req.query.tag && req.query.tag.length <= 20){
                    done(null)
                } else {
                    done({error:"invalid tag"})
                }
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_tag_comments_validate",er:er}, 0, 2))
                res.send({error:"get book tag comments",er:er})
            } else next(null)
        })
    }

    books.get_book_tag_comments = function(req, res){
        var query = {
            book: req.params.id,
            tags: {$in:[req.query.tag]},
            del: {$exists:false}
        }
        var aux = {
            sort: k.sort_by.best,
            limit: k.page_size,
            skip: req.query.page * k.page_size
        }
        if (req.query.sort) aux.sort = k.sort_by[req.query.sort]
        DB.get_entries(k.tables.comments, query, aux, function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"books.get_book_tag_comments",er:er}, 0, 2))
                res.send({error:"get book comments"})
            } else {
                res.send({comments:entries})
            }
        })
    }

    books.get_comment_parents_validate = function(req, res, next){
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books.get_comment_parents_validate",er:er}, 0, 2))
                res.send({error:"get comment_parents validate",er:er})
            } else next(null)
        })
    }

    books.get_comment_parents = function(req, res){
        DB.get_comment_parents(req.params.id, k.recursion_limit, [], function(er, entries){
            if (er){
                console.log(JSON.stringify(er, 0, 2))
                res.send({error:"get comment parents"})
            } else {
                res.send({comments:entries})
            }
        })
    }

    books.lockcommentvalidate = function(req, res, next){
        validate.id(req.params.id, function(er){
            if (er){
                console.log(JSON.stringify({error:"books lock comment",er:er}, 0, 2))
                res.send({error:"lock comment"})
            } else next(null)
        })
    }

    books.lockcomment = function(req, res){
        DB.update_entry(k.tables.comments, {
            _id: new mongo.ObjectID(req.params.id)
        },{
            $set: {
                locked: true,
                locker: req.session.username,
                modified: new Date()
            }
        }, function(er, num){
            if (er) res.send({error:"locking comment",er:er})
            else res.send({num:num})
        })
    }

    books.getillosvalidate = function(req, res, next){
        async.parallel([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.getillosvalidate",er:er}, 0, 2))
                res.send({error:"get book edits",er:er})
            } else next(null)
        })
    }

    books.getillos = function(req, res){
        var query = {
            book: req.params.id,
            approved: true,
            img: {$exists:true},
            del: {$exists:false}
        }
        var aux = {
            // sort: [["approvedon","desc"]], // don't need to sort here: doing it on client
        }
        DB.get_entries(k.tables.comments, query, aux, function(er, entries){
            if (er){
                console.log(JSON.stringify({error:"books get book illos",id:req.params.id,er:er}, 0, 2))
                res.send({error:"get book illos"})
            } else res.send({illos:entries})
        })
    }

    books.editcommentvalidate = function(req, res, next){
        async.parallel([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
            function(done){
                if (req.body.p) validate.integer(req.body.p, function(er){
                    if (er) done({error:"p not an integer"})
                    else done(null)
                })
                else done(null)
            },
            function(done){
                if (req.body.artists) validate.text_length_zero_ok(req.body.artists, function(er){
                    if (er) done({error:"invalid artists string"})
                    else done(null)
                })
                else done(null)
            },
            function(done){
                if (req.body.artists) validate.html(req.body.artists, function(er, re){
                    req.body.artists = re
                    done(er)
                })
                else done(null)
            }
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.editcommentvalidate",er:er}, 0, 2))
                res.send({error:"edit comment validate",er:er})
            } else next(null)
        })
    }

    books.editcomment = function(req, res){
        var update = {
            modified: new Date(),
        }
        if (req.body.p) update.p = parseInt(req.body.p)
        if (req.body.approved == "true"){
            update.approved = true
            update.approvedon = new Date()
        } else if (req.body.approved == "false") update.approved = false
        if (req.body.artists) update.artists = req.body.artists
        if (req.body.del == "true") update.del = true
        DB.update_entry(k.tables.comments, {
            _id: new mongo.ObjectID(req.params.id)
        },{
            $set: update
        }, function(er, num){
            if (er) res.send({error:"edit comment",er:er})
            else res.send({num:num})
        })
    }

    books.editbookvalidate = function(req, res, next){
        async.parallel([
            function(done){
                validate.id(req.params.id, function(er){
                    done(er)
                })
            },
        ], function(er, re){
            if (er){
                console.log(JSON.stringify({error:"books.editbookvalidate",er:er}, 0, 2))
                res.send({error:"edit book validate",er:er})
            } else next(null)
        })
    }

    books.editbook = function(req, res){
        var update = {
            modified: new Date(),
        }
        if (req.body.ready == "true") update.ready = true
        else if (req.body.ready == "false") update.ready = false
        if (req.body.preview == "true") update.preview = true // so that artists can see and read the book before readers
        else if (req.body.preview == "false") update.preview = false
        DB.update_entry(k.tables.books, {
            _id: new mongo.ObjectID(req.params.id)
        },{
            $set: update
        }, function(er, num){
            if (er) res.send({error:"edit book",er:er})
            else res.send({num:num})
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

    test.count_entries = function(){
        setTimeout(function(){
            var query = {
                pop: 315
            }
            var aux = {}
            DB.count_entries(k.tables.books, query, aux, function(er, count){
                console.log(JSON.stringify(er, 0, 2))
                console.log(JSON.stringify(count, 0, 2))
            })
        }, 2000)
    }

    return test
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){
    test.count_entries()
} else {
    press.process_books()
}
