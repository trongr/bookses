jQuery(function($){

    var k = {

    }

    var views = (function(){
        var views = {}

        views.init = function(){
            var id = $.url(window.location).param("id")
            views.loadbook(id)
        }

        views.loadbook = function(id){
            async.waterfall([
                function(done){
                    api.getbook(id, function(er, book){
                        done(er, book)
                    })
                },
                function(book, done){
                    $("#bookses a").html(book.title)
                    $("#tagline a").html(book.author)
                    $("#description").html(templates.description(book.description))
                    if (book.ready) views.loadbooktext(book)
                    else if (book.preview) views.loadbookimgs(book)
                    done(null)
                },
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        views.loadbooktext = function(book, done){
            async.waterfall([
                function(done){
                    api.gettext(book.url, function(er, text){
                        done(er, text)
                    })
                },
                function(text, done){
                    $("#book").html(text)
                    done(null)
                },
                function(done){
                    views.loadillos(book._id)
                    views.loadedits(book._id)
                    done(null)
                },
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        views.loadbookimgs = function(book, done){
            async.waterfall([
                function(done){
                    api.getbookcomments(book._id, {
                        // img: true,
                        edit: false,
                        sort: "recent",
                        page: 0,
                        limit: 48,
                    }, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    // var days = new Date(book.readyon).getTime() - new Date()
                    // days = Math.ceil(days / 1000 / 60 / 60 / 24)
                    // $("#days").html(days)
                    $("#wip").show()
                    $("#imgs").html(templates.imgs(comments))
                    done(null)
                },
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        views.loadedits = function(id){
            async.waterfall([
                function(done){
                    api.getedits(id, function(er, entries){
                        done(er, entries)
                    })
                },
                function(entries, done){
                    async.eachSeries(entries, function(entry, done){
                        $("#book p.paragraph[data-p='" + entry.p + "']").html(entry.comment)
                        done(null)
                    }, function(er){
                        done(er)
                    })
                },
            ], function(er, re){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        views.loadillos = function(id){
            async.waterfall([
                function(done){
                    api.getillos(id, function(er, entries){
                        done(er, entries)
                    })
                },
                function(entries, done){
                    entries.sort(function(a, b){
                        if (parseInt(a.p) < parseInt(b.p)) return -1
                        if (parseInt(a.p) == parseInt(b.p) && new Date(a.approvedon) == new Date(b.approvedon)) return 0
                        if (parseInt(a.p) == parseInt(b.p) && new Date(a.approvedon) < new Date(b.approvedon)) return 1 // sort time in reverse because of the order we'll insert them
                        if (parseInt(a.p) > parseInt(b.p)) return 1
                    })
                    async.eachSeries(entries, function(entry, done){
                        $("#book p.paragraph[data-p='" + entry.p + "']").after(templates.illos(entry))
                        done(null)
                    }, function(er){
                        done(er)
                    })
                },
            ], function(er, re){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){

        }

        return bindings
    }())

    var app = (function(){
        var app = {}

        app.init = function(){
            views.init()
            bindings.init()
        }

        app.init()
        return app
    }())

    ;(function(){
        (function(i,s,o,g,r,a,m){
            i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();
            a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
        ga('create', 'UA-45942817-1', 'bookses.com');
        ga('send', 'pageview');
    }())
});
