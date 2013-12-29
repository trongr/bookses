var notis = (function(){
    var notis = {}

    var k = {
        box: null
    }

    var templates = (function(){
        var templates = {}

        templates.notis = function(){
            var html = "<div id='notis_box'>"
                + "         <button id='notis_comments'><i class='icon-comments'></i><span></span></button>"
                + "         <button id='notis_mails'><i class='icon-envelope-alt'></i><span></span></button>"
                + "     </div>"
            return html
        }

        return templates
    }())

    var api = (function(){
        var api = {}

        api.count_notis_comments = function(done){
            $.ajax({
                url: "/user/notis",
                type: "get",
                success: function(re){
                    if (re.count != null) done(null, re.count)
                    else done(re)
                }
            })
        }

        return api
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_notis_comments = function(){

        }

        bindings.click_notis_mails = function(){
            alert("coming soon")
        }

        return bindings
    }())

    var views = (function(){
        var views = {}

        views.update_notis = function(){
            ;(function callmeagain(){
                var timeout
                async.waterfall([
                    function(done){
                        api.count_notis_comments(function(er, count){
                            done(er, count)
                        })
                    },
                    function(count, done){
                        done(null)
                        if (count > 0){
                            $("#notis_comments").addClass("new_notis")
                                .find("span").html(count)
                        }
                    }
                ], function(er){
                    if (er) console.log(JSON.stringify(er, 0, 2))
                    timeout = setTimeout(function(){
                        callmeagain()
                        // clearTimeout(timeout) // stop calling
                    }, 30000)
                })
            }());
        }

        return views
    }())

    notis.init = function(box){
        k.box = box
        users.is_logged_in(function(er, user){
            if (user && user.loggedin){
                box.html(templates.notis())
                    .off()
                    .on("click", "#notis_comments", bindings.click_notis_comments)
                    .on("click", "#notis_mails", bindings.click_notis_mails)
                views.update_notis()
            }
        })
    }

    notis.clear = function(){
        if (k.box) k.box.html("")
    }

    return notis
}())
