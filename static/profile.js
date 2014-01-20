jQuery(function($){

    var k = {
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        username: null,
        img: null,
        max_img_size: 5242880,
    }

    var dom = {
        profile: $("#profile")
    }

    var msg = (function(){
        var msg = {}

        msg.show = function(mes){
            $("#msg").html(mes).fadeIn(100).fadeOut(5000)
        }

        return msg
    }())

    var imglib = (function(){
        var imglib = {}

        imglib.choose_img = function(input, imgtag, done){
            var file
            input.off().on("change", function(e){
                file = e.target.files[0]
                var reader = new FileReader()
                reader.onload = function(e){
                    imgtag.attr("src", e.target.result)
                    done(null, file)
                }
                reader.readAsDataURL(file)
            }).click()
        }

        return imglib
    }())

    var api = (function(){
        var api = {}

        api.get_user = function(done){
            k.username = $.url(window.location).param("u")
            $.ajax({
                url: "/user/" + k.username + "/public",
                type: "get",
                data: {},
                success: function(re){
                    if (re.user) done(null, re.user)
                    else done({error:re})
                }
            })
        }

        // todo email
        api.edit_user = function(update, done){
            if (!FormData) return alert("can't upload: please update your browser")
            var data = new FormData()
            if (update.img && update.img.size < k.max_img_size){
                data.append("img", update.img)
            } else if (update.img){
                return alert("Image too big. Please choose one less than 5 MB")
            }
            $.ajax({
                url: "/user/edit",
                type: "post",
                data: data,
                processData: false,
                contentType: false,
                success: function(re){
                    if (re.user) done(null, re.user)
                    else if (re.loggedin == false) done({error:"not logged in"})
                    else done({error:"update user",re:re})
                }
            })
        }

        api.get_books = function(opts, done){
            $.ajax({
                url: "/books",
                type: "get",
                data: opts,
                success: function(re){
                    if (re.books) done(null, re.books)
                    else done({re:re})
                }
            })
        }

        api.get_comments = function(opts, done){
            $.ajax({
                url: "/comments",
                type: "get",
                data: opts,
                success: function(re){
                    if (re.comments) done(null, re.comments)
                    else done({re:re})
                }
            })
        }

        return api
    }())

    var css = (function(){
        var css = {}

        css.init = function(){

        }

        css.fit = function(parent, child){
            var parent_width = parent.width() - 50
            var size = parseInt(child.css("font-size"))
            while (child.width() < parent_width){
                size++
                child.css("font-size", size.toString() + "px")
            }
        }

        return css
    }())

    var templates = (function(){
        var templates = {}

        templates.profile = function(user){
            var html = "<div id='herotron'>"
                +          "<input id='user_img_input' accept='image/*' type='file'>"
                +          "<div id='user_img_box' style='" + (user.img ? "height:auto" : "") + "'>"
                +               (user.img ? templates.user_img(user.img) : "")
                +          "</div>"
                +          "<div id='user_info_box'>"
                +               "<div id='user_username'>" + user.username + "</div>"
                +               "<div id='user_joined'>Joined " + Date.create(user.created).relative() + "</div>"
                +               "<div id='user_profile_kudos'>" + user.kudos + " kudos</div>"
                +               "<button id='user_follow'><i class='icon-rss'></i> subscribe</button>"
                +          "</div>"
                +      "</div>"
                +      "<div id='user_history' class='data' data-username='" + user.username + "'>"
                +           "<div id='history_books_button_box'><button id='history_books_button'>Books</button><i class='icon-plus'></i></div>"
                +           "<div id='history_books'></div>"
                +           "<div id='history_comments_button_box'><button id='history_comments_button'>Notes</button><i class='icon-plus'></i></div>"
                +           "<div id='history_comments'></div>"
                +      "</div>"
            return html
        }

        templates.user_img = function(src){
            var html = "<img id='user_img' src='" + src + "'>"
            return html
        }

        templates.user_edit_img = function(){
            var html = "<button id='user_edit_img'><i class='icon-pencil'></i></button>"
            return html
        }

        templates.history_books = function(books){
            var html = ""
            for (var i = 0; i < books.length; i++){
                html += templates.book(books[i])
            }
            if ( ! html) return "<div style='padding:20px'>none</div>"
            return html
        }

        templates.html_to_text = function(html){
            return $("<div/>", {html:html}).text()
        }

        templates.book = function(book){
            var description = templates.html_to_text(book.description)
            description = (description.length > 400 ? description.slice(0, 400) + " . . ." : description)
            var html = "<div class='book data' data-id='" + book._id + "'>"
                +           "<span class='book_title'>" + book.title + "</span>"
                +           "<span class='book_description'>" + description + "</span>"
                +           "<span class='book_created'>" + Date.create(book.created).short() + "</span>"
                +           "<span class='book_notes'>" + book.pop + " note" + (book.pop > 1 ? "s" : "") + "</span>"
                +      "</div>"
            return html
        }

        templates.history_comments = function(comments){
            var html = ""
            for (var i = 0; i < comments.length; i++){
                html += templates.comment(comments[i])
            }
            if ( ! html) return "<div style='padding:20px'>none</div>"
            return html
        }

        templates.comment = function(comment){
            var text = templates.html_to_text(comment.comment)
            text = (text.length > 400 ? text.slice(0, 400) + " . . ." : text)
            var img = "", votes = "", replies = "", youtube = ""
            if (comment.thumb) img = "<img class='comment_img' src='" + comment.thumb + "'>"
            if (comment.youtube) youtube = "<div class='yt_thumb_box'>" + yt.thumbnail(comment.youtube, yt.k.small) + "</div>"
            if (comment.votes > 1) votes = "<span class='comment_votes'>" + comment.votes + " votes</span>"
            if (comment.replies == 1) replies = "<span class='comment_replies'>1 reply</span>"
            else if (comment.replies > 1) replies = "<span class='comment_replies'>" + comment.replies + " replies</span>"
            var html = "<div class='comment data' data-id='" + comment._id + "' data-book='" + comment.book + "'>"
                +           img
                +           youtube
                +           "<span class='comment_text'>" + text + "</span>"
                +           "<span class='comment_created'>" + Date.create(comment.created).short() + "</span>"
                +           votes
                +           replies
                +           "<div class='clear_both'></div>"
                +      "</div>"
            return html
        }

        return templates
    }())

    var views = (function(){
        var views = {}

        views.init = function(){
            users.init(views.load_user_edits)
            views.load_profile()
            notis.init($("#notification_menu"), $("#notification_tray"))
        }

        views.load_profile = function(){
            async.waterfall([
                function(done){
                    api.get_user(function(er, user){
                        done(er, user)
                    })
                },
                function(user, done){
                    dom.profile.html(templates.profile(user))
                        .off()
                        .on("click", "#user_follow", bindings.click_follow)
                        .on("click", "#history_books_button_box", bindings.click_load_user_book_history)
                        .on("click", ".book", bindings.click_book)
                        .on("click", "#history_comments_button_box", bindings.click_load_user_comment_history)
                        .on("click", ".comment", bindings.click_comment)
                    done(null)
                },
                function(done){
                    done(null)
                    views.load_user_edits()
                },
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        views.load_user_edits = function(){
            k.username = $.url(window.location).param("u")
            async.waterfall([
                function(done){
                    users.is_logged_in(function(er, user){
                        done(er, user)
                    })
                },
                function(user, done){
                    var loggedin = k.username == user.username
                    views.load_user_img_edit(loggedin)
                    done(null)
                }
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        views.load_user_img_edit = function(loggedin){
            if (loggedin){
                $("#user_img_box").prepend(templates.user_edit_img())
                    .off()
                    .on("click", "#user_edit_img", bindings.choose_img)
            } else {
                $("#user_edit_img").hide()
            }
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){
            $("body").on("keydown", ".input_enter_submit input", bindings.input_enter_submit)
            $("#logins").on("click", bindings.click_logins)
        }

        bindings.choose_img = function(){
            var input = $("#user_img_input")
            var imgtag = $("#user_img_box img")
            if (imgtag.length == 0){
                imgtag = $("#user_img_box").html(templates.user_img("")).find("img").hide()
                views.load_user_img_edit(true)
            }
            imglib.choose_img(input, imgtag, function(er, file){
                if (er) alert("Something's wrong: I can't choose a file")
                else {
                    imgtag.show()
                    $("#user_img_box").css({height:"auto"})
                    api.edit_user({img:file}, function(er, user){
                        if (er) msg.show("Error saving profile image")
                        else msg.show("Saved!")
                    })
                }
            })
        }

        bindings.click_follow = function(){
            alert("coming soon")
        }

        bindings.click_logins = function(){
            users.show_login_box($("#logins_box"))
        }

        bindings.input_enter_submit = function(e){
            if (e.which == 13){
                $(this).parent().find("button").click()
            }
        }

        bindings.click_load_user_book_history = function(){
            var username = $(this).closest(".data").attr("data-username")
            async.waterfall([
                function(done){
                    api.get_books({
                        username: username,
                        page: 0,
                    }, function(er, books){
                        done(er, books)
                    })
                },
                function(books, done){
                    done(null)
                    $("#history_books").html(templates.history_books(books))
                }
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        bindings.click_load_user_comment_history = function(){
            var username = $(this).closest(".data").attr("data-username")
            async.waterfall([
                function(done){
                    api.get_comments({
                        username: username,
                        page: 0,
                        sort: "recent",
                    }, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    done(null)
                    $("#history_comments").html(templates.history_comments(comments))
                }
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        bindings.click_book = function(){
            var id = $(this).attr("data-id")
            window.location = "/read/" + id
        }

        bindings.click_comment = function(){
            var book = $(this).attr("data-book")
            var id = $(this).attr("data-id")
            window.location = "/read/" + book + "?c=" + id
        }

        return bindings
    }())

    var app = (function(){
        var app = {}

        app.init = function(){
            views.init()
            bindings.init()
            css.init()
        }

        return app
    }())

    app.init()

    ;(function(){
        (function(i,s,o,g,r,a,m){
            i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();
            a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
        ga('create', 'UA-45942817-1', 'bookses.com');
        ga('send', 'pageview');
    }())
});
