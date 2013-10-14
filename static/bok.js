var bok = function(x){
    var o = {
        bID: x.bID,
        box: x.box,
    }

    var dom = {
        box: o.box,
    }

    var k = {
        static_public: "/static/public",
    }

    var api = (function(){
        var api = {}

        api.get_book = function(bID, done){
            $.ajax({
                url: k.static_public + "/" + bID + ".html",
                type: "get",
                success: function(re){
                    done(null, re)
                },
                error: function(xhr, status, er){
                    done({error:"api getting book", xhr:xhr, status:status, er:er})
                }
            })
        }

        api.get_book_quotes = function(bID, done){
            $.ajax({
                url: "/book/" + bID + "/quotes",
                type: "get",
                success: function(re){
                    if (re.quotes) done(null, re.quotes)
                    else done({error:"api.get_book_quotes",re:re})
                }
            })
        }

        api.create_quote = function(bID, quote, done){
            $.ajax({
                url: "/book/" + bID + "/quote",
                type: "post",
                data: {
                    quote: quote.quote,
                    comment: quote.comment,
                    p: quote.p
                },
                success: function(re){
                    if (re.quote) done(null, re.quote)
                    else done({error:"api.create_quote",re:re})
                }
            })
        }

        return api
    }())

    var templates = (function(){
        var templates = {}

        templates.reader = function(text){
            var html = "<div id='" + o.bID + "' class='boks_reader'>"
                + "         <div class='boks_reader_menu'>"
                + "             <button class='boks_clip' type='button'>clip</button>"
                + "         </div>"
                + "         <div class='boks_reader_content'>"
                + "         <div class='boks_reader_left'>"
                + "             <div class='boks_book'>" + text + "</div>"
                + "         </div>"
                + "         <div class='boks_reader_right'>"
                + "             <div class='boks_quotes'></div>"
                + "         </div>"
                + "         </div>"
                + "     </div>"
            return html
        }

        templates.quote_box = function(p, top){
            var html = "<div class='quote_box'"
            + "             style='"
            + "                   position:absolute;"
            + "                   top:" + top + ";'>"
            + "         </div>"
            return html
        }

        templates.quote = function(quote, top){
            var html = "<div"
                + "        style='"
                + "              background-color:#eee;"
                + "              padding:10px;"
                + "              white-space:pre-line;"
                + "              position:absolute;"
                + "              top:" + top + ";'>"
                +          quote
                + "     </div>"
            return html
        }

        return templates
    }())

    var views = (function(){
        var views = {}

        views.init = function(){
            views.load_book(function(er){
                if (er) api.bug(er)
                else views.load_quotes() // need to finish loading book to get paragraph positions
            })
        }

        views.load_book = function(done){
            async.waterfall([
                function(done){
                    api.get_book(o.bID, function(er, text){
                        done(er, text)
                    })
                },
                function(text, done){
                    o.box.html(templates.reader(text))
                        .on("click", "button", bindings.clip)
                        .on("click", ".boks_book p", bindings.onclick_paragraph)
                    done(null)
                },
            ], function(er, re){
                if (er) done({error:"views.load_book",er:er})
                else done(null)
            })
        }

        views.load_quotes = function(){
            async.waterfall([
                function(done){
                    api.get_book_quotes(o.bID, function(er, quotes){
                        done(er, quotes)
                    })
                },
                function(quotes, done){
                    views.render_quotes(quotes)
                    done(null)
                },
            ], function(er, re){
                if (er) console.log(JSON.stringify({error:"views.load_quotes",er:er}, 0, 2))
            })
        }

        views.render_quotes = function(quotes){
            var paragraphs = $("#" + o.bID + " .boks_book p")
            var html = ""
            for (var i = 0; i < quotes.length; i++){
                var top = paragraphs.eq(quotes[i].p).get(0).offsetTop
                html += templates.quote(quotes[i].quote, top)
            }
            $("#" + o.bID + " .boks_quotes").html(html)
        }

        views.load_quote = function(box, quote, top, done){
            box.append(templates.quote(quote, top))
            done(null)
        }

        views.clear_selection = function(){
            if (window.getSelection().empty) window.getSelection().empty()
            else if (window.getSelection().removeAllRanges) window.getSelection().removeAllRanges()
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        // todo. limit quote length
        bindings.clip = function(){
            var s = window.getSelection()
            if (s.rangeCount > 0){
                var reader = $(this).closest(".boks_reader")
                var node = $(s.getRangeAt(0).startContainer.parentNode) // todo: error checking for different browsers
                if (reader.find(node).length){ // only allow highlight from this book
                    var quotes = reader.find(".boks_quotes")
                    var quote = {
                        quote: s.toString(),
                        comment: "",
                        p: node.index()
                    }
                    api.create_quote(o.bID, quote, function(er, quote){
                        if (er) console.log(JSON.stringify(er, 0, 2))
                    })
                    views.load_quote(quotes, quote.quote, node.get(0).offsetTop, function(er){})
                    views.clear_selection() // avoids consecutive clicks
                }
            }
        }

        // todo: one click clip paragraph
        bindings.onclick_paragraph = function(){
            var p = $(this)
        }

        return bindings
    }())

    this.init = function(){
        views.init()
    }

    this.next_chapter = function(){

    }

    this.prev_chapter = function(){

    }

    this.init()
}
