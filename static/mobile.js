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

    var css = (function(){
        var css = {}

        css.init = function(){
            // css.fit($("#click_colors"), $("#click_colors").children())
            css.fit($("#tagline_box"), $("#tagline"))
            $(".book_description").flowtype({lineRatio:1})
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

        templates.book = function(book){
            var html = "<div id='" + book._id + "' class='book' data-id='" + book._id + "'>"
                + "        <div class='book_left_box'>"
                + "            <div class='book_pop'>" + book.pop + "<span>" + (book.pop > 1 ? "pts." : "pt.") + "</span></div>"
                // + "            <div class='book_votes'><i class='icon-thumbs-up-alt'></i>" + book.votes + "</div>"
                // + "            <hr>"
                // + "            <div class='book_num_comments'><i class='icon-comment-alt'></i>" + book.replies + "</div>"
                + "        </div>"
                + "        <div class='book_main_box'>"
                + "            <div class='book_title link'>" + book.title + "</div>"
                + "            <div class='book_created'>" + Date.create(book.created).long() + "</div>"
                // + "            <div class='book_created'>" + moment(book.created).format(k.date_format) + "</div>"
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
            if (!query) return alert("Please enter a title or author")
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
                    $(".books_list").hide()
                    $("#results_box").show()
                    $("#results").html("")
                    views.render_books($("#results"), books)
                    done(null)
                }
            ], function(er, re){
                if (er) alert("Sorry, no matching books")
            })
        }

        views.load_new_book = function(book){
            $(".books_list").hide()
            $("#books_box").show()
                .find("#books").prepend(templates.book(book))
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){
            $("body").on("keydown", ".input_enter_submit input", bindings.input_enter_submit)
            $("#more_menu").on("click", bindings.click_more_menu)
            $("#search_button").on("click", bindings.click_search_button)
            $("#upload_button").on("click", bindings.click_upload_button)
            $("#logins").on("click", bindings.click_logins)
            $("#more_books_button").on("click", bindings.click_more_books)
            $("#more_results_button").on("click", bindings.click_more_results)
        }

        bindings.click_upload_button = function(){
            var bar = $("#upload_progress")
            upload.init({
                box: $("#popup"),
                progress: function(re){
                    if (re.percent) bar.css("width", re.percent + "%")
                },
                done: function(re){
                    if (re.book) views.load_new_book(re.book)
                    else console.log(JSON.stringify(re, 0, 2))
                    bar.css("width", 0)
                }
            })
        }

        bindings.click_more_menu = function(){
            menu.show_menu($("#popup"))
        }

        bindings.click_logins = function(){
            users.show_login_box($("#popup"))
        }

        bindings.input_enter_submit = function(e){
            if (e.which == 13){
                $(this).parent().find("button").click()
            }
        }

        bindings.click_search_button = function(){
            k.results_page = 0
            views.load_more_results(k.results_page++)
        }

        bindings.click_more_results = function(){
            views.load_more_results(k.results_page++)
        }

        bindings.click_more_books = function(){
            views.load_books(k.page++)
        }

        bindings.click_book_title = function(){
            // window.open("/read/" + $(this).closest(".book").attr("data-id"))
            window.location = "/read/" + $(this).closest(".book").attr("data-id")
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
