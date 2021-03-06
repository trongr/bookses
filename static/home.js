jQuery(function($){

    var k = {
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        page: 0,
        search_page: 0,
        searching: true,
        class: "all",
    }

    var dom = {
        books: $("#books"),
    }

    var api = (function(){
        var api = {}

        api.get_all_books = function(opts, done){
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

        return api
    }())

    var css = (function(){
        var css = {}

        css.init = function(){
            css.fit($("#tagline_box"), $("#tagline"), 50)
            css.fit($("#tagline_box"), $("#projectdesc"), 100)
            css.fit($("#tagline_box"), $("#votestory"), 100)
            $(".book_description").flowtype({lineRatio:1})
        }

        css.fit = function(parent, child, margin){
            var parent_width = parent.width() - margin
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

        templates.drop_caps = function(text){
            var html = "<div class='first_letter'>" + text[0] + "</div>" + text.slice(1)
            return html
        }

        templates.book = function(book){
            var imgs = ""
            if (book.img_comments){
                for (var i = 0; i < book.img_comments.length; i++){
                    var comment = book.img_comments[i]
                    if (comment.thumb){
                        var img = "<img class='book_img' src='" + comment.thumb + "'>"
                        imgs += "<a class='book_img_box' href='/read/" + book._id + "?p=" + comment.p + "'>" + img + "</a>"
                    } else {
                        var text = "<div class='commenttext'>" + comment.comment + "---" + comment.username + "</div>"
                        imgs += "<a class='book_img_box' href='/read/" + book._id + "?p=" + comment.p + "'>" + text + "</a>"
                    }
                }
            }
            var user_img = (book.user_img ? "<div class='book_user_img_box'><img class='book_user_img' src='" + book.user_img + "'></div>" : "")
            var description = templates.drop_caps(book.description.slice(0, 500))
            if (book.description.length > 500) description += " . . . "
            var html = "<div id='" + book._id + "' class='book' data-id='" + book._id + "'>"
                // + "        <div class='book_left_box'>"
                // +              user_img
                // + "            <div class='book_pop'>" + book.pop + "<br><span>" + (book.pop > 1 ? "notes" : "note") + "</span></div>"
                // + "        </div>"
                + "        <div class='book_main_box'>"
                + "            <div class='book_title link'>" + book.title + "</div>"
                // + "            <span class='book_username'>Published by <a href='/profile?u=" + book.username + "'>" + book.username + "</a></span>"
                // + "            <span class='user_kudos' data-username='" + book.username + "'></span>"
                + "            <span class='book_created'>" + Date.create(book.created).short() + "</span>"
                // + "            <div class='book_created'>" + moment(book.created).format(k.date_format) + "</div>"
                + "            <div class='book_description'>" + description + "</div>"
                + "            <div class='book_imgs'>" + imgs + "</div>"
                + "        </div>"
                + "     </div>"
            return html
        }

        return templates
    }())

    var yt = (function(){
        var yt = {}

        yt.k = {
            small: "small",
            big: "big"
        }

        yt.embed = function(link){
            var html = "<iframe type='text/html' width='100%' height='300' src='http://www.youtube.com/embed/"
                + yt.extract_id(link)
                + "?autoplay=0' frameborder='0'/>"
            return html
        }

        yt.thumbnail = function(link, size){
            var random_id = Math.random() // so youtube can find the right box if you have multiple copies of the same video
            var id = yt.extract_id(link)
            var img_size
            if (size == k.big) img_size = "0"
            else if (size == yt.k.small) img_size = "default"
            var html = "<div id='" + random_id + "' class='youtube_thumb_box data' data-ytid='" + id + "'>"
                + "         <img class='youtube_thumb' src='http://img.youtube.com/vi/"
                +               id + "/" + img_size + ".jpg' alt='youtube video'>"
                + "         <div class='youtube_thumb_caption'><i class='icon-play-circle'></i></div>"
                + "     </div>"
            return html
        }

        yt.extract_id = function(link){
            return $.url(link).param("v")
        }

        return yt
    }())

    var views = (function(){
        var views = {}

        views.init = function(){
            views.load_books(k.page++, k.class)
            users.init()
            notis.init($("#notification_menu"), $("#notification_tray"))
        }

        views.load_books = function(page, klass){
            k.searching = false
            async.waterfall([
                function(done){
                    api.get_all_books({
                        page: page,
                        class: klass,
                        // latest: true, // sort books
                        latestcomments: true, // sort comments per book
                    }, function(er, books){
                        done(er, books)
                    })
                },
                function(books, done){
                    views.render_books(dom.books, books)
                    done(null, books)
                },
                function(books, done){
                    done(null)
                    if (books.length) $("#random_book").attr("href", "/read/" + books[0]._id)
                }
            ], function(er){
                if (er) alert("Oops! I can't load more books")
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
            users.load_user_kudos()
        }

        views.load_more_search_results = function(page, klass){
            k.searching = true
            var query = $("#search_bar").val().trim()
            if (!query) return alert("Please enter a title or author")
            async.waterfall([
                function(done){
                    $.ajax({
                        url: "/books/search",
                        type: "get",
                        data: {
                            search: query,
                            page: page,
                            class: klass
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
            $("#search_button").on("click", bindings.click_search_button)
            $("#logins").on("click", bindings.click_logins)
            $("#more_books_button").on("click", bindings.click_more_books)
            $("#more_search_results_button").on("click", bindings.click_more_search_results)
            $("#class_menu button").on("click", bindings.click_class_button)
        }

        bindings.click_class_button = function(){
            $(".class_button_box").removeClass("class_selected")
            $(this).parent().addClass("class_selected")
            var c = $(this).attr("data-class")
            k.class = c
            if (k.searching){
                k.search_page = 0
                $("#results").html("")
                views.load_more_search_results(k.search_page++, k.class)
            } else {
                k.page = 0
                $("#books").html("")
                views.load_books(k.page++, k.class)
            }
        }

        bindings.click_logins = function(){
            users.show_login_box($("#logins_box"))
        }

        bindings.input_enter_submit = function(e){
            if (e.which == 13){
                $(this).parent().find("button").click()
            }
        }

        bindings.click_search_button = function(){
            k.search_page = 0
            views.load_more_search_results(k.search_page++, k.class)
        }

        bindings.click_more_search_results = function(){
            views.load_more_search_results(k.search_page++, k.class)
        }

        bindings.click_more_books = function(){
            views.load_books(k.page++, k.class)
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
