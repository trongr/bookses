var api = (function(){
    var api = {}

    api.getbooks = function(data, done){
        $.ajax({
            url: "/books",
            type: "get",
            data: data,
            success: function(re){
                if (re.books) done(null, re)
                else done({re:re})
            }
        })
    }

    api.getbook = function(id, done){
        $.ajax({
            url: "/book/" + id,
            type: "get",
            success: function(re){
                if (re.book) done(null, re.book)
                else done({re:re})
            }
        })
    }

    api.gettext = function(url, done){
        $.ajax({
            url: url,
            type: "get",
            success: function(re){
                done(null, re)
            },
            error: function(xhr, status, er){
                done({error:"api get text",xhr:xhr,status:status,er:er})
            }
        })
    }

    api.getedits = function(id, done){
        $.ajax({
            url: "/book/" + id + "/edits",
            type: "get",
            success: function(re){
                if (re.edits) done(null, re.edits)
                else done(re)
            }
        })
    }

    api.getillos = function(id, done){
        $.ajax({
            url: "/book/" + id + "/illos",
            type: "get",
            success: function(re){
                if (re.illos) done(null, re.illos)
                else done(re)
            }
        })
    }

    api.getbookcomments = function(id, data, done){
        $.ajax({
            url: "/book/" + id + "/comments",
            type: "get",
            data: data,
            success: function(re){
                if (re.comments) done(null, re.comments)
                else done({error:"api.getbookcomments",re:re})
            }
        })
    }

    api.getvotes = function(data, done){
        $.ajax({
            url: "/votes",
            type: "get",
            data: data,
            success: function(re){
                if (re.votes) done(null, re)
                else done({re:re})
            }
        })
    }

    api.createvote = function(text, done){
        $.ajax({
            url: "/vote",
            type: "post",
            data: {text:text},
            success: function(re){
                if (re.vote) done(null, re.vote)
                else done({re:re})
            }
        })
    }

    api.upvote = function(id, done){
        $.ajax({
            url: "/vote/" + id + "/upvote",
            type: "post",
            success: function(re){
                if (re.num) done(null, re.num)
                else done({re:re})
            }
        })
    }

    api.subscribe = function(data, done){
        $.ajax({
            url: "/sub",
            type: "post",
            data: data,
            success: function(re){
                if (re.sub) done(null, re.sub)
                else done({re:re})
            }
        })
    }

    return api
}())
