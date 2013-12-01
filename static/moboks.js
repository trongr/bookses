var bok = function(x){
    var o = {
        bID: x.bID,
        error: x.error
    }

    var dom = {
        box: x.box,
        content_right: null,
    }

    var k = {
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        date_format_alt: "h:mm A D MMM YYYY",
        page_size: 10,
        request_ahead: 20,
    }

    var page = (function(){
        var page = {}

        page.k = {
            page_size: 10, // should be same as on server
            pages: {}, // pages already requested
        }

        // let api.book_comments_store worry about caching
        page.get_p = function(p){
            // var q = p - p % page.k.page_size
            if (page.k.pages[p]){
                return null
            } else {
                page.k.pages[p] = true
                return p
            }
        }

        return page
    }())

    var color = (function(){
        var color = {}

        // start:result:end == 0:point:range
        color.code_point_range = function(start, end, point, range){
            var sr = parseInt(start.substr(0, 2), 16) // substr(start, length) not (start, end)!
            var sg = parseInt(start.substr(2, 2), 16)
            var sb = parseInt(start.substr(4, 2), 16)
            var er = parseInt(end.substr(0, 2), 16)
            var eg = parseInt(end.substr(2, 2), 16)
            var eb = parseInt(end.substr(4, 2), 16)
            var pr = ("00" + parseInt(point * (er - sr) / range + sr).toString(16)).substr(-2)
            var pg = ("00" + parseInt(point * (eg - sg) / range + sg).toString(16)).substr(-2)
            var pb = ("00" + parseInt(point * (eb - sb) / range + sb).toString(16)).substr(-2)
            return pr + pg + pb
        }

        return color
    }())

    var css = (function(){
        var css = {}

        css.k = {
            cold: "dddddd",
            hot: "00ff00",
        }

        css.color_code_p_margin = function(p, pop){
            p.css({
                "background-color": "#eaeaea",
                "border-right": "5px solid #" + color.code_point_range(css.k.cold, css.k.hot, pop, k.page_size)
            })
        }

        css.fit = function(parent, child){
            var parent_width = parent.width() - 100
            var size = parseInt(child.css("font-size"))
            while (child.width() < parent_width){
                size++
                child.css("font-size", size.toString() + "px")
            }
        }

        return css
    }())

    var api = (function(){
        var api = {}

        api.is_logged_in = function(done){
            $.ajax({
                url: "/user/login",
                type: "get",
                success: function(re){
                    if (re.loggedin) done(null, re.loggedin)
                    else done({error:"may not be logged in",re:re})
                }
            })
        }

        api.get_book = function(bID, done){
            $.ajax({
                url: "/book/" + bID,
                type: "get",
                success: function(re){
                    if (re.book) done(null, re.book)
                    else done({error:"api getting book",re:re})
                }
            })
        }

        api.get_text = function(book, done){
            $.ajax({
                url: book.url,
                type: "get",
                success: function(re){
                    done(null, re)
                },
                error: function(xhr, status, er){
                    done({ready:false})
                }
            })
        }

        // caching first page of each paragraph's comments
        api.book_comments = {}

        api.get_book_comments_cache = function(p, page){
            if (api.book_comments[p] && api.book_comments[p][page]) return api.book_comments[p][page]
            else return null
        }

        api.push_book_comments_cache = function(p, page, comments){
            if (page == 0) api.book_comments[p] = [comments]
            else api.book_comments[p].push(comments)
        }

        api.get_book_comments = function(bID, p, page, done){
            var cache = api.get_book_comments_cache(p, page)
            if (cache) return done(null, cache)
            $.ajax({
                url: "/book/" + bID + "/comments",
                type: "get",
                data: {
                    p: p,
                    page: page
                },
                success: function(re){
                    if (re.comments){
                        api.push_book_comments_cache(p, page, re.comments)
                        done(null, re.comments)
                    } else done({error:"api.get_book_comments",re:re})
                }
            })
        }

        api.get_comment_comments = function(id, page, done){
            $.ajax({
                url: "/comment/" + id + "/comments",
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
                url: "/comment/" + cID + "/upvote",
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
                url: "/book/" + id + "/like",
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

        templates.book_info = function(book){
            var html = "<div class='boks_book_info'>"
                + "         <div class='boks_book_title_box'><span class='boks_book_title'>" + book.title + "</span></div>"
                + "         <div class='boks_book_created'>" + moment(book.created).format(k.date_format) + "</div>"
                + "         <div class='boks_book_description'>" + templates.replace_text_with_img(book.description) + "</div>"
                + "     </div>"
            return html
        }

        templates.reader = function(text){
            var html = "<div id='" + o.bID + "' class='boks_reader'>"
                + "         <div class='boks_content'>"
                + "             <div class='boks_content_left'>"
                + "                 <div class='boks_text'>" + text + "</div>"
                + "             </div>"
                + "             <div class='boks_content_right'><div style='padding:20px'>Paragraphs with green side bars have comments or illustrations. Click or tap to reveal. If you're on the phone it looks better in landscape.</div></div>"
                + "         </div>"
                + "     </div>"
            return html
        }

        templates.p_menu = function(p){
            var html = "<div id='boks_p_menu' class='data' data-p='" + p + "'>"
                + "         <button class='boks_reply'><i class='icon-pencil'></i></button>"
                + "     </div>"
            return html
        }

        templates.reply_box = function(p, parentid){
            var datap = (p ? "data-p='" + p + "'" : "")
            var dataparent = (parentid ? "data-parent='" + parentid + "'" : "")
            var html = "<div class='boks_reply_box data' " + datap + " " + dataparent + ">"
                + "         <div class='boks_reply_cancel popup_cancel'></div>"
                + "         <div class='boks_reply_textarea_box'>"
                + "             <button class='boks_reply_cancel'>cancel</button>"
                + "             <div class='boks_reply_menu'>"
                + "                 <input class='boks_reply_picture_input' accept='image/*' type='file'>"
                + "                 <button class='boks_reply_picture_button'><i class='icon-picture'></i></button>"
                + "                 <button class='boks_reply_post'>POST</button>"
                + "                 <div class='clear_both'></div>"
                + "             </div>"
                + "             <textarea class='boks_reply_textarea' placeholder='Comment or add an image'></textarea>"
                + "         </div>"
                + "         <div class='boks_reply_img_box'>"
                + "             <img class='boks_reply_img'>"
                + "         </div>"
                + "     </div>"
            return html
        }

        // p and top can be null if comments have a parent, otw parentid can be null
        templates.comments_box = function(comments, p, parentid){
            var content = templates.comments(comments.slice(0, k.page_size))
            var datap = ((p || p == 0) ? "data-p='" + p + "'" : "")
            var parent = (parentid ? "data-parent='" + parentid + "'" : "")
            var more_comments = (comments.length > 10 ? "" : "boks_hide")
            var html = "<div class='boks_comments_box data' " + parent + " " + datap + ">"
                + "         <div class='boks_comments'>"
                +               content
                + "         </div>"
                + "         <div>"
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
            var img = (comment.img ? "<div class='boks_comment_img_box'><img class='boks_comment_img' src='" + comment.img + "'></div>" : "")
            var dataid = "data-id='" + comment._id + "'"
            var datap = "data-p='" + comment.p + "'"
            var has_replies = (comment.replies > 0 ? "boks_green_underline" : "")
            var has_votes = (comment.votes > 1 ? "boks_red_underline" : "")
            var html = "<div class='boks_comment data' " + dataid + " " + datap + ">"
                + "         <div class='boks_comment_text_box'>"
                + "             <div class='boks_comment_content'>"
                +                   img
                + "                 <div class='boks_comment_text'>" + text + "</div>"
                + "             </div>"
                + "             <div class='boks_comment_username'>" + comment.username + "</div>"
                + "             <div class='boks_comment_created'>" + moment(comment.created).format(k.date_format_alt) + "</div>"
                + "             <div class='boks_comment_menu'>"
                + "                 <button class='boks_reply'><i class='icon-pencil'></i></button>"
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
                if (er) o.error(er)
            })
        }

        views.load_book = function(done){
            async.waterfall([
                function(done){
                    api.get_book(o.bID, function(er, book){
                        done(er, book)
                    })
                },
                function(book, done){
                    dom.box.html(templates.book_info(book))
                    css.fit($(".boks_book_info"), $(".boks_book_title"))
                    api.get_text(book, function(er, text){
                        done(er, text)
                    })
                },
                function(text, done){
                    dom.box.append(templates.reader(text))
                        .off()
                        .on("click", ".boks_text p", bindings.click_p)
                    $(window)
                        .on("scroll", bindings.scroll_window)
                    dom.content_right = dom.box.find(".boks_content_right")
                        .off()
                        .on("click", ".boks_more_comments_button", bindings.click_more_comments)
                        .on("click", ".boks_comment_content", bindings.click_comment_reply)
                        .on("click", ".boks_comment_reply", bindings.click_comment_reply)
                        .on("click", ".boks_comment_thumbs_up", bindings.click_comment_like)
                        .on("click", ".boks_reply", bindings.click_reply)
                    $("#popup")
                        .off()
                        .on("click", ".boks_reply_post", bindings.click_reply_post)
                        .on("click", ".boks_reply_cancel", bindings.click_reply_cancel)
                        .on("click", ".boks_reply_picture_button", bindings.click_choose_reply_image)
                        .on("change", ".boks_reply_picture_input", bindings.change_reply_picture_input)
                    $(".boks_text").flowtype({
                        fontRatio: 38,
                        lineRatio: 1,
                    })
                    done(null)
                },
                function(done){
                    views.load_book_comments(0)
                }
            ], function(er, re){
                done(er)
            })
        }

        views.load_book_comments = function(q){
            async.timesSeries(k.request_ahead, function(i, done){
                var p = page.get_p(q + i)
                if (p == null) return done(null) // already requested. todo render the closest set of comments
                views.load_paragraph_comments(p, function(er){
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
                    // todo opt. render the closest set of comments
                    if (comments.length){
                        var paragraph = $("#" + o.bID + " .boks_text p").eq(p)
                        var pop = Math.min(comments.length, k.page_size)
                        css.color_code_p_margin(paragraph, pop)
                    }
                    done(null)
                },
            ], function(er, re){
                if (er) done({error:"views.load_paragraph_comments",er:er})
                else done(null)
            })
        }

        views.load_comments = function(parentid, p, box, done){
            async.waterfall([
                function(done){
                    api.get_comment_comments(parentid, 0, function(er, comments){ // todo. replace 0 with page
                        done(er, comments)
                    })
                },
                function(comments, done){
                    box.html(templates.comments_box(comments, p, parentid))
                    done(null)
                },
            ], function(er, re){
                if (er) done({error:"load_comments",parentid:parentid,er:er})
                else done(null)
            })
        }

        views.load_new_comment = function(comment){
            var elmt = $(templates.comment(comment))
            if (comment.parent){
                $(".boks_comment[data-id='" + comment.parent + "']").find(".boks_comments").eq(0).prepend(elmt)
            } else {
                $(".boks_content_right .boks_comments").eq(0).prepend(elmt)
            }
            $("#" + o.bID + " .boks_text p").eq(comment.p).addClass("p_margin")
            return elmt
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.scroll_timeout

        bindings.scroll_window = function(){
            if (bindings.scroll_timeout) return
            bindings.scroll_timeout = setTimeout(function(){
                var top = $(window).scrollTop()
                var bottom = top + window.innerHeight
                var mid = (top + bottom) / 2
                var p = $(".boks_text p").filter(function(){
                    var t = $(this).get(0).offsetTop
                    var b = $(this).height() + t
                    return t < mid && b > mid
                })
                views.load_book_comments(p.index())
                bindings.scroll_timeout = null
            }, 100)
        }

        bindings.click_p = function(){
            var p = $(this).index()
            dom.content_right.html(templates.p_menu(p))
            $("#boks_p_menu > .boks_reply").fadeOut(200).fadeIn(200)
            api.get_book_comments(o.bID, p, 0, function(er, comments){
                if (comments && comments.length){
                    dom.content_right
                        .append(templates.comments_box(comments, p, comments[0].parent)) // parent should be null
                        .animate({scrollTop:0}, 100)
                } else {
                    dom.content_right.append(templates.comments_box([], p, null))
                }
            })
        }

        bindings.click_more_comments = function(){
            var that = $(this)
            var container = that.closest(".data")
            var box = container.children(".boks_comments")
            var page = parseInt(that.attr("data-page")) + 1
            var p = container.attr("data-p")
            var parentid = container.attr("data-parent")
            async.waterfall([
                function(done){
                    if (parentid) api.get_comment_comments(parentid, page, function(er, comments){
                        done(er, comments)
                    })
                    else api.get_book_comments(o.bID, p, page, function(er, comments){
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

        bindings.click_comment_reply = function(){
            var comment_box = $(this).closest(".data")
            var id = comment_box.attr("data-id")
            var p = comment_box.attr("data-p")
            var children_box = comment_box.find(".boks_comments_box_box")
            views.load_comments(id, p, children_box, function(er){
                if (er) alert(JSON.stringify(er, 0, 2))
            })
        }

        bindings.click_comment_like = function(){
            try {
                var id = $(this).closest(".data").attr("data-id")
                var boks_comment_votes = $(this).find(".boks_comment_votes")
                boks_comment_votes.html(parseInt(boks_comment_votes.html()) + 1)
                api.upvote_comment(id, function(er, num){
                    if (er && er.loggedin == false) alert("You have to be logged in")
                    else if (er) alert(JSON.stringify(er, 0, 2))
                })
            } catch (e){
                alert("something went wrong. couldn't upvote comment")
            }
        }

        bindings.click_reply = function(){
            var data_box = $(this).closest(".data")
            var id = data_box.attr("data-id")
            var p = data_box.attr("data-p")
            $("#popup").html(templates.reply_box(p, id)).show().find("textarea").focus()
            data_box.find(".boks_comment_content").click()
        }

        bindings.click_reply_post = function(){
            var that = $(this)
            api.is_logged_in(function(er, loggedin){
                if (!loggedin) return alert("please log in")

                var data_box = that.closest(".data")
                var p = data_box.attr("data-p")
                var parentid = data_box.attr("data-parent")
                var comment = data_box.find(".boks_reply_textarea").val().trim()
                if (!comment) return alert("comment can't be empty")
                var img = that.parent().children(".boks_reply_picture_input")[0].files[0]
                if (img && img.size > k.max_img_size) return alert("your img is too big: must be less than 5MB")

                if (!FormData) return alert("can't upload: please update your browser")
                var data = new FormData()
                data.append("book", o.bID)
                data.append("p", p)
                if (parentid) data.append("parent", parentid)
                data.append("comment", comment)
                if (img) data.append("img", img)

                var img_src = data_box.find(".boks_reply_img").attr("src")
                bindings.click_reply_cancel()
                var fake_comment = {
                    book: o.bID,
                    p: p,
                    parent: parentid,
                    username: "you",
                    comment: comment,
                    img: img_src,
                    created: new Date(),
                    votes: 1,
                    replies: 0,
                    pop: 1
                }
                var new_comment = views.load_new_comment(fake_comment)

                $.ajax({
                    url: "/comment",
                    type: "post",
                    data: data,
                    processData: false,
                    contentType: false,
                    success: function(re){
                        if (re.comment){
                            new_comment.attr("data-id", re.comment._id)
                            new_comment.find(".boks_comment_username").eq(0).html(re.comment.username)
                        } else if (re.loggedin == false) alert("you have to log in")
                        else alert(JSON.stringify({error:"create comment",er:re}, 0, 2))
                    }
                })
            })
        }

        bindings.click_reply_cancel = function(){
            $("#popup").html("").hide()
        }

        bindings.click_choose_reply_image = function(){
            $(this).parent().children(".boks_reply_picture_input").click()
        }

        bindings.change_reply_picture_input = function(e){
            var file = e.target.files[0]
            var box = $(this).closest(".data")
            var txt = box.find(".boks_reply_textarea").focus()
            var img = box.find(".boks_reply_img")
            var reader = new FileReader()
            reader.onload = function(e){
                img.attr("src", e.target.result).show()
            }
            reader.readAsDataURL(file)
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
