var notis = (function(){
    var notis = {}

    var k = {
        menu_box: null,
    }

    var templates = (function(){
        var templates = {}

        templates.notis_menu = function(){
            var html = "<div id='notis_box'>"
                + "         <button id='notis_comments'><i class='icon-comments'></i><span></span></button>"
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

        templates.noti = function(entry){
            var html = "<div class='noti data' data-id='" + entry._id + "' data-book='" + entry.book + "'>"
                +           "<div class='noti_text'>" + entry.comment.slice(0, 200) + (entry.comment.length > 200 ? " . . ." : "") + "</div>"
                +           "<div class='noti_modified'>" + Date.create(entry.modified).relative() + "</div>"
                +           "<div class='noti_notee'>by " + entry.notee + "</div>"
                +           "<div class='clear_both'></div>"
                +      "</div>"
            return html
        }

        return templates
    }())

    var api = (function(){
        var api = {}

        api.count_notis_comments = function(done){
            $.ajax({
                url: "/user/notiscount",
                type: "get",
                success: function(re){
                    if (re.count != null) done(null, re.count)
                    else done(re)
                }
            })
        }

        api.get_notis = function(done){
            $.ajax({
                url: "/user/notis",
                type: "get",
                success: function(re){
                    if (re.notis != null) done(null, re.notis)
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
                    api.get_notis(function(er, entries){
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
