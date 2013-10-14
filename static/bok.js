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

        templates.quote_box = function(quotes, p, top){
            var html = "<div data-p='" + p + "' class='boks_quote_box'"
            + "             style='"
            + "                   position:absolute;"
            + "                   top:" + top + ";'>"
            +               quotes
            + "         </div>"
            return html
        }

        templates.quote = function(quote){
            var html = "<div class='boks_quote'>"
                +           quote
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
            var prev_p = null
            var box_quotes = ""
            for (var i = 0; i < quotes.length; i++){
                var p = quotes[i].p
                var quote = templates.quote(quotes[i].quote)
                if (prev_p == p || prev_p == null){ // put a paragraph's quotes into one box
                    box_quotes += quote
                } else { // new paragraph: add the last one to html and restart box_quotes
                    var top = paragraphs.eq(prev_p).get(0).offsetTop
                    html += templates.quote_box(box_quotes, prev_p, top)
                    box_quotes = quote
                }
                if (i == quotes.length - 1){ // put the last quote wherever it belongs
                    var top = paragraphs.eq(prev_p).get(0).offsetTop
                    html += templates.quote_box(box_quotes, prev_p, top)
                    box_quotes = quote
                }
                prev_p = p
            }
            $("#" + o.bID + " .boks_quotes").html(html)
        }

        views.load_quote = function(quotes_box, quote, p, top, done){
            var box = quotes_box.find(".boks_quote_box[data-p='" + p + "']")
            var q = templates.quote(quote)
            if (box.length){
                box.append(q)
            } else {
                quotes_box.append(templates.quote_box(q, p, top))
            }
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
                    var p = node.index()
                    var top = node.get(0).offsetTop
                    var quotes = reader.find(".boks_quotes")
                    var quote = {
                        quote: s.toString(),
                        comment: "",
                        p: p
                    }
                    api.create_quote(o.bID, quote, function(er, quote){
                        if (er) console.log(JSON.stringify(er, 0, 2))
                    })
                    views.load_quote(quotes, quote.quote, p, top, function(er){})
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
