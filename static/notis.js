var notis = (function(){
    var notis = {}

    var k = {
        menu_box: null,
    }

    var templates = (function(){
        var templates = {}

        templates.notis_menu = function(){
            var html = "<div id='notis_box'>"
                + "         <button id='notis_comments'><i class='icon-comments'></i></button>"
                // + "         <button id='notis_mails'><i class='icon-envelope-alt'></i><span></span></button>"
                + "     </div>"
            return html
        }

        templates.notis_tray = function(entries){
            var content = ""
            for (var i = 0; i < entries.length; i++){
                content += templates.noti(entries[i])
            }
            var html = "<div id='notis_tray'>"
                + "         <div id='notis_tray_msg'>Recent activity on your posts</div>"
                + "         <div id='notis_tray_content'>" + content + "</div>"
                + "     </div>"
            return html
        }

        templates.html_to_text = function(html){
            return $("<div/>", {html:html}).text()
        }

        templates.noti = function(entry){
            var new_notis = (entry.notis ? "is_new_notis" : "")
            var votes = (entry.votes ? "<div class='noti_votes'>" + entry.votes + " kudos</div>" : "")
            var notes = (entry.replies ? "<div class='noti_notes'>" + entry.replies + " comment" + (entry.replies > 1 ? "s" : "") + "</div>" : "")
            var new_notee = (entry.notee ? "<div class='noti_notee'>last comment by " + entry.notee + "</div>" : "")
            var text = templates.html_to_text(entry.comment)
            var html = "<div class='noti data " + new_notis + "' data-id='" + entry._id + "' data-book='" + entry.book + "'>"
                +           "<div class='noti_text'>" + text.slice(0, 200) + (text.length > 200 ? " . . ." : "") + "</div>"
                +           "<div class='noti_modified'>" + Date.create(entry.modified).relative() + "</div>"
                +           votes
                +           notes
                +           new_notee
                +           "<div class='clear_both'></div>"
                +      "</div>"
            return html
        }

        return templates
    }())

    var api = (function(){
        var api = {}

        api.get_user_notis = function(done){
            $.ajax({
                url: "/user/notis",
                type: "get",
                success: function(re){
                    if (re.user) done(null, re.user)
                    else done(re)
                }
            })
        }

        api.clear_user_notis = function(done){
            $.ajax({
                url: "/user/clear_notis",
                type: "post",
                success: function(re){
                    if (re.ok) done(null)
                    else done(re)
                }
            })
        }

        api.get_comment_notis = function(done){
            $.ajax({
                url: "/user/comments/notis",
                type: "get",
                success: function(re){
                    if (re.notis != null) done(null, re.notis)
                    else done(re)
                }
            })
        }

        api.clear_comment_notis = function(id, done){
            $.ajax({
                url: "/comment/" + id + "/clear_notis",
                type: "post",
                success: function(re){
                    if (re.ok) done(null)
                    else done(re)
                }
            })
        }

        return api
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_notis_comments = function(){
            async.waterfall([
                function(done){
                    api.clear_user_notis(function(er){
                        done(er)
                    })
                },
                function(done){
                    $("#notis_comments").removeClass("new_notis")
                    done(null)
                },
                function(done){
                    api.get_comment_notis(function(er, entries){
                        done(er, entries)
                    })
                },
                function(entries, done){
                    if (k.tray_box) k.tray_box.html(templates.notis_tray(entries)).show()
                        .off()
                        .on("click", function(){$(this).html("").hide()})
                        .on("click", ".noti", bindings.click_notis_entry)
                }
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        bindings.click_notis_entry = function(){
            var box = $(this).closest(".data")
            var id = box.attr("data-id")
            var book = box.attr("data-book")
            api.clear_comment_notis(id, function(er){})
            window.location = "/read/" + book + "?c=" + id
            return false
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
                        api.get_user_notis(function(er, user){
                            done(er, user)
                        })
                    },
                    function(user, done){
                        done(null)
                        if (user.notis) $("#notis_comments").addClass("new_notis")
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

    notis.init = function(menu_box, tray_box){
        k.menu_box = menu_box
        k.tray_box = tray_box
        users.is_logged_in(function(er, user){
            if (user && user.loggedin){
                k.menu_box.html(templates.notis_menu())
                    .off()
                    .on("click", "#notis_comments", bindings.click_notis_comments)
                    .on("click", "#notis_mails", bindings.click_notis_mails)
                views.update_notis()
            }
        })
    }

    notis.clear = function(){
        if (k.menu_box) k.menu_box.html("")
    }

    return notis
}())
