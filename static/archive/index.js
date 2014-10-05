jQuery(function($){

    var k = {

    }

    var views = (function(){
        var views = {}

        views.init = function(){
            var p = $.url(window.location).param("p")
            views.loadbooks(p)
            // views.loadvotes()
        }

        views.loadvotes = function(page){
            async.waterfall([
                function(done){
                    api.getvotes({
                        page: 0,
                        limit: 10
                    }, function(er, re){
                        done(er, re)
                    })
                },
                function(re, done){
                    $("#votes").append(templates.votes(re.votes, 0))
                    done(null)
                },
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        views.loadbooks = function(page){
            async.waterfall([
                function(done){
                    api.getbooks({
                        page: page
                    }, function(er, re){
                        done(er, re)
                    })
                },
                function(re, done){
                    $("#books").append(templates.books(re.books))
                    done(null, re)
                },
                function(re, done){
                    views.paginate(page, re.pagesize, re.total)
                    done(null)
                }
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        views.paginate = function(page, pagesize, total){
            page = page || 0
            if (page > 0){
                $("#pagin #first").attr("href", "/?p=0")
                $("#pagin #prev").attr("href", "/?p=" + (page - 1))
            } else {
                $("#pagin #first").addClass("disabled")
                $("#pagin #prev").addClass("disabled")
            }
            $("#pagin #page").html(page)
            if (page < Math.ceil(total / pagesize - 1)){
                $("#pagin #next").attr("href", "/?p=" + (parseInt(page) + 1))
                $("#pagin #last").attr("href", "/?p=" + Math.ceil(total / pagesize - 1))
            } else {
                $("#pagin #next").addClass("disabled")
                $("#pagin #last").addClass("disabled")
            }
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){
            $("#newssubscribe").on("click", bindings.subscribe)
            // $("#request #post").on("click", bindings.createvote)
            // $("#votes").on("click", ".upvote", bindings.upvote)
        }

        bindings.subscribe = function(){
            var email = $("#newsemail").val().trim()
            if (!email) return msg.error("email empty")
            api.subscribe({email:email}, function(er, sub){
                if (er) console.log(JSON.stringify(er, 0, 2))
                else msg.info("subscribed")
            })
        }

        bindings.upvote = function(){
            var that = $(this).attr("disabled", true)
            var id = that.closest(".data").attr("data-id")
            var votes = that.parent().find(".votes")
            var count = parseInt(votes.html()) + 1
            api.upvote(id, function(er, num){
                if (er && er.re && er.re.info) msg.error(er.re.info)
                else if (er) console.log(JSON.stringify(er, 0, 2))
                else {
                    votes.html(count)
                }
            })
        }

        bindings.createvote = function(){
            var btn = $("#request #post").attr("disabled", true)
            var text = $("#request #text").val().trim()
            if (!text) return msg.error("empty text")
            else if (text.length > 500) return msg.error("text too long: at most 500 chars")
            api.createvote(text, function(er, vote){
                if (er) msg.error("couldn't recommend story")
                else {
                    $("#votes").prepend(templates.votes([vote], -1)) // -1 so that votepos will become 0
                    $("#request #text").val("")
                }
                btn.attr("disabled", false)
            })
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
