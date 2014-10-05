jQuery(function($){

    var k = {

    }

    var templates = (function(){
        var templates = {}

        templates.votes = function(votes, offset){
            var html = ""
            for (var i = 0; i < votes.length; i++){
                var v = votes[i]
                var text = v.text.replace("<script>", "").replace("</script>", "")
                html += "<div class='vote data' data-id='" + v._id + "'>"
                    +       "<div class='votepos'>" + (offset + i + 1) + ".</div>"
                    +       "<div class='votetext'>"
                    +           text
                    +       "</div>"
                    +       "<div class='votemenu'>"
                    +           "<button class='votes'>" + v.votes + "</button>"
                    +           "<button class='upvote'><i class='fa fa-thumbs-o-up'></i></button>"
                    +       "</div>"
                    +   "</div>"
            }
            return html
        }

        return templates
    }())

    var sapi = (function(){
        var sapi = {}

        sapi.editcomment = function(id, data, done){
            $.ajax({
                url: "/comment/" + id + "/edit",
                type: "post",
                data: data,
                success: function(re){
                    if (re.num) done(null, re.num)
                    else done(re)
                }
            })
        }

        sapi.editvote = function(id, data, done){
            $.ajax({
                url: "/vote/" + id + "/edit",
                type: "post",
                data: data,
                success: function(re){
                    if (re.num) done(null, re.num)
                    else done(re)
                }
            })
        }

        return sapi
    }())

    var views = (function(){
        var views = {}

        views.init = function(){
            views.loadcomments()
            views.loadvotes()
        }

        views.loadvotes = function(){
            async.waterfall([
                function(done){
                    api.getvotes({
                        page: 0,
                        limit: 25,
                        recent: true // mk restart server for this and edit del comments and votes
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

        views.loadcomments = function(){

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
