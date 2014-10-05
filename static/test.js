jQuery(function($){

    var k = {

    }

    var views = (function(){
        var views = {}

        views.init = function(){
            var p = $.url(window.location).param("p")
            views.loadbooks(p)
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
