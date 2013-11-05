var bok = function(x){
    var o = {
        bID: x.bID,
        box: x.box,
        error: x.error
    }

    var dom = {
        box: o.box,
        quotes: null,
    }

    var k = {
        static_public: "static/public",
        date_format: "D MMMM YYYY",
    }

    var page = (function(){
        var page = {}

        page.k = {
            p: 0,
            page_size: 10, // should be same as on server
            pages: {
                0: true,
            }, // pages already requested
        }

        page.get_p = function(p){
            var q = p - p % page.k.page_size + page.k.page_size
            if (page.k.pages[q]){
                return null
            } else {
                page.k.pages[q] = true
                return q
            }
        }

        return page
    }())

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

        api.get_book = function(bID, done){
            $.ajax({
                url: k.static_public + "/" + bID,
                type: "get",
                success: function(re){
                    done(null, re)
                },
                error: function(xhr, status, er){
                    done({error:"api getting book", xhr:xhr, status:status, er:er})
                }
            })
        }

        api.get_book_quotes = function(bID, p, done){
            $.ajax({
                url: "book/" + bID + "/quotes",
                type: "get",
                data: {
                    p: p
                },
                success: function(re){
                    if (re.quotes) done(null, re.quotes)
                    else done({error:"api.get_book_quotes",re:re})
                }
            })
        }

        api.create_quote = function(bID, quote, done){
            $.ajax({
                url: "book/" + bID + "/quote",
                type: "post",
                data: {
                    quote: quote.quote,
                    comment: quote.comment,
                    p: quote.p
                },
                success: function(re){
                    if (re.quote) done(null, re.quote)
                    else done(re)
                }
            })
        }

        api.get_quote_comments = function(qID, done){
            $.ajax({
                url: "quote/" + qID + "/comments",
                type: "get",
                success: function(re){
                    if (re.comments) done(null, re.comments)
                    else done({error:"api.get_quote_comments",re:re})
                }
            })
        }

        api.create_quote_comment = function(qID, comment, done){
            $.ajax({
                url: "quote/" + qID + "/comment",
                type: "post",
                data: {
                    comment: comment
                },
                success: function(re){
                    if (re.comment) done(null, re.comment)
                    else done(re)
                }
            })
        }

        api.get_comment_comments = function(cID, done){
            $.ajax({
                url: "comment/" + cID + "/comments",
                type: "get",
                success: function(re){
                    if (re.comments) done(null, re.comments)
                    else done({error:"api.get_comment_comments",re:re})
                }
            })
        }

        api.create_comment_comment = function(cID, comment, done){
            $.ajax({
                url: "comment/" + cID + "/comment",
                type: "post",
                data: {
                    comment: comment
                },
                success: function(re){
                    if (re.comment) done(null, re.comment)
                    else done(re)
                }
            })
        }

        api.upvote_quote = function(qID, done){
            $.ajax({
                url: "quote/" + qID + "/upvote",
                type: "post",
                data: {

                },
                success: function(re){
                    if (re.num) done(null, re.num)
                    else done(re)
                }
            })
        }

        api.upvote_comment = function(cID, done){
            $.ajax({
                url: "comment/" + cID + "/upvote",
                type: "post",
                data: {

                },
                success: function(re){
                    if (re.num) done(null, re.num)
                    else done(re)
                }
            })
        }

        return api
    }())

    var templates = (function(){
        var templates = {}

        // mark
        templates.reader = function(text){
            var html = "<div id='" + o.bID + "' class='boks_reader'>"
                + "         <div class='boks_reader_menu'>"
                + "             <button class='boks_book_upvote'><i class='icon-heart-empty'></i></button>"
                + "             <button class='boks_clip'><i class='icon-quote-right'></i></button>"
                + "             <button class='boks_close'><i class='icon-remove'></i></button>"
                + "         </div>"
                + "         <div class='boks_reader_content'>"
                + "             <div class='boks_reader_left'>"
                + "                 <div class='boks_book'>" + text + "</div>"
                + "             </div>"
                + "             <div class='boks_reader_right'>"
                + "                 <div class='boks_quotes'></div>"
                + "             </div>"
                + "         </div>"
                + "     </div>"
            return html
        }

        templates.quote_box = function(quotes, p, top){
            var html = "<div data-p='" + p + "' class='boks_quote_box'"
                + "             style='"
                + "                   position:absolute;"
                + "                   top:" + top + ";'>"
                + "             <div class='boks_quote_new_quote_box'>"
                + "                 <div class='boks_quote_new_quote_textarea_box'>"
                + "                     <textarea class='boks_quote_new_quote_textarea' placeholder='Comment or add a picture, like so: [[http://example.com/cat.jpg]]'></textarea>"
                + "                 </div>"
                + "                 <div class='boks_quote_new_quote_menu'>"
                + "                     <button class='boks_quote_new_quote_post'>POST</button>"
                + "                 </div>"
                + "                 <div class='clear_both'></div>"
                + "             </div>"
                + "             <div class='boks_quote_box_quotes'>"
                +                  quotes
                + "             </div>"
                + "         </div>"
            return html
        }

        templates.replace_text_with_img = function(text){
            var exp = /\[\[(.*)\]\]/ig;
            return text.replace(exp,"<img class='boks_img' src='$1'/>");
        }

        templates.quote = function(quote){
            var text = templates.replace_text_with_img(quote.quote)
            var html = "<div data-id='" + quote._id + "' class='boks_quote'>"
                + "         <div class='boks_quote_text_box'>"
                + "             <div class='boks_quote_text'>"
                +                   text
                + "             </div>"
                + "             <div class='boks_quote_created'>"
                +                   moment(quote.created).format(k.date_format)
                + "             </div>"
                + "             <div class='boks_quote_username'>"
                +                   quote.username
                + "             </div>"
                + "             <div class='boks_quote_menu'>"
                + "                 <button class='boks_quote_reply " + (quote.replies > 0 ? "boks_green_underline" : "") + "'><i class='icon-comments-alt'></i>" + quote.replies + "</button>"
                + "                 <button class='boks_quote_thumbs_up " + (quote.votes > 1 ? "boks_red_underline" : "") + "'><i class='icon-thumbs-up-alt'></i><span class='boks_votes'>" + quote.votes + "</span></button>"
                + "                 <button class='boks_quote_flag'><i class='icon-flag'></i></button>"
                + "             </div>"
                + "             <div class='clear_both'></div>"
                + "         </div>"
                + "         <div class='boks_quote_reply_box'>"
                + "             <div class='boks_quote_reply_textarea_box'>"
                + "                 <textarea class='boks_quote_reply_textarea' placeholder='Comment or add a picture, like so: [[http://example.com/cat.jpg]]'></textarea>"
                + "             </div>"
                + "             <div class='boks_quote_reply_menu'>"
                + "                 <button class='boks_quote_reply_menu_post'>POST</button>"
                + "             </div>"
                + "             <div class='clear_both'></div>"
                + "         </div>"
                + "         <div class='boks_quote_comments'>"
                + "         </div>"
                + "     </div>"
            return html
        }

        templates.comment = function(comment){
            var text = templates.replace_text_with_img(comment.comment)
            var html = "<div class='boks_quote_comment' data-id='" + comment._id + "'>"
                + "         <div class='boks_quote_comment_text_box'>"
                + "             <div class='boks_quote_comment_text'>"
                +                   text
                + "             </div>"
                + "             <div class='boks_comment_created'>"
                +                   moment(comment.created).format(k.date_format)
                + "             </div>"
                + "             <div class='boks_comment_username'>"
                +                   comment.username
                + "             </div>"
                + "             <div class='boks_comment_menu'>"
                + "                 <button class='boks_comment_menu_reply " + (comment.replies > 0 ? "boks_green_underline" : "") + "'><i class='icon-comments-alt'></i>" + comment.replies + "</button>"
                + "                 <button class='boks_comment_menu_thumbs_up " + (comment.votes > 1 ? "boks_red_underline" : "") + "'><i class='icon-thumbs-up-alt'></i><span class='boks_votes'>" + comment.votes + "</span></button>"
                + "                 <button class='boks_comment_menu_flag'><i class='icon-flag'></i></button>"
                + "             </div>"
                + "             <div class='clear_both'></div>"
                + "         </div>"
                + "         <div class='boks_comment_reply_box'>"
                + "             <div class='boks_comment_reply_textarea_box'>"
                + "                 <textarea class='boks_comment_reply_textarea' placeholder='Comment or add a picture, like so: [[http://example.com/cat.jpg]]'></textarea>"
                + "             </div>"
                + "             <div class='boks_comment_reply_menu'>"
                + "                 <button class='boks_comment_reply_menu_post'>POST</button>"
                + "             </div>"
                + "             <div class='clear_both'></div>"
                + "         </div>"
                + "         <div class='boks_comment_comments'>"
                + "         </div>"
                + "     </div>"
            return html
        }

        return templates
    }())

    var views = (function(){
        var views = {}

        views.init = function(){
            views.load_book(function(er){
                if (er) o.error({error:"loading book",er:er})
                else views.load_quotes(0)
            })
        }

        // mark
        views.load_book = function(done){
            async.waterfall([
                function(done){
                    api.get_book(o.bID, function(er, text){
                        done(er, text)
                    })
                },
                function(text, done){
                    o.box.html(templates.reader(text)).off()
                        .on("click", ".boks_clip", bindings.clip)
                        .on("click", ".boks_close", bindings.close)
                        .on("click", ".boks_book p", bindings.click_paragraph)
                        .on("mouseenter", ".boks_book p", bindings.mouseenter_p)
                        .on("mouseleave", ".boks_book p", bindings.mouseleave_p)
                        .on("click", ".boks_book_upvote", bindings.click_book_upvote)
                        .scrollTop()
                    dom.quotes = o.box.find(".boks_quotes")
                    done(null)
                },
            ], function(er, re){
                if (er) done({error:"views.load_book",er:er})
                else done(null)
            })
        }

        views.load_quotes = function(p){
            async.waterfall([
                function(done){
                    api.get_book_quotes(o.bID, p, function(er, quotes){
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
                prev_p = p
                if (i == quotes.length - 1){ // put the last quote wherever it belongs
                    var top = paragraphs.eq(prev_p).get(0).offsetTop
                    html += templates.quote_box(box_quotes, prev_p, top)
                    box_quotes = quote
                }
            }
            $("#" + o.bID + " .boks_quotes").append(html).off()
                .on("mouseenter", ".boks_quote_box", bindings.mouseenter_quote_box)
                .on("mouseleave", ".boks_quote_box", bindings.mouseleave_quote_box)
                .on("click", ".boks_quote_new_quote_post", bindings.click_new_quote_post)
                .on("click", ".boks_quote_text", bindings.click_quote_text)
                .on("click", ".boks_quote_reply", bindings.click_quote_reply)
                .on("click", ".boks_quote_thumbs_up", bindings.click_quote_thumbs_up)
                .on("click", ".boks_quote_reply_menu_post", bindings.click_quote_reply_post)
        }

        views.load_quote = function(quote, p, top, done){
            var box = dom.quotes.find(".boks_quote_box[data-p='" + p + "'] .boks_quote_box_quotes")
            var q = templates.quote(quote)
            if (box.length){
                box.prepend(q)
            } else {
                dom.quotes.append(templates.quote_box(q, p, top))
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
            box.html(html).off()
                .on("click", ".boks_quote_comment_text", bindings.click_comment_text)
                .on("click", ".boks_comment_menu_reply", bindings.click_comment_reply)
                .on("click", ".boks_comment_menu_thumbs_up", bindings.click_comment_menu_thumbs_up)
                .on("click", ".boks_comment_reply_menu_post", bindings.click_comment_reply_post)
            done(null)
        }

        views.load_quote_comment = function(box, comment){
            box.prepend(templates.comment(comment)).off()
                .on("click", ".boks_quote_comment_text", bindings.click_comment_text)
                .on("click", ".boks_comment_menu_reply", bindings.click_comment_reply)
                .on("click", ".boks_comment_menu_thumbs_up", bindings.click_comment_menu_thumbs_up)
                .on("click", ".boks_comment_reply_menu_post", bindings.click_comment_reply_post)
        }

        views.load_comment_comments = function(box, comments, done){
            var html = ""
            for (var i = 0; i < comments.length; i++){
                html += templates.comment(comments[i])
            }
            box.html(html) // no need to bind events here: already bound in load_quote_comments
            done(null)
        }

        views.load_comment_comment = function(box, comment){
            box.prepend(templates.comment(comment))
        }

        views.load_new_quote_box = function(p, top){
            var quote = $(templates.quote_box("", p, top))
            dom.quotes.append(quote).find(quote) // have to find quote again, cause if you focus before appending it'll lose focus
                .find(".boks_quote_new_quote_box").show()
                .find(".boks_quote_new_quote_textarea").focus()
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        // todo. limit quote length
        bindings.clip = function(){
            var s = window.getSelection()
            if (s.rangeCount > 0 && s.toString().length){
                var reader = $(this).closest(".boks_reader")
                var book = reader.find(".boks_book")
                var node = $(s.getRangeAt(0).startContainer.parentNode) // todo: error checking for different browsers
                if (book.find(node).length){ // only allow highlight from this book
                    var p = node.index()
                    var top = node.get(0).offsetTop
                    var quote = {
                        quote: s.toString(),
                        p: p
                    }
                    api.create_quote(o.bID, quote, function(er, quote){
                        if (er && er.loggedin == false) alert("You have to be logged in")
                        else if (er) console.log(JSON.stringify(er, 0, 2))
                        else views.load_quote(quote, p, top, function(er){})
                    })
                    views.clear_selection() // avoids consecutive clicks
                }
            } else {
                alert("Please select some text to quote")
            }
        }

        bindings.click_paragraph = function(){
            var s = window.getSelection()
            if (s.rangeCount > 0 && s.toString().length){
                // selecting text
            } else {
                var p = $(this).index()
                var top = $(this).get(0).offsetTop
                var quote_box = dom.quotes.find(".boks_quote_box[data-p='" + p + "']")
                if (quote_box.length){
                    quote_box.find(".boks_quote_new_quote_box").show()
                        .find(".boks_quote_new_quote_textarea").focus().val("")
                } else {
                    views.load_new_quote_box(p, top)
                }
            }
        }

        bindings.mouseenter_quote_box = function(){
            $(this).css({
                "z-index": 1,
                "margin-left": "-10px"
            })
        }

        bindings.mouseleave_quote_box = function(){
            $(this).css({
                "z-index": 0,
                "margin-left": 0
            })
        }

        bindings.click_quote_text = function(){
            var quote_box = $(this).closest(".boks_quote")
            var quote_id = quote_box.attr("data-id")
            var box = quote_box.find(".boks_quote_comments")
            quote_box.find(".boks_quote_reply_box").show()
                .find(".boks_quote_reply_textarea").focus().val("")
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

        bindings.click_quote_reply = function(){
            var quote_box = $(this).closest(".boks_quote")
            quote_box.find(".boks_quote_text").click()
        }

        bindings.click_quote_reply_post = function(){
            var quote_box = $(this).closest(".boks_quote")
            var quote_id = quote_box.attr("data-id")
            var comment = quote_box.find(".boks_quote_reply_textarea").val()
            var comments_box = quote_box.find(".boks_quote_comments")
            quote_box.find(".boks_quote_reply_box").hide()
            api.create_quote_comment(quote_id, comment, function(er, comment){
                if (er && er.loggedin == false) alert("You have to be logged in")
                else if (er) console.log(JSON.stringify(er, 0, 2))
                else views.load_quote_comment(comments_box, comment)
            })
        }

        bindings.mouseenter_p = function(){
            var p = $(this).index()
            dom.quotes.find(".boks_quote_box[data-p='" + p + "']").css({
                "z-index": 1,
                "margin-left": "-10px",
                "border-left": "5px solid #0f0"
            })
            var q = page.get_p(p)
            if (q) views.load_quotes(q)
        }

        bindings.mouseleave_p = function(){
            var p = $(this).index()
            dom.quotes.find(".boks_quote_box[data-p='" + p + "']").css({
                "z-index": 0,
                "margin-left": "0",
                "border-left": "none"
            })
        }

        bindings.click_comment_text = function(){
            var comment_box = $(this).closest(".boks_quote_comment")
            var comment_id = comment_box.attr("data-id")
            var box = comment_box.find(".boks_comment_comments")
            comment_box.find(".boks_comment_reply_box").eq(0).show()
                .find(".boks_comment_reply_textarea").focus().val("")
            async.waterfall([
                function(done){
                    api.get_comment_comments(comment_id, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    views.load_comment_comments(box, comments, function(er){
                        done(er)
                    })
                },
            ], function(er, re){
                if (er) api.bug(er)
            })
        }

        bindings.click_comment_reply = function(){
            var comment_box = $(this).closest(".boks_quote_comment")
            comment_box.find(".boks_quote_comment_text").click()
        }

        bindings.click_comment_reply_post = function(){
            var comment_box = $(this).closest(".boks_quote_comment")
            var comment_id = comment_box.attr("data-id")
            var comment = comment_box.find(".boks_comment_reply_textarea").eq(0).val()
            var comments_box = comment_box.find(".boks_comment_comments").eq(0)
            comment_box.find(".boks_comment_reply_box").hide()
            api.create_comment_comment(comment_id, comment, function(er, comment){
                if (er && er.loggedin == false) alert("You have to be logged in")
                else if (er) console.log(JSON.stringify(er, 0, 2))
                else views.load_comment_comment(comments_box, comment)
            })
        }

        bindings.click_new_quote_post = function(){
            var quote_box = $(this).closest(".boks_quote_box")
            var comment = quote_box.find(".boks_quote_new_quote_textarea").val()
            var p = quote_box.attr("data-p")
            var quote = {
                quote: comment,
                p: p
            }
            api.create_quote(o.bID, quote, function(er, quote){
                if (er && er.loggedin == false) alert("You have to be logged in")
                else if (er) console.log(JSON.stringify(er, 0, 2))
                else views.load_quote(quote, p, null, function(er){})
            })
            var quotes_box = quote_box.find(".boks_quote_box_quotes")
            quote_box.find(".boks_quote_new_quote_box").hide()
        }

        bindings.close = function(){
            $(this).closest(".boks_reader").parent().hide()
        }

        bindings.click_quote_thumbs_up = function(){
            try {
                var id = $(this).closest(".boks_quote").attr("data-id")
                var boks_votes = $(this).find(".boks_votes")
                boks_votes.html(parseInt(boks_votes.html()) + 1)
                api.upvote_quote(id, function(er, num){
                    if (er && er.loggedin == false) alert("You have to be logged in")
                    else if (er) console.log(JSON.stringify(er, 0, 2))
                })
            } catch (e){
                alert("something went wrong. couldn't upvote quote")
            }
        }

        bindings.click_comment_menu_thumbs_up = function(){
            try {
                var id = $(this).closest(".boks_quote_comment").attr("data-id")
                var boks_votes = $(this).find(".boks_votes")
                boks_votes.html(parseInt(boks_votes.html()) + 1)
                api.upvote_comment(id, function(er, num){
                    if (er && er.loggedin == false) alert("You have to be logged in")
                    else if (er) console.log(JSON.stringify(er, 0, 2))
                })
            } catch (e){
                alert("something went wrong. couldn't upvote comment")
            }
        }

        // mark
        bindings.click_book_upvote = function(){
            $(this).find("i").removeClass("icon-heart-empty").addClass("icon-heart")
            var id = o.bID
            // alert(id)
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
