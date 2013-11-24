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
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        date_format_alt: "h:mm A D MMM YYYY",
        page_size: 10,
        sound: false,
        max_img_size: 5242880,
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
                "border-left": "5px solid #" + color.code_point_range(css.k.cold, css.k.hot, pop, k.page_size)
            })
        }

        return css
    }())

    var api = (function(){
        var api = {}

        api.bug = function(error){
            console.log(JSON.stringify(error, 0, 2))
            $.ajax({
                url: "/bug",
                type: "post",
                data: {
                    error: error
                },
                success: function(re){}
            })
        }

        api.get_book = function(bID, done){
            async.waterfall([
                function(done){
                    $.ajax({
                        url: "/book/" + bID,
                        type: "get",
                        success: function(re){
                            if (re.book) done(null, re.book)
                            else done({error:"api getting book",re:re})
                        }
                    })
                },
                function(book, done){
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
            ], function(er, re){
                done(er, re)
            })
        }

        api.get_book_comments = function(bID, p, page, done){
            $.ajax({
                url: "/book/" + bID + "/comments",
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

        templates.reader = function(text){
            var html = "<div id='" + o.bID + "' class='boks_reader'>"
                + "         <div class='boks_menu'>"
                + "             <button class='boks_upvote'><i class='icon-heart-empty'></i></button>"
                + "             <button class='boks_sound'><i class='icon-volume-up'></i></button>"
                + "             <button class='boks_close'>B</button>"
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

        templates.comment_img_input = function(){
            return "<input class='boks_new_comment_picture_input' accept='image/*' type='file'>"
        }

        // mark
        // p and top can be null if comments have a parent, otw parentid can be null
        templates.comments_box = function(comments, p, top, parentid){
            var content = templates.comments(comments.slice(0, k.page_size))
            var style = (top ? "style='position:absolute;top:" + top + ";'" : "")
            var datap = ((p || p == 0) ? "data-p='" + p + "'" : "")
            var parent = (parentid ? "data-parent='" + parentid + "'" : "")
            var more_comments = (comments.length > 10 ? "" : "boks_hide")
            var home_comments = (parentid ? "boks_hide" : "")
            var html = "<div class='boks_comments_box' " + parent + " " + datap + " " + style + ">"
                + "         <div class='boks_new_comment_box'>"
                + "             <div class='boks_new_comment_textarea_box'>"
                + "                 <textarea class='boks_new_comment_textarea' placeholder='Comment or add an image'></textarea>"
                + "             </div>"
                + "             <div class='boks_new_comment_img_box'>"
                + "                 <img class='boks_new_comment_img'>"
                + "             </div>"
                + "             <div class='boks_new_comment_menu'>"
                + "                 <button class='boks_new_comment_post'>POST</button>"
                +                   templates.comment_img_input()
                + "                 <button class='boks_new_comment_picture_button'><i class='icon-picture'></i></button>"
                + "             </div>"
                + "             <div class='clear_both'></div>"
                + "         </div>"
                + "         <div class='boks_comments'>"
                +               content
                + "         </div>"
                + "         <div>"
                + "             <button class='boks_comments_home_button " + home_comments + "'><i class='icon-home'></i></button>"
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
            var html = "<div class='boks_comment' " + dataid + " " + datap + ">"
                + "         <div class='boks_comment_text_box'>"
                + "             <div class='boks_comment_content'>"
                +                   img
                + "                 <div class='boks_comment_text'>" + text + "</div>"
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
                if (er) o.error(er)
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
                    dom.box.html(templates.reader(text)).off()
                        .on("click", ".boks_upvote", bindings.click_book_like)
                        .on("click", ".boks_sound", bindings.click_book_sound_toggle)
                        .on("click", ".boks_close", bindings.click_book_close)
                        .on("click", ".boks_text p", bindings.click_paragraph)
                        .on("click", ".boks_new_comment_picture_button", bindings.click_choose_comment_image)
                        .on("click", ".boks_new_comment_post", bindings.click_new_comment_post)
                        .on("click", ".boks_comment_content", bindings.click_comment_content)
                        .on("click", ".boks_comment_reply", bindings.click_comment_reply)
                        .on("click", ".boks_comment_thumbs_up", bindings.click_comment_like)
                        .on("click", ".boks_more_comments_button", bindings.click_more_comments)
                        .on("click", ".boks_comments_home_button", bindings.click_comments_home)
                        .on("mouseenter", ".boks_text p", bindings.mouseenter_p)
                        .on("mouseenter", ".boks_content_right > .boks_comments_box", bindings.mouseenter_top_level_comments_box)
                        .on("change", ".boks_new_comment_picture_input", bindings.change_new_comment_picture_input)
                    dom.comments = dom.box.find(".boks_content_right")
                    window.scrollTo(0, 0)
                    done(null)
                },
            ], function(er, re){
                done(er)
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
                        var pop = Math.min(comments.length, k.page_size)
                        css.color_code_p_margin(paragraph, pop)
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
            var comments_box = $(templates.comments_box([], p, top, parent))
            dom.comments.append(comments_box).find(comments_box) // have to find quote again, cause if you focus before appending it'll lose focus
                .find(".boks_new_comment_box").show()
                .find(".boks_new_comment_textarea").focus()
            return comments_box // should do this for every view that creates a dom element, so you can chain methods
        }

        views.load_comments = function(parentid, p, box, done){
            async.waterfall([
                function(done){
                    api.get_comment_comments(parentid, 0, function(er, comments){ // todo. replace 0 with page
                        done(er, comments)
                    })
                },
                function(comments, done){
                    box.html(templates.comments_box(comments, p, null, parentid))
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
            window.location = "/"
        }

        bindings.click_paragraph = function(){
            var p = $(this).index()
            var top = $(this).get(0).offsetTop
            dom.comments.children(".boks_comments_box").removeClass("boks_comments_box_hover boks_p_hover")
            var comments_box = dom.comments.children(".boks_comments_box[data-p='" + p + "']")
            if (comments_box.length){
                comments_box.addClass("boks_p_hover")
                    .find(".boks_new_comment_box").eq(0).show()
                    .find(".boks_new_comment_textarea").focus().val("")
            } else {
                views.load_new_comments_box(p, top, null).addClass("boks_p_hover")
            }
        }

        bindings.click_comment_content = function(){
            var comment_box = $(this).closest(".boks_comment")
            var id = comment_box.attr("data-id")
            var p = comment_box.attr("data-p")
            var children_box = comment_box.find(".boks_comments_box_box")
            views.load_comments(id, p, children_box, function(er){
                if (er) alert(JSON.stringify(er, 0, 2))
            })
        }

        bindings.click_comment_reply = function(){
            var comment_box = $(this).closest(".boks_comment")
            var id = comment_box.attr("data-id")
            var p = comment_box.attr("data-p")
            var children_box = comment_box.find(".boks_comments_box_box")
            views.load_comments(id, p, children_box, function(er){
                if (er) alert(JSON.stringify(er, 0, 2))
                else children_box
                    .find(".boks_new_comment_box").show()
                    .find(".boks_new_comment_textarea").focus().val()
            })
        }

        bindings.mouseenter_p = function(){
            var p = $(this).index()
            var comments_box = dom.comments.children(".boks_comments_box[data-p='" + p + "']")
            if (comments_box.length){
                dom.comments.children(".boks_comments_box").removeClass("boks_comments_box_hover boks_p_hover")
                comments_box.addClass("boks_p_hover")
            }
            var q = page.get_p(p)
            if (q != null) views.load_book_comments(q)
        }

        bindings.click_new_comment_post = function(){
            var that = $(this)
            api.is_logged_in(function(er, loggedin){
                if (!loggedin) return alert("please log in")

                var comments_box = that.closest(".boks_comments_box")
                var p = comments_box.attr("data-p")
                var parentid = comments_box.attr("data-parent")
                var comment = comments_box.find(".boks_new_comment_textarea").val().trim()
                if (!comment) return alert("comment can't be empty")
                var img = that.parent().children(".boks_new_comment_picture_input")[0].files[0]
                if (img && img.size > k.max_img_size) return alert("your img is too big: must be less than 5MB")

                if (!FormData) return alert("can't upload: please update your browser")
                var data = new FormData()
                data.append("book", o.bID)
                data.append("p", p)
                if (parentid) data.append("parent", parentid)
                data.append("comment", comment)
                if (img) data.append("img", img)

                var new_comment_box = comments_box.find(".boks_new_comment_box").eq(0)
                var img_src = new_comment_box.find(".boks_new_comment_img").attr("src")
                new_comment_box.find(".boks_new_comment_textarea").val("")
                new_comment_box.find(".boks_new_comment_picture_input").replaceWith(templates.comment_img_input())
                new_comment_box.find(".boks_new_comment_img").attr("src", "").hide()
                new_comment_box.hide() // hide here to avoid comments_box being hidden

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
                var new_comment = $(templates.comment(fake_comment))
                comments_box.children(".boks_comments").prepend(new_comment)

                $("#" + o.bID + " .boks_text p").eq(p).addClass("p_margin")

                $.ajax({
                    url: "/comment",
                    type: "post",
                    data: data,
                    processData: false,
                    contentType: false,
                    success: function(re){
                        if (re.comment){
                            new_comment.attr("data-id", re.comment._id)
                        } else if (re.loggedin == false) alert("you have to log in")
                        else alert(JSON.stringify({error:"create comment",er:re}, 0, 2))
                    }
                })
            })
        }

        bindings.click_comment_like = function(){
            try {
                var id = $(this).closest(".boks_comment").attr("data-id")
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

        bindings.click_more_comments = function(){
            var that = $(this)
            var container = that.closest(".boks_comments_box")
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
                    if (comments.length <= k.page_size){
                        that.hide()
                        that.parent().find(".boks_comments_home_button").show()
                    } else that.attr("data-page", page)
                    done(null)
                },
            ], function(er, re){
                if (er) console.log(JSON.stringify(({error:"bindings.click_more_comments",er:er}), 0, 2))
            })
        }

        bindings.click_book_sound_toggle = function(){
            k.sound = !k.sound
            if (k.sound) $(".boks_sound").html("<i class='icon-volume-off'></i>")
            else $(".boks_sound").html("<i class='icon-volume-up'></i>")
        }

        bindings.mouseenter_top_level_comments_box = function(){
            if (k.sound) dom.clink.play()
            dom.comments.children(".boks_comments_box").removeClass("boks_comments_box_hover boks_p_hover")
            $(this).addClass("boks_comments_box_hover")
        }

        bindings.click_choose_comment_image = function(){
            $(this).parent().children(".boks_new_comment_picture_input").click()
        }

        bindings.click_comments_home = function(){
            var p = $(this).closest(".boks_comments_box").attr("data-p")
            var top = $("#" + o.bID + " .boks_text p").eq(p).get(0).offsetTop
            $("html, body").animate({
                scrollTop: top
            }, 100)
        }

        bindings.change_new_comment_picture_input = function(e){
            var file = e.target.files[0]
            var box = $(this).closest(".boks_new_comment_box")
            var txt = box.find(".boks_new_comment_textarea").focus()
            var img = box.find(".boks_new_comment_img")
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
