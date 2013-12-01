jQuery(function($){

    var k = {
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        page: 0,
        results_page: 0,
    }

    var dom = {
        books: $("#books"),
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

    var users = (function(){
        var users = {}

        users.click_logout = function(){
            users.api_logout(function(er){
                if (er) alert("error logging out " + JSON.stringify(er, 0, 2))
                else {
                    $("#login_box").show()
                    $("#logout_box").hide()
                }
            })
        }

        users.click_login = function(e){
            var username = $("#username").val().trim()
            var password = $("#password").val().trim()
            if (!username || !password){
                alert("Invalid logins")
                e.stopImmediatePropagation()
            }
            users.api_login(username, password, function(er, user){
                if (er){
                    alert("wrong")
                    e.stopImmediatePropagation()
                } else {
                    $("#login_box").hide()
                    $("#logout_box").show()
                }
            })
        }

        users.click_register = function(e){
            var username = $("#username").val().trim()
            var password = $("#password").val().trim()
            if (!username || !password){
                alert("Please enter a new username and password to register")
                e.stopImmediatePropagation()
            }
            users.api_create_user(username, password, function(er, user){
                if (er){
                    alert(JSON.stringify(er, 0, 2))
                    e.stopImmediatePropagation()
                } else {
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
            $(".book_description").flowtype({lineRatio:1})
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
                + "            <div class='book_title link'>" + book.title + "</div>"
                + "            <div class='book_created'>" + moment(book.created).format(k.date_format) + "</div>"
                + "            <div class='book_description'>" + book.description + "</div>"
                + "        </div>"
                + "     </div>"
            return html
        }

        // mark
        templates.logins = function(){
            var html = "<div id='login_box'>"
                + "         <div class='popup_cancel'></div>"
                + "         <span class='input_enter_submit'>"
                + "             <input id='username' placeholder='username'><br>"
                + "             <input id='password' type='password' placeholder='password'><br>"
                + "             <button id='login'>LOGIN</button><br>"
                + "         </span>"
                + "         <button id='register'>REGISTER</button><br>"
                + "         <button class='popup_cancel'>cancel</button>"
                + "     </div>"
                + "     <div id='logout_box'>"
                + "         <div class='popup_cancel'></div>"
                + "         <button id='logout'>LOGOUT</button><br>"
                + "         <button class='popup_cancel'>cancel</button>"
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

        views.render_books = function(box, books){
            var html = ""
            for (var i = 0; i < books.length; i++){
                html += templates.book(books[i])
            }
            box.append(html)
                .off()
                .on("click", ".book_title", bindings.click_book_title)
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

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){
            $("body").on("keydown", ".input_enter_submit input", bindings.input_enter_submit)
            $("#search_button").on("click", bindings.click_search_button)
            $("#logins").on("click", bindings.click_logins)
            $("#more_books_button").on("click", bindings.click_more_books)
            $("#more_results_button").on("click", bindings.click_more_results)
        }

        // mark
        bindings.click_logins = function(){
            $("#popup").html(templates.logins()).show()
                .off()
                .on("click", "#login", users.click_login)
                .on("click", "#register", users.click_register)
                .on("click", "#logout", users.click_logout)
                .on("click", ".popup_cancel", bindings.click_popup_cancel)
                .on("click", "button", function(){bindings.click_popup_cancel()}) // apparently if you put this guy before the other buttons they don't get called
            users.init_login_boxes()
        }

        bindings.click_popup_cancel = function(){
            $("#popup").html("").hide()
        }

        bindings.input_enter_submit = function(e){
            if (e.which == 13){
                $(this).parent().find("button").click()
            }
        }

        bindings.click_search_button = function(){
            k.results_page = 0
            $("#results").html("")
            $(".books_list").hide()
            $("#results_box").show()
            views.load_more_results(k.results_page++)
        }

        bindings.click_more_results = function(){
            views.load_more_results(k.results_page++)
        }

        bindings.click_more_books = function(){
            views.load_books(k.page++)
        }

        bindings.click_book_title = function(){
            window.open("/mobile/read/" + $(this).closest(".book").attr("data-id"))
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
