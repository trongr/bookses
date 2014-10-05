jQuery(function($){

    var k = {
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        page: 0,
        results_page: 0,
        max_book_size: 10485760,
    }

    var dom = {
        books: $("#books"),
        upload_page: $("#upload_page"),
        upload_progress: $("#upload_progress")
    }

    var api = (function(){
        var api = {}

        api.get_all_books = function(page, done){
            $.ajax({
                url: "/books",
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
                + "            <div class='book_title pointer'>" + book.title + "</div>"
                + "            <div class='book_created'>" + moment(book.created).format(k.date_format) + "</div>"
                + "            <div class='book_description'>" + book.description + "</div>"
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
                    views.render_books(dom.books, books)
                    done(null)
                },
            ], function(er, re){
                if (er) alert("Oops! I can't load more books. Please let Trong know about this")
            })
        }

        views.load_more_results = function(page){
            var query = $("#search_bar").val().trim()
            if (!query) return alert("empty search string")
            async.waterfall([
                function(done){
                    $.ajax({
                        url: "/books/search",
                        type: "get",
                        data: {
                            search: query,
                            page: page
                        },
                        success: function(re){
                            if (re.books) done(null, re.books)
                            else done({error:"search books",re:re})
                        }
                    })
                },
                function(books, done){
                    var result = []
                    for (var i = 0; i < books.length; i++){
                        result.push(books[i].obj)
                    }
                    done(null, result)
                },
                function(books, done){
                    views.render_books($("#results"), books)
                    done(null)
                }
            ], function(er, re){
                if (er) alert("Sorry, no matching books")
            })
        }

        views.render_books = function(box, books){
            var html = ""
            for (var i = 0; i < books.length; i++){
                html += templates.book(books[i])
            }
            box.append(html)
                .off()
                .on("click", ".book_title", bindings.click_book_title)
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_book_title = function(){
            window.open("/read/" + $(this).closest(".book").attr("data-id"))
        }

        // mark
        bindings.init = function(){
            $(".link_box").on("mouseenter", bindings.mouseenter_link_box)
            $(".link_box").on("mouseleave", bindings.mouseleave_link_box)
            $(".menu_item").on("mouseenter", bindings.mouseenter_menu_item)
            $(".menu_item").on("mouseleave", bindings.mouseleave_menu_item)
            $(".input_enter_submit input").keypress(bindings.input_enter_submit)
            $("#more_menu").on("click", bindings.click_more_menu)
            $("#logo").on("click", bindings.click_logo)
            $("#tagline").on("click", bindings.click_tagline)
            $("#search_button").on("click", bindings.click_search_button)
            $("#upload_button").on("click", bindings.click_upload_button)
            $("#local_book_upload").on("change", bindings.change_book_input)
            $("#post_upload_button").on("click", bindings.click_post_upload_button)
            $("#cancel_upload_button").on("click", bindings.click_cancel_upload_button)
            $("#more_books_button").on("click", bindings.click_more_books)
            $("#more_results_button").on("click", bindings.click_more_results)
        }

        bindings.click_tagline = function(){
            $("#info_box").toggle()
            css.fit($("#info_box_left"), $("#info_box_faq"))
        }

        bindings.mouseenter_link_box = function(){
            $(this).find("a").addClass("a_hover")
        }

        bindings.mouseleave_link_box = function(){
            $(this).find("a").removeClass("a_hover")
        }

        bindings.click_more_menu = function(){
            $("#bookses_more_menu_box").toggle()
        }

        // mark
        bindings.click_search_button = function(){
            k.results_page = 0
            $("#results").html("")
            $(".books_list").hide()
            $("#results_box").show()
            views.load_more_results(k.results_page++)
        }

        bindings.click_upload_button = function(){
            dom.upload_page.css({"display":"table"})
            $("html, body").animate({scrollTop:dom.upload_page.offset().top - 10}, 100)
        }

        bindings.click_post_upload_button = function(){
            var post_button = $(this).attr("disabled", true)
            users.api_is_logged_in(function(er, loggedin){
                if (!loggedin) return alert("please log in")

                var title = $("#upload_book_title").val().trim()
                var description = $("#upload_book_description").val().trim()
                if (!title || !description) return alert("title and description can't be empty")
                var file = $("#local_book_upload")[0].files[0]
                if (!file) return alert("please choose a file")
                else if (file.size > k.max_book_size) return alert("your file is too big: must be less than 10MB")

                if (!FormData) return alert("can't upload: please update your browser")
                var data = new FormData()
                data.append("file", file)
                data.append("title", title)
                data.append("description", description)

                $.ajax({
                    url: "/book",
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
                    complete: function(){
                        post_button.attr("disabled", false)
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

        bindings.click_more_results = function(){
            views.load_more_results(k.results_page++)
        }

        bindings.change_book_input = function(e){
            if (!(window.File && window.FileReader && window.Blob)) return
            var file = e.target.files[0].slice(0, 1024)
            var reader = new FileReader()
            reader.onload = function(e){
                var height = $("#upload_page_right").height()
                var width = parseInt($("#upload_page_right").width()) * 60 / 40
                $("#book_preview").text(e.target.result).css({height:height, width:width + "px"})
            }
            reader.readAsText(file)
        }

        bindings.input_enter_submit = function(e){
            if (e.which == 13){
                $(this).parent().find("button").click()
            }
        }

        bindings.mouseenter_menu_item = function(){
            $(this).children(".menu_item_text").css({visibility:"visible"})
        }

        bindings.mouseleave_menu_item = function(){
            $(this).children(".menu_item_text").css({visibility:"hidden"})
        }

        bindings.click_logo = function(){
            $(".books_list").hide()
            $("#books_box").show()
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
            var username = $("#username").val().trim()
            var password = $("#password").val().trim()
            if (!username || !password) return alert("Invalid logins")
            users.api_login(username, password, function(er, user){
                if (er){
                    alert("wrong")
                } else {
                    $("#login_box").hide()
                    $("#logout_box").show()
                }
            })
        }

        users.click_register = function(){
            var username = $("#username").val().trim()
            var password = $("#password").val().trim()
            if (!username || !password) return alert("Please enter a new username and password to register")
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
                url: "/user/" + username + "/register",
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
                url: "/user/" + username + "/login",
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
                url: "/user/logout",
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
                url: "/user/login",
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
            css.fit($("#tagline_box"), $("#tagline"))
        }

        css.fit = function(parent, child){
            var parent_width = parent.width() - 100
            var size = parseInt(child.css("font-size"))
            while (child.width() < parent_width){
                size++
                child.css("font-size", size.toString() + "px")
            }
        }

        return css
    }())

    var app = (function(){
        var app = {}

        // mark
        app.init = function(){
            views.init()
            bindings.init()
            users.init()
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
