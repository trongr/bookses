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

        api.get_quote_comments = function(qID, done){
            $.ajax({
                url: "/quote/" + qID + "/comments",
                type: "get",
                success: function(re){
                    if (re.comments) done(null, re.comments)
                    else done({error:"api.get_quote_comments",re:re})
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
                + "             <button class='boks_clip' type='button'><i class='icon-quote-right'></i></button>"
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
            var html = "<div data-id='" + quote._id + "' class='boks_quote'>"
                + "         <div class='boks_quote_menu'>"
                + "             <button class='boks_quote_up'><i class='icon-chevron-up'></i></button><br>"
                + "             <button class='boks_quote_down'><i class='icon-chevron-down'></i></button><br>"
                + "             <button class='boks_quote_edit'><i class='icon-pencil'></i></button><br>"
                + "         </div>"
                + "         <div class='boks_quote_text'>"
                +               quote.quote
                + "         </div>"
                + "         <div class='boks_quote_comments'>"
                + "         </div>"
                + "     </div>"
            return html
        }

        templates.comment = function(comment){
            var html = "<div class='boks_quote_comment'>"
                +           comment.comment
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
                        .on("click", ".boks_book p", bindings.click_paragraph)
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
                var quote = templates.quote(quotes[i])
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
                .on("mouseenter", ".boks_quote_box", bindings.mouseenter_quote_box)
                .on("mouseleave", ".boks_quote_box", bindings.mouseleave_quote_box)
                .on("mouseenter", ".boks_quote", bindings.mouseenter_quote)
                .on("mouseleave", ".boks_quote", bindings.mouseleave_quote)
                .on("click", ".boks_quote", bindings.click_quote)
                .on("click", ".boks_quote_up", bindings.click_quote_up)
                .on("click", ".boks_quote_down", bindings.click_quote_down)
                .on("click", ".boks_quote_edit", bindings.click_quote_edit)
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

        views.load_quote_comments = function(box, comments, done){
            var html = ""
            for (var i = 0; i < comments.length; i++){
                html += templates.comment(comments[i])
            }
            box.html(html)
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
                var book = reader.find(".boks_book")
                var node = $(s.getRangeAt(0).startContainer.parentNode) // todo: error checking for different browsers
                if (book.find(node).length){ // only allow highlight from this book
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
                        else views.load_quote(quotes, quote, p, top, function(er){})
                    })
                    views.clear_selection() // avoids consecutive clicks
                }
            }
        }

        // todo: one click clip paragraph
        bindings.click_paragraph = function(){
            var p = $(this)
        }

        bindings.mouseenter_quote_box = function(){
            $(this).css("z-index", 1)
        }

        bindings.mouseleave_quote_box = function(){
            $(this).css("z-index", 0)
        }

        bindings.mouseenter_quote = function(){
            $(this).find(".boks_quote_menu").show()
        }

        bindings.mouseleave_quote = function(){
            $(this).find(".boks_quote_menu").hide()
        }

        bindings.click_quote = function(){
            var quote_id = $(this).attr("data-id")
            var box = $(this).find(".boks_quote_comments")
            async.waterfall([
                function(done){
                    api.get_quote_comments(quote_id, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    views.load_quote_comments(box, comments, function(er){
                        done(er)
                    })
                },
            ], function(er, re){
                if (er) api.bug(er)
            })
        }

        bindings.click_quote_up = function(e){
            e.stopPropagation()
        }

        bindings.click_quote_down = function(e){
            e.stopPropagation()
        }

        bindings.click_quote_edit = function(e){
            e.stopPropagation()
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
