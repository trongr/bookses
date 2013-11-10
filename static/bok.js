var bok = function(x){
    var o = {
        bID: x.bID,
        box: x.box,
        error: x.error
    }

    var dom = {
        box: o.box,
        comments: null,
    }

    var k = {
        static_public: "static/public",
        date_format: "D MMMM YYYY",
        date_format_alt: "llll",
        page_size: 10,
    }

    var page = (function(){
        var page = {}

        page.k = {
            page_size: 10, // should be same as on server
            pages: {}, // pages already requested
        }

        page.get_p = function(p){
            var q = p - p % page.k.page_size
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

        // mark
        api.get_book_comments = function(bID, p, page, done){
            $.ajax({
                url: "book/" + bID + "/comments",
                type: "get",
                data: {
                    p: p,
                    page: page
                },
                success: function(re){
                    if (re.comments) done(null, re.comments)
                    else done({error:"api.get_book_comments",re:re})
                }
            })
        }

        api.create_comment = function(bID, comment, done){
            $.ajax({
                url: "book/" + bID + "/comment",
                type: "post",
                data: {
                    comment: comment.comment,
                    p: comment.p
                },
                success: function(re){
                    if (re.comment) done(null, re.comment)
                    else done(re)
                }
            })
        }

        api.get_comment_comments = function(qID, done){
            $.ajax({
                url: "comment/" + qID + "/comments",
                type: "get",
                success: function(re){
                    if (re.comments) done(null, re.comments)
                    else done({error:"api.get_comment_comments",re:re})
                }
            })
        }

        api.create_comment_comment = function(qID, comment, done){
            $.ajax({
                url: "comment/" + qID + "/comment",
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

        api.like_book = function(id, done){
            $.ajax({
                url: "book/" + id + "/like",
                type: "post",
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

        templates.reader = function(text){
            var html = "<div id='" + o.bID + "' class='boks_reader'>"
                + "         <div class='boks_reader_menu'>"
                + "             <button class='boks_book_upvote'><i class='icon-heart-empty'></i></button>"
                + "             <button class='boks_close'><i class='icon-remove'></i></button>"
                + "         </div>"
                + "         <div class='boks_reader_content'>"
                + "             <div class='boks_reader_left'>"
                + "                 <div class='boks_book'>" + text + "</div>"
                + "             </div>"
                + "             <div class='boks_reader_right'>"
                + "                 <div class='boks_comments'></div>"
                + "             </div>"
                + "         </div>"
                + "     </div>"
            return html
        }

        // mark
        templates.comments_box = function(comments, p, top){
            var content = templates.comments(comments.slice(0, k.page_size))
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
                +                   content
                + "             </div>"
                + "             <div class=''>"
                + "                 <button class='boks_more_quotes_button " + (comments.length > 10 ? "boks_green" : "") + "' data-page='0'><i class='icon-chevron-down'></i></button>"
                + "             </div>"
                + "         </div>"
            return html
        }

        templates.replace_text_with_img = function(text){
            var exp = /\[\[(.*)\]\]/ig;
            return text.replace(exp,"<img class='boks_img' src='$1'/>");
        }

        // mark
        templates.comments = function(comments){
            var html = ""
            for (var i = 0; i < comments.length; i++){
                html += templates.quote(comments[i])
            }
            return html
        }

        templates.quote = function(comment){
            var text = templates.replace_text_with_img(comment.comment)
            var html = "<div data-id='" + comment._id + "' class='boks_quote'>"
                + "         <div class='boks_quote_text_box'>"
                + "             <div class='boks_quote_text'>"
                +                   text
                + "             </div>"
                + "             <div class='boks_quote_created'>"
                +                   moment(comment.created).format(k.date_format_alt)
                + "             </div>"
                + "             <div class='boks_quote_username'>"
                +                   comment.username
                + "             </div>"
                + "             <div class='boks_quote_menu'>"
                + "                 <button class='boks_quote_reply " + (comment.replies > 0 ? "boks_green_underline" : "") + "'><i class='icon-comments-alt'></i>" + comment.replies + "</button>"
                + "                 <button class='boks_quote_thumbs_up " + (comment.votes > 1 ? "boks_red_underline" : "") + "'><i class='icon-thumbs-up-alt'></i><span class='boks_votes'>" + comment.votes + "</span></button>"
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
                +                   moment(comment.created).format(k.date_format_alt)
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
                    o.box.html(templates.reader(text)).off()
                    // .on("click", ".boks_clip", bindings.clip)
                        .on("click", ".boks_close", bindings.close)
                        .on("click", ".boks_book p", bindings.click_paragraph)
                        .on("mouseenter", ".boks_book p", bindings.mouseenter_p)
                        .on("mouseleave", ".boks_book p", bindings.mouseleave_p)
                        .on("click", ".boks_book_upvote", bindings.click_book_like)
                        .on("mouseenter", ".boks_quote_box", bindings.mouseenter_quote_box)
                        .on("mouseleave", ".boks_quote_box", bindings.mouseleave_quote_box)
                        .on("click", ".boks_quote_new_quote_post", bindings.click_new_quote_post)
                        .on("click", ".boks_quote_text", bindings.click_quote_text)
                        .on("click", ".boks_quote_reply", bindings.click_quote_reply)
                        .on("click", ".boks_quote_thumbs_up", bindings.click_quote_thumbs_up)
                        .on("click", ".boks_quote_reply_menu_post", bindings.click_quote_reply_post)
                        .on("click", ".boks_more_quotes_button", bindings.click_more_quotes)
                    dom.comments = o.box.find(".boks_comments")
                    window.scrollTo(0, 0)
                    done(null)
                },
            ], function(er, re){
                if (er) done({error:"views.load_book",er:er})
                else done(null)
            })
        }

        views.load_quotes = function(p){
            async.timesSeries(k.page_size, function(i, done){
                views.load_paragraph_quotes(p + i, function(er){
                    if (er) console.log(JSON.stringify(er, 0, 2))
                    done(null)
                })
            }, function(er, re){
                if (er) console.log(JSON.stringify({error:"views.load_quotes",er:er}, 0, 2))
            })
        }

        views.load_paragraph_quotes = function(p, done){
            async.waterfall([
                function(done){
                    api.get_book_comments(o.bID, p, 0, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    if (comments.length) views.render_quotes(p, comments)
                    done(null)
                },
            ], function(er, re){
                if (er) done({error:"views.load_paragraph_quotes",er:er})
                else done(null)
            })
        }

        // mark
        views.render_quotes = function(p, comments){
            var paragraph = $("#" + o.bID + " .boks_book p").eq(p)
            var top = paragraph.get(0).offsetTop
            var html = templates.comments_box(comments, p, top)
            $("#" + o.bID + " .boks_comments").append(html)
        }

        views.load_quote = function(comment, p, top, done){
            var box = dom.comments.find(".boks_quote_box[data-p='" + p + "'] .boks_quote_box_quotes")
            if (box.length){
                box.prepend(templates.quote(comment))
            } else {
                dom.comments.append(templates.comments_box([comment], p, top))
            }
            done(null)
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
            var comment = $(templates.comments_box([], p, top))
            dom.comments.append(comment).find(comment) // have to find quote again, cause if you focus before appending it'll lose focus
                .find(".boks_quote_new_quote_box").show()
                .find(".boks_quote_new_quote_textarea").focus()
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_paragraph = function(){
            var s = window.getSelection()
            if (s.rangeCount > 0 && s.toString().length){
                // selecting text
            } else {
                var p = $(this).index()
                var top = $(this).get(0).offsetTop
                var quote_box = dom.comments.find(".boks_quote_box[data-p='" + p + "']")
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
            async.waterfall([
                function(done){
                    api.get_comment_comments(quote_id, function(er, comments){
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
            quote_box.find(".boks_quote_reply_box").show()
                .find(".boks_quote_reply_textarea").focus().val("")
            quote_box.find(".boks_quote_text").click()
        }

        bindings.click_quote_reply_post = function(){
            var quote_box = $(this).closest(".boks_quote")
            var quote_id = quote_box.attr("data-id")
            var comment = quote_box.find(".boks_quote_reply_textarea").val()
            var comments_box = quote_box.find(".boks_quote_comments")
            quote_box.find(".boks_quote_reply_box").hide()
            api.create_comment_comment(quote_id, comment, function(er, comment){
                if (er && er.loggedin == false) alert("You have to be logged in")
                else if (er) alert(JSON.stringify(er, 0, 2))
                else views.load_quote_comment(comments_box, comment)
            })
        }

        bindings.mouseenter_p = function(){
            var p = $(this).index()
            dom.comments.find(".boks_quote_box[data-p='" + p + "']").css({











                "z-index": 1,
                "margin-left": "-10px",
                "border-left": "5px solid #0f0"
            })
            var q = page.get_p(p)
            if (q != null) views.load_quotes(q)
        }

        bindings.mouseleave_p = function(){
            var p = $(this).index()
            dom.comments.find(".boks_quote_box[data-p='" + p + "']").css({
                "z-index": 0,
                "margin-left": "0",
                "border-left": "none"
            })
        }

        bindings.click_comment_text = function(){
            var comment_box = $(this).closest(".boks_quote_comment")
            var comment_id = comment_box.attr("data-id")
            var box = comment_box.find(".boks_comment_comments")
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
            comment_box.find(".boks_comment_reply_box").eq(0).show()
                .find(".boks_comment_reply_textarea").focus().val("")
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
                else if (er) alert(JSON.stringify(er, 0, 2))
                else views.load_comment_comment(comments_box, comment)
            })
        }

        bindings.click_new_quote_post = function(){
            var quote_box = $(this).closest(".boks_quote_box")
            var text = quote_box.find(".boks_quote_new_quote_textarea").val()
            var p = quote_box.attr("data-p")
            var comment = {
                comment: text,
                p: p
            }
            api.create_comment(o.bID, comment, function(er, comment){
                if (er && er.loggedin == false) alert("You have to be logged in")
                else if (er) alert(JSON.stringify(er, 0, 2))
                else views.load_quote(comment, p, null, function(er){})
            })
            quote_box.find(".boks_quote_new_quote_box").hide()
        }

        bindings.close = function(){
            $(this).closest(".boks_reader").parent().hide()
            $("html, body").animate({
                scrollTop: $("#" + o.bID).offset().top
            }, 100)
        }

        bindings.click_quote_thumbs_up = function(){
            try {
                var id = $(this).closest(".boks_quote").attr("data-id")
                var boks_votes = $(this).find(".boks_votes")
                boks_votes.html(parseInt(boks_votes.html()) + 1)
                api.upvote_comment(id, function(er, num){
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

        bindings.click_book_like = function(){
            $(this).attr("disabled", true)
                .find("i").removeClass("icon-heart-empty").addClass("icon-heart")
            api.like_book(o.bID, function(er, num){
                if (er) alert("couldn't like book " + JSON.stringify(er, 0, 2))
            })
        }

        // mark
        bindings.click_more_quotes = function(){
            var that = $(this)
            var container = that.closest(".boks_quote_box")
            var box = container.find(".boks_quote_box_quotes")
            var page = parseInt(that.attr("data-page")) + 1
            var p = container.attr("data-p")
            async.waterfall([
                function(done){
                    api.get_book_comments(o.bID, p, page, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    if (comments.length) box.append(templates.comments(comments.slice(0, k.page_size)))
                    if (comments.length > k.page_size) that.addClass("boks_green")
                    else that.removeClass("boks_green")
                    that.attr("data-page", page)
                    done(null)
                },
            ], function(er, re){
                if (er) console.log(JSON.stringify(({error:"bindings.click_more_quotes",er:er}), 0, 2))
            })
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
