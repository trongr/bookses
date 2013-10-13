jQuery(function($){

    var k = {
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
    }

    var dom = {
        books: $("#books")
    }

    var api = (function(){
        var api = {}

        api.bug = function(error){
            console.log(JSON.stringify(bug, 0, 2))
            $.ajax({
                url: "/bug",
                type: "post",
                data: {
                    error: error
                },
                success: function(re){}
            })
        }

        api.get_all_books = function(done){
            $.ajax({
                url: "/books",
                type: "get",
                success: function(re){
                    if (re.books) done(null, re.books)
                    else done({re:re})
                }
            })
        }

        api.get_book_quotes = function(book_id, done){
            $.ajax({
                url: "/book/" + book_id + "/quotes",
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
            var html = "<div class='book' data-id='" + book._id + "'>"
                + "        <div class='book_title'>"
                +              book.title
                + "        </div>"
                + "        <div class='book_created'>"
                +              moment(book.created).format(k.date_format)
                + "        </div>"
                + "        <div class='book_description'>"
                +              book.description
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
            async.waterfall([
                function(done){
                    api.get_all_books(function(er, books){
                        done(er, books)
                    })
                },
                function(books, done){
                    views.load_books(books)
                    done(null)
                },
            ], function(er, re){
                if (er) api.bug(er)
            })
        }

        views.load_books = function(books){
            var html = ""
            for (var i = 0; i < books.length; i++){
                html += templates.book(books[i])
            }
            dom.books.html(html)
                .on("click", ".book_title", bindings.onclick_book_title)
        }

        views.load_book = function(box, bID){
            var book = new bok({
                box: box,
                bID: bID
            })
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.onclick_book_title = function(){
            var book = $(this).closest(".book")
            var box = book.find(".book_text").show()
            views.load_book(box, book.attr("data-id"))
        }

        return bindings
    }())

    var app = (function(){
        var app = {}

        app.init = function(){
            views.init()
        }

        return app
    }())

    app.init()
});
