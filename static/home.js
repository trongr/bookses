jQuery(function($){

    var k = {
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        page: 0,
        max_book_size: 10485760,
    }

    var dom = {
        books: $("#books"),
        upload_page: $("#upload_page"),
        upload_progress: $("#upload_progress")
    }

    var api = (function(){
        var api = {}

        api.bug = function(error){
            console.log(JSON.stringify(error, 0, 2))
            $.ajax({
                url: "bug",
                type: "post",
                data: {
                    error: error
                },
                success: function(re){}
            })
        }

        api.get_all_books = function(page, done){
            $.ajax({
                url: "books",
                type: "get",
                data: {
                    page: page
                },
                success: function(re){
                    if (re.books) done(null, re.books)
                    else done({re:re})
                }
            })
        }

        api.get_book_quotes = function(book_id, done){
            $.ajax({
                url: "book/" + book_id + "/quotes",
                type: "get",
                success: function(re){
                    if (re.quotes) done(null, re.quotes)
                    else done({re:re})
                }
            })
        }

        return api
    }())

    var templates = (function(){
        var templates = {}

        templates.book = function(book){
            var html = "<div id='" + book._id + "' class='book' data-id='" + book._id + "'>"
                + "        <div class='book_left_box'>"
                + "            <div class='book_votes' title='likes'>" + book.votes + "</div>"
                + "            <hr>"
                + "            <div class='book_num_comments' title='comments'>" + book.replies + "</div>"
                + "        </div>"
                + "        <div class='book_main_box'>"
                + "            <div class='book_title'>"
                +                  book.title
                + "            </div>"
                + "            <div class='book_created'>"
                +                  moment(book.created).format(k.date_format)
                + "            </div>"
                + "            <div class='book_description'>"
                +                  book.description
                + "            </div>"
                + "        </div>"
                + "        <div class='book_text'>"
                + "        </div>"
                + "     </div>"
            return html
        }

        return templates
    }())

    var views = (function(){
        var views = {}

        views.init = function(){
            views.load_books(k.page++)
        }

        views.load_books = function(page){
            async.waterfall([
                function(done){
                    api.get_all_books(page, function(er, books){
                        done(er, books)
                    })
                },
                function(books, done){
                    views.render_books(books)
                    done(null)
                },
            ], function(er, re){
                if (er) api.bug(er)
            })
        }

        views.render_books = function(books){
            var html = ""
            for (var i = 0; i < books.length; i++){
                html += templates.book(books[i])
            }
            dom.books.append(html)
                .on("click", ".book_title", bindings.click_book_title)
        }

        views.load_book = function(box, bID){
            var book = new bok({
                box: box,
                bID: bID,
                error: function(er){
                    box.hide()
                    alert(JSON.stringify(er, 0, 2))
                }
            })
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_book_title = function(){
            var book = $(this).closest(".book")
            var box = book.find(".book_text").show()
            views.load_book(box, book.attr("data-id"))
        }

        bindings.init = function(){
            $("#search_button").on("click", bindings.click_search_button)
            $("#upload_button").on("click", bindings.click_upload_button)
            $("#local_book_upload").on("change", bindings.change_book_input)
            $("#post_upload_button").on("click", bindings.click_post_upload_button)
            $("#cancel_upload_button").on("click", bindings.click_cancel_upload_button)
            $("#more_books_button").on("click", bindings.click_more_books)
        }

        bindings.click_search_button = function(){
            alert("coming soon")
        }

        bindings.click_upload_button = function(){
            dom.upload_page.css({"display":"table"})
        }

        bindings.click_post_upload_button = function(){
            users.api_is_logged_in(function(er, loggedin){
                if (!loggedin) return alert("please log in")

                var title = $("#upload_book_title").val().trim()
                var description = $("#upload_book_description").val().trim()
                var file = $("#local_book_upload")[0].files[0]
                if (!file) return alert("please choose a file")
                else if (file.size > k.max_book_size) return alert("your file is too big: must be less than 10MB")

                if (!FormData) return alert("can't upload: please update your browser")
                var data = new FormData()
                data.append("file", file)
                data.append("title", title)
                data.append("description", description)

                $.ajax({
                    url: "book",
                    type: "post",
                    data: data,
                    processData: false,
                    contentType: false,
                    success: function(re){
                        if (re.book){
                            console.log(JSON.stringify(re.book, 0, 2))
                        } else if (re.loggedin == false) alert("you have to log in")
                        else console.log(JSON.stringify({error:"book",er:re}, 0, 2))
                        dom.upload_progress.css("width", "0")
                        dom.upload_page.hide()
                    },
                    error: function(xhr, status, er){
                        console.log(JSON.stringify({error:"upload",xhr:xhr,status:status,er:er}, 0, 2))
                    },
                    xhr: function(){
                        var xhr = $.ajaxSettings.xhr()
                        if (xhr && xhr.upload){
                            xhr.upload.addEventListener('progress', function(event) {
                                if (event.lengthComputable) {
                                    var percent = event.loaded / file.size * 100
                                    dom.upload_progress.css("width", percent + "%")
                                }
                            }, false)
                        }
                        return xhr
                    }
                })
            })
        }

        bindings.click_cancel_upload_button = function(){
            dom.upload_page.hide()
        }

        bindings.click_more_books = function(){
            views.load_books(k.page++)
        }

        bindings.change_book_input = function(e){
            if (!(window.File && window.FileReader && window.Blob)) return
            var file = e.target.files[0].slice(0, 1024)
            var reader = new FileReader()
            reader.onload = function(e){
                var height = $("#upload_page_right").height()
                var width = parseInt($("#upload_page_right").width()) * 60 / 40
                $("#book_preview").text(e.target.result)
                    .css({
                        height:height,
                        width:width + "px"
                    })
            }
            reader.readAsText(file)
        }

        return bindings
    }())

    var users = (function(){
        var users = {}

        users.init = function(){
            users.bind()
            users.init_login_boxes()
        }

        users.bind = function(){
            $("#login").on("click", users.click_login)
            $("#register").on("click", users.click_register)
            $("#logout").on("click", users.click_logout)
        }

        users.click_logout = function(){
            users.api_logout(function(er){
                if (er) alert("error logging out " + JSON.stringify(er, 0, 2))
                else {
                    $("#login_box").show()
                    $("#logout_box").hide()
                }
            })
        }

        users.click_login = function(){
            var username = $("#username").val()
            var password = $("#password").val()
            users.api_login(username, password, function(er, user){
                if (er) alert(JSON.stringify(er, 0, 2))
                else {
                    $("#login_box").hide()
                    $("#logout_box").show()
                }
            })
        }

        users.click_register = function(){
            var username = $("#username").val()
            var password = $("#password").val()
            users.api_create_user(username, password, function(er, user){
                if (er) alert(JSON.stringify(er, 0, 2))
                else {
                    $("#login_box").hide()
                    $("#logout_box").show()
                    alert("Registration complete. Your new identity: " + JSON.stringify(user, 0, 2))
                }
            })
        }

        users.api_create_user = function(username, password, done){
            $.ajax({
                url: "user/" + username + "/register",
                type: "post",
                data: {password:password},
                success: function(re){
                    if (re.user) done(null, re.user)
                    else done({error:re})
                }
            })
        }

        users.api_login = function(username, password, done){
            $.ajax({
                url: "user/" + username + "/login",
                type: "post",
                data: {password:password},
                success: function(re){
                    if (re.user) done(null, re.user)
                    else done({error:re})
                }
            })
        }

        users.api_logout = function(done){
            $.ajax({
                url: "user/logout",
                type: "post",
                success: function(re){
                    if (re.loggedout) done(null)
                    else done({error:"logging out",re:re})
                }
            })
        }

        users.init_login_boxes = function(){
            users.api_is_logged_in(function(er, loggedin){
                if (loggedin){
                    $("#login_box").hide()
                    $("#logout_box").show()
                }
            })
        }

        users.api_is_logged_in = function(done){
            $.ajax({
                url: "user/login",
                type: "get",
                success: function(re){
                    if (re.loggedin) done(null, re.loggedin)
                    else done({error:"may not be logged in",re:re})
                }
            })
        }

        return users
    }())

    var css = (function(){
        var css = {}

        css.init = function(){
            css.fit_tagline()
        }

        css.fit_tagline = function(){
            var box_width = $("#tagline_box").width() - 100
            var tagline = $("#tagline")
            var size = parseInt(tagline.css("font-size"))
            while (tagline.width() < box_width){
                size++
                tagline.css("font-size", size.toString() + "px")
            }
        }

        return css
    }())

    var app = (function(){
        var app = {}

        app.init = function(){
            views.init()
            bindings.init()
            users.init()
            css.init()
        }

        return app
    }())

    app.init()
});
