var bok = function(x){
    var o = {
        bID: x.bID,
        error: x.error
    }

    var dom = {
        box: x.box,
        comments: null,
        clink: $("#clink")[0]
    }

    var k = {
        static_public: "static/public",
        date_format: "D MMMM YYYY",
        date_format_alt: "h:mm A D MMM YYYY",
        page_size: 10,
        sound: false,
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

        api.create_comment = function(bID, comment, done){
            $.ajax({
                url: "comment",
                type: "post",
                data: {
                    comment: comment.comment,
                    book: bID,
                    p: comment.p,
                    parent: comment.parent
                },
                success: function(re){
                    if (re.comment) done(null, re.comment)
                    else done(re)
                }
            })
        }

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

        api.get_comment_comments = function(id, page, done){
            $.ajax({
                url: "comment/" + id + "/comments",
                type: "get",
                data: {
                    page: page
                },
                success: function(re){
                    if (re.comments) done(null, re.comments)
                    else done({error:"api.get_comment_comments",re:re})
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

        templates.replace_text_with_img = function(text){
            var exp = /\[\[(.*)\]\]/ig;
            return text.replace(exp,"<img class='boks_img' src='$1'/>");
        }

        templates.reader = function(text){
            var html = "<div id='" + o.bID + "' class='boks_reader'>"
                + "         <div class='boks_menu'>"
                + "             <button class='boks_upvote'><i class='icon-heart-empty'></i></button>"
                + "             <button class='boks_sound'><i class='icon-volume-up'></i></button>"
                + "             <button class='boks_close'><i class='icon-remove'></i></button>"
                + "         </div>"
                + "         <div class='boks_content'>"
                + "             <div class='boks_content_left'>"
                + "                 <div class='boks_text'>" + text + "</div>"
                + "             </div>"
                + "             <div class='boks_content_right'></div>"
                + "         </div>"
                + "     </div>"
            return html
        }

        // p and top can be null if comments have a parent, otw parentid can be null
        templates.comments_box = function(comments, p, top, parentid){
            var content = templates.comments(comments.slice(0, k.page_size))
            var style = (top ? "style='position:absolute;top:" + top + ";'" : "")
            var datap = ((p || p == 0) ? "data-p='" + p + "'" : "")
            var parent = (parentid ? "data-parent='" + parentid + "'" : "")
            var more_comments = (comments.length > 10 ? "" : "boks_hide")
            var html = "<div class='boks_comments_box' " + parent + " " + datap + " " + style + ">"
                + "         <div class='boks_new_comment_box'>"
                + "             <div class='boks_new_comment_textarea_box'>"
                + "                 <textarea class='boks_new_comment_textarea' placeholder='Comment or add a picture, like so: [[http://example.com/cat.jpg]]'></textarea>"
                + "             </div>"
                + "             <div class='boks_new_comment_menu'>"
                + "                 <button class='boks_new_comment_post'>POST</button>"
                + "             </div>"
                + "             <div class='clear_both'></div>"
                + "         </div>"
                + "         <div class='boks_comments'>"
                +               content
                + "         </div>"
                + "         <div class=''>"
                + "             <button class='boks_more_comments_button " + more_comments + "' data-page='0'><i class='icon-chevron-down'></i></button>"
                + "         </div>"
                + "     </div>"
            return html
        }

        templates.comments = function(comments){
            var html = ""
            for (var i = 0; i < comments.length; i++){
                html += templates.comment(comments[i])
            }
            return html
        }

        templates.comment = function(comment){
            var text = templates.replace_text_with_img(comment.comment)
            var has_replies = (comment.replies > 0 ? "boks_green_underline" : "")
            var has_votes = (comment.votes > 1 ? "boks_red_underline" : "")
            var html = "<div class='boks_comment' data-id='" + comment._id + "'>"
                + "         <div class='boks_comment_text_box'>"
                + "             <div class='boks_comment_text'>"
                +                   text
                + "             </div>"
                + "             <div class='boks_comment_created'>"
                +                   moment(comment.created).format(k.date_format_alt)
                + "             </div>"
                + "             <div class='boks_comment_username'>"
                +                   comment.username
                + "             </div>"
                + "             <div class='boks_comment_menu'>"
                + "                 <button class='boks_comment_reply " + has_replies + "'><i class='icon-comments-alt'></i>" + comment.replies + "</button>"
                + "                 <button class='boks_comment_thumbs_up " + has_votes + "'><i class='icon-thumbs-up-alt'></i><span class='boks_comment_votes'>" + comment.votes + "</span></button>"
                + "                 <button class='boks_comment_flag'><i class='icon-flag'></i></button>"
                + "             </div>"
                + "             <div class='clear_both'></div>"
                + "         </div>"
                + "         <div class='boks_comments_box_box'></div>"
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
                    dom.box.html(templates.reader(text)).off()
                        .on("click", ".boks_upvote", bindings.click_book_like)
                        .on("click", ".boks_sound", bindings.click_book_sound_toggle)
                        .on("click", ".boks_close", bindings.click_book_close)
                        .on("click", ".boks_text p", bindings.click_paragraph)
                        .on("click", ".boks_new_comment_post", bindings.click_new_comment_post)
                        .on("click", ".boks_comment_text", bindings.click_comment_text)
                        .on("click", ".boks_comment_reply", bindings.click_comment_reply)
                        .on("mouseenter", ".boks_text p", bindings.mouseenter_p)
                        .on("mouseleave", ".boks_text p", bindings.mouseleave_p)
                        .on("click", ".boks_comment_thumbs_up", bindings.click_comment_like)
                        .on("click", ".boks_more_comments_button", bindings.click_more_comments)
                        .on("mouseenter", ".boks_content_right > .boks_comments_box", bindings.mouseenter_top_level_comments_box)
                    dom.comments = dom.box.find(".boks_content_right")
                    window.scrollTo(0, 0)
                    done(null)
                },
            ], function(er, re){
                if (er) done({error:"views.load_book",er:er})
                else done(null)
            })
        }

        views.load_book_comments = function(p){
            async.timesSeries(k.page_size, function(i, done){
                views.load_paragraph_comments(p + i, function(er){
                    if (er) console.log(JSON.stringify(er, 0, 2))
                    done(null)
                })
            }, function(er, re){
                if (er) console.log(JSON.stringify({error:"views.load_book_comments",er:er}, 0, 2))
            })
        }

        views.load_paragraph_comments = function(p, done){
            async.waterfall([
                function(done){
                    api.get_book_comments(o.bID, p, 0, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    if (comments.length){
                        var paragraph = $("#" + o.bID + " .boks_text p").eq(p)
                        var top = paragraph.get(0).offsetTop
                        dom.comments.append(templates.comments_box(comments, p, top, null))
                    }
                    done(null)
                },
            ], function(er, re){
                if (er) done({error:"views.load_paragraph_comments",er:er})
                else done(null)
            })
        }

        views.load_new_comments_box = function(p, top, parent){
            var comment = $(templates.comments_box([], p, top, parent))
            dom.comments.append(comment).find(comment) // have to find quote again, cause if you focus before appending it'll lose focus
                .find(".boks_new_comment_box").show()
                .find(".boks_new_comment_textarea").focus()
        }

        views.load_comments = function(parentid, box, done){
            async.waterfall([
                function(done){
                    api.get_comment_comments(parentid, 0, function(er, comments){ // todo. replace 0 with page
                        done(er, comments)
                    })
                },
                function(comments, done){
                    box.html(templates.comments_box(comments, null, null, parentid))
                    done(null)
                },
            ], function(er, re){
                if (er) done({error:"load_comments",parentid:parentid,er:er})
                else done(null)
            })
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_book_like = function(){
            $(this).attr("disabled", true)
                .find("i").removeClass("icon-heart-empty").addClass("icon-heart")
            api.like_book(o.bID, function(er, num){
                if (er) alert("couldn't like book " + JSON.stringify(er, 0, 2))
            })
        }

        bindings.click_book_close = function(){
            $(this).closest(".boks_reader").parent().hide()
            $("html, body").animate({
                scrollTop: $("#" + o.bID).offset().top
            }, 100)
        }

        bindings.click_paragraph = function(){
            var p = $(this).index()
            var top = $(this).get(0).offsetTop
            var comments_box = dom.comments.find(".boks_comments_box[data-p='" + p + "']")
            if (comments_box.length){
                comments_box.find(".boks_new_comment_box").eq(0).show()
                    .find(".boks_new_comment_textarea").focus().val("")
            } else {
                views.load_new_comments_box(p, top, null)
            }
        }

        bindings.click_comment_text = function(){
            var comment_box = $(this).closest(".boks_comment")
            var id = comment_box.attr("data-id")
            var children_box = comment_box.find(".boks_comments_box_box")
            views.load_comments(id, children_box, function(er){
                if (er) alert(JSON.stringify(er, 0, 2))
            })
        }

        bindings.click_comment_reply = function(){
            var comment_box = $(this).closest(".boks_comment")
            var id = comment_box.attr("data-id")
            var children_box = comment_box.find(".boks_comments_box_box")
            views.load_comments(id, children_box, function(er){
                if (er) alert(JSON.stringify(er, 0, 2))
                else children_box
                    .find(".boks_new_comment_box").show()
                    .find(".boks_new_comment_textarea").focus().val()
            })
        }

        bindings.mouseenter_p = function(){
            var p = $(this).index()
            dom.comments.find(".boks_comments_box[data-p='" + p + "']").css({
                "z-index": 1,
                "margin-left": "-5px",
                "border-left": "5px solid #0f0",
            })
            var q = page.get_p(p)
            if (q != null) views.load_book_comments(q)
        }

        bindings.mouseleave_p = function(){
            var p = $(this).index()
            dom.comments.find(".boks_comments_box[data-p='" + p + "']").css({
                "z-index": 0,
                "margin-left": "0",
                "border-left": "none",
            })
        }

        bindings.click_new_comment_post = function(){
            var comments_box = $(this).closest(".boks_comments_box")
            var text = comments_box.find(".boks_new_comment_textarea").val()
            var p = comments_box.attr("data-p")
            var parentid = comments_box.attr("data-parent")
            var comment = {
                comment: text,
                p: p,
                parent: parentid
            }
            api.create_comment(o.bID, comment, function(er, comment){
                if (er && er.loggedin == false) alert("You have to be logged in")
                else if (er) alert(JSON.stringify(er, 0, 2))
                else comments_box.find(".boks_comments").eq(0).prepend(templates.comment(comment))
            })
            comments_box.find(".boks_new_comment_box").hide()
        }

        bindings.click_comment_like = function(){
            try {
                var id = $(this).closest(".boks_comment").attr("data-id")
                var boks_comment_votes = $(this).find(".boks_comment_votes")
                boks_comment_votes.html(parseInt(boks_comment_votes.html()) + 1)
                api.upvote_comment(id, function(er, num){
                    if (er && er.loggedin == false) alert("You have to be logged in")
                    else if (er) console.log(JSON.stringify(er, 0, 2))
                })
            } catch (e){
                alert("something went wrong. couldn't upvote comment")
            }
        }

        bindings.click_more_comments = function(){
            var that = $(this)
            var container = that.closest(".boks_comments_box")
            var box = container.find(".boks_comments")
            var page = parseInt(that.attr("data-page")) + 1
            var p = container.attr("data-p")
            var parentid = container.attr("data-parent")
            async.waterfall([
                function(done){
                    if (p) api.get_book_comments(o.bID, p, page, function(er, comments){
                        done(er, comments)
                    })
                    else api.get_comment_comments(parentid, page, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    if (comments.length) box.append(templates.comments(comments.slice(0, k.page_size)))
                    if (comments.length <= k.page_size) that.hide()
                    else that.attr("data-page", page)
                    done(null)
                },
            ], function(er, re){
                if (er) console.log(JSON.stringify(({error:"bindings.click_more_comments",er:er}), 0, 2))
            })
        }

        bindings.click_book_sound_toggle = function(){
            k.sound = !k.sound
            if (k.sound) $(".boks_sound").html("<i class='icon-volume-off'></i>")
            else $(".boks_sound").html("<i class='icon-volume-off'></i>")
        }

        bindings.mouseenter_top_level_comments_box = function(){
            if (k.sound) dom.clink.play()
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
