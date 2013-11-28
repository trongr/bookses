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
            $(".book_description").flowtype({
                lineRatio: 1
            })
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

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_book_title = function(){
            window.open("/mobile/read/" + $(this).closest(".book").attr("data-id"))
        }

        return bindings
    }())

    var app = (function(){
        var app = {}

        app.init = function(){
            views.init()
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
